import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUmi } from '../umi/UmiProvider';
import { createNft } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const MintButton = ({ 
  metadataUri, 
  name, 
  onMintSuccess,
  sellerFeeBasisPoints = 0
}: {
  metadataUri: string;
  name?: string;
  sellerFeeBasisPoints?: number;
  onMintSuccess?: () => void;
  isMinted?: boolean;
}) => {
  const wallet = useWallet();
  const umi = useUmi();
  const [loading, setLoading] = useState(false);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasAlreadyMinted, setHasAlreadyMinted] = useState(false);

  // Проверяем, заминтил ли уже этот кошелёк NFT через API
  useEffect(() => {
    const checkMintStatus = async () => {
      if (!wallet.publicKey) {
        setHasAlreadyMinted(false);
        setMintAddress(null);
        setShowSuccess(false);
        setError(null);
        return;
      }

      try {
        const walletAddress = wallet.publicKey.toBase58();
        const response = await fetch(`${API_BASE_URL}/api/mint-status/${walletAddress}`);
        
        if (!response.ok) {
          throw new Error('Failed to check mint status');
        }

        const data = await response.json();
        
        if (data.hasMinted && data.mintData) {
          setHasAlreadyMinted(true);
          setMintAddress(data.mintData.transaction_signature);
          setShowSuccess(true);
          console.log('E123:');
        } else {
          setHasAlreadyMinted(false);
          setMintAddress(null);
          setShowSuccess(false);
        }
        setError(null);
      } catch (error) {
        console.error('Error checking mint status:', error);
        // Fallback to localStorage if API is not available
        const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '[]');
        const walletAddress = wallet.publicKey.toBase58();
        const hasMinted = mintedWallets.includes(walletAddress);
        setHasAlreadyMinted(hasMinted);
        
        if (hasMinted) {
          const savedMintAddress = localStorage.getItem(`mintAddress_${walletAddress}`);
          if (savedMintAddress) {
            setMintAddress(savedMintAddress);
            setShowSuccess(true);
          } else {
            setShowSuccess(true);
          }
        }
      }
    };

    setError(null);
    checkMintStatus();
  }, [wallet.publicKey]);

  const recordMintToAPI = async (walletAddress: string, transactionSignature: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/record-mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          transactionSignature,
          mintAddress: transactionSignature // Using signature as mint identifier
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record mint');
      }

      return await response.json();
    } catch (error) {
      console.error('Error recording mint to API:', error);
      // Fallback to localStorage
      const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '[]');
      if (!mintedWallets.includes(walletAddress)) {
        mintedWallets.push(walletAddress);
        localStorage.setItem('mintedWallets', JSON.stringify(mintedWallets));
      }
      localStorage.setItem(`mintAddress_${walletAddress}`, transactionSignature);
      throw error;
    }
  };

  const onMint = useCallback(async () => {
    if (!wallet.connected) {
      setError('Сначала подключите кошелёк.');
      return;
    }

    if (hasAlreadyMinted) {
      setError('Этот кошелёк уже заминтил NFT. Один кошелёк = один NFT.');
      return;
    }

    setLoading(true);
    setError(null);
    setMintAddress(null);
    
    try {
      // Check current supply before minting
      const supplyResponse = await fetch(`${API_BASE_URL}/api/mint-count`);
      if (supplyResponse.ok) {
        const supplyData = await supplyResponse.json();
        if (supplyData.count >= 400) {
          setError('Максимальный лимит достигнут! Все 400 NFT уже заминчены.');
          setLoading(false);
          return;
        }
      }

      const mint = generateSigner(umi);
      
      let nftName = name;
      if (!nftName) {
        try {
          const response = await fetch(metadataUri);
          const metadata = await response.json();
          nftName = metadata.name;
        } catch (e) {
          console.error('Не удалось загрузить метаданные для получения имени:', e);
          nftName = 'Fogo NFT';
        }
      }
      
      // Создаём NFT
      const txBuilder = await createNft(umi, {
        mint,
        payer: umi.identity,
        authority: umi.identity,
        updateAuthority: umi.identity.publicKey,
        uri: metadataUri,
        name: nftName || 'Fogo NFT',
        sellerFeeBasisPoints:percentAmount(sellerFeeBasisPoints, 2),
      });
      
      const { signature } = await txBuilder.sendAndConfirm(umi);
      
      // Конвертируем signature в base58 строку
      const signatureString = base58.deserialize(signature)[0];
      const walletAddress = wallet.publicKey!.toBase58();
      
      // Записываем минт в API
      try {
        const response = await recordMintToAPI(walletAddress, signatureString);
        if (response.totalMinted) {
          console.log(`Total minted: ${response.totalMinted}/400`);
        }
      } catch (apiError: any) {
        console.warn('API recording failed, but mint was successful:', apiError);
        // Check if it's a supply limit error
        if (apiError.message && apiError.message.includes('Maximum supply reached')) {
          setError('Лимит достигнут во время минта. NFT создан, но может не учитываться.');
        }
      }
      
      setMintAddress(signatureString);
      setShowSuccess(true);
      setHasAlreadyMinted(true);
      onMintSuccess?.();
      
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка минта');
    } finally {
      setLoading(false);
    }
  }, [wallet.connected, wallet.publicKey, umi, metadataUri, name, sellerFeeBasisPoints, onMintSuccess, hasAlreadyMinted]);

  const handleTransactionClick = () => {
    if (mintAddress) {
      window.open(`https://fogoscan.com/tx/${mintAddress}?cluster=testnet`, '_blank');
    }
  };

  return (
    <div className="relative font-funnel">
      <button 
        onClick={onMint} 
        disabled={loading || hasAlreadyMinted} 
        className={`w-full py-6 lg:py-7 xl:py-8 px-8 lg:px-10 xl:px-12 rounded-lg font-bold text-lg lg:text-xl xl:text-2xl transition-all duration-300 ${
          loading 
            ? 'bg-[#f37126] text-black cursor-not-allowed animate-pulse'
            : hasAlreadyMinted
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-[#f37126] text-black shadow-lg hover:shadow-xl transform hover:scale-105'
        }`}
      >
        {loading ? 'Minting...' : hasAlreadyMinted ? 'Minted' : 'Mint | Free'}
      </button>
      
      {showSuccess && (
        <div className="flex bottom-[-30px] absolute items-center space-x-2 text-green-400 text-sm lg:text-base">
          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          {mintAddress ? (
            <span className='font-funnel'>Successfully, check  <span onClick={handleTransactionClick} className="text-orange-400 underline cursor-pointer hover:text-orange-300">here</span></span>
          ) : (
            <span className='font-funnel'>Successfully minted </span>
          )}
        </div>
      )}
      
      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
};