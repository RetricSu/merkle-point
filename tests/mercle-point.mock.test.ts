import {
  hexFrom,
  Transaction,
  WitnessArgs,
  Hex,
  hashTypeToBytes,
  ccc,
} from "@ckb-ccc/core";
import { readFileSync } from "fs";
import {
  Resource,
  Verifier,
  DEFAULT_SCRIPT_ALWAYS_SUCCESS,
  DEFAULT_SCRIPT_CKB_JS_VM,
} from "ckb-testtool";
import { CkbSmt, hash_data, verify_proof } from "smt-wasm";
import {
  serializeUpdates,
  MerclePointUpdateLike,
  AccountUpdate,
} from "./core/mol";
import { assert } from "console";

describe("mercle-point contract", () => {
  test("should init a mercle cell successfully", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const mainScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_CKB_JS_VM)),
      tx,
      false,
    );
    const contractScript = resource.deployCell(
      hexFrom(readFileSync("contracts/mercle-point/dist/mercle-point.bc")),
      tx,
      false,
    );
    mainScript.args = hexFrom(
      "0x0000" +
        contractScript.codeHash.slice(2) +
        hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
        "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f",
    );
    const alwaysSuccessScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_ALWAYS_SUCCESS)),
      tx,
      false,
    );
    const lockScript = alwaysSuccessScript;
    const typeScript = mainScript;

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
      oldRoot: root1 as Hex,
      newRoot: root2 as Hex,
      accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    assert(verify_proof(root1, proof.slice(2), [[k1, ""]]));
    assert(verify_proof(root2, proof.slice(2), [[k1, v1]]));

    const inputCell = resource.mockCell(lockScript);
    const outputCell = Resource.createCellOutput(lockScript, typeScript);

    tx.inputs.push(Resource.createCellInput(inputCell));
    tx.outputs.push(outputCell);
    tx.outputsData.push(hexFrom(root2));
    tx.witnesses.push(hexFrom(witness.toBytes()));

    const typeId = ccc.hashTypeId(tx.inputs[0], 0);
    tx.outputs[0].type!.args = hexFrom(
      "0x0000" +
        contractScript.codeHash.slice(2) +
        hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
        typeId.slice(2),
    );

    // verify the transaction
    const verifier = Verifier.from(resource, tx);
    verifier.verifySuccess(true);
  });

  test("should execute successfully", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const mainScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_CKB_JS_VM)),
      tx,
      false,
    );
    const contractScript = resource.deployCell(
      hexFrom(readFileSync("contracts/mercle-point/dist/mercle-point.bc")),
      tx,
      false,
    );
    const typeId =
      "0x000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";
    mainScript.args = hexFrom(
      "0x0000" +
        contractScript.codeHash.slice(2) +
        hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
        typeId.slice(2),
    );
    const alwaysSuccessScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_ALWAYS_SUCCESS)),
      tx,
      false,
    );
    const lockScript = alwaysSuccessScript;
    const typeScript = mainScript;

    const accounts: AccountUpdate[] = [
      {
        address:
          "0x3aff0a9d6f7a8f741bd634b7f14254e93fd9c37e2499100189788dae48a2f3e4",
        oldPoint: 100,
        newPoint: 150,
      },
      {
        address:
          "0x68fe1c829f04a6f7b55e34361584c4bca686889d82427f1287fcadd752dfeb73",
        oldPoint: 200,
        newPoint: 150,
      },
    ];

    let smt = new CkbSmt();

    const k1 = hash_data(accounts[0].address);
    const k2 = hash_data(accounts[1].address);
    const v1 = hash_data(hexFrom(accounts[0].oldPoint.toString(16)));
    const v2 = hash_data(hexFrom(accounts[1].oldPoint.toString(16)));

    smt.update(k1, v1);
    const root1 = smt.root();

    smt.update(k2, v2);
    const root2 = smt.root();

    const proof = ("0x" + smt.get_proof([k1, k2])) as Hex;

    const update: MerclePointUpdateLike = {
      oldRoot: root1 as Hex,
      newRoot: root2 as Hex,
      accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    assert(
      verify_proof(root1, proof.slice(2), [
        [k1, v1],
        [k2, ""],
      ]),
    );
    assert(
      verify_proof(root2, proof.slice(2), [
        [k1, v1],
        [k2, v2],
      ]),
    );

    const inputCell = resource.mockCell(lockScript, typeScript, hexFrom(root1));
    const outputCell = Resource.createCellOutput(lockScript, typeScript);

    tx.inputs.push(Resource.createCellInput(inputCell));
    tx.outputs.push(outputCell);
    tx.outputsData.push(hexFrom(root2));
    tx.witnesses.push(hexFrom(witness.toBytes()));

    // verify the transaction
    const verifier = Verifier.from(resource, tx);
    verifier.verifySuccess(true);
  });
});
