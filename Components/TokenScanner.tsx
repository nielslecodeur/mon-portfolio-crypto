'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

interface TokenScannerProps {
  onFoundTokens: (tokens: any[]) => void;
}

export default function TokenScanner({ onFoundTokens }: TokenScannerProps) {
  const { address, chainId } = useAccount();
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('');

  const handleScan = async () => {
    if (!address || !chainId) return;
    setIsScanning(true);
    setStatus('Interrogation de la Blockchain...');

    try {
      // Appel à notre API interne
      const response = await fetch(`/api/scan?address=${address}&chain=${chainId}`);
      const data = await response.json();

      if (data.result) {
        setStatus(`Analyse de ${data.result.length} actifs...`);
        
        // On transforme les données Moralis en notre format
        const newTokens = data.result
          .filter((t: any) => !t.possible_spam) // On retire les spams détectés par Moralis
          .map((t: any) => ({
            address: t.token_address,
            symbol: t.symbol,
            name: t.name,
            coingeckoId: t.name.toLowerCase().replace(/\s+/g, '-'), // Tentative ID
          }));

        if (newTokens.length > 0) {
           onFoundTokens(newTokens);
           setStatus(`Succès ! ${newTokens.length} tokens trouvés.`);
        } else {
           setStatus('Aucun nouveau token trouvé.');
        }
      }
    } catch (e) {
      console.error(e);
      setStatus('Erreur lors du scan.');
    } finally {
      setTimeout(() => { setIsScanning(false); setStatus(''); }, 3000);
    }
  };

  if (!address) return null;

  return (
    <div className="mt-6 border-t border-gray-800 pt-6">
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-xl border border-blue-500/30">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-blue-300 uppercase">Auto-Découverte</h3>
            {isScanning && <span className="text-[10px] animate-pulse text-blue-400">Scan en cours...</span>}
        </div>
        
        <p className="text-[10px] text-gray-400 mb-3">
          Utilise l'IA de Moralis pour trouver les tokens que tu as oubliés sur ce réseau.
        </p>

        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          {isScanning ? 'Radar actif 📡' : '🕵️ Scanner mon Wallet'}
        </button>
        
        {status && <p className="text-center text-[10px] mt-2 text-blue-200">{status}</p>}
      </div>
    </div>
  );
}