// SupplyBar.tsx
import { useEffect, useState } from 'react';
import './SupplyBar.css'; // Создадим этот файл для анимаций

export const SupplyBar = ({ 
  maxSupply = 400,
  refreshCounter = 0 
}: { 
  maxSupply?: number;
  refreshCounter?: number;
}) => {
  const [supply, setSupply] = useState(0);

  useEffect(() => {
    // Get total mints from localStorage (since 1 wallet = 1 NFT)
    const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '[]');
    setSupply(mintedWallets.length);
  }, [refreshCounter]);

  const percent = Math.min(100, Math.round((supply / maxSupply) * 100));

  return (
    <div className="w-full space-y-3 lg:space-y-4 font-funnel">
      <div className="flex items-center space-x-2 text-white">
        <span className="text-3xl lg:text-4xl xl:text-5xl font-bold">{percent}%</span>
        <span className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-300">|</span>
        <span className="text-lg lg:text-xl xl:text-2xl text-gray-300">
          {supply}/{maxSupply}
        </span>
      </div>
      <div className="w-full bg-gray-700 h-3 lg:h-4">
        <div
          className="bg-gradient-to-r from-orange-500 to-red-500 h-3 lg:h-4 progress-bar transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};