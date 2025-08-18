import { bytesFrom } from "@ckb-ccc/core";
import { serializeUpdates, deserializeUpdates, Bytes32Codec } from "./core/mol";

const hex32 = (byte: string) => "0x" + byte.repeat(32);

describe("mol codecs for merklePointUpdate", () => {
  test("encode/decode Bytes32Codec", () => {
    const encoded = Bytes32Codec.encode(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );
    const decoded = Bytes32Codec.decode(encoded);
    expect(decoded).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );

    expect(() => Bytes32Codec.encode("0x11223344")).toThrow();
    expect(() =>
      Bytes32Codec.decode(bytesFrom("0x112233445566778899aabbccddeeff")),
    ).toThrow();
  });

  test("encode/decode round-trip with multiple accounts", () => {
    const update = {
      oldRoot: hex32("11"),
      newRoot: hex32("22"),
      accounts: [
        {
          address: hex32("aa"),
          oldPoint: 1,
          newPoint: 2,
        },
        {
          address: hex32("bb"),
          oldPoint: 100,
          newPoint: 200,
        },
      ],
      proof: hex32("ff"),
    };

    const encoded = serializeUpdates(update);
    const decoded = deserializeUpdates(encoded);

    expect(decoded.oldRoot).toBe(update.oldRoot);
    expect(decoded.newRoot).toBe(update.newRoot);
    expect(decoded.proof).toBe(update.proof);
    expect(decoded.accounts).toHaveLength(2);
    expect(decoded.accounts[0]).toEqual({
      address: update.accounts[0].address,
      oldPoint: 1,
      newPoint: 2,
    });
    expect(decoded.accounts[1]).toEqual({
      address: update.accounts[1].address,
      oldPoint: 100,
      newPoint: 200,
    });
  });

  test("encode/decode round-trip with empty accounts", () => {
    const update = {
      oldRoot: hex32("33"),
      newRoot: hex32("44"),
      accounts: [],
      proof: hex32("ee"),
    };

    const encoded = serializeUpdates(update);
    const decoded = deserializeUpdates(encoded);
    expect(decoded.accounts).toHaveLength(0);
    expect(decoded.oldRoot).toBe(update.oldRoot);
    expect(decoded.newRoot).toBe(update.newRoot);
    expect(decoded.proof).toBe(update.proof);
  });

  test("encode fails with invalid root length", () => {
    const bad = {
      oldRoot: "0x11", // not 32 bytes
      newRoot: hex32("22"),
      accounts: [],
      proof: hex32("ff"),
    } as any;

    expect(() => serializeUpdates(bad)).toThrow();
  });
});
