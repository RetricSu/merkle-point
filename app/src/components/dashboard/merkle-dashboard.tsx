"use client";

import { useState, useEffect, useCallback } from "react";
import { useSigner, Cell } from "@ckb-ccc/connector-react";
import { WalletConnection } from "./wallet-connection";
import { AccountManager } from "./account-manager";
import { TransactionHistory } from "./transaction-history";
import { MerklePointStatus } from "./merkle-point-status";
import { AccountUpdate } from "@/lib/contract/types";
import { MerklePointContract } from "@/lib/contract/merkle-point";
import { getContractConfig } from "@/lib/contract/config";
import { getNetwork } from "@/lib/env";

interface Transaction {
  hash: string;
  timestamp: Date;
  accounts: number;
  status: "pending" | "confirmed" | "failed";
}

export function MerkleDashboard() {
  const signer = useSigner();
  const [accounts, setAccounts] = useState<AccountUpdate[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [merkleCell, setMerkleCell] = useState<Cell | null>(null);
  const [isLoadingCells, setIsLoadingCells] = useState(false);

  const loadMerkleCells = useCallback(async () => {
    if (!signer) return;

    setIsLoadingCells(true);
    try {
      const network = getNetwork();
      const config = getContractConfig(network);
      const contract = new MerklePointContract(config, signer);
      const merkleCells = await contract.findMerkleCells();

      const latestCell = merkleCells[merkleCells.length - 1];
      setMerkleCell(latestCell);
    } catch (error) {
      console.error("Failed to load merkle cells:", error);
      setError("Failed to load merkle cells");
    } finally {
      setIsLoadingCells(false);
    }
  }, [signer]);

  const handleRefresh = useCallback(async () => {
    await loadMerkleCells();
  }, [loadMerkleCells]);

  // Load cells on component mount and when signer changes
  useEffect(() => {
    if (signer) {
      loadMerkleCells();
    }
  }, [signer, loadMerkleCells]);

  const handleSubmit = async () => {
    if (!signer || accounts.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get contract configuration based on current network
      const network = getNetwork();
      const config = getContractConfig(network);
      const contract = new MerklePointContract(config, signer);

      let txHash: string;

      if (merkleCell) {
        // Convert Cell to CellInputLike for updateMerkleCell
        const cellInput = {
          outPoint: merkleCell.outPoint,
          cellOutput: merkleCell.cellOutput,
          outputData: merkleCell.outputData,
        };

        // Update existing merkle cell
        txHash = await contract.updateMerkleCell(cellInput, accounts);
        setSuccess(
          `Merkle cell updated successfully! Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        );
      } else {
        // Create new merkle cell
        txHash = await contract.createMerkleCell(accounts);
        setSuccess(
          `New merkle cell created successfully! Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        );
      }

      // Add to transaction history
      const newTransaction: Transaction = {
        hash: txHash,
        timestamp: new Date(),
        accounts: accounts.length,
        status: "pending",
      };

      setTransactions([newTransaction, ...transactions]);
      setAccounts([]); // Clear accounts after submission

      // Monitor transaction status
      monitorTransactionStatus(txHash);
    } catch (error) {
      console.error("Failed to submit transaction:", error);

      // Set error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Transaction failed: ${errorMessage}`);

      // Add failed transaction to history
      const failedTransaction: Transaction = {
        hash: `0x${Math.random().toString(16).slice(2)}${"0".repeat(64)}`.slice(
          0,
          66,
        ),
        timestamp: new Date(),
        accounts: accounts.length,
        status: "failed",
      };

      setTransactions([failedTransaction, ...transactions]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const monitorTransactionStatus = async (txHash: string) => {
    // In a real implementation, you would poll the blockchain for transaction status
    // For now, we'll simulate confirmation after a delay
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.hash === txHash ? { ...tx, status: "confirmed" as const } : tx,
        ),
      );

      // Refresh cells after confirmation
      loadMerkleCells();
    }, 5000); // 5 seconds for demo
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WalletConnection />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{success}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Display */}
      {isSubmitting && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="animate-spin h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Processing Transaction
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Please wait while your transaction is being submitted to the
                  blockchain...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        <AccountManager
          accounts={accounts}
          onAccountsChange={setAccounts}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <MerklePointStatus
          network={getNetwork()}
          merkleCell={merkleCell}
          onRefresh={handleRefresh}
          isLoading={isLoadingCells}
        />

        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
}
