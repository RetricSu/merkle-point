import { Hex } from "@ckb-ccc/connector-react";
import scripts from "./deployment/scripts.json";
import systemScripts from "./deployment/system-scripts.json";
import { NetworkType } from "@/lib/env";

export const getContractConfig = (network: NetworkType): ContractConfig => {
  const system = systemScripts as SystemScriptsConfig;
  const contracts = scripts as ScriptsConfig;

  return {
    ckbJsVmScript: system[network]["ckb_js_vm"].script,
    contractScript: contracts[network]["merkle-point.bc"],
  };
};

interface CellDep {
  outPoint: { txHash: Hex; index: number };
  depType: "code" | "depGroup";
}

export interface ScriptConfig {
  codeHash: Hex;
  hashType: "type" | "data" | "data1" | "data2";
  cellDeps: Array<{ cellDep: CellDep }>;
}

export interface SystemScriptEntry {
  name: string;
  file?: string;
  script: ScriptConfig;
}

export interface NetworkScripts {
  [key: string]: ScriptConfig;
}

export interface NetworkSystemScripts {
  [key: string]: SystemScriptEntry;
}

export interface ScriptsConfig {
  devnet: NetworkScripts;
  testnet: NetworkScripts;
  mainnet: NetworkScripts;
}

export interface SystemScriptsConfig {
  devnet: NetworkSystemScripts;
  testnet: NetworkSystemScripts;
  mainnet: NetworkSystemScripts;
}

export interface ContractConfig {
  ckbJsVmScript: ScriptConfig;
  contractScript: ScriptConfig;
}
