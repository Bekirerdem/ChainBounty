# 🔺 ChainBounty

**Cross-chain bounty & freelance platform** — create bounties on C-Chain, execute on App-Chain, settle payments automatically via Avalanche ICM.

> Built for [Avalanche Build Games 2026](https://www.avax.network/build-games) hackathon.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ChainBounty Flow                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👤 İş Veren                                            │
│   │                                                     │
│   ▼                                                     │
│  ┌──────────────────────┐    ICM/Teleporter             │
│  │  C-Chain (Fuji)      │ ◄──────────────────►          │
│  │  BountyManager.sol   │                    │          │
│  │  • Escrow (AVAX)     │    ┌──────────────────────┐   │
│  │  • Payment Release   │    │  App-Chain (L1)      │   │
│  └──────────────────────┘    │  BountyExecutor.sol  │   │
│                              │  • Submissions       │   │
│                              │  • Approval / Dispute│   │
│                              └──────────────────────┘   │
│                                         ▲               │
│                                         │               │
│                                    👷 Freelancer        │
└─────────────────────────────────────────────────────────┘
```

### Why Cross-Chain?

| Layer | Purpose |
|-------|---------|
| **C-Chain** | Liquidity, AVAX escrow, payment security (mainnet security) |
| **App-Chain** | Cheap gas for submissions, voting, dispute resolution (high throughput) |
| **ICM/Teleporter** | Secure cross-chain messaging, no bridge needed |

---

## 📁 Project Structure

```
ChainBounty/
├── packages/
│   ├── contracts/              # Foundry — Smart Contracts
│   │   ├── src/
│   │   │   ├── c-chain/        # BountyManager.sol (C-Chain)
│   │   │   ├── app-chain/      # BountyExecutor.sol (App-Chain)
│   │   │   └── interfaces/     # IBountyTypes.sol (shared types)
│   │   ├── test/               # Foundry unit tests
│   │   └── script/             # Deployment scripts
│   │
│   └── frontend/               # Next.js 15 — Web Dashboard
│       ├── app/                # App Router pages
│       └── lib/                # Wagmi config, ABIs, chain defs
│
├── avalanche/                  # L1 genesis config
├── relayer/                    # ICM Relayer config
└── .github/workflows/         # CI/CD
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Avalanche CLI](https://docs.avax.network/tooling/avalanche-cli)

### Setup

```bash
# 1. Clone & install
git clone https://github.com/YOUR_USERNAME/ChainBounty.git
cd ChainBounty
npm install

# 2. Setup Foundry dependencies
cd packages/contracts
forge install foundry-rs/forge-std
forge install ava-labs/icm-services
forge install OpenZeppelin/openzeppelin-contracts

# 3. Build & test contracts
forge build
forge test -vvv

# 4. Create & deploy local Avalanche L1
avalanche blockchain create bountychain
avalanche blockchain deploy bountychain --local

# 5. Deploy contracts
cp .env.example .env   # Fill in your values
forge script script/DeployBountyManager.s.sol --rpc-url $C_CHAIN_RPC_URL --broadcast
forge script script/DeployBountyExecutor.s.sol --rpc-url $APP_CHAIN_RPC_URL --broadcast

# 6. Start frontend
cd ../frontend
npm install
npm run dev
```

---

## 🛡️ Tech Stack

| Component | Technology |
|-----------|------------|
| Smart Contracts | Solidity 0.8.18, Foundry |
| Cross-Chain | Avalanche ICM (Teleporter) |
| Frontend | Next.js 15, React 19, TailwindCSS v4 |
| Web3 | Wagmi v2, Viem, RainbowKit |
| Animation | Framer Motion |
| CI/CD | GitHub Actions |
| Monorepo | npm Workspaces, Turborepo |

---

## 📅 Roadmap

| Week | Milestone |
|------|-----------|
| 1 | Project setup, idea pitch, 1-min video |
| 2 | Smart contracts + Foundry tests |
| 3 | Frontend MVP (bounty CRUD dashboard) |
| 4 | Cross-chain integration + E2E testing |
| 5 | Landing page, demo video, polish |
| 6 | Finals — live demo & pitch |

---

## 📄 License

MIT

---

**Built with ❤️ for the Avalanche ecosystem**
