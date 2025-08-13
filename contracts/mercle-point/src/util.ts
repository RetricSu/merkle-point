import * as bindings from "@ckb-js-std/bindings";
import { hashCkb } from "@ckb-js-std/core";
import { MerclePointUpdateCodec, MerclePointUpdateLike } from "./type";

export function hashAddress(address: string) {
  return hashCkb(bindings.hex.decode(address));
}

export function hashPoint(point: number) {
  return hashCkb(bindings.hex.decode(point.toString(16)));
}

export function serializeWitness(update: MerclePointUpdateLike) {
  return MerclePointUpdateCodec.encode(update);
}

export function deserializeWitness(bytes: ArrayBuffer) {
  return MerclePointUpdateCodec.decode(bytes);
}
