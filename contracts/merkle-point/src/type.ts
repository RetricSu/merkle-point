import { BytesLike, mol, NumLike } from "@ckb-js-std/core";
import * as bindings from "@ckb-js-std/bindings";

export type Hex = `0x${string}`;

export const Bytes32Codec: mol.Codec<string, Hex> = mol.Codec.from({
  byteLength: 32,
  encode: (hex: string) => bindings.hex.decode(hex),
  decode: (bytes: BytesLike) => bindings.hex.encode(bytes) as Hex,
});

export interface AccountUpdateLike {
  address: string; // 32 bytes
  oldPoint: NumLike; // 4 bytes
  newPoint: NumLike; // 4 bytes
}

export interface AccountUpdate {
  address: Hex; // 32 bytes
  oldPoint: number; // 4 bytes
  newPoint: number; // 4 bytes
}

export const AccountUpdateCodec: mol.Codec<AccountUpdateLike, AccountUpdate> =
  mol.table({
    address: Bytes32Codec,
    oldPoint: mol.Uint32,
    newPoint: mol.Uint32,
  });

export interface merklePointUpdateLike {
  oldRoot: string; // 32 bytes
  newRoot: string; // 32 bytes
  accounts: AccountUpdateLike[];
  proof: ArrayBuffer; // dynamic length
}

export interface merklePointUpdate {
  oldRoot: Hex; // 32 bytes
  newRoot: Hex; // 32 bytes
  accounts: AccountUpdate[];
  proof: ArrayBuffer; // dynamic length
}

export const merklePointUpdateCodec: mol.Codec<
  merklePointUpdateLike,
  merklePointUpdate
> = mol.table({
  oldRoot: Bytes32Codec,
  newRoot: Bytes32Codec,
  accounts: mol.vector(AccountUpdateCodec),
  proof: mol.Bytes,
});
