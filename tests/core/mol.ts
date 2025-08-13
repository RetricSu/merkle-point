import {
  BytesLike,
  mol,
  NumLike,
  Hex,
  hexFrom,
  bytesFrom,
} from "@ckb-ccc/core";

export const Bytes32Codec: mol.Codec<string, Hex> = mol.Codec.from({
  byteLength: 32,
  encode: (hex: string) => {
    if (hex.startsWith("0x")) {
      return bytesFrom(hex.slice(2), "hex");
    }
    return bytesFrom(hex, "hex");
  },
  decode: (bytes: BytesLike) => hexFrom(bytes),
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

export interface MerclePointUpdateLike {
  oldRoot: string; // 32 bytes
  newRoot: string; // 32 bytes
  accounts: AccountUpdateLike[];
  proof: string; // dynamic length
}

export interface MerclePointUpdate {
  oldRoot: Hex; // 32 bytes
  newRoot: Hex; // 32 bytes
  accounts: AccountUpdate[];
  proof: Hex; // dynamic length
}

export const MerclePointUpdateCodec: mol.Codec<
  MerclePointUpdateLike,
  MerclePointUpdate
> = mol.table({
  oldRoot: Bytes32Codec,
  newRoot: Bytes32Codec,
  accounts: mol.vector(AccountUpdateCodec),
  proof: mol.Bytes,
});

export function serializeUpdates(update: MerclePointUpdateLike) {
  return MerclePointUpdateCodec.encode(update);
}

export function deserializeUpdates(bytes: ArrayBuffer) {
  const update = MerclePointUpdateCodec.decode(bytes);
  return update;
}
