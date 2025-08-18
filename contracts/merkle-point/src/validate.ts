import { Hex, merklePointUpdate } from "./type";
import * as bindings from "@ckb-js-std/bindings";
import { hashAddress, hashPoint } from "./util";
import { log } from "@ckb-js-std/core";

export function validateOldRoot(
  targetOldRoot: string,
  update: merklePointUpdate,
) {
  if (targetOldRoot !== update.oldRoot) {
    log.info("old root is not equal from updates");
    return false;
  }
  let smt = new bindings.Smt();
  for (const account of update.accounts) {
    if (account.oldPoint === 0) {
      // if the old point is 0, it means the account is new
      // so we only need to insert an empty value
      const k1 = hashAddress(account.address);
      smt.insert(k1, new ArrayBuffer(0));
      continue;
    }
    const k1 = hashAddress(account.address);
    const v1 = hashPoint(account.oldPoint);
    smt.insert(k1, v1);
  }
  return smt.verify(bindings.hex.decode(update.oldRoot), update.proof);
}

export function validateNewRoot(targetNewRoot: Hex, update: merklePointUpdate) {
  if (targetNewRoot !== update.newRoot) {
    log.info("new root is not equal from updates");
    return false;
  }
  let smt = new bindings.Smt();
  for (const account of update.accounts) {
    const k1 = hashAddress(account.address);
    const v1 = hashPoint(account.newPoint);
    smt.insert(k1, v1);
  }

  return smt.verify(bindings.hex.decode(update.newRoot), update.proof);
}
