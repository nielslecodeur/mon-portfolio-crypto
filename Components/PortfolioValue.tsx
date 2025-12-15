'use client';

import { useState, useEffect, useMemo } from 'react';
import { useReadContracts } from 'wagmi'; 
import { formatUnits, erc20Abi } from 'viem';
import { isValidBitcoinAddress, fetchBitcoinBalance } from '../utils/bitcoin'; // <-- Import

const NATIVE_ID_MAP: Record<number, string> = {
  1: 'ethereum',
  56: 'binancecoin',
  137: 'matic-network',
  324: 'ethereum', // zkSync utilise l'ETH comme gaz
  11155111: 'ethereum',
};

interface PortfolioValueProps {
  wallets: string[];
  tokens: { address: `0x${string}`; symbol: string; coingeckoId: string }[];
  chainId: number;
}

export default function PortfolioValue({ wallets, tokens, chainId }: PortfolioValueProps) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [btcBalance, setBtcBalance] = useState(0); // Nouveau state pour le total BTC
  const [isLoading, setIsLoading] = useState(false);

  // 1. SÉPARER LES WALLETS ETH ET BTC
  const ethWallets = wallets.filter(w => w.startsWith('0x'));
  const btcWallets = wallets.filter(w => isValidBitcoinAddress(w));

  // 2. RÉCUPÉRER LES PRIX
  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        const nativeId = NATIVE_ID_MAP[chainId] || 'ethereum';
        // On ajoute 'bitcoin' à la liste des prix à chercher
        const allIds = Array.from(new Set([nativeId, 'bitcoin', ...tokens.map(t => t.coingeckoId)])).join(',');
        
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${allIds}&vs_currencies=usd`);
        const data = await response.json();
        
        const priceMap: Record<string, number> = {};
        for (const [key, value] of Object.entries(data)) {
          // @ts-ignore
          priceMap[key] = value.usd;
        }
        setPrices(priceMap);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchPrices();
    const i = setInterval(fetchPrices, 120000); 
    return () => clearInterval(i);
  }, [tokens, chainId]);

  // 3. SCANNER LES BTC (Nouveau !)
  useEffect(() => {
    const scanBitcoin = async () => {
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
    };
    scanBitcoin();
  }, [wallets]); // Se relance quand la liste des wallets change

  // 4. SCANNER LES ETH (Multicall existant)
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

  const { data: tokenBalances } = useReadContracts({
    contracts: contractCalls,
    query: { enabled: ethWallets.length > 0 && tokens.length > 0, refetchInterval: 30000 }
  });

  // 5. CALCUL FINAL
  const calculateTotal = () => {
    if (Object.keys(prices).length === 0) return 0;
    let totalUSD = 0;

    // A. Valeur des Tokens ETH
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

    // B. Valeur du Bitcoin
    if (btcBalance > 0) {
      const btcPrice = prices['bitcoin'] || 0;
      totalUSD += btcBalance * btcPrice;
    }

    return totalUSD;
  };

  const totalValue = calculateTotal();

  return (
    <div className="bg-gradient-to-br from-orange-900/80 via-indigo-900 to-slate-900 p-6 rounded-2xl border border-orange-500/30 shadow-2xl mb-8 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-10 pointer-events-none"></div>
      <div className="relative z-10">
        <p className="text-orange-200 text-xs uppercase tracking-widest font-bold mb-3">
          Fortune Globale ({wallets.length} wallets)
        </p>
        <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-white to-indigo-200 tracking-tight">
            {isLoading ? (
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
    </div>
  );
}