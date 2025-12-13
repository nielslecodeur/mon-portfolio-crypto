'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi'; // On importe useDisconnect
import WalletInfo from '../components/WalletInfo';
import SmartTransfer from '../components/SmartTransfer';
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
  const { disconnect } = useDisconnect(); // Le hook pour déconnecter manuellement

  // --- ÉTATS (STATE) ---
  const [myWallets, setMyWallets] = useState<string[]>([]);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false); 

  // --- 1. PERSISTANCE (LocalStorage) ---
  useEffect(() => {
    const savedWallets = localStorage.getItem('myPortfolio_wallets');
    const savedSelection = localStorage.getItem('myPortfolio_selection');
    
    if (savedWallets) setMyWallets(JSON.parse(savedWallets));
    if (savedSelection) setSelectedWallets(JSON.parse(savedSelection));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('myPortfolio_wallets', JSON.stringify(myWallets));
      localStorage.setItem('myPortfolio_selection', JSON.stringify(selectedWallets));
    }
  }, [myWallets, selectedWallets, isLoaded]);

  // --- 2. AJOUT AUTOMATIQUE ---
  // Dès qu'un nouveau wallet est connecté, on l'ajoute à la liste
  useEffect(() => {
    if (connectedAddress && isLoaded) {
      if (!myWallets.includes(connectedAddress)) {
        setMyWallets(prev => [...prev, connectedAddress]);
        // On le sélectionne par défaut pour que l'utilisateur le voie tout de suite
        if (!selectedWallets.includes(connectedAddress)) {
            setSelectedWallets(prev => [...prev, connectedAddress]);
        }
      }
    }
  }, [connectedAddress, isLoaded]); 

  // --- GESTION TOKENS ---
  const availableTokens = chainId ? TOKEN_MAP[chainId] || [] : [];
  useEffect(() => {
    if (availableTokens.length > 0 && !selectedTokenAddress) {
        setSelectedTokenAddress(availableTokens[0].address);
    }
  }, [chainId, availableTokens]);

  // --- FONCTIONS ---
  const removeWallet = (w: string) => {
    const newList = myWallets.filter(x => x !== w);
    setMyWallets(newList);
    setSelectedWallets(selectedWallets.filter(x => x !== w));
    if (newList.length === 0) localStorage.removeItem('myPortfolio_wallets');
  };

  const toggleSelection = (w: string) => {
    selectedWallets.includes(w) ? setSelectedWallets(selectedWallets.filter(x => x !== w)) : setSelectedWallets([...selectedWallets, w]);
  };

  if (!isLoaded) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Chargement...</div>;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white font-sans">
      
      {/* --- SIDEBAR GAUCHE --- */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 h-screen sticky top-0">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          My Portfolio
        </h1>
        
        <div className="space-y-4">
          <div className="w-full">
            
            {/* 1. Le Wallet ACTIF (Celui connecté actuellement) */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
               <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Pilote Actif</p>
               <ConnectButton showBalance={false} chainStatus="icon" accountStatus="full" />
            </div>

            {/* 2. LE BOUTON MAGIQUE "AJOUTER UN AUTRE" */}
            <ConnectButton.Custom>
              {({ openConnectModal, authenticationStatus, mounted }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                    })}
                  >
                    <button
                      onClick={() => {
                        // C'EST ICI QUE LA MAGIE OPÈRE :
                        // Si on est déjà connecté, on force la déconnexion pour pouvoir en ajouter un autre
                        if (isConnected) {
                            disconnect();
                        }
                        // On attend un tout petit peu que la déconnexion se fasse, puis on ouvre le menu
                        setTimeout(openConnectModal, 100);
                      }}
                      type="button"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
                    >
                      <span className="text-xl">+</span>
                      <span>Ajouter un autre wallet</span>
                    </button>
                  </div>
                );
              }}
            </ConnectButton.Custom>

            <p className="text-[10px] text-gray-500 mt-2 text-center px-2">
              Astuce : Cliquez sur "+" pour connecter un Ledger ou un autre compte MetaMask.
            </p>
          </div>
        </div>

        {/* LISTE MÉMOIRE (Les wallets sauvegardés) */}
        <div className="flex-grow overflow-y-auto space-y-2 pt-2 border-t border-gray-800 mt-2">
           <div className="flex justify-between items-center mt-4">
             <h3 className="text-xs text-gray-500 uppercase font-semibold">Mes Wallets ({myWallets.length})</h3>
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

      {/* --- CONTENU DROITE (MAIN) --- */}
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

        {/* GRILLE DES CARTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedWallets.map(walletAddr => (
            <div key={walletAddr} className={`bg-gray-900 border rounded-xl p-6 shadow-xl space-y-4 transition-all ${walletAddr === connectedAddress ? 'border-green-500 shadow-green-900/20 shadow-lg' : 'border-gray-800'}`}>
              
              <div className="flex justify-between items-start border-b border-gray-800 pb-3 mb-2">
                <div>
                  <p className="font-mono text-xs text-gray-400">{walletAddr.slice(0, 6)}...{walletAddr.slice(-4)}</p>
                </div>
                {walletAddr === connectedAddress && (
                   <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded font-bold animate-pulse">PILOTE</span>
                )}
              </div>

              <WalletInfo address={walletAddr as `0x${string}`} />

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

        {/* COUTEAU SUISSE (VIREMENT) */}
        {isConnected && (
          <div className="mt-12 pt-8 border-t border-gray-800">
             <SmartTransfer myWallets={myWallets} />
          </div>
        )}

      </div>
    </div>
  );
}