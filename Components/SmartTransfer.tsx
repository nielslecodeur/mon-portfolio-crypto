'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useDisconnect } from 'wagmi'; // Ajout useDisconnect
import { useConnectModal } from '@rainbow-me/rainbowkit'; // Ajout pour ouvrir la fenêtre
import { parseEther } from 'viem';

interface SmartTransferProps {
  myWallets: string[];
}

export default function SmartTransfer({ myWallets }: SmartTransferProps) {
  const { address: connectedAddress } = useAccount();
  const { disconnect } = useDisconnect(); // Le hook pour déconnecter
  const { openConnectModal } = useConnectModal(); // Le hook pour ouvrir la fenêtre RainbowKit
  const { sendTransaction, isPending, data: hash } = useSendTransaction();

  const [fromWallet, setFromWallet] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [isExternal, setIsExternal] = useState(false);

  useEffect(() => {
    if (connectedAddress) {
      setFromWallet(connectedAddress);
    }
  }, [connectedAddress]);

  // LA NOUVELLE FONCTION UNIVERSELLE
  const handleSwitchWallet = () => {
    // 1. On déconnecte le wallet actuel
    disconnect();
    
    // 2. On ouvre la fenêtre de choix (avec un micro délai pour que la déconnexion soit prise en compte)
    setTimeout(() => {
      if (openConnectModal) {
        openConnectModal();
      }
    }, 100);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !toWallet) return;

    sendTransaction({
      to: toWallet as `0x${string}`,
      value: parseEther(amount),
    });
  };

  const isWrongWallet = fromWallet.toLowerCase() !== connectedAddress?.toLowerCase();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl w-full max-w-xl mx-auto">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        🔪 Couteau Suisse (Virement)
      </h3>

      <form onSubmit={handleSend} className="space-y-5">
        
        {/* DE (Émetteur) */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">De (Émetteur)</label>
          <select 
            className="w-full bg-gray-950 border border-gray-700 rounded p-3 mt-1 text-white focus:border-blue-500 outline-none"
            value={fromWallet}
            onChange={(e) => setFromWallet(e.target.value)}
          >
            {myWallets.map(w => (
              <option key={w} value={w}>
                {w === connectedAddress ? '🟢 ' : '🔴 '} 
                {w.slice(0, 6)}...{w.slice(-4)}
              </option>
            ))}
          </select>

          {/* ALERTE INTELLIGENTE CORRIGÉE */}
          {isWrongWallet && (
            <div className="mt-2 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded flex justify-between items-center animate-in slide-in-from-top-2">
              <span className="text-xs text-yellow-500">
                Ce wallet n'est pas actif.
              </span>
              <button 
                type="button"
                onClick={handleSwitchWallet} // <--- On utilise la nouvelle fonction
                className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded font-bold transition-colors"
              >
                ⚡ Activer ce Wallet
              </button>
            </div>
          )}
        </div>

        {/* VERS (Destinataire) */}
        <div>
          <div className="flex justify-between">
            <label className="text-xs text-gray-500 uppercase font-bold">Vers (Destinataire)</label>
            <button 
              type="button" 
              onClick={() => { setIsExternal(!isExternal); setToWallet(''); }}
              className="text-xs text-blue-400 underline"
            >
              {isExternal ? "Choisir un de mes wallets" : "Saisir une adresse externe"}
            </button>
          </div>

          {!isExternal ? (
            <select 
              className="w-full bg-gray-950 border border-gray-700 rounded p-3 mt-1 text-white focus:border-blue-500 outline-none"
              value={toWallet}
              onChange={(e) => setToWallet(e.target.value)}
            >
              <option value="">-- Choisir le destinataire --</option>
              {myWallets
                .filter(w => w !== fromWallet)
                .map(w => (
                  <option key={w} value={w}>
                    📥 {w.slice(0, 6)}...{w.slice(-4)}
                  </option>
              ))}
            </select>
          ) : (
            <input 
              type="text" 
              placeholder="0x..."
              className="w-full bg-gray-950 border border-gray-700 rounded p-3 mt-1 text-white focus:border-blue-500 outline-none font-mono"
              value={toWallet}
              onChange={(e) => setToWallet(e.target.value)}
            />
          )}
        </div>

        {/* MONTANT */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Montant (ETH/BNB)</label>
          <input 
            type="number" 
            step="0.0001"
            placeholder="0.0"
            className="w-full bg-gray-950 border border-gray-700 rounded p-3 mt-1 text-white focus:border-blue-500 outline-none text-xl font-bold"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* BOUTON D'ENVOI */}
        <button 
          disabled={isWrongWallet || isPending || !amount || !toWallet}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all transform active:scale-95"
        >
          {isWrongWallet ? '🛑 Wallet Incorrect' : isPending ? 'Envoi en cours...' : 'Envoyer les fonds 🚀'}
        </button>

        {hash && (
          <p className="text-center text-green-400 text-xs mt-2">
            ✅ Transaction envoyée ! Hash: {hash.slice(0,10)}...
          </p>
        )}

      </form>
    </div>
  );
}