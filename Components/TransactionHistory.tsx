'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

interface Transaction {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  block_timestamp: string;
}

export default function TransactionHistory() {
  const { address, chainId } = useAccount();
  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // On crée une fonction réutilisable pour charger les données
  const fetchHistory = useCallback(async () => {
    if (!address || !chainId) return;

    setIsLoading(true);
    try {
      // Petit délai artificiel pour que l'utilisateur voie que ça charge (UX)
      // et laisser le temps à Moralis d'indexer si on vient juste de cliquer
      await new Promise(r => setTimeout(r, 500)); 

      const res = await fetch(`/api/history?address=${address}&chain=${chainId}`);
      const data = await res.json();
      
      if (data.result) {
        setHistory(data.result);
      }
    } catch (e) {
      console.error("Erreur refresh historique:", e);
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId]);

  // Chargement initial automatique
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!address) return null;

  return (
    <div className="mt-8">
      
      {/* HEADER AVEC BOUTON REFRESH */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Dernières Activités</h3>
        
        <button 
          onClick={fetchHistory}
          disabled={isLoading}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          <span className={isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}>
            🔄
          </span>
          {isLoading ? 'Mise à jour...' : 'Actualiser'}
        </button>
      </div>
      
      {/* LISTE DES TRANSACTIONS */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        {isLoading && history.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-500 text-sm">Récupération des données...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Aucune transaction récente trouvée sur ce réseau.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {history.map((tx) => {
              const isIncoming = tx.to_address.toLowerCase() === address.toLowerCase();
              const date = new Date(tx.block_timestamp).toLocaleDateString();
              const time = new Date(tx.block_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={tx.hash} className="p-4 flex justify-between items-center hover:bg-gray-800/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    {/* Icône flèche */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-inner ${isIncoming ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
                      {isIncoming ? '↙️' : '↗️'}
                    </div>
                    
                    {/* Détails */}
                    <div>
                      <div className="flex items-center gap-2">
                         <p className="text-sm font-bold text-gray-200">
                           {isIncoming ? 'Reçu' : 'Envoyé'}
                         </p>
                         <a 
                           href={`https://etherscan.io/tx/${tx.hash}`} // Lien simple (à adapter selon la chaine idéalement)
                           target="_blank" 
                           rel="noreferrer"
                           className="text-[10px] text-gray-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           Voir ↗
                         </a>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {date} à {time}
                      </p>
                    </div>
                  </div>
                  
                  {/* Montant */}
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${isIncoming ? 'text-green-400' : 'text-white'}`}>
                      {isIncoming ? '+' : '-'}{Number(formatEther(BigInt(tx.value))).toFixed(4)} <span className="text-[10px] opacity-60">ETH</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}