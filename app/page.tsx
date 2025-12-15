'use client';

import { useState, useEffect, useMemo } from 'react';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

// Composants
import WalletInfo from '../components/WalletInfo';
import SmartTransfer from '../components/SmartTransfer';
import TokenCard from '../components/TokenCard';
import WalletRow from '../components/WalletRow';
import PortfolioValue from '../components/PortfolioValue';
import ImportToken from '../components/ImportToken'; 
import TokenScanner from '../components/TokenScanner';

// Utils
import { isValidBitcoinAddress } from '../utils/bitcoin'; // <-- Import indispensable

// --- MEGA LISTE DES TOKENS (Comme MetaMask + zkSync) ---
const DEFAULT_TOKENS: Record<number, { address: `0x${string}`; name: string; symbol: string; coingeckoId: string }[]> = {
  // === Ethereum Mainnet (ID: 1) ===
  1: [
    { symbol: 'USDT', name: 'Tether USD', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', coingeckoId: 'tether' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', coingeckoId: 'usd-coin' },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6b175474e89094c44da98b954eedeac495271d0f', coingeckoId: 'dai' },
    { symbol: 'WBTC', name: 'Wrapped BTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', coingeckoId: 'wrapped-bitcoin' },
    { symbol: 'ETH', name: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', coingeckoId: 'ethereum' },
    { symbol: 'PEPE', name: 'Pepe', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', coingeckoId: 'pepe' },
    { symbol: 'SHIB', name: 'Shiba Inu', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', coingeckoId: 'shiba-inu' },
    { symbol: 'LINK', name: 'Chainlink', address: '0x514910771af9ca656af840dff83e8264ecf986ca', coingeckoId: 'chainlink' },
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', coingeckoId: 'uniswap' },
    { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', coingeckoId: 'aave' },
  ],
  
  // === Binance Smart Chain (ID: 56) ===
  56: [
    { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', coingeckoId: 'tether' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', coingeckoId: 'usd-coin' },
    { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', coingeckoId: 'binance-usd' },
    { symbol: 'CAKE', name: 'PancakeSwap', address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', coingeckoId: 'pancakeswap-token' },
    { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', coingeckoId: 'binancecoin' },
  ],
  
  // === Polygon (ID: 137) ===
  137: [
    { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', coingeckoId: 'tether' },
    { symbol: 'USDC', name: 'USD Coin (PoS)', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', coingeckoId: 'usd-coin' },
    { symbol: 'WETH', name: 'Wrapped ETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', coingeckoId: 'ethereum' },
    { symbol: 'WMATIC', name: 'Wrapped Matic', address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', coingeckoId: 'matic-network' },
  ],

  // === zkSync Era (ID: 324) ===
  324: [
    { symbol: 'USDC', name: 'USD Coin', address: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4', coingeckoId: 'usd-coin' },
    { symbol: 'USDT', name: 'Tether USD', address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', coingeckoId: 'tether' },
    { symbol: 'ZK', name: 'ZKsync', address: '0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E', coingeckoId: 'zksync' }, 
    { symbol: 'WETH', name: 'Wrapped ETH', address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', coingeckoId: 'ethereum' },
    { symbol: 'MUTE', name: 'Mute', address: '0x0e97C7a0F8B2C9885C8AC9fC6136e829CbC21d42', coingeckoId: 'mute' },
  ],

  // === Sepolia Testnet (ID: 11155111) ===
  11155111: [
    { symbol: 'LINK', name: 'Chainlink (Test)', address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', coingeckoId: 'chainlink' },
  ],
};

// Interface pour nos tokens
interface TokenType {
  address: `0x${string}`;
  name: string;
  symbol: string;
  coingeckoId: string;
}

export default function Home() {
  const { address: connectedAddress, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  // --- ÉTATS ---
  const [myWallets, setMyWallets] = useState<string[]>([]);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  
  // Bitcoin State
  const [btcInput, setBtcInput] = useState('');

  // Gestion des Tokens Dynamiques
  const [customTokens, setCustomTokens] = useState<Record<number, TokenType[]>>({});
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>('');
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // --- LISTE COMBINÉE (Défaut + Custom) ---
  const currentTokens = useMemo(() => {
    const activeChainId = chainId || 1;
    const defaults = DEFAULT_TOKENS[activeChainId] || [];
    const customs = customTokens[activeChainId] || [];
    return [...defaults, ...customs].sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [chainId, customTokens]);


  // --- PERSISTANCE ---
  useEffect(() => {
    const savedWallets = localStorage.getItem('myPortfolio_wallets');
    const savedSelection = localStorage.getItem('myPortfolio_selection');
    const savedCustomTokens = localStorage.getItem('myPortfolio_customTokens');

    if (savedWallets) setMyWallets(JSON.parse(savedWallets));
    if (savedSelection) setSelectedWallets(JSON.parse(savedSelection));
    if (savedCustomTokens) setCustomTokens(JSON.parse(savedCustomTokens));
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('myPortfolio_wallets', JSON.stringify(myWallets));
      localStorage.setItem('myPortfolio_selection', JSON.stringify(selectedWallets));
      localStorage.setItem('myPortfolio_customTokens', JSON.stringify(customTokens));
    }
  }, [myWallets, selectedWallets, customTokens, isLoaded]);

  // --- AUTO-ADD EVM WALLET ---
  useEffect(() => {
    if (connectedAddress && isLoaded) {
      if (!myWallets.includes(connectedAddress)) {
        setMyWallets(prev => [...prev, connectedAddress]);
        if (!selectedWallets.includes(connectedAddress)) {
            setSelectedWallets(prev => [...prev, connectedAddress]);
        }
      }
    }
  }, [connectedAddress, isLoaded]); 

  // --- TOKEN PAR DÉFAUT ---
  useEffect(() => {
    if (currentTokens.length > 0 && !selectedTokenAddress) {
        const defaultStable = currentTokens.find(t => t.symbol === 'USDT' || t.symbol === 'USDC');
        setSelectedTokenAddress(defaultStable ? defaultStable.address : currentTokens[0].address);
    }
  }, [currentTokens, chainId]);

  // --- ACTIONS ---
  const removeWallet = (w: string) => {
    const newList = myWallets.filter(x => x !== w);
    setMyWallets(newList);
    setSelectedWallets(selectedWallets.filter(x => x !== w));
    if (newList.length === 0) localStorage.removeItem('myPortfolio_wallets');
  };

  const toggleSelection = (w: string) => {
    selectedWallets.includes(w) ? setSelectedWallets(selectedWallets.filter(x => x !== w)) : setSelectedWallets([...selectedWallets, w]);
  };

  const requestSwitch = () => {
    if (isConnected) setShowSwitchModal(true);
    else if (openConnectModal) openConnectModal();
  };

  const confirmSwitchWallet = () => {
    disconnect();
    setShowSwitchModal(false);
    setTimeout(() => { if (openConnectModal) openConnectModal(); }, 200);
  };

  // --- BITCOIN ADD ---
  const addBitcoinWallet = () => {
    if (!isValidBitcoinAddress(btcInput)) {
      alert("Adresse Bitcoin invalide (doit commencer par 1, 3 ou bc1)");
      return;
    }
    if (myWallets.includes(btcInput)) return;
    
    setMyWallets(prev => [...prev, btcInput]);
    setSelectedWallets(prev => [...prev, btcInput]);
    setBtcInput('');
  };

  // --- GESTION DES TOKENS CUSTOM ---
  const addTokensToCustomList = (tokensToAdd: TokenType[]) => {
    const activeChainId = chainId || 1;
    
    setCustomTokens(prev => {
        const currentList = prev[activeChainId] || [];
        const defaults = DEFAULT_TOKENS[activeChainId] || [];
        
        const reallyNew = tokensToAdd.filter(newT => 
            !currentList.some(c => c.address.toLowerCase() === newT.address.toLowerCase()) &&
            !defaults.some(d => d.address.toLowerCase() === newT.address.toLowerCase())
        );

        if (reallyNew.length === 0) return prev;

        return {
            ...prev,
            [activeChainId]: [...currentList, ...reallyNew]
        };
    });
  };

  const handleImportToken = (token: TokenType) => {
    addTokensToCustomList([token]);
  };

  const handleScanResults = (foundTokens: any[]) => {
      addTokensToCustomList(foundTokens);
  };

  if (!isLoaded) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Chargement...</div>;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white font-sans relative">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 h-screen sticky top-0 overflow-y-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          My Portfolio
        </h1>
        
        {/* CONNEXION */}
        <div className="space-y-4">
          <div className="w-full">
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
               <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Pilote Actif</p>
               <ConnectButton showBalance={false} chainStatus="icon" accountStatus="full" />
            </div>
            <button onClick={requestSwitch} type="button" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg">
              <span className="text-xl">+</span><span>Ajouter un autre wallet</span>
            </button>
          </div>
        </div>

        {/* SECTION BITCOIN */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-[10px] text-orange-500 uppercase font-bold mb-2">Suivre du Bitcoin (Watch Only)</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Adresse BTC (bc1...)" 
              className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              value={btcInput} 
              onChange={(e) => setBtcInput(e.target.value)}
            />
            <button onClick={addBitcoinWallet} className="bg-orange-700 hover:bg-orange-600 text-white px-2 rounded text-xs font-bold">OK</button>
          </div>
        </div>

        {/* LISTE WALLETS */}
        <div className="flex-grow space-y-2 pt-2 border-t border-gray-800 mt-2">
           <div className="flex justify-between items-center mt-4">
             <h3 className="text-xs text-gray-500 uppercase font-semibold">Mes Wallets ({myWallets.length})</h3>
             <button onClick={() => setSelectedWallets(myWallets)} className="text-[10px] text-blue-400 underline">Tout cocher</button>
           </div>
           {myWallets.map(wallet => (
             <WalletRow 
               key={wallet} address={wallet} isSelected={selectedWallets.includes(wallet)}
               isActive={wallet === connectedAddress} 
               onToggle={() => toggleSelection(wallet)} onDelete={() => removeWallet(wallet)}
               onActivate={requestSwitch}
             />
           ))}
        </div>

        {/* --- ZONE INTELLIGENTE (Scan & Import) --- */}
        <div className="pb-4">
            <TokenScanner onFoundTokens={handleScanResults} />
            <div className="pt-6">
                <ImportToken onImport={handleImportToken} />
            </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 p-10 overflow-y-auto bg-gray-950">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <h2 className="text-3xl font-bold">Vue d'ensemble</h2>
             {chainId === 324 && <span className="px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded border border-slate-600">zkSync Era</span>}
          </div>
          
          {currentTokens.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Actifs ({currentTokens.length}) :</span>
              <select 
                className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm text-white focus:outline-none cursor-pointer max-w-[200px]"
                value={selectedTokenAddress} onChange={(e) => setSelectedTokenAddress(e.target.value)}
              >
                {currentTokens.map((token) => (
                  <option key={token.address} value={token.address}>{token.symbol}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SCANNER DE FORTUNE (Gère maintenant BTC aussi) */}
        {selectedWallets.length > 0 && (
          <PortfolioValue 
             wallets={selectedWallets} 
             tokens={currentTokens} 
             chainId={chainId || 1}
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

              {/* Si c'est du Bitcoin, on affiche une info spéciale, sinon WalletInfo standard */}
              {walletAddr.startsWith('0x') ? (
                  <>
                    <WalletInfo address={walletAddr as `0x${string}`} />
                    {selectedTokenAddress && (
                      <div className="pt-2">
                        <TokenCard 
                          tokenAddress={selectedTokenAddress as `0x${string}`} 
                          walletAddress={walletAddr}
                        />
                      </div>
                    )}
                  </>
              ) : (
                  <div className="text-center py-4">
                      <p className="text-orange-500 font-bold text-lg">BITCOIN WALLET</p>
                      <p className="text-gray-500 text-xs mt-1">Inclus dans la Fortune Globale 👆</p>
                  </div>
              )}

            </div>
          ))}
        </div>

        {/* COUTEAU SUISSE (Seulement pour les wallets EVM "0x...") */}
        {isConnected && (
          <div className="mt-12 pt-8 border-t border-gray-800">
             {/* On filtre pour ne passer que les adresses EVM au module de transfert */}
             <SmartTransfer myWallets={myWallets.filter(w => w.startsWith('0x'))} />
          </div>
        )}
      </div>

      {/* MODALE SWITCH */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Changer de Pilote ?</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Pour changer de compte, nous devons déconnecter le pilote actuel.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowSwitchModal(false)} className="flex-1 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors border border-gray-700">Retour</button>
              <button onClick={confirmSwitchWallet} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-900/20">Continuer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}