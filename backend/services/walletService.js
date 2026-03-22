import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'your-secret-encryption-key-change-this';

// Mock wallet generation (replace with real blockchain API later)
export async function generateWallet(symbol) {
    // Generate random address based on symbol
    const prefix = {
        BTC: '1',
        ETH: '0x',
        BNB: 'bnb1',
        SOL: 'sol',
        XRP: 'r',
        ADA: 'addr1',
        DOGE: 'D',
        DOT: '1',
        AVAX: '0x',
        MATIC: '0x',
        LINK: '0x',
        UNI: '0x',
        ATOM: 'cosmos1',
        ALGO: 'ALGO',
        VET: '0x'
    }[symbol] || '0x';
    
    const randomPart = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    return {
        address: prefix + randomPart,
        privateKey: 'priv_' + Math.random().toString(36).substring(2, 20),
        publicKey: 'pub_' + Math.random().toString(36).substring(2, 20),
        symbol: symbol,
        chain: symbol === 'BTC' ? 'bitcoin' : 
               symbol === 'ETH' ? 'ethereum' : 
               symbol === 'SOL' ? 'solana' : 'ethereum'
    };
}

// Encrypt private key before storing
export function encryptPrivateKey(privateKey) {
    return CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY).toString();
}

// Decrypt private key when needed
export function decryptPrivateKey(encryptedKey) {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Get all supported coins
export async function getSupportedCoins() {
    return [
        { symbol: 'BTC', name: 'Bitcoin', chain: 'bitcoin', icon: '₿' },
        { symbol: 'ETH', name: 'Ethereum', chain: 'ethereum', icon: 'Ξ' },
        { symbol: 'BNB', name: 'Binance Coin', chain: 'binance', icon: 'BNB' },
        { symbol: 'SOL', name: 'Solana', chain: 'solana', icon: 'SOL' },
        { symbol: 'XRP', name: 'Ripple', chain: 'ripple', icon: 'XRP' },
        { symbol: 'ADA', name: 'Cardano', chain: 'cardano', icon: 'ADA' },
        { symbol: 'DOGE', name: 'Dogecoin', chain: 'dogecoin', icon: 'Ð' },
        { symbol: 'DOT', name: 'Polkadot', chain: 'polkadot', icon: 'DOT' },
        { symbol: 'AVAX', name: 'Avalanche', chain: 'avalanche', icon: 'AVAX' },
        { symbol: 'MATIC', name: 'Polygon', chain: 'polygon', icon: 'MATIC' },
        { symbol: 'LINK', name: 'Chainlink', chain: 'ethereum', icon: 'LINK' },
        { symbol: 'UNI', name: 'Uniswap', chain: 'ethereum', icon: 'UNI' },
        { symbol: 'ATOM', name: 'Cosmos', chain: 'cosmos', icon: 'ATOM' },
        { symbol: 'ALGO', name: 'Algorand', chain: 'algorand', icon: 'ALGO' },
        { symbol: 'VET', name: 'VeChain', chain: 'vechain', icon: 'VET' }
    ];
}

// Get wallet balance (mock for now)
export async function getWalletBalance(address, symbol) {
    // Return random balance between 0.1 and 2.0
    return Math.random() * 2;
}
