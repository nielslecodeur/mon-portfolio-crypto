'use client';

interface WalletRowProps {
  address: string;
  isSelected: boolean;
  isActive: boolean; // Nouveau : savoir si c'est le pilote actuel
  onToggle: () => void;
  onDelete: () => void;
  onActivate: () => void; // Nouveau : fonction pour switcher
}

export default function WalletRow({ 
  address, 
  isSelected, 
  isActive, 
  onToggle, 
  onDelete, 
  onActivate 
}: WalletRowProps) {
  
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
      isActive 
        ? 'bg-green-900/20 border-green-800' 
        : isSelected 
          ? 'bg-blue-900/20 border-blue-800' 
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
    }`}>
      
      {/* Zone Clicable pour cocher/décocher */}
      <div className="flex items-center gap-3 cursor-pointer flex-grow overflow-hidden" onClick={onToggle}>
        
        {/* Case à cocher */}
        <div className={`w-4 h-4 min-w-[1rem] rounded-sm border flex items-center justify-center transition-colors ${
          isSelected 
            ? 'bg-blue-600 border-blue-600' 
            : 'border-gray-500 group-hover:border-gray-400'
        }`}>
          {isSelected && <span className="text-[10px] text-white font-bold">✓</span>}
        </div>

        {/* Adresse + Badge Actif */}
        <div className="flex flex-col truncate">
          <span className={`font-mono text-sm truncate ${isActive ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
            {shortAddress}
          </span>
          {isActive && <span className="text-[9px] text-green-600 uppercase font-bold tracking-wider leading-none">Connecté</span>}
        </div>
      </div>

      {/* BOUTONS D'ACTION (À droite) */}
      <div className="flex items-center gap-1">
        
        {/* Bouton ECLAIR (Pour activer ce wallet s'il ne l'est pas) */}
        {!isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onActivate();
            }}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-yellow-900/30 text-gray-500 hover:text-yellow-500 transition-colors"
            title="Connexion rapide (Switch)"
          >
            ⚡
          </button>
        )}

        {/* Bouton SUPPRIMER */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors"
          title="Retirer de la liste"
        >
          ✕
        </button>
      </div>

    </div>
  );
}