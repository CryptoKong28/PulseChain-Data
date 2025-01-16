# PulseChain Token Scanner

A modern, feature-rich web application for analyzing tokens on PulseChain. Track burned tokens, monitor liquidity distribution, analyze holder patterns, and view trading volume across different DEXs.

![Token Scanner](https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=80&w=2000&h=600)

## Features

- **🔥 Token Burns**: Track burned tokens and monitor total supply changes
- **💧 Liquidity Analysis**: View liquidity distribution across different DEXs
- **👥 Holder Analysis**: Analyze token holder patterns and distributions
- **📊 Volume Tracking**: Monitor 24h trading volume across various DEXs

## Tech Stack

- Next.js 13 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- Recharts for Data Visualization
- Web3.js for Blockchain Interaction

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd pulsechain-token-scanner
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# API Configuration
NEXT_PUBLIC_RPC_ENDPOINT=https://rpc.pulsechain.com
NEXT_PUBLIC_SCAN_API=https://api.scan.pulsechain.com/api/v2/
NEXT_PUBLIC_RATE_LIMIT=100
NEXT_PUBLIC_DEXSCREENER_API=https://api.dexscreener.com/latest/dex/tokens

# Burn Addresses
NEXT_PUBLIC_BURN_ADDRESSES=0x0000000000000000000000000000000000000000,0x000000000000000000000000000000000000dEaD

# Token Configuration
NEXT_PUBLIC_NATIVE_TOKEN_NAME=PulseChain
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=PLS
NEXT_PUBLIC_NATIVE_TOKEN_DECIMALS=18

# Contract ABIs
NEXT_PUBLIC_ERC20_ABI=[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"}]

# Query Configuration
NEXT_PUBLIC_DEFAULT_QUERY_LIMIT=1000
NEXT_PUBLIC_QUERY_TIMEOUT=30000
NEXT_PUBLIC_RETRY_ATTEMPTS=3
NEXT_PUBLIC_RETRY_DELAY=1000
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. **Token Burns**: Enter a token name and address to view burn statistics
2. **Liquidity**: Analyze liquidity distribution across DEXs
3. **Holders**: View token holder distribution and statistics
4. **Volume**: Track 24h trading volume across different exchanges

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.