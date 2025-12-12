'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';

interface SmartTransferProps {
  myWallets: string[]; // La liste de tes wallets pour le menu déroulant
}

export default function SmartTransfer({ myWallets }: SmartTransferProps) {
  const { address: connectedAddress } = useAccount();
  const { sendTransaction, isPending, data: hash } = useSendTransaction();

  // États du formulaire
  const [fromWallet, setFromWallet] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [isExternal, setIsExternal] = useState(false); // Est-ce un virement vers un inconnu ?

  // Au démarrage, on sélectionne le wallet connecté comme expéditeur
  useEffect(() => {
    if (connectedAddress) {
      setFromWallet(connectedAddress);
    }
  }, [connectedAddress]);

  // L'ASTUCE DU CHEF : Fonction pour forcer MetaMask à changer de compte
  const requestSwitchWallet = async () => {
    try {
      // @ts-ignore (Car window.ethereum n'est pas toujours défini en standard TypeScript)
      if (window.ethereum) {
        // Cette commande force MetaMask à ouvrir la fenêtre "Connecter un compte"
        // @ts-ignore
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }]
        });
      }
    } catch (error) {
      console.error("Erreur switch:", error);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !toWallet) return;

    sendTransaction({
      to: toWallet as `0x${string}`,
      value: parseEther(amount),
    });
  };

  // Vérification : Est-ce que le wallet "De" est bien celui connecté ?
  const isWrongWallet = fromWallet.toLowerCase() !== connectedAddress?.toLowerCase();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl w-full max-w-xl mx-auto">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        🔪 Couteau Suisse (Virement)
      </h3>

      <form onSubmit={handleSend} className="space-y-5">
        
        {/* LIGNE 1 : DE (Source) */}
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

          {/* ALERTE INTELLIGENTE : Si le wallet choisi n'est pas connecté */}
          {isWrongWallet && (
            <div className="mt-2 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded flex justify-between items-center animate-in slide-in-from-top-2">
              <span className="text-xs text-yellow-500">
                Ce wallet n'est pas actif.
              </span>
              <button 
                type="button"
                onClick={requestSwitchWallet}
                className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded font-bold transition-colors"
              >
                ⚡ Changer de Wallet (MetaMask)
              </button>
            </div>
          )}
        </div>

        {/* LIGNE 2 : VERS (Destination) */}
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
                .filter(w => w !== fromWallet) // On n'affiche pas l'émetteur dans la liste
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

        {/* LIGNE 3 : MONTANT */}
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