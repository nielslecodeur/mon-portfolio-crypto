'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useReadContracts } from 'wagmi'; 
import { formatUnits, erc20Abi } from 'viem';
import { isValidBitcoinAddress, fetchBitcoinBalance } from '../utils/bitcoin';

const NATIVE_ID_MAP: Record<number, string> = {
  1: 'ethereum',
  56: 'binancecoin',
  137: 'matic-network',
  324: 'ethereum', 
  11155111: 'ethereum',
};

interface PortfolioValueProps {
  wallets: string[];
  tokens: { address: `0x${string}`; symbol: string; coingeckoId: string }[];
  chainId: number;
}

export default function PortfolioValue({ wallets, tokens, chainId }: PortfolioValueProps) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [btcBalance, setBtcBalance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- FILTRES WALLETS ---
  const ethWallets = useMemo(() => wallets.filter(w => w.startsWith('0x')), [wallets]);
  const btcWallets = useMemo(() => wallets.filter(w => isValidBitcoinAddress(w)), [wallets]);

  // --- LOGIQUE DE RÉCUPÉRATION ---
  const fetchPrices = useCallback(async () => {
    try {
      const nativeId = NATIVE_ID_MAP[chainId] || 'ethereum';
      const allIds = Array.from(new Set([nativeId, 'bitcoin', ...tokens.map(t => t.coingeckoId)])).join(',');
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${allIds}&vs_currencies=usd`);
      const data = await response.json();
      const priceMap: Record<string, number> = {};
      for (const [key, value] of Object.entries(data)) {
        // @ts-ignore
        priceMap[key] = value.usd;
      }
      setPrices(priceMap);
    } catch (e) { console.error("Erreur prix:", e); }
  }, [tokens, chainId]);

  const scanBitcoin = useCallback(async () => {
    if (btcWallets.length === 0) {
      setBtcBalance(0);
      return;
    }
    let totalBtc = 0;
    for (const wallet of btcWallets) {
      const bal = await fetchBitcoinBalance(wallet);
      totalBtc += bal;
    }
    setBtcBalance(totalBtc);
  }, [btcWallets]);

  const contractCalls = useMemo(() => {
    const calls: any[] = [];
    ethWallets.forEach(wallet => {
      tokens.forEach(token => {
        calls.push({
          address: token.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [wallet],
        });
      });
    });
    return calls;
  }, [ethWallets, tokens]);

  const { data: tokenBalances, refetch: refetchTokens, isLoading: isLoadingWagmi } = useReadContracts({
    contracts: contractCalls,
    query: { enabled: ethWallets.length > 0 && tokens.length > 0 }
  });

  // --- ACTION DU BOUTON REFRESH ---
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // On force la mise à jour de tout
    await Promise.all([fetchPrices(), scanBitcoin(), refetchTokens()]);
    setTimeout(() => setIsRefreshing(false), 500); // Petit délai visuel
  };

  useEffect(() => {
    fetchPrices();
    scanBitcoin();
  }, [fetchPrices, scanBitcoin]);

  // --- CALCUL DU TOTAL ---
  const calculateTotal = () => {
    if (Object.keys(prices).length === 0) return 0;
    let totalUSD = 0;

    if (tokenBalances) {
      let index = 0;
      ethWallets.forEach(() => {
        tokens.forEach(token => {
          const result = tokenBalances[index++];
          if (result && result.status === 'success') {
             const balanceBigInt = result.result as bigint;
             if (balanceBigInt > BigInt(0)) {
               const decimals = (token.symbol === 'USDT' || token.symbol === 'USDC') ? 6 : 18;
               const amount = Number(formatUnits(balanceBigInt, decimals));
               const price = prices[token.coingeckoId] || 0;
               totalUSD += amount * price;
             }
          }
        });
      });
    }

    if (btcBalance > 0) {
      const btcPrice = prices['bitcoin'] || 0;
      totalUSD += btcBalance * btcPrice;
    }

    return totalUSD;
  };

  const totalValue = calculateTotal();
  const isLoadingGlobal = isLoadingWagmi && !tokenBalances;

  return (
    // "relative" ici est CRUCIAL pour que le bouton "absolute" se place par rapport à CE cadre
    <div className="relative w-full bg-gradient-to-br from-orange-900/80 via-indigo-900 to-slate-900 p-6 rounded-2xl border border-orange-500/30 shadow-2xl mb-8 overflow-hidden group">
      
      {/* 1. LE BOUTON (Hors du flux normal, collé en haut à droite) */}
      <button 
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10 active:scale-95 shadow-lg"
        title="Actualiser le solde"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2} 
          stroke="currentColor" 
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </button>

      {/* 2. LE CONTENU (Centré indépendamment du bouton) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center mt-2">
        
        <p className="text-orange-200 text-xs uppercase tracking-widest font-bold mb-3">
          Fortune Globale ({wallets.length} wallets)
        </p>
        
        <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-white to-indigo-200 tracking-tight">
            {isLoadingGlobal ? (
              <span className="text-3xl text-gray-500 animate-pulse">Calcul...</span>
            ) : (
              <>
                <span className="text-3xl align-top opacity-50 mr-1">$</span>
                {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </>
            )}
        </div>

        {btcBalance > 0 && (
          <div className="mt-2 text-xs text-orange-400 font-mono bg-black/30 inline-block px-3 py-1 rounded-full border border-orange-500/20">
            Dont ₿ {btcBalance.toFixed(6)} BTC
          </div>
        )}
      </div>

      {/* 3. ARRIÈRE-PLAN */}
      <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-10 pointer-events-none z-0"></div>
    </div>
  );
}