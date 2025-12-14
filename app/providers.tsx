'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { 
  mainnet, 
  polygon, 
  bsc, 
  arbitrum, 
  base, 
  sepolia, 
  zkSync // C'est le bon import !
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from 'wagmi';

const config = getDefaultConfig({
  appName: 'Mon Portfolio Crypto',
  // ⚠️ IMPORTANT : Va sur https://cloud.walletconnect.com/ pour avoir un vrai ID gratuit
  projectId: '570688819ee13a1a0d3c35b25eab93c1', 
  
  chains: [mainnet, polygon, bsc, arbitrum, base, sepolia, zkSync],
  
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
    // J'ajoute l'URL officielle ici pour être sûr que ça connecte bien
    [zkSync.id]: http('https://mainnet.era.zksync.io'), 
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}