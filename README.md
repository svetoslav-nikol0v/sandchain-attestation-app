# Sandchain Manifesto

A React + TypeScript + Vite application for signing the Sandchain Manifesto using Ethereum Attestation Service (EAS) and Sequence wallet integration.

## Features

- Connect with Sequence wallet
- Sign the Sandchain Manifesto with Sequence wallet as different roles (creator, fan, investor, builder)
- On-chain attestation using EAS (Ethereum Attestation Service)
- Warning decoder for transaction warnings
- Real-time transaction status updates

## Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Sequence wallet browser extension
- Environment variables configured

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd sandchain-attestation-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
VITE_ATTESTATION_SCHEMA_UID=your_schema_uid
VITE_EAS_CONTRACT_ADDRESS=your_eas_contract_address
VITE_MANIFESTO_SCHEMA=your_manifesto_schema
VITE_SEQUENCE_PROJECT_ACCESS_KEY=your_project_access_key
VITE_CHAIN_ID=chain_id
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

Build the application for production:

```bash
npm run build
```

## Preview

Preview the production build locally:

```bash
npm run preview
```

## Linting

Run ESLint to check for code issues:

```bash
npm run lint
```

## Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
