export const config = {
  rpc: {
    endpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT,
    rateLimit: Number(process.env.NEXT_PUBLIC_RATE_LIMIT) || 100,
  },
  scan: {
    api: process.env.NEXT_PUBLIC_SCAN_API,
  },
  dex: {
    api: process.env.NEXT_PUBLIC_DEXSCREENER_API,
  },
  burnAddresses: (process.env.NEXT_PUBLIC_BURN_ADDRESSES || "").split(","),
  token: {
    native: {
      name: process.env.NEXT_PUBLIC_NATIVE_TOKEN_NAME || "PulseChain",
      symbol: process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || "PLS",
      decimals: Number(process.env.NEXT_PUBLIC_NATIVE_TOKEN_DECIMALS) || 18,
    },
  },
  query: {
    limit: Number(process.env.NEXT_PUBLIC_DEFAULT_QUERY_LIMIT) || 1000,
    timeout: Number(process.env.NEXT_PUBLIC_QUERY_TIMEOUT) || 30000,
    retry: {
      attempts: Number(process.env.NEXT_PUBLIC_RETRY_ATTEMPTS) || 3,
      delay: Number(process.env.NEXT_PUBLIC_RETRY_DELAY) || 1000,
    },
  },
  sacrificeAddress: process.env.NEXT_PUBLIC_SACRIFICE_ADDRESS || "0x075e72a5eDf65F0A5f44188985A9b1239721eEc5",
};

export const ERC20_ABI = JSON.parse(process.env.NEXT_PUBLIC_ERC20_ABI || "[]");