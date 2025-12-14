'use client';

import { useState, useEffect, useMemo } from 'react';
import { useReadContracts } from 'wagmi'; 
import { formatUnits, erc20Abi } from 'viem';

// ID CoinGecko pour la monnaie native de chaque chaîne
const NATIVE_ID_MAP: Record<number, string> = {
  1: 'ethereum',
  56: 'binancecoin',
  137: 'matic-network',
  11155111: 'ethereum',
};

interface PortfolioValueProps {
  wallets: string[];
  tokens: { address: `0x${string}`; symbol: string; coingeckoId: string }[];
  chainId: number;
}

export default function PortfolioValue({ wallets, tokens, chainId }: PortfolioValueProps) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // 1. RÉCUPÉRER LES PRIX COINGECKO
  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoadingPrice(true);
      try {
        const nativeId = NATIVE_ID_MAP[chainId] || 'ethereum';
        const allIds = Array.from(new Set([nativeId, ...tokens.map(t => t.coingeckoId)])).join(',');
        
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${allIds}&vs_currencies=usd`);
        const data = await response.json();
        
        const priceMap: Record<string, number> = {};
        for (const [key, value] of Object.entries(data)) {
          // @ts-ignore
          priceMap[key] = value.usd;
        }
        setPrices(priceMap);
      } catch (e) {
        console.error("Erreur prix:", e);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 120000); 
    return () => clearInterval(interval);
  }, [tokens, chainId]);


  // 2. PRÉPARER LES REQUÊTES (MULTICALL)
  const contractCalls = useMemo(() => {
    const calls: any[] = [];
    wallets.forEach(wallet => {
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
  }, [wallets, tokens]);

  // 3. EXÉCUTER LE SCAN
  const { data: tokenBalances, isLoading: isLoadingTokens } = useReadContracts({
    contracts: contractCalls,
    query: {
        enabled: wallets.length > 0 && tokens.length > 0,
        refetchInterval: 30000 
    }
  });

  // --- CALCUL DU TOTAL ---
  const calculateTotal = () => {
    if (!tokenBalances || Object.keys(prices).length === 0) return 0;

    let totalUSD = 0;
    
    let index = 0;
    wallets.forEach(wallet => {
      tokens.forEach(token => {
        const result = tokenBalances[index];
        index++;

        if (result && result.status === 'success') {
           const balanceBigInt = result.result as bigint;
           
           // === C'EST ICI LA CORRECTION ===
           // On utilise BigInt(0) au lieu de 0n
           if (balanceBigInt > BigInt(0)) {
             
             // Attention: USDT/USDC ont 6 décimales
             const decimals = (token.symbol === 'USDT' || token.symbol === 'USDC') ? 6 : 18;
             const amount = Number(formatUnits(balanceBigInt, decimals));
             const price = prices[token.coingeckoId] || 0;
             totalUSD += amount * price;
           }
        }
      });
    });

    return totalUSD;
  };

  const totalTokenValue = calculateTotal();

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl mb-8 text-center relative overflow-hidden group">
      
      {/* Effet de fond */}
      <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-20 pointer-events-none"></div>
      
      <div className="relative z-10">
        <p className="text-indigo-300 text-xs uppercase tracking-widest font-bold mb-3">
          Fortune Globale ({wallets.length} wallets)
        </p>
        
        <div className="flex flex-col items-center justify-center gap-2">
            
            {/* LE GROS CHIFFRE */}
            <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tight drop-shadow-lg">
                {isLoadingTokens || isLoadingPrice ? (
                <span className="text-3xl text-gray-500 animate-pulse">Scan...</span>
                ) : (
                <>
                    <span className="text-3xl align-top opacity-50 mr-1">$</span>
                    {totalTokenValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </>
                )}
            </div>

            {/* Info Complémentaire */}
            <div className="flex gap-2 mt-4 text-[10px] text-indigo-400/70 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                <span>Scan actif sur :</span>
                <span className="text-indigo-300 font-bold">{tokens.length} Actifs majeurs</span>
            </div>
        </div>
      </div>
    </div>
  );
}