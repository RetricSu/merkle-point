import {
  hexFrom,
  ccc,
  hashTypeToBytes,
  WitnessArgs,
  Hex,
  CellInputLike,
  Cell,
  Script,
  ClientTransactionResponse,
  bytesFrom,
  hashCkb,
} from "@ckb-ccc/connector-react";
import {
  AccountUpdate,
  deserializeUpdates,
  merklePointUpdateLike,
  serializeUpdates,
} from "./types";
import { ContractConfig } from "./config";
import { getCkbSmt, initWasm } from "./smt-wrapper";

export class MerklePointContract {
  private config: ContractConfig;
  private signer: ccc.Signer;

  constructor(config: ContractConfig, signer: ccc.Signer) {
    this.config = config;
    this.signer = signer;
  }

  /**
   * Create a new merkle cell with initial account updates
   */
  async createMerkleCell(initialAccountUpdates: AccountUpdate[]): Promise<Hex> {
    await initWasm();

    const mainScript = {
      codeHash: this.config.ckbJsVmScript.codeHash,
      hashType: this.config.ckbJsVmScript.hashType,
      args: hexFrom(
        "0x0000" +
          this.config.contractScript.codeHash.slice(2) +
          hexFrom(hashTypeToBytes(this.config.contractScript.hashType)).slice(
            2,
          ) +
          "0000000000000000000000000000000000000000000000000000000000000000",
      ),
    };

    // Build SMT tree with account updates
    const CkbSmt = getCkbSmt();
    const smt = new CkbSmt();
    const root1 = smt.root();

    // Add accounts to SMT
    for (const account of initialAccountUpdates) {
      const key = this.hashAddress(account.address);
      const value = this.hashPoint(account.newPoint);
      smt.update(key, value);
    }

    const root2 = smt.root();
    const keys = initialAccountUpdates.map((account) =>
      this.hashAddress(account.address),
    );
    const proof = ("0x" + smt.get_proof(keys)) as Hex;

    const update: merklePointUpdateLike = {
      oldRoot: root1,
      newRoot: root2,
      accounts: initialAccountUpdates,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    const signerLock = (await this.signer.getRecommendedAddressObj()).script;
    const toLock = {
      codeHash: signerLock.codeHash,
      hashType: signerLock.hashType,
      args: signerLock.args,
    };

    let tx = ccc.Transaction.from({
      outputs: [
        {
          lock: toLock,
          type: mainScript,
        },
      ],
      outputsData: [hexFrom(root2)],
      cellDeps: [
        ...this.config.ckbJsVmScript.cellDeps.map((c) => c.cellDep),
        ...this.config.contractScript.cellDeps.map((c) => c.cellDep),
      ],
      witnesses: [hexFrom(witness.toBytes())],
    });

    await tx.completeInputsByCapacity(this.signer);
    await tx.completeFeeBy(this.signer, 1000);

    // Generate type ID
    const typeId = ccc.hashTypeId(tx.inputs[0], 0);
    tx.outputs[0].type!.args = hexFrom(
      "0x0000" +
        this.config.contractScript.codeHash.slice(2) +
        hexFrom(hashTypeToBytes(this.config.contractScript.hashType)).slice(2) +
        typeId.slice(2),
    );

    // the new ccc signer works differently in filling the witness
    // so we just construct it manually until we figure out the details of ccc signer
    tx = await this.signer.signTransaction(tx);
    witness.lock = tx.witnesses[0];
    tx.witnesses = [hexFrom(witness.toBytes())];

    const txHash = await this.signer.sendTransaction(tx);
    return txHash;
  }

  /**
   * Update existing merkle cell with new account points
   */
  async updateMerkleCell(
    smtCell: CellInputLike,
    accounts: AccountUpdate[],
  ): Promise<Hex> {
    // Initialize WASM module
    await initWasm();

    // Build current SMT state from existing accounts
    const CkbSmt = getCkbSmt();
    const smt = new CkbSmt();
    if (!smtCell.outputData) {
      throw new Error("Input cell has no output data");
    }

    const oldRoot = hexFrom(smtCell.outputData);

    // Apply updates to get new root
    for (const account of accounts) {
      const key = this.hashAddress(account.address);
      const newValue = this.hashPoint(account.newPoint);
      smt.update(key, newValue);
    }

    const newRoot = smt.root();
    const keys = accounts.map((account) => this.hashAddress(account.address));
    const proof = ("0x" + smt.get_proof(keys)) as Hex;

    const update: merklePointUpdateLike = {
      oldRoot: oldRoot,
      newRoot: newRoot,
      accounts: accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    const tx = ccc.Transaction.from({
      inputs: [smtCell],
      outputs: [
        {
          lock: smtCell.cellOutput!.lock,
          type: smtCell.cellOutput!.type,
        },
      ],
      outputsData: [hexFrom(newRoot)],
      cellDeps: [
        ...this.config.ckbJsVmScript.cellDeps.map((c) => c.cellDep),
        ...this.config.contractScript.cellDeps.map((c) => c.cellDep),
      ],
      witnesses: [hexFrom(witness.toBytes())],
    });

    await tx.completeInputsByCapacity(this.signer);
    await tx.completeFeeBy(this.signer, 1000);

    const txHash = await this.signer.sendTransaction(tx);
    return txHash;
  }

  /**
   * Get all merkle cells owned by the signer
   */
  async findMerkleCells() {
    const lockScript = (await this.signer.getRecommendedAddressObj()).script;
    const cellsGenerator = await this.signer.client.findCells({
      script: lockScript,
      scriptType: "lock",
      filter: {
        script: {
          codeHash: this.config.ckbJsVmScript.codeHash,
          hashType: this.config.ckbJsVmScript.hashType,
          args: this.buildScriptArgs("0x"),
        },
      },
      scriptSearchMode: "prefix",
    });
    const result: Cell[] = [];
    for await (const cell of cellsGenerator) {
      result.push(cell);
    }
    return result;
  }

  async findTransactionsBy(merklePointTypeScript: Script) {
    const txFindResultGenerator =
      await this.signer.client.findTransactionsByType(merklePointTypeScript);
    const txFindResult: {
      txHash: Hex;
      blockNumber: ccc.Num;
      txIndex: ccc.Num;
      isInput: boolean;
      cellIndex: ccc.Num;
    }[] = [];
    for await (const tx of txFindResultGenerator) {
      txFindResult.push(tx);
    }

    const txs: ClientTransactionResponse[] = [];
    for (const txResult of txFindResult) {
      // todo: make this batch request to get all transactions
      const tx = await this.signer.client.getTransaction(txResult.txHash);
      if (tx != null) {
        txs.push(tx);
      }
    }

    return txs;
  }

  parseMerkleUpdateFromWitness(witness: WitnessArgs) {
    if (witness.inputType == undefined) {
      throw new Error("Witness has no input type");
    }
    const update = deserializeUpdates(
      bytesFrom(witness.inputType).buffer as ArrayBuffer,
    );
    return update;
  }

  buildScriptArgs(typeId: Hex) {
    return hexFrom(
      "0x0000" +
        this.config.contractScript.codeHash.slice(2) +
        hexFrom(hashTypeToBytes(this.config.contractScript.hashType)).slice(2) +
        typeId.slice(2),
    );
  }

  hashAddress(address: Hex) {
    return hashCkb(hexFrom(address));
  }

  hashPoint(point: number) {
    return hashCkb(hexFrom(point.toString(16)));
  }
}

export { getCkbSmt, initWasm };
