import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUmi } from '../umi/UmiProvider';
import { createNft } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';

export const MintButton = ({ 
  metadataUri, 
  name, 
  onMintSuccess,
  isMinted = false,
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

  // Проверяем, заминтил ли уже этот кошелёк NFT и загружаем данные о транзакции
  useEffect(() => {
    // Сбрасываем ошибку при смене кошелька
    setError(null);
    
    if (wallet.publicKey) {
      const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '[]');
      const walletAddress = wallet.publicKey.toBase58();
      const hasMinted = mintedWallets.includes(walletAddress);
      setHasAlreadyMinted(hasMinted);
      
      // Если кошелёк уже минтил, загружаем адрес его транзакции и показываем успешное сообщение
      if (hasMinted) {
        const savedMintAddress = localStorage.getItem(`mintAddress_${walletAddress}`);
        if (savedMintAddress) {
          setMintAddress(savedMintAddress);
          setShowSuccess(true);
        } else {
          // Если кошелёк минтил, но адрес транзакции не сохранился, всё равно показываем успех
          setShowSuccess(true);
        }
      } else {
        // Сбрасываем данные для нового кошелька
        setMintAddress(null);
        setShowSuccess(false);
      }
    } else {
      // Сбрасываем все состояния если кошелёк отключен
      setHasAlreadyMinted(false);
      setMintAddress(null);
      setShowSuccess(false);
      setError(null);
    }
  }, [wallet.publicKey]);

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
      
      // Сохраняем адрес кошелька в список заминтивших
      const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '[]');
      const walletAddress = wallet.publicKey!.toBase58();
      if (!mintedWallets.includes(walletAddress)) {
        mintedWallets.push(walletAddress);
        localStorage.setItem('mintedWallets', JSON.stringify(mintedWallets));
      }
      
      // Сохраняем адрес транзакции для этого кошелька
      localStorage.setItem(`mintAddress_${walletAddress}`, signatureString);
      
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
            <span>Successfully, check  <span onClick={handleTransactionClick} className="text-orange-400 underline cursor-pointer hover:text-orange-300">here</span></span>
          ) : (
            <span>Successfully minted </span>
          )}
        </div>
      )}
      
      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
};