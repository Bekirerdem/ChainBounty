# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

This is a **npm Workspaces + Turborepo** monorepo. Run from root:

| Command | Description |
|---|---|
| `npm run dev` | Start all packages in dev mode (turbo) |
| `npm run build` | Build contracts then frontend (turbo) |
| `npm run test` | Run all tests (turbo) |
| `npm run lint` | Lint all packages (turbo) |

### Contracts (`packages/contracts`) — Foundry

```bash
forge build                  # Compile
forge test -vvv              # Run all tests (verbose)
forge test --match-test test_FunctionName -vvv   # Run a single test
forge fmt --check            # Lint (check formatting)
forge fmt                    # Auto-format
```

Deployment (requires env vars from `.env.example`):
```bash
forge script script/DeployBountyManager.s.sol --rpc-url $C_CHAIN_RPC_URL --broadcast
forge script script/DeployBountyExecutor.s.sol --rpc-url $APP_CHAIN_RPC_URL --broadcast
```

### Frontend (`packages/frontend`) — Next.js 15

```bash
npm run dev      # next dev
npm run build    # next build
npm run lint     # next lint
```

## Architecture

**ChainBounty** is a cross-chain freelance bounty platform on Avalanche using ICM/Teleporter for messaging between C-Chain and a custom App-Chain.

### Two-Chain Contract Design

```
C-Chain (Fuji, 43113)              App-Chain (Custom L1, 99999)
┌─────────────────────┐            ┌──────────────────────┐
│  BountyManager.sol  │◄──ICM/──►│  BountyExecutor.sol  │
│  - createBounty()   │  Teleporter │  - submitProposal()  │
│  - escrows AVAX     │            │  - acceptProposal()  │
│  - receiveTeleporter│            │  - (TODO) complete &  │
│    Message → pays   │            │    trigger payment    │
│    developer        │            │    via ICM message    │
└─────────────────────┘            └──────────────────────┘
```

1. Employer creates bounty on C-Chain → AVAX escrowed in BountyManager
2. Freelancers submit proposals on App-Chain (cheap gas) via BountyExecutor
3. Employer accepts proposal on App-Chain
4. (TODO) Work completion triggers ICM message → C-Chain releases funds to developer

### Frontend Architecture

- **Next.js 15 App Router** with React 19, TypeScript, TailwindCSS v4 (CSS-first config in `globals.css`)
- **Web3 stack**: Wagmi v2 + RainbowKit v2 + Viem + TanStack Query
- **Provider hierarchy**: `WagmiProvider → QueryClientProvider → RainbowKitProvider → DemoProvider`
- **Demo mode** (`contexts/DemoContext.tsx`): `isDemoMode` defaults `true`, serves mock data from `lib/mock-data.ts`. Toggle in Navbar switches between mock and live contract calls.
- **Custom chains** defined in `lib/chains.ts` (Fuji + App-Chain). Wagmi config in `lib/wagmi.ts`.
- **`lib/contracts.ts`**: Currently empty — ABI/address bindings are TODO.
- **3D/Animation**: Three.js + R3F for hero background (dynamically imported, no SSR), GSAP for hero entry animations, Framer Motion for scroll animations, Lenis for smooth scroll.

### Key Files

- `packages/contracts/src/interfaces/IBountyTypes.sol` — Shared enums/structs (BountyStatus, CrossChainMessage, etc.)
- `packages/contracts/src/interfaces/ITeleporter.sol` — ITeleporterReceiver interface
- `avalanche/genesis.json` — Custom App-Chain genesis config
- `relayer/config.json` — AWM/ICM relayer config for both chains
- `.env.example` — All required environment variables

## Conventions

- Solidity version: `0.8.20` (set in `foundry.toml`). Some files still use `pragma ^0.8.18` — should be `^0.8.20`.
- Foundry remappings: `@openzeppelin/` → `node_modules`, `forge-std/` and `icm-contracts/` → `lib/` submodules.
- All interactive frontend components use `"use client"` directive.
- CSS custom properties for theming (`--avax-red`, `--bg-primary`, etc.) defined in `globals.css`.
- Path alias: `@/*` maps to package root in frontend tsconfig.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push to `main`/`develop` and PRs to `main`:
- **Contracts**: Foundry nightly, `forge build --sizes`, `forge test -vvv`, `forge fmt --check`
- **Frontend**: Node 20, `npm ci`, `npm run lint`, `npm run build`
