'use client'

import { createConfig, http } from 'wagmi'
import { mainnet, polygon, base, arbitrum } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

// No WalletConnect — only browser-injected wallets (MetaMask, Brave, etc.)
// and Coinbase Wallet (has its own embedded wallet, no WC needed).
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, base, arbitrum],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: 'Verdict' }),
  ],
  transports: {
    [mainnet.id]:  http(),
    [polygon.id]:  http(),
    [base.id]:     http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
})
