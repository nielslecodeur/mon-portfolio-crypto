'use client';

import { useReadContracts } from 'wagmi';
import { formatUnits, erc20Abi } from 'viem';

interface TokenCardProps {
  tokenAddress: `0x${string}`;
  walletAddress: string; // <--- AJOUT : On doit savoir QUEL wallet regarder
}

export default function TokenCard({ tokenAddress, walletAddress }: TokenCardProps) {
  // On a SUPPRIMÉ useAccount() ici. On utilise walletAddress à la place.

  const tokenContract = {
    address: tokenAddress,
    abi: erc20Abi,
  };

  const { data, isLoading, isError } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...tokenContract, functionName: 'balanceOf', args: [walletAddress as `0x${string}`] }, // <--- ICI
      { ...tokenContract, functionName: 'decimals' },
      { ...tokenContract, functionName: 'symbol' },
    ],
  });

  if (isLoading) return <div className="text-gray-500 text-xs animate-pulse">Chargement...</div>;
  if (isError || !data) return <div className="text-gray-500 text-xs">-</div>;

  const [balance, decimals, symbol] = data;

  // Si solde est 0, on affiche en gris clair pour moins de bruit visuel
  const formattedBalance = Number(formatUnits(balance, decimals));
  
  return (
    <div className={`flex justify-between items-center p-2 rounded border ${formattedBalance > 0 ? 'bg-gray-800 border-gray-700' : 'bg-transparent border-transparent'}`}>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs font-bold">{symbol}</span>
      </div>
      <span className={`font-mono font-bold ${formattedBalance > 0 ? 'text-blue-300' : 'text-gray-600'}`}>
        {formattedBalance.toFixed(2)}
      </span>
    </div>
  );
}