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
import { CkbSmt, verify_proof } from "smt-wasm";
import {
  serializeUpdates,
  merklePointUpdateLike,
  AccountUpdate,
} from "./core/mol";
import { assert } from "console";
import { hashAddress, hashPoint } from "./core/util";

describe("Mock test", () => {
  test("create a new merkle cell", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const mainScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_CKB_JS_VM)),
      tx,
      false,
    );
    const contractScript = resource.deployCell(
      hexFrom(readFileSync("contracts/merkle-point/dist/merkle-point.bc")),
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
      oldRoot: root1 as Hex,
      newRoot: root2 as Hex,
      accounts,
      proof,
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

  test("update an old key from old value to a new value", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const mainScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_CKB_JS_VM)),
      tx,
      false,
    );
    const contractScript = resource.deployCell(
      hexFrom(readFileSync("contracts/merkle-point/dist/merkle-point.bc")),
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
    ];

    let smt = new CkbSmt();

    const k1 = hashAddress(accounts[0].address);
    const v1 = hashPoint(accounts[0].oldPoint);
    const v1_1 = hashPoint(accounts[0].newPoint);

    smt.update(k1, v1);
    const root1 = smt.root();

    smt.update(k1, v1_1);
    const root2 = smt.root();

    const proof = ("0x" + smt.get_proof([k1])) as Hex;

    const update: merklePointUpdateLike = {
      oldRoot: root1 as Hex,
      newRoot: root2 as Hex,
      accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    assert(verify_proof(root1, proof.slice(2), [[k1, v1]]));
    assert(verify_proof(root2, proof.slice(2), [[k1, v1_1]]));

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

  test("update an old key and insert a new key at the same time", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const mainScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_CKB_JS_VM)),
      tx,
      false,
    );
    const contractScript = resource.deployCell(
      hexFrom(readFileSync("contracts/merkle-point/dist/merkle-point.bc")),
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
        oldPoint: 0,
        newPoint: 150,
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
        [k1, v1_1],
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

  test("update an old key with wrong proof", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const mainScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_CKB_JS_VM)),
      tx,
      false,
    );
    const contractScript = resource.deployCell(
      hexFrom(readFileSync("contracts/merkle-point/dist/merkle-point.bc")),
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
    ];

    let smt = new CkbSmt();

    const k1 = hashAddress(accounts[0].address);
    const v1 = hashPoint(accounts[0].oldPoint);
    const v1_1 = hashPoint(accounts[0].newPoint);

    smt.update(k1, v1);
    const root1 = smt.root();

    smt.update(k1, v1_1);
    const root2 = smt.root();

    const proof = ("0x" + smt.get_proof([k1])) as Hex;

    // we set the old value to a wrong value
    accounts[0].oldPoint = 101;

    const update: merklePointUpdateLike = {
      oldRoot: root1 as Hex,
      newRoot: root2 as Hex,
      accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    assert(verify_proof(root1, proof.slice(2), [[k1, v1]]));
    assert(verify_proof(root2, proof.slice(2), [[k1, v1_1]]));

    const inputCell = resource.mockCell(lockScript, typeScript, hexFrom(root1));
    const outputCell = Resource.createCellOutput(lockScript, typeScript);

    tx.inputs.push(Resource.createCellInput(inputCell));
    tx.outputs.push(outputCell);
    tx.outputsData.push(hexFrom(root2));
    tx.witnesses.push(hexFrom(witness.toBytes()));

    // verify the transaction
    const verifier = Verifier.from(resource, tx);

    // INSERT_YOUR_CODE
    expect(() => {
      verifier.verifySuccess(true);
    }).toThrow();
  });

  test("update an old key with wrong old value", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const mainScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_CKB_JS_VM)),
      tx,
      false,
    );
    const contractScript = resource.deployCell(
      hexFrom(readFileSync("contracts/merkle-point/dist/merkle-point.bc")),
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
    ];

    const rightSMT = new CkbSmt();

    const k1 = hashAddress(accounts[0].address);
    const v1 = hashPoint(accounts[0].oldPoint);
    const v1_1 = hashPoint(accounts[0].newPoint);

    rightSMT.update(k1, hashPoint(101));
    const root1 = rightSMT.root();

    const smt = new CkbSmt();
    smt.update(k1, v1);
    const wrongRoot1 = smt.root();

    smt.update(k1, v1_1);
    const root2 = rightSMT.root();

    const proof = ("0x" + rightSMT.get_proof([k1])) as Hex;

    const update: merklePointUpdateLike = {
      oldRoot: wrongRoot1 as Hex,
      newRoot: root2 as Hex,
      accounts,
      proof: proof,
    };

    const witness = WitnessArgs.from({
      inputType: hexFrom(serializeUpdates(update)),
    });

    assert(verify_proof(root1, proof.slice(2), [[k1, v1]]));
    assert(verify_proof(root2, proof.slice(2), [[k1, v1_1]]));

    const inputCell = resource.mockCell(lockScript, typeScript, hexFrom(root1));
    const outputCell = Resource.createCellOutput(lockScript, typeScript);

    tx.inputs.push(Resource.createCellInput(inputCell));
    tx.outputs.push(outputCell);
    tx.outputsData.push(hexFrom(root2));
    tx.witnesses.push(hexFrom(witness.toBytes()));

    // verify the transaction
    const verifier = Verifier.from(resource, tx);

    expect(() => {
      verifier.verifySuccess(true);
    }).toThrow();
  });
});
