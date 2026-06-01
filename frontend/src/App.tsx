import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeatureList from './components/FeatureList';
import CheckoutCard from './components/CheckoutCard';
import Footer from './components/Footer';
import { api } from './services/api';

function App() {
  const [saleStatus, setSaleStatus] = useState('loading...');
  const [stock, setStock] = useState<number | null>(null);
  const [totalStock, setTotalStock] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const fetchStatus = useCallback(() => {
    api.getSaleStatus()
      .then(({ data }) => {
        setSaleStatus(data.status);
        setStock(data.stock);
        setTotalStock(data.totalStock);
        setStartTime(data.startTime);
        setEndTime(data.endTime);
      })
      .catch(() => setSaleStatus('error'));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initial fetch to get the state immediately
    fetchStatus();

    // Open a persistent Server-Sent Events (SSE) connection for real-time stock updates
    const eventSource = api.createSaleStream();
    
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
        setIsUrgent(false);
        return '';
      }

      if (saleStatus === 'active' && difference <= 5 * 60 * 1000) {
        setIsUrgent(true);
      } else {
        setIsUrgent(false);
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

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: 'linear-gradient(to bottom, #E3F0FE, #FEFEFE)' }}>
      <Navbar isScrolled={isScrolled} onConfigSaved={fetchStatus} />

      <main className="flex-grow flex flex-col items-center px-4 py-8 md:py-16">
        <Hero timeLeft={timeLeft} saleStatus={saleStatus} />

        {/* Product Card Container */}
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">
          <FeatureList />
          <CheckoutCard 
            saleStatus={saleStatus}
            timeLeft={timeLeft}
            isUrgent={isUrgent}
            stock={stock}
            totalStock={totalStock}
            onPurchaseSuccess={fetchStatus}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;