// SMT WASM wrapper for browser environment
interface SmtWasmModule {
  default: () => Promise<void>;
  CkbSmt: new () => CkbSmtInstance;
  hash_data: (data: string) => string;
  verify_proof: (
    root: string,
    proof: string,
    leaves: Array<[string, string]>,
  ) => boolean;
}

interface CkbSmtInstance {
  root(): string;
  update(key: string, value: string): void;
  get_proof(keys: string[]): string;
}

declare global {
  interface Window {
    smtWasm?: SmtWasmModule;
  }
}

let wasmInitialized = false;

export async function initWasm(): Promise<SmtWasmModule | null> {
  if (!wasmInitialized && typeof window !== "undefined") {
    try {
      // Load the WASM module by dynamically creating a script tag
      if (!window.smtWasm) {
        await loadWasmScript();
      }
      wasmInitialized = true;
      return window.smtWasm || null;
    } catch (error) {
      console.error("Failed to initialize WASM:", error);
      throw error;
    }
  }
  return window?.smtWasm || null;
}

async function loadWasmScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser environment"));
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.innerHTML = `
      import init, { CkbSmt, hash_data, verify_proof } from '/smt_wasm.js';
      await init();
      window.smtWasm = { default: init, CkbSmt, hash_data, verify_proof };
      window.dispatchEvent(new Event('smtWasmLoaded'));
    `;

    const handleLoad = () => {
      script.removeEventListener("error", handleError);
      resolve();
    };

    const handleError = (error: ErrorEvent) => {
      script.removeEventListener("load", handleLoad);
      reject(error);
    };

    window.addEventListener("smtWasmLoaded", handleLoad, { once: true });
    script.addEventListener("error", handleError);

    document.head.appendChild(script);
  });
}

export function getCkbSmt() {
  if (typeof window !== "undefined" && window.smtWasm) {
    return window.smtWasm.CkbSmt;
  }
  throw new Error("SMT WASM not initialized. Call initWasm() first.");
}

export function getHashData() {
  if (typeof window !== "undefined" && window.smtWasm) {
    return window.smtWasm.hash_data;
  }
  throw new Error("SMT WASM not initialized. Call initWasm() first.");
}

export function getVerifyProof() {
  if (typeof window !== "undefined" && window.smtWasm) {
    return window.smtWasm.verify_proof;
  }
  throw new Error("SMT WASM not initialized. Call initWasm() first.");
}
