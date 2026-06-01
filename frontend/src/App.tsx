import { useState, useEffect, useCallback } from 'react';
import DevSandbox from './DevSandbox';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [userId, setUserId] = useState('');
  const [saleStatus, setSaleStatus] = useState('loading...');
  const [stock, setStock] = useState<number | null>(null);
  const [totalStock, setTotalStock] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(() => {
    fetch(`${API_BASE}/api/sale/status`)
      .then((res) => res.json())
      .then((data) => {
        setSaleStatus(data.status);
        setStock(data.stock);
        setTotalStock(data.totalStock);
        setStartTime(data.startTime);
        setEndTime(data.endTime);
      })
      .catch(() => setSaleStatus('error'));
  }, []);

  useEffect(() => {
    // Initial fetch to get the state immediately
    fetchStatus();

    // Open a persistent Server-Sent Events (SSE) connection for real-time stock updates
    const eventSource = new EventSource(`${API_BASE}/api/sale/stream`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSaleStatus(data.status);
      setStock(data.stock);
      setTotalStock(data.totalStock);
      setStartTime(data.startTime);
      setEndTime(data.endTime);
    };

    eventSource.onerror = () => {
      console.warn('SSE stream disconnected. Attempting to reconnect...');
      // EventSource automatically attempts to reconnect
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [fetchStatus]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!startTime || !endTime) return '';
      
      const now = new Date().getTime();
      let targetTime;
      let prefix = '';

      if (saleStatus === 'upcoming') {
        targetTime = new Date(startTime).getTime();
        prefix = 'Starts in: ';
      } else if (saleStatus === 'active') {
        targetTime = new Date(endTime).getTime();
        prefix = 'Ends in: ';
      } else {
        return '';
      }

      const difference = targetTime - now;

      if (difference <= 0) {
        // Time is up, refresh status to get the new state
        fetchStatus();
        return '';
      }

      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      return `${prefix}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [saleStatus, startTime, endTime, fetchStatus]);

  const handlePurchase = async () => {
    if (!userId.trim()) {
      setFeedback('Please enter a user ID or email.');
      return;
    }

    setIsLoading(true);
    setFeedback('');

    try {
      const res = await fetch(`${API_BASE}/api/sale/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback(`✅ ${data.message}`);
      } else {
        setFeedback(`❌ ${data.message || data.error}`);
      }

      // Refresh stock count after purchase attempt
      fetchStatus();
    } catch (error) {
      setFeedback('❌ Network error occurred while purchasing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <DevSandbox onConfigSaved={fetchStatus} />

      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Flash Sale! ⚡
        </h1>

        <div className="mb-6 p-4 bg-gray-100 rounded-lg flex items-center justify-between">
          <span className="text-gray-600 font-medium">Current Status:</span>
          <div className="text-right">
            <div className={`font-bold uppercase ${saleStatus === 'active' ? 'text-green-600' : 'text-orange-500'
              }`}>
              {saleStatus}
            </div>
            {timeLeft && (
              <div className="text-sm text-gray-500 font-mono mt-1">
                {timeLeft}
              </div>
            )}
          </div>
        </div>

        {stock !== null && totalStock !== null && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg flex items-center justify-between">
            <span className="text-gray-600 font-medium">Stock Remaining:</span>
            <span className="font-bold text-gray-900">
              {stock} <span className="text-gray-400 font-normal">/ {totalStock}</span>
            </span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your email or ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={saleStatus !== 'active' || isLoading}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          <button
            onClick={handlePurchase}
            disabled={saleStatus !== 'active' || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              'Buy Now'
            )}
          </button>
        </div>

        {feedback && (
          <div className={`mt-6 p-4 rounded-lg border ${feedback.includes('✅')
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            <p className="font-medium text-center">{feedback}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;