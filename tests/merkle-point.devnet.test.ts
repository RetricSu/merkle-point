import { hexFrom, ccc, hashTypeToBytes, WitnessArgs, Hex } from "@ckb-ccc/core";
import scripts from "../deployment/scripts.json";
import systemScripts from "../deployment/system-scripts.json";
import { buildClient, buildSigner } from "./core/client";
import {
  AccountUpdate,
  merklePointUpdateLike,
  serializeUpdates,
} from "./core/mol";
import { CkbSmt } from "smt-wasm";
import { hashAddress, hashPoint } from "./core/util";

describe("Devnet test", () => {
  let client: ccc.Client;
  let signer: ccc.SignerCkbPrivateKey;
  let firstMerkleCellOutPoint: ccc.OutPoint | null = null;
  let firstMerkleCellOut: ccc.CellOutput | null = null;
  let currentRoot: Hex;

  beforeAll(() => {
    // Create global devnet client and signer for all tests in this describe block
    client = buildClient("devnet");
    signer = buildSigner(client);
  });

  test("create a new merkle cell", async () => {
    const ckbJsVmScript = systemScripts.devnet["ckb_js_vm"];
    const contractScript = scripts.devnet["merkle-point.bc"];

    const mainScript = {
      codeHash: ckbJsVmScript.script.codeHash,
      hashType: ckbJsVmScript.script.hashType,
      args: hexFrom(
        "0x0000" +
          contractScript.codeHash.slice(2) +
          hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
          "0000000000000000000000000000000000000000000000000000000000000000",
      ),
    };

    const accounts: AccountUpdate[] = [
      {
        address:
          "0x3aff0a9d6f7a8f741bd634b7f14254e93fd9c37e2499100189788dae48a2f3e4" as Hex,
        oldPoint: 0,
        newPoint: 150,
      },
    ];

    let smt = new CkbSmt();
    const root1 = smt.root();

    const k1 = hashAddress(accounts[0].address);
    const v1 = hashPoint(accounts[0].newPoint);

    smt.update(k1, v1);
    const root2 = smt.root();

    const proof = ("0x" + smt.get_proof([k1])) as Hex;

    const update: merklePointUpdateLike = {
      oldRoot: root1,
      newRoot: root2,
      accounts: accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    const signerLock = (await signer.getRecommendedAddressObj()).script;
    const toLock = {
      codeHash: signerLock.codeHash,
      hashType: signerLock.hashType,
      args: signerLock.args,
    };

    const tx = ccc.Transaction.from({
      outputs: [
        {
          lock: toLock,
          type: mainScript,
        },
      ],
      outputsData: [hexFrom(root2)],
      cellDeps: [
        ...ckbJsVmScript.script.cellDeps.map((c) => c.cellDep),
        ...contractScript.cellDeps.map((c) => c.cellDep),
      ],
      witnesses: [hexFrom(witness.toBytes())],
    });

    await tx.completeInputsByCapacity(signer);
    await tx.completeFeeBy(signer, 1000);

    const typeId = ccc.hashTypeId(tx.inputs[0], 0);
    tx.outputs[0].type!.args = hexFrom(
      "0x0000" +
        contractScript.codeHash.slice(2) +
        hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
        typeId.slice(2),
    );
    const txHash = await signer.sendTransaction(tx);
    console.log(`Transaction sent: ${txHash}`);

    // Store the output cell for reuse in subsequent tests
    firstMerkleCellOut = tx.outputs[0];
    firstMerkleCellOutPoint = ccc.OutPoint.from({
      txHash: txHash as Hex,
      index: 0,
    });
    currentRoot = root2 as Hex;
  });

  test("update an old key from old value to a new value", async () => {
    if (!firstMerkleCellOut || !firstMerkleCellOutPoint) {
      throw new Error(
        "First merkle cell not created. Tests must run in order.",
      );
    }

    const ckbJsVmScript = systemScripts.devnet["ckb_js_vm"];
    const contractScript = scripts.devnet["merkle-point.bc"];

    const mainScript = firstMerkleCellOut.type;

    const accounts: AccountUpdate[] = [
      {
        address:
          "0x3aff0a9d6f7a8f741bd634b7f14254e93fd9c37e2499100189788dae48a2f3e4" as Hex,
        oldPoint: 150,
        newPoint: 200,
      },
    ];

    let smt = new CkbSmt();

    const k1 = hashAddress(accounts[0].address);
    const v1 = hashPoint(accounts[0].oldPoint);
    const v1_1 = hashPoint(accounts[0].newPoint);

    smt.update(k1, v1);
    const root1 = currentRoot; // smt.root();

    smt.update(k1, v1_1);
    const root2 = smt.root();

    const proof = ("0x" + smt.get_proof([k1])) as Hex;

    const update: merklePointUpdateLike = {
      oldRoot: root1,
      newRoot: root2,
      accounts: accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    const signerLock = (await signer.getRecommendedAddressObj()).script;
    const toLock = {
      codeHash: signerLock.codeHash,
      hashType: signerLock.hashType,
      args: signerLock.args,
    };

    const tx = ccc.Transaction.from({
      inputs: [
        {
          previousOutput: firstMerkleCellOutPoint,
        },
      ],
      outputs: [
        {
          lock: toLock,
          type: mainScript,
        },
      ],
      outputsData: [hexFrom(root2)],
      cellDeps: [
        ...ckbJsVmScript.script.cellDeps.map((c) => c.cellDep),
        ...contractScript.cellDeps.map((c) => c.cellDep),
      ],
      witnesses: [hexFrom(witness.toBytes())],
    });

    await tx.completeInputsByCapacity(signer);
    await tx.completeFeeBy(signer, 1000);

    const txHash = await signer.sendTransaction(tx);
    console.log(`Update transaction sent: ${txHash}`);

    // Update the stored output cell for the next test
    firstMerkleCellOut = tx.outputs[0];
    firstMerkleCellOutPoint = ccc.OutPoint.from({
      txHash: txHash as Hex,
      index: 0,
    });
    currentRoot = root2 as Hex;
  });

  test("update an old key and insert a new key at the same time", async () => {
    if (!firstMerkleCellOut || !firstMerkleCellOutPoint) {
      throw new Error(
        "First merkle cell not created. Tests must run in order.",
      );
    }

    const ckbJsVmScript = systemScripts.devnet["ckb_js_vm"];
    const contractScript = scripts.devnet["merkle-point.bc"];

    const mainScript = firstMerkleCellOut.type;

    const accounts: AccountUpdate[] = [
      {
        address:
          "0x3aff0a9d6f7a8f741bd634b7f14254e93fd9c37e2499100189788dae48a2f3e4" as Hex,
        oldPoint: 200,
        newPoint: 250,
      },
      {
        address:
          "0x68fe1c829f04a6f7b55e34361584c4bca686889d82427f1287fcadd752dfeb73" as Hex,
        oldPoint: 0,
        newPoint: 100,
      },
    ];

    let smt = new CkbSmt();

    const k1 = hashAddress(accounts[0].address);
    const v1 = hashPoint(accounts[0].oldPoint);
    const v1_1 = hashPoint(accounts[0].newPoint);
    const k2 = hashAddress(accounts[1].address);
    const v2 = hashPoint(accounts[1].newPoint);

    smt.update(k1, v1);
    const root1 = smt.root();

    smt.update(k1, v1_1);
    smt.update(k2, v2);
    const root2 = smt.root();

    const proof = ("0x" + smt.get_proof([k1, k2])) as Hex;

    const update: merklePointUpdateLike = {
      oldRoot: root1,
      newRoot: root2,
      accounts: accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    const signerLock = (await signer.getRecommendedAddressObj()).script;
    const toLock = {
      codeHash: signerLock.codeHash,
      hashType: signerLock.hashType,
      args: signerLock.args,
    };

    const tx = ccc.Transaction.from({
      inputs: [
        {
          previousOutput: firstMerkleCellOutPoint,
        },
      ],
      outputs: [
        {
          lock: toLock,
          type: mainScript,
        },
      ],
      outputsData: [hexFrom(root2)],
      cellDeps: [
        ...ckbJsVmScript.script.cellDeps.map((c) => c.cellDep),
        ...contractScript.cellDeps.map((c) => c.cellDep),
      ],
      witnesses: [hexFrom(witness.toBytes())],
    });

    await tx.completeFeeBy(signer, 1000);

    const txHash = await signer.sendTransaction(tx);
    console.log(`Multi-update transaction sent: ${txHash}`);

    // Update the stored output cell for potential future tests
    firstMerkleCellOut = tx.outputs[0];
    firstMerkleCellOutPoint = ccc.OutPoint.from({
      txHash: txHash as Hex,
      index: 0,
    });
    currentRoot = root2 as Hex;
  });

  test("update old keys from one correct value and one wrong value", async () => {
    if (!firstMerkleCellOut || !firstMerkleCellOutPoint) {
      throw new Error(
        "First merkle cell not created. Tests must run in order.",
      );
    }

    const ckbJsVmScript = systemScripts.devnet["ckb_js_vm"];
    const contractScript = scripts.devnet["merkle-point.bc"];

    const mainScript = firstMerkleCellOut.type;

    const accounts: AccountUpdate[] = [
      {
        address:
          "0x3aff0a9d6f7a8f741bd634b7f14254e93fd9c37e2499100189788dae48a2f3e4" as Hex,
        oldPoint: 240, // the correct old value is 200
        newPoint: 300,
      },
      {
        address:
          "0x68fe1c829f04a6f7b55e34361584c4bca686889d82427f1287fcadd752dfeb73" as Hex,
        oldPoint: 100,
        newPoint: 101,
      },
    ];

    let smt = new CkbSmt();

    const k1 = hashAddress(accounts[0].address);
    const v1 = hashPoint(accounts[0].oldPoint);
    const v1_1 = hashPoint(accounts[0].newPoint);
    const k2 = hashAddress(accounts[1].address);
    const v2 = hashPoint(accounts[1].newPoint);

    smt.update(k1, v1);
    const root1 = smt.root();

    smt.update(k1, v1_1);
    smt.update(k2, v2);
    const root2 = smt.root();

    const proof = ("0x" + smt.get_proof([k1, k2])) as Hex;

    const update: merklePointUpdateLike = {
      oldRoot: root1,
      newRoot: root2,
      accounts: accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    const signerLock = (await signer.getRecommendedAddressObj()).script;
    const toLock = {
      codeHash: signerLock.codeHash,
      hashType: signerLock.hashType,
      args: signerLock.args,
    };

    const tx = ccc.Transaction.from({
      inputs: [
        {
          previousOutput: firstMerkleCellOutPoint,
        },
      ],
      outputs: [
        {
          lock: toLock,
          type: mainScript,
        },
      ],
      outputsData: [hexFrom(root2)],
      cellDeps: [
        ...ckbJsVmScript.script.cellDeps.map((c) => c.cellDep),
        ...contractScript.cellDeps.map((c) => c.cellDep),
      ],
      witnesses: [hexFrom(witness.toBytes())],
    });

    await tx.completeFeeBy(signer, 1000);

    expect(async () => {
      await signer.sendTransaction(tx);
    }).rejects.toThrow();
  });
});
