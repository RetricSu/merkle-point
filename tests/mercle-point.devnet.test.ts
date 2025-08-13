import { hexFrom, ccc, hashTypeToBytes, WitnessArgs, Hex } from "@ckb-ccc/core";
import scripts from "../deployment/scripts.json";
import systemScripts from "../deployment/system-scripts.json";
import { buildClient, buildSigner } from "./core/helper";
import {
  AccountUpdate,
  MerclePointUpdateLike,
  serializeUpdates,
} from "./core/mol";
import { hash_data } from "smt-wasm";
import { CkbSmt } from "smt-wasm";

describe("mercle-point contract", () => {
  let client: ccc.Client;
  let signer: ccc.SignerCkbPrivateKey;

  beforeAll(() => {
    // Create global devnet client and signer for all tests in this describe block
    client = buildClient("devnet");
    signer = buildSigner(client);
  });

  test("should create a new merkle cell successfully", async () => {
    const ckbJsVmScript = systemScripts.devnet["ckb-js-vm"];
    const contractScript = scripts.devnet["mercle-point.bc"];

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
          "0x3aff0a9d6f7a8f741bd634b7f14254e93fd9c37e2499100189788dae48a2f3e4",
        oldPoint: 100,
        newPoint: 150,
      },
    ];

    let smt = new CkbSmt();
    const root1 = smt.root();

    const k1 = hash_data(accounts[0].address);
    const v1 = hash_data(hexFrom(accounts[0].oldPoint.toString(16)));

    smt.update(k1, v1);
    const root2 = smt.root();

    const proof = ("0x" + smt.get_proof([k1])) as Hex;

    const update: MerclePointUpdateLike = {
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

    console.log(
      "length: ",
      hexFrom(
        "0x0000" +
          contractScript.codeHash.slice(2) +
          hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
          typeId.slice(2),
      ).length,
    );

    const txHash = await signer.sendTransaction(tx);
    console.log(`Transaction sent: ${txHash}`);
  });
});
