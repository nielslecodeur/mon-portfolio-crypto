'use client';

import { useReadContracts } from 'wagmi';
import { formatUnits, erc20Abi } from 'viem';

interface TotalBalanceProps {
  tokenAddress: `0x${string}`;
  wallets: string[];
}

export default function TotalBalance({ tokenAddress, wallets }: TotalBalanceProps) {
  
  // On prépare un appel "balanceOf" pour CHAQUE wallet sélectionné
  const contracts = wallets.map(wallet => ({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [wallet as `0x${string}`],
  }));

  // On ajoute un appel pour avoir les decimals et le symbol
  const extraCalls = [
    { address: tokenAddress, abi: erc20Abi, functionName: 'decimals' },
    { address: tokenAddress, abi: erc20Abi, functionName: 'symbol' },
  ];

  const { data, isLoading } = useReadContracts({
    contracts: [...contracts, ...extraCalls], 
    query: {
        enabled: wallets.length > 0
    }
  });

  if (isLoading || !data) return <span className="animate-pulse text-sm">Calcul en cours...</span>;

  // Récupération sécurisée des infos (si les appels ont réussi)
  const decimalsResult = data[data.length - 2];
  const symbolResult = data[data.length - 1];

  // Si l'appel a échoué (réseau instable), on arrête
  if (decimalsResult.status === 'failure' || symbolResult.status === 'failure') {
    return <span>Erreur chargement</span>;
  }

  const decimals = decimalsResult.result as number;
  const symbol = symbolResult.result as string;

  // Calcul de la somme
  // CORRECTION ICI : On utilise BigInt(0) au lieu de 0n
  let totalBigInt = BigInt(0); 
  
  // On parcourt uniquement les résultats des balances (on exclut les 2 derniers appels)
  for (let i = 0; i < wallets.length; i++) {
    const balanceResult = data[i];
    if (balanceResult.status === 'success') {
       totalBigInt += balanceResult.result as bigint;
    }
  }

  return (
    <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-4 rounded-xl border border-emerald-700/50 shadow-lg mb-6">
      <p className="text-emerald-300 text-xs uppercase tracking-widest font-semibold mb-1">
        Somme Totale ({wallets.length} wallets)
      </p>
      <p className="text-3xl font-bold text-white">
        {Number(formatUnits(totalBigInt, decimals)).toFixed(2)} 
        <span className="text-lg ml-2 text-emerald-400">{symbol}</span>
      </p>
    </div>
  );
}