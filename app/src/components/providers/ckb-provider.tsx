"use client";

import { ccc } from "@ckb-ccc/connector-react";
import { buildClient } from "@/lib/contract/client";
import { useState, useEffect, ReactNode } from "react";
import { CSSProperties } from "react";
import { getNetwork } from "@/lib/env";

interface CKBProviderProps {
  children: ReactNode;
}

export function CKBProvider({ children }: CKBProviderProps) {
  const [client, setClient] = useState<
    ccc.ClientPublicMainnet | ccc.ClientPublicTestnet | null
  >(null);

  // Initialize client only on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const network = getNetwork();
      const newClient = buildClient(network);
      setClient(newClient);
    }
  }, []);

  if (!client) {
    return <div>Loading...</div>;
  }

  return (
    <ccc.Provider
      connectorProps={{
        style: {
          "--background": "#232323",
          "--divider": "rgba(255, 255, 255, 0.1)",
          "--btn-primary": "#2D2F2F",
          "--btn-primary-hover": "#515151",
          "--btn-secondary": "#2D2F2F",
          "--btn-secondary-hover": "#515151",
          "--icon-primary": "#FFFFFF",
          "--icon-secondary": "rgba(255, 255, 255, 0.6)",
          color: "#ffffff",
          "--tip-color": "#666",
        } as CSSProperties,
      }}
      defaultClient={client}
    >
      {children}
    </ccc.Provider>
  );
}
