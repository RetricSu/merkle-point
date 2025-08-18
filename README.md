# merkle-point

A CKB JavaScript smart contract on the CKB blockchain.

## Overview

This project uses the CKB JavaScript VM (ckb-js-vm) to write smart contracts in typescript. The contracts are compiled to bytecode and can be deployed to the CKB blockchain.

## Project Structure

```
merkle-point/
├── contracts/           # Smart contract source code
│   └── hello-world/
│       ├── src/
│       │   └── index.typescript # Contract implementation
│       └── dist/        # Compiled output (generated)
├── tests/              # Contract tests
│   └── hello-world.test.typescript
├── scripts/            # Build and utility scripts
│   ├── build-all.js
│   ├── build-contract.js
│   └── add-contract.js
├── package.json
├── tsconfig.json       # TypeScript configuration
├── tsconfig.base.json  # Base TypeScript settings
├── jest.config.cjs     # Jest testing configuration
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
