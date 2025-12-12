'use client';

import { useBalance } from 'wagmi';
import { formatEther } from 'viem'; // On s'assure que cet outil est bien importé

interface WalletInfoProps {
  address?: `0x${string}`;
}

export default function WalletInfo({ address }: WalletInfoProps) {
  const { data: balance, isLoading } = useBalance({
    address: address,
  });

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Carte de Solde */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg text-center shadow-lg transform hover:scale-105 transition-transform">
        <p className="text-sm text-blue-100 uppercase tracking-wider font-semibold">Solde Disponible</p>
        
        {isLoading ? (
          <p className="animate-pulse">Chargement...</p>
        ) : (
          <p className="text-4xl font-bold text-white mt-1">
            {/* C'est ici la correction importante : */}
            {balance ? Number(formatEther(balance.value)).toFixed(4) : '0.0000'}
            <span className="text-lg ml-2 opacity-80">{balance?.symbol}</span>
          </p>
        )}
      </div>

      {/* Infos Adresse */}
      <div className="bg-gray-950 p-4 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-500 mb-1">Ton adresse publique</p>
        <p className="font-mono text-xs text-gray-300 break-all">{address}</p>
      </div>
    </div>
  );
}