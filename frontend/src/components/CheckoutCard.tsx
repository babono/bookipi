import { useState } from 'react';
import { api } from '../services/api';

interface CheckoutCardProps {
  saleStatus: string;
  timeLeft: string;
  isUrgent: boolean;
  stock: number | null;
  totalStock: number | null;
  onPurchaseSuccess: () => void;
}

export default function CheckoutCard({
  saleStatus,
  timeLeft,
  isUrgent,
  stock,
  totalStock,
  onPurchaseSuccess
}: CheckoutCardProps) {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handlePurchase = async () => {
    if (!userId.trim()) {
      setFeedback('Please enter a user ID or email.');
      return;
    }

    setIsLoading(true);
    setFeedback('');

    try {
      const { ok, data } = await api.purchase(userId);

      if (ok) {
        setFeedback(`✅ ${data.message}`);
      } else {
        setFeedback(`❌ ${data.message || data.error}`);
      }

      // Refresh stock count after purchase attempt
      onPurchaseSuccess();
    } catch (error) {
      setFeedback('❌ Network error occurred while purchasing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#f8faff] to-[#eef4ff] p-8 lg:p-12 lg:w-1/3 border-t lg:border-t-0 lg:border-l border-blue-100 flex flex-col justify-center">
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="text-xl font-bold text-gray-400 line-through mb-1 tracking-wide decoration-2 decoration-gray-300">$3,376/yr</div>
        <div className="text-6xl font-bold text-[#1361e9] mb-2 tracking-tighter">$999</div>
        <div className="text-gray-400 uppercase tracking-[0.2em] text-xs font-bold">One Time Payment</div>
      </div>

      <div className="mb-6 flex items-center justify-between px-2">
        <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Status</span>
        <div className="text-right">
          <div className={`font-bold uppercase text-lg ${saleStatus === 'active' ? (isUrgent ? 'text-red-500 animate-pulse' : 'text-green-500') : 'text-orange-500'}`}>
            {saleStatus}
          </div>
          {timeLeft && <div className={`text-xs font-mono mt-0.5 font-semibold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>{timeLeft}</div>}
        </div>
      </div>

      {saleStatus === 'active' && stock !== null && totalStock !== null && (
        <div className="mb-8 p-5 bg-white rounded-xl flex flex-col gap-3 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Remaining</span>
            <span className="font-bold text-[#111928] text-2xl">
              {stock} <span className="text-gray-300 font-bold text-lg">/ {totalStock}</span>
            </span>
          </div>
          {/* Visual Stock Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                ((stock / totalStock) * 100) > 50 ? 'bg-green-500' : 
                ((stock / totalStock) * 100) > 10 ? 'bg-yellow-400' : 'bg-red-500'
              }`} 
              style={{ width: `${Math.max((stock / totalStock) * 100, 0)}%` }}
            ></div>
          </div>
        </div>
      )}

      {saleStatus === 'active' && (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your email"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isLoading}
            className="w-full p-4 border border-blue-400 bg-white rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#1361e9] outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
          />

          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full font-semibold py-4 px-4 rounded-xl shadow-blue-500/40 shadow-xl hover:shadow-blue-500/60 hover:-translate-y-1 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed flex justify-center items-center text-lg active:scale-95 text-white"
            style={{ backgroundImage: isLoading ? 'none' : 'linear-gradient(90deg, #095ae9 3%, #0047c4 100%)' }}
          >
            {isLoading ? <span className="animate-pulse">Processing...</span> : 'Claim My Lifetime Deal'}
          </button>
        </div>
      )}

      {feedback && (
        <div className={`mt-6 p-4 rounded-xl flex flex-col gap-1.5 ${feedback.includes('✅') ? 'bg-[#f0fdf4] text-[#065f46]' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <div className="flex items-center gap-2">
            {!feedback.includes('✅') && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
            )}
            {feedback.includes('✅') && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-bold text-base">
              {feedback.includes('✅') ? 'Email sent' : feedback.replace('❌ ', '')}
            </span>
          </div>
          {feedback.includes('✅') && (
            <p className="text-[#065f46] text-sm ml-7">
              We sent you a link to verify. Please check your inbox.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
