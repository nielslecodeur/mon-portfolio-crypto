'use client';

import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { getAddress, parseAbi } from 'viem';

interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  coingeckoId: string;
}

interface ImportTokenProps {
  onImport: (token: Token) => void;
}

export default function ImportToken({ onImport }: ImportTokenProps) {
  const [addressInput, setAddressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const publicClient = usePublicClient();

  const handleImport = async () => {
    setError('');
    setIsLoading(true);

    try {
      // 1. Vérifier si l'adresse est valide
      const validAddress = getAddress(addressInput);

      if (!publicClient) return;

      // 2. Lire les infos sur la blockchain
      const [symbol, name] = await Promise.all([
        publicClient.readContract({
          address: validAddress,
          abi: parseAbi(['function symbol() view returns (string)']),
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: validAddress,
          abi: parseAbi(['function name() view returns (string)']),
          functionName: 'name',
        }),
      ]);

      // 3. Créer le token
      const newToken: Token = {
        address: validAddress,
        symbol: symbol as string,
        name: name as string,
        coingeckoId: (name as string).toLowerCase().replace(' ', '-'), 
      };

      onImport(newToken);
      setAddressInput(''); 

    } catch (err) {
      console.error(err);
      setError("Adresse invalide ou token inconnu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mt-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Importer un Token personnalisé</h3>
      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder="0x..." 
          className="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
        />
        <button 
          onClick={handleImport}
          disabled={isLoading || !addressInput}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-2 rounded text-xs font-bold transition-colors"
        >
          {isLoading ? '...' : '+'}
        </button>
      </div>
      {error && <p className="text-red-400 text-[10px] mt-2">{error}</p>}
    </div>
  );
}