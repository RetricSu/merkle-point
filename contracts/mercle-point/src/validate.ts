import { Bytes32Codec, Hex, MerclePointUpdate } from "./type";
import * as bindings from "@ckb-js-std/bindings";
import { hashAddress, hashPoint } from "./util";
import { log } from "@ckb-js-std/core";

export function validateOldRoot(targetOldRoot: Hex, update: MerclePointUpdate) {
  if (targetOldRoot !== update.oldRoot) {
    log.info("old root is not equal from updates");
    return false;
  }
  let smt = new bindings.Smt();
  for (const account of update.accounts) {
    smt.insert(hashAddress(account.address), hashPoint(account.oldPoint));
  }
  return smt.verify(
    Bytes32Codec.encode(update.oldRoot),
    bindings.hex.decode(update.proof),
  );
}

export function validateNewRoot(targetNewRoot: Hex, update: MerclePointUpdate) {
  if (targetNewRoot !== update.newRoot) {
    log.info("new root is not equal from updates");
    return false;
  }
  let smt = new bindings.Smt();
  for (const account of update.accounts) {
    smt.insert(hashAddress(account.address), hashPoint(account.newPoint));
  }
  return smt.verify(
    Bytes32Codec.encode(update.newRoot),
    bindings.hex.decode(update.proof),
  );
}
