'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import WalletInfo from '../components/WalletInfo';
// import SendTransaction from '../components/SendTransaction'; // <-- On l'enlève
import SmartTransfer from '../components/SmartTransfer'; // <-- On met le nouveau
import TokenCard from '../components/TokenCard';
import WalletRow from '../components/WalletRow';
import TotalBalance from '../components/TotalBalance';

// --- CONFIGURATION TOKENS ---
const TOKEN_MAP: Record<number, { address: `0x${string}`; name: string; symbol: string }[]> = {
  1: [
    { symbol: 'USDT', name: 'Tether USD', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  ],
  56: [
    { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955' },
    { symbol: 'FDUSD', name: 'First Digital USD', address: '0xc5f0f7b66764f6ec8c8fa67d6618046320554949' },
  ],
  137: [
    { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
  ],
  11155111: [
    { symbol: 'LINK', name: 'Chainlink (Test)', address: '0x779877A7B0D9E8603169DdbD7836e478b4624789' },
  ],
};

export default function Home() {
  const { address: connectedAddress, isConnected, chainId } = useAccount();

  const [myWallets, setMyWallets] = useState<string[]>([]);
  const [newWalletInput, setNewWalletInput] = useState('');
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>('');

  // --- EFFETS ---
  useEffect(() => {
    if (connectedAddress && !myWallets.includes(connectedAddress)) {
      setMyWallets(prev => [...prev, connectedAddress]);
      setSelectedWallets(prev => [...prev, connectedAddress]);
    }
  }, [connectedAddress]);

  const availableTokens = chainId ? TOKEN_MAP[chainId] || [] : [];
  useEffect(() => {
    if (availableTokens.length > 0) setSelectedTokenAddress(availableTokens[0].address);
    else setSelectedTokenAddress('');
  }, [chainId]);

  // --- FONCTIONS ---
  const addWallet = () => {
    if (!newWalletInput.startsWith('0x') || newWalletInput.length !== 42) return;
    if (myWallets.includes(newWalletInput)) return;
    setMyWallets([...myWallets, newWalletInput]);
    setSelectedWallets([...selectedWallets, newWalletInput]);
    setNewWalletInput('');
  };

  const removeWallet = (w: string) => {
    setMyWallets(myWallets.filter(x => x !== w));
    setSelectedWallets(selectedWallets.filter(x => x !== w));
  };

  const toggleSelection = (w: string) => {
    selectedWallets.includes(w) ? setSelectedWallets(selectedWallets.filter(x => x !== w)) : setSelectedWallets([...selectedWallets, w]);
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white font-sans">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 h-screen sticky top-0">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          My Portfolio
        </h1>
        <div className="space-y-4">
          <ConnectButton showBalance={false} />
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Ajouter 0x..." 
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              value={newWalletInput} onChange={(e) => setNewWalletInput(e.target.value)}
            />
            <button onClick={addWallet} className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded text-lg font-bold">+</button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto space-y-2">
           <div className="flex justify-between items-center">
             <h3 className="text-xs text-gray-500 uppercase font-semibold">Mes Wallets</h3>
             <button onClick={() => setSelectedWallets(myWallets)} className="text-[10px] text-blue-400 underline">Tout cocher</button>
           </div>
          {myWallets.map(wallet => (
            <WalletRow 
              key={wallet} address={wallet} isSelected={selectedWallets.includes(wallet)}
              onToggle={() => toggleSelection(wallet)} onDelete={() => removeWallet(wallet)}
            />
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10 overflow-y-auto bg-gray-950">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Vue d'ensemble</h2>
          {availableTokens.length > 0 && (
            <select 
              className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm text-white focus:outline-none cursor-pointer"
              value={selectedTokenAddress} onChange={(e) => setSelectedTokenAddress(e.target.value)}
            >
              {availableTokens.map((token) => (
                <option key={token.address} value={token.address}>{token.symbol} - {token.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* SOMME TOTALE */}
        {selectedTokenAddress && selectedWallets.length > 0 && (
            <TotalBalance 
                tokenAddress={selectedTokenAddress as `0x${string}`} 
                wallets={selectedWallets} 
            />
        )}

        {/* LISTE DES CARTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedWallets.map(walletAddr => (
            <div key={walletAddr} className={`bg-gray-900 border rounded-xl p-6 shadow-xl space-y-4 transition-all ${walletAddr === connectedAddress ? 'border-green-800/50' : 'border-gray-800'}`}>
              
              <div className="flex justify-between items-start border-b border-gray-800 pb-3 mb-2">
                <div>
                  <p className="font-mono text-xs text-gray-400">{walletAddr.slice(0, 6)}...{walletAddr.slice(-4)}</p>
                </div>
                {walletAddr === connectedAddress && (
                   <span className="bg-green-900/40 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-800">Connecté</span>
                )}
              </div>

              {/* Solde Natif */}
              <WalletInfo address={walletAddr as `0x${string}`} />

              {/* Solde Token */}
              {selectedTokenAddress && (
                <div className="pt-2">
                  <TokenCard 
                    tokenAddress={selectedTokenAddress as `0x${string}`} 
                    walletAddress={walletAddr}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* --- C'EST ICI QUE CA CHANGE --- */}
        {/* On a remplacé SendTransaction par SmartTransfer */}
        {isConnected && (
          <div className="mt-12 pt-8 border-t border-gray-800">
             {/* On passe la liste 'myWallets' au composant pour le menu déroulant */}
             <SmartTransfer myWallets={myWallets} />
          </div>
        )}

      </div>
    </div>
  );
}