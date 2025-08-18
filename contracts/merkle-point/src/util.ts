import * as bindings from "@ckb-js-std/bindings";
import { hashCkb, log } from "@ckb-js-std/core";
import { merklePointUpdateCodec, merklePointUpdateLike } from "./type";

export function hashAddress(address: string) {
  const value = hashCkb(bindings.hex.decode(address));
  return value;
}

export function hashPoint(point: number) {
  return hashCkb(bindings.hex.decode(point.toString(16)));
}

export function serializeWitness(update: merklePointUpdateLike) {
  return merklePointUpdateCodec.encode(update);
}

export function deserializeWitness(bytes: ArrayBuffer) {
  return merklePointUpdateCodec.decode(bytes);
}
