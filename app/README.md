# Merkle Point Management Dashboard

A Next.js 15 frontend application for managing CKB merkle points using the @ckb-ccc connector.

## Features

- **Wallet Connection**: Connect to CKB wallets using @ckb-ccc/connector-react
- **Network Selection**: Switch between devnet, testnet, and mainnet
- **Account Management**: Add, edit, and manage multiple account point updates
- **CSV Import/Export**: Bulk import accounts from CSV or export current list
- **Transaction History**: Track submitted transactions and their status
- **Real-time Updates**: Monitor transaction confirmations

## Tech Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **@ckb-ccc/connector-react**: CKB wallet connector for React
- **smt-wasm**: Sparse Merkle Tree implementation in WebAssembly
- **Lucide React**: Icon library

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- A CKB wallet (for connecting to the dashboard)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the dashboard
2. Select your preferred CKB wallet from the connector dialog
3. Approve the connection request in your wallet

### Managing Accounts

1. **Add Individual Accounts**:
   - Enter the account address (with or without 0x prefix)
   - Set the old point value (current points)
   - Set the new point value (target points)
   - Click "Add Account"

2. **Import from CSV**:
   - Prepare a CSV file with columns: `address`, `oldPoint`, `newPoint`
   - Click "Import CSV" and select your file
   - Accounts will be added to the current list

3. **Export to CSV**:
   - Click "Export CSV" to download current account list
   - Use this for backup or sharing with team members

### Submitting Updates

1. Add all accounts you want to update
2. Review the changes in the table (green = increase, red = decrease)
3. Click "Submit to Chain" to create the merkle update transaction
4. Confirm the transaction in your wallet
5. Monitor the transaction status in the history section

### CSV Format

Your CSV file should have the following format:

```csv
address,oldPoint,newPoint
0x3aff0a9d6f7a8f741bd634b7f14254e93fd9c37e2499100189788dae48a2f3e4,100,150
0x68fe1c829f04a6f7b55e34361584c4bca686889d82427f1287fcadd752dfeb73,200,175
```

## Configuration

### Environment Variables

The application uses environment variables to configure the CKB network. Create a `.env.local` file in the app directory with the following configuration:

```bash
# CKB Network Configuration
# Valid values: "devnet", "testnet", "mainnet"
# Default: "testnet" (if not set or invalid)
NEXT_PUBLIC_CKB_NETWORK=testnet
```

**Network Options:**

- `devnet`: Local development network (requires offckb)
- `testnet`: CKB testnet for testing
- `mainnet`: CKB mainnet for production

### Contract Configuration

The dashboard uses contract configuration files to interact with the merkle point contract. These configurations include:

- CKB-JS VM script information
- Merkle point contract script details
- Cell dependencies

Update the configuration in `/src/lib/contract/config.ts` with your deployed contract details.

### Network Configuration

The app supports three networks:

- **Devnet**: Local development (http://localhost:28114)
- **Testnet**: CKB Testnet
- **Mainnet**: CKB Mainnet

## Smart Contract Integration

The dashboard integrates with the merkle point smart contract through:

1. **Sparse Merkle Trees**: Uses SMT to efficiently store and update account points
2. **Proof Generation**: Automatically generates merkle proofs for updates
3. **Transaction Building**: Constructs CKB transactions with proper witnesses
4. **Type ID Management**: Handles contract type ID generation and validation

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── dashboard/         # Dashboard components
│   ├── providers/         # React context providers
│   └── ui/               # Reusable UI components
└── lib/
    ├── contract/         # Smart contract interaction
    └── utils.ts         # Utility functions
```

### Key Components

- **MerkleDashboard**: Main dashboard component
- **WalletConnection**: Wallet connection UI
- **AccountManager**: Account CRUD operations
- **TransactionHistory**: Transaction monitoring
- **MerklePointContract**: Smart contract interaction class

## Deployment

1. Build the application:

```bash
pnpm build
```

2. Start the production server:

```bash
pnpm start
```

3. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

## Security Considerations

- Always verify contract addresses and configurations
- Test thoroughly on devnet/testnet before mainnet usage
- Keep your private keys secure and never commit them to version control
- Validate all user inputs before submitting transactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the merkle-point repository and follows the same licensing terms.
