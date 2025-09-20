// SupplyBar.tsx
import { useEffect, useState } from 'react';
import './SupplyBar.css'; // Создадим этот файл для анимаций

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://1111-rust.vercel.app';

const POLLING_INTERVAL = 60000; // 1 minute in milliseconds

export const SupplyBar = ({ 
  maxSupply = 200,
  refreshCounter = 0 
}: { 
  maxSupply?: number;
  refreshCounter?: number;
}) => {
  const [supply, setSupply] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMintCount = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mint-count`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mint count');
      }

      const data = await response.json();
      setSupply(data.count);
      setError(null);
    } catch (error) {
      console.error('Error fetching mint count:', error);
      setError('Failed to update mint count');
      // Fallback to localStorage if API is not available
      const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '[]');
      setSupply(mintedWallets.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMintCount();

    // Set up polling
    const intervalId = setInterval(fetchMintCount, POLLING_INTERVAL);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshCounter]);

  const percent = Math.min(100, Math.floor((supply / maxSupply) * 100));

  return (
    <div className="w-full space-y-3 lg:space-y-4 font-funnel">
      <div className="flex items-center space-x-2 text-white">
        <span className="text-3xl lg:text-4xl xl:text-5xl font-bold">
          {loading ? '...' : `${percent}%`}
        </span>
        <span className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-300">|</span>
        <span className="text-lg lg:text-xl xl:text-2xl text-gray-300">
          {loading ? '...' : `${supply}/${maxSupply}`}
        </span>
      </div>
      <div className="w-full bg-gray-700 h-3 lg:h-4">
        <div
          className="bg-gradient-to-r from-orange-500 to-red-500 h-3 lg:h-4 progress-bar transition-all duration-500"
          style={{ width: `${loading ? 0 : percent}%` }}
        />
      </div>
    </div>
  );
};