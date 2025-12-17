'use client';

import { useGasPrice } from 'wagmi';
import { formatGwei } from 'viem';
import { useEffect, useState } from 'react';

export default function GasTracker() {
  // Récupère le prix du gas actuel
  const { data: gasPrice, refetch } = useGasPrice();
  const [mounted, setMounted] = useState(false);

  // Pour éviter les erreurs d'hydratation Next.js
  useEffect(() => setMounted(true), []);

  // Rafraîchir toutes les 10 secondes
  useEffect(() => {
    const timer = setInterval(() => refetch(), 10000);
    return () => clearInterval(timer);
  }, [refetch]);

  if (!mounted || !gasPrice) return null;

  // Conversion en Gwei (unité lisible)
  const gwei = parseFloat(formatGwei(gasPrice));
  
  // Code couleur dynamique (Basé sur les standards Mainnet)
  let colorClass = 'text-green-400'; // Pas cher (< 20)
  if (gwei > 20) colorClass = 'text-yellow-400'; // Moyen
  if (gwei > 50) colorClass = 'text-red-400';    // Cher

  return (
    <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-700/50 shadow-sm backdrop-blur-sm">
      <span className="text-xs text-gray-500 font-medium">⛽ Gas:</span>
      <span className={`text-xs font-bold font-mono ${colorClass} transition-colors duration-500`}>
        {gwei < 1 ? gwei.toFixed(4) : gwei.toFixed(1)} <span className="text-[10px] opacity-70">Gwei</span>
      </span>
    </div>
  );
}