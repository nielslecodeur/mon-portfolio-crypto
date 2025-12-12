'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
// On importe nos deux nouveaux composants
import WalletInfo from '../Components/WalletInfo';
import SendTransaction from '../Components/SendTransaction';

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Mon Portfolio Crypto</h1>
      
      <div className="border border-gray-700 p-8 rounded-xl bg-gray-800 flex flex-col items-center gap-6 w-full max-w-md shadow-2xl">
        
        {/* Le Bouton de connexion reste toujours visible */}
        <ConnectButton />

        {/* Si connecté, on affiche nos composants proprement rangés */}
        {isConnected && (
          <>
            {/* On passe l'adresse au composant WalletInfo */}
            <WalletInfo address={address} />
            
            {/* Le composant de transaction se gère tout seul */}
            <SendTransaction />
          </>
        )}

      </div>
    </div>
  );
}