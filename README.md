# Merkle-Point

A smart contract demo built with [ckb-js-vm](https://github.com/nervosnetwork/ckb-js-vm) in TypeScript that demonstrates how to use a Sparse Merkle Tree (SMT) to verify proofs on-chain.

## What is SMT?

A **Sparse Merkle Tree (SMT)** is a cryptographic data structure that makes it efficient to prove both inclusion (that something exists) and non-inclusion (that something does not exist) in a dataset.

- Each piece of data maps to a unique position in the tree, determined by its hash.
- If that position is empty, you can be certain the data is not in the entire tree.
- Although the tree is conceptually huge, almost all leaves are empty, so it remains efficient to store and compute.

### Why it Matters

- Efficient proofs: SMTs generate compact proofs for both inclusion (a key exists) and non-inclusion (a key does not exist) in a dataset.
- Scalability for sparse data: Ideal for large key spaces where only a fraction of entries are populated, since empty branches are represented implicitly, saving storage and computation.
- Security and integrity: Like all Merkle trees, SMTs provide cryptographic guarantees, ensuring any attempt to tamper with the data can be detected.

## Use Cases

SMTs are a building block you can apply to many scenarios:

- Allowlists & Airdrops:  prove that an address is eligible (or not) without uploading the full list on-chain.
- Membership & Access Control: prove a user belongs (or doesn’t belong) to a group (DAO, gated event, subscription program) using small, verifiable proofs.
- Loyalty & Point Systems: track balances off-chain and provide compact proofs on-chain when redemption or settlement is needed.


## Project Structure

```
merkle-point/
├── app/                                   # Next.js frontend
│   ├── public/                            # Static assets
│   └── src/
│       ├── app/                           # Next.js app router (layout, page, styles)
│       ├── components/                    # UI + dapp widgets
│       ├── lib/
│       │   ├── contract/                  # Frontend contract client + bindings
│       │   │   ├── client.ts              # RPC calls & on-chain interactions
│       │   │   ├── config.ts              # Addresses, network config
│       │   │   ├── deployment/            # Exported system/deploy metadata (JSON)
│       │   │   ├── merkle-point.ts        # Contract-specific frontend helpers
│       │   │   ├── smt-wrapper.ts         # Thin wrapper around SMT WASM
│       │   │   └── types.ts               # Shared types
│       │   ├── env.ts                     # Frontend env loader
│       │   └── utils.ts                   # Misc utilities
│   └── tsconfig.json
│
├── contracts/
│   └── merkle-point/
│       └── src/                           # JS-VM contract sources
│           ├── index.ts                   # Contract entry (verify proofs)
│           ├── type.ts                    # Molecule / type defs
│           ├── util.ts                    # Helpers
│           └── validate.ts                # Validation logic
│
├── deployment/                            # Built artifacts & migrations by network
├── smt-wasm/                              # WASM package for SMT operations
│   ├── smt_wasm_bg.wasm                   # Compiled WASM
│   └── smt_wasm.js / d.ts                 # JS glue + type defs
│
├── tests/                                 # Contract & integration tests
│   ├── merkle-point.mock.test.ts          # Mock env tests
│   ├── merkle-point.devnet.test.ts        # Devnet integration tests
│   ├── smt.test.ts / mol.test.ts          # Unit tests (SMT & Molecule)
│   └── core/                              # Test helpers (client, mol, utils)
├── scripts/                               # Repo build utilities
├── package.json                           # Workspace config & deps
├── tsconfig.base.json / tsconfig.json     # TS settings (root + project)
├── jest.config.cjs                        # Jest config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm package manager

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

### Building Contracts

Build all contracts:

```bash
pnpm run build
```

Build a specific contract:

```bash
pnpm run build:contract hello-world
```

### Running Tests

Run all tests:

```bash
pnpm test
```

Run tests for a specific contract:

```bash
pnpm test -- hello-world
```

### Adding New Contracts

Create a new contract:

```bash
pnpm run add-contract my-new-contract
```

This will:

- Create a new contract directory under `contracts/`
- Generate a basic contract template
- Create a corresponding test file

## Development

### Contract Development

1. Edit your contract in `contracts/<contract-name>/src/index.typescript`
2. Build the contract: `pnpm run build:contract <contract-name>`
3. Run tests: `pnpm test -- <contract-name>`

### Build Output

Each contract generates two files in its `dist/` directory:

- `{contract-name}.js` - Bundled JavaScript code
- `{contract-name}.bc` - Compiled bytecode for CKB execution

### Testing

Tests use the `ckb-testtool` framework to simulate CKB blockchain execution. Each test:

1. Sets up a mock CKB environment
2. Deploys the contract bytecode
3. Executes transactions
4. Verifies results

## Available Scripts

- `build` - Build all contracts
- `build:contract <name>` - Build a specific contract
- `test` - Run all tests
- `add-contract <name>` - Add a new contract
- `clean` - Remove all build outputs
- `format` - Format code with Prettier

## Dependencies

### Core Dependencies

- `@ckb-js-std/bindings` - CKB JavaScript VM bindings
- `@ckb-js-std/core` - Core CKB JavaScript utilities

### Development Dependencies

- `ckb-testtool` - Testing framework for CKB contracts
- `esbuild` - Fast JavaScript bundler
- `jest` - JavaScript testing framework
- `typescript` - TypeScript compiler
- `ts-jest` - TypeScript support for Jest
- `prettier` - Code formatter

## Resources

- [CKB JavaScript VM Documentation](https://github.com/nervosnetwork/ckb-js-vm)
- [CKB Developer Documentation](https://docs.nervos.org/docs/script/js/js-quick-start)
- [The Little Book of ckb-js-vm ](https://nervosnetwork.github.io/ckb-js-vm/)

## License

MIT
