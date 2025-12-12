'use client';

import { useState } from 'react';
import { useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';

export default function SendTransaction() {
  // Toute la logique de transaction est isolée ici
  const { sendTransaction, isPending, data: hash, error } = useSendTransaction();
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !amount) return;

    sendTransaction({
      to: destination as `0x${string}`,
      value: parseEther(amount),
    });
  };

  return (
    <form onSubmit={handleSend} className="bg-gray-950 p-4 rounded-lg border border-gray-700 space-y-4 w-full mt-6">
      <h3 className="text-lg font-bold text-gray-200">Envoyer des fonds</h3>
      
      {/* Champ Adresse */}
      <div>
        <label className="text-xs text-gray-500">Adresse de destination</label>
        <input 
          type="text" 
          placeholder="0x123..." 
          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>

      {/* Champ Montant */}
      <div>
        <label className="text-xs text-gray-500">Montant (ETH)</label>
        <input 
          type="number" 
          step="0.0001"
          placeholder="0.05" 
          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <button 
        disabled={isPending || !amount || !destination}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
      >
        {isPending ? 'Confirmation en cours...' : 'Envoyer 💸'}
      </button>

      {/* Messages */}
      {hash && (
        <div className="text-xs text-green-400 mt-2 break-all bg-green-900/20 p-2 rounded">
          ✅ Transaction envoyée ! <br/>Hash: {hash}
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400 mt-2 bg-red-900/20 p-2 rounded">
          ❌ Erreur: {error.message.split('.')[0]}
        </div>
      )}
    </form>
  );
}