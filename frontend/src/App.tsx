import { useState, useEffect } from 'react';

function App() {
  const [userId, setUserId] = useState('');
  const [saleStatus, setSaleStatus] = useState('loading...');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/sale/status')
      .then((res) => res.json())
      .then((data) => setSaleStatus(data.status))
      .catch(() => setSaleStatus('error'));
  }, []);

  const handlePurchase = async () => {
    if (!userId.trim()) {
      setFeedback('Please enter a user ID or email.');
      return;
    }

    setIsLoading(true);
    setFeedback('');

    try {
      const res = await fetch('http://localhost:3001/api/sale/purchase', {
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
    } catch (error) {
      setFeedback('❌ Network error occurred while purchasing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Flash Sale! ⚡
        </h1>

        <div className="mb-6 p-4 bg-gray-100 rounded-lg flex items-center justify-between">
          <span className="text-gray-600 font-medium">Current Status:</span>
          <span className={`font-bold uppercase ${saleStatus === 'active' ? 'text-green-600' : 'text-orange-500'
            }`}>
            {saleStatus}
          </span>
        </div>

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