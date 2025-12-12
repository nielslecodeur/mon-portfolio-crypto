'use client';

interface WalletRowProps {
  address: string;
  isSelected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export default function WalletRow({ address, isSelected, onToggle, onDelete }: WalletRowProps) {
  // On raccourcit l'adresse pour l'affichage (ex: 0x1234...ABCD)
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
      
      {/* Zone Clicable pour sélectionner */}
      <div className="flex items-center gap-3 cursor-pointer flex-grow" onClick={onToggle}>
        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
          {isSelected && <span className="text-xs text-white">✓</span>}
        </div>
        <span className="font-mono text-sm text-gray-200">{shortAddress}</span>
      </div>

      {/* Bouton Supprimer (Petite croix rouge) */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Empêche de sélectionner la ligne quand on clique sur supprimer
          onDelete();
        }}
        className="text-gray-500 hover:text-red-400 transition-colors px-2"
        title="Retirer ce wallet"
      >
        ✕
      </button>

    </div>
  );
}