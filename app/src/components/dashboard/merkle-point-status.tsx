"use client";

import { useState, useEffect, useCallback } from "react";
import { useSigner, WitnessArgs, Cell } from "@ckb-ccc/connector-react";
import { MerklePointContract } from "@/lib/contract/merkle-point";
import { getContractConfig } from "@/lib/contract/config";
import { getNetwork, NetworkType } from "@/lib/env";
import { AccountUpdate, merklePointUpdate } from "@/lib/contract/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

interface MerklePointStatusProps {
  merkleCell?: Cell | null;
  showRefreshButton?: boolean;
  network?: NetworkType;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Utility functions
const formatAddress = (address: string) =>
  `${address.slice(0, 10)}...${address.slice(-8)}`;

const formatRoot = (root: string) => `${root.slice(0, 10)}...${root.slice(-8)}`;

const formatTime = (date: Date) => date.toLocaleTimeString();

// Loading Spinner Component
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  </div>
);

// Error Display Component
const ErrorDisplay = ({ error }: { error: string }) => (
  <div className="flex items-center space-x-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
    <AlertCircle className="h-4 w-4 text-destructive" />
    <p className="text-sm text-destructive">{error}</p>
  </div>
);

// Root Info Component
const RootInfo = ({ update }: { update: merklePointUpdate }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">
        Previous Root
      </h4>
      <div className="font-mono text-sm bg-muted/50 p-3 rounded-md">
        {formatRoot(update.oldRoot)}
      </div>
    </div>
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">
        Current Root
      </h4>
      <div className="font-mono text-sm bg-green-50 p-3 rounded-md border border-green-200">
        {formatRoot(update.newRoot)}
      </div>
    </div>
  </div>
);

// Account Update Item Component
const AccountUpdateItem = ({
  account,
  index,
}: {
  account: AccountUpdate;
  index: number;
}) => {
  const pointChange = account.newPoint - account.oldPoint;
  const isPositive = pointChange > 0;

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Account {index + 1}
        </span>
        <Badge variant="outline" className="font-mono text-xs">
          {formatAddress(account.address)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-muted-foreground">Previous Points</span>
          <div className="text-sm font-mono text-muted-foreground">
            {account.oldPoint.toLocaleString()}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Current Points</span>
          <div className="text-sm font-mono font-semibold text-foreground">
            {account.newPoint.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground">Point Change</span>
        <Badge
          variant={isPositive ? "default" : "secondary"}
          className={
            isPositive ? "bg-green-100 text-green-800 border-green-200" : ""
          }
        >
          {isPositive ? "+" : ""}
          {pointChange.toLocaleString()}
        </Badge>
      </div>
    </div>
  );
};

// Account Updates Section Component
const AccountUpdatesSection = ({ update }: { update: merklePointUpdate }) => (
  <div className="space-y-4 mb-6">
    <div className="flex items-center space-x-2">
      <h4 className="text-sm font-medium text-muted-foreground">
        Account Updates
      </h4>
      <Badge variant="secondary" className="text-xs">
        {update.accounts.length}
      </Badge>
    </div>

    <div className="space-y-3">
      {update.accounts.map((account, index) => (
        <AccountUpdateItem
          key={`${account.address}-${index}`}
          account={account}
          index={index}
        />
      ))}
    </div>
  </div>
);

// Proof Section Component
const ProofSection = ({ proof }: { proof: string }) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium text-muted-foreground">Proof</h4>
    <div className="font-mono text-xs bg-muted/50 p-3 rounded-md break-all">
      {proof}
    </div>
  </div>
);

// Main Component
export function MerklePointStatus({
  merkleCell,
  showRefreshButton = true,
  network,
  onRefresh,
  isLoading: externalLoading = false,
}: MerklePointStatusProps) {
  const signer = useSigner();
  const [allUpdates, setAllUpdates] = useState<merklePointUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const currentNetwork = network || getNetwork();

  const fetchAllUpdates = useCallback(async () => {
    if (!signer || !merkleCell) return;

    setIsLoading(true);
    setError(null);

    try {
      const config = getContractConfig(currentNetwork);
      const contract = new MerklePointContract(config, signer);

      const finalTypeScript = merkleCell.cellOutput.type!;
      const transactions = await contract.findTransactionsBy(finalTypeScript);

      if (transactions.length === 0) {
        setError("No transactions found for this merkle cell");
        return;
      }

      // Parse all transactions to get all updates, filtering by unique transaction hash
      const updates: merklePointUpdate[] = [];
      const seenTxHashes = new Set<string>();

      for (const tx of transactions) {
        // Get transaction hash - try different possible properties
        const txHash = tx.transaction.hash();

        // Skip if we've already processed this transaction
        if (seenTxHashes.has(txHash)) {
          continue;
        }
        seenTxHashes.add(txHash);

        const witnessHex = tx.transaction.witnesses[0];

        if (witnessHex) {
          try {
            const witnessArgs = WitnessArgs.fromBytes(witnessHex);
            const update = contract.parseMerkleUpdateFromWitness(witnessArgs);
            updates.push(update);
          } catch (err) {
            console.warn("Failed to parse witness for transaction:", err);
          }
        }
      }

      setAllUpdates(updates);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch merkle point status:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setIsLoading(false);
    }
  }, [signer, currentNetwork, merkleCell]);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      await fetchAllUpdates();
    }
  }, [onRefresh, fetchAllUpdates]);

  // Effects
  useEffect(() => {
    if (merkleCell) {
      fetchAllUpdates();
    }
  }, [signer, merkleCell, fetchAllUpdates]);

  useEffect(() => {
    const handleRefreshEvent = () => {
      if (signer) {
        handleRefresh();
      }
    };

    window.addEventListener("refresh-cells", handleRefreshEvent);
    return () => {
      window.removeEventListener("refresh-cells", handleRefreshEvent);
    };
  }, [signer, handleRefresh]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>Merkle Point Status</CardTitle>
            {allUpdates.length > 0 && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
          {showRefreshButton && (
            <Button
              onClick={handleRefresh}
              disabled={isLoading || externalLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading || externalLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          )}
        </div>
        {lastRefresh && (
          <p className="text-xs text-muted-foreground">
            Last updated: {formatTime(lastRefresh)}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {error && <ErrorDisplay error={error} />}

        {isLoading && <LoadingSpinner message="Loading status..." />}

        {allUpdates.length > 0 && !isLoading && (
          <div className="space-y-6">
            <div>
              Merkle Cell: {merkleCell?.outPoint.txHash}, index:{" "}
              {merkleCell?.outPoint.index}
            </div>

            {/* Display all updates in reverse chronological order */}
            <div className="space-y-8">
              <h4 className="text-lg font-medium">
                All Updates ({allUpdates.length})
              </h4>
              {allUpdates
                .slice()
                .reverse()
                .map((update, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium">
                        Update #{allUpdates.length - index}
                      </h5>
                      <Badge variant="outline" className="text-xs">
                        {index === 0 ? "Latest" : "Previous"}
                      </Badge>
                    </div>
                    <RootInfo update={update} />
                    <AccountUpdatesSection update={update} />
                    <ProofSection proof={update.proof} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
