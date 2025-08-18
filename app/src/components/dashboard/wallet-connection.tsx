"use client";

import { ccc } from "@ckb-ccc/connector-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getContractConfig } from "@/lib/contract/config";
import { getNetwork } from "@/lib/env";

export function WalletConnection() {
  const { wallet, open, disconnect } = ccc.useCcc();
  const signer = ccc.useSigner();

  const [balance, setBalance] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    if (!signer) {
      return;
    }

    (async () => {
      const addr = await signer.getRecommendedAddress();
      setAddress(addr);
    })();

    (async () => {
      const capacity = await signer.getBalance();
      setBalance(ccc.fixedPointToString(capacity));
    })();

    return () => {};
  }, [signer]);

  return (
    <div className="border-none w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5" />
          {wallet ? signer?.client.url : "Connect Wallet"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {wallet ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">{balance} CKB</h2>
              <p className="text-xs flex items-center gap-2">
                <span
                  className="cursor-pointer hover:underline"
                  title={address}
                  onClick={() => {
                    if (address) {
                      navigator.clipboard.writeText(address);
                    }
                  }}
                >
                  {address
                    ? `${address.slice(0, 10)}...${address.slice(-6)}`
                    : ""}
                </span>{" "}
                on {wallet.name}
              </p>
            </div>
            <Button
              onClick={disconnect}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button onClick={open} className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4">
          contract:{getContractConfig(getNetwork()).contractScript?.codeHash}
        </div>
      </CardContent>
    </div>
  );
}
