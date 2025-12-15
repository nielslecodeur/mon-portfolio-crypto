// src/utils/bitcoin.ts

export const isValidBitcoinAddress = (address: string) => {
  // Regex simple pour valider les adresses BTC (Legacy, Segwit, Native Segwit)
  return /^(1|3|bc1)/.test(address) && address.length > 25 && address.length < 65;
};

export const fetchBitcoinBalance = async (address: string) => {
  try {
    // On utilise l'API gratuite de mempool.space
    const response = await fetch(`https://mempool.space/api/address/${address}`);
    if (!response.ok) throw new Error('Erreur API Bitcoin');
    
    const data = await response.json();
    
    // Le solde est en satoshis (1 BTC = 100,000,000 sats)
    // On additionne le solde confirmé + le solde en attente (mempool)
    const satoshis = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) + 
                     (data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum);
                     
    return satoshis / 100000000; // On convertit en BTC
  } catch (error) {
    console.error("Impossible de lire le solde Bitcoin", error);
    return 0;
  }
};