import { hashCkb, Hex, hexFrom } from "@ckb-ccc/core";

export function hashAddress(address: Hex) {
  return hashCkb(hexFrom(address));
}

export function hashPoint(point: number) {
  return hashCkb(hexFrom(point.toString(16)));
}
