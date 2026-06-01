import { useState, useEffect, useCallback } from 'react';
import DevSandbox from './DevSandbox';
import logoBookipi from './assets/logo-bookipi.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [userId, setUserId] = useState('');
  const [saleStatus, setSaleStatus] = useState('loading...');
  const [stock, setStock] = useState<number | null>(null);
  const [totalStock, setTotalStock] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    <div className="min-h-screen flex flex-col font-sans" style={{ background: 'linear-gradient(to bottom, #E3F0FE, #FEFEFE)' }}>
      {/* Sticky Navbar */}
      <nav className={`sticky top-0 w-full p-4 flex items-center justify-between z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md border-b border-gray-200' : 'bg-transparent border-b border-transparent'}`}>
        <div className="flex items-center gap-3 ml-4">
          <img src={logoBookipi} alt="Bookipi Logo" className="h-8" />
          <span className="font-bold text-[#111928] text-xl tracking-tight hidden sm:block border-l-2 border-gray-300 pl-3">Flash Sale</span>
        </div>
        <div className="mr-4">
          <DevSandbox onConfigSaved={fetchStatus} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center px-4 py-8 md:py-16">
        <div className="text-center mb-12 px-2 flex flex-col items-center">
          <div className="inline-block mb-5 px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md border border-blue-400/30">
            <span className="text-white text-sm md:text-base font-bold uppercase tracking-widest shadow-sm">
              Exclusive Lifetime Deal
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#111928] flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-12 md:h-12 text-[#1361e9]">
              <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
            </svg>
            <span>The Diamond Platinum Lifetime Membership</span>
          </h2>
        </div>

        {/* Big Centered Timer */}
        {timeLeft && saleStatus !== 'ended' && (
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-10">
            {(() => {
              const match = timeLeft.match(/^(Starts|Ends) in: (\d{2}):(\d{2}):(\d{2})$/);
              if (!match) return null;
              const label = match[1] === 'Starts' ? 'Start in' : 'End in';
              return (
                <>
                  <span className="text-3xl md:text-4xl font-bold text-[#F3B241] mr-2 md:mr-4 tracking-tight">{label}</span>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="bg-[#F3B241] text-white text-3xl md:text-5xl font-bold rounded-xl md:rounded-2xl w-14 h-14 md:w-20 md:h-20 flex items-center justify-center shadow-sm">
                      {match[2]}
                    </div>
                    <span className="text-3xl md:text-4xl font-bold text-[#F3B241] mb-1 md:mb-2">:</span>
                    <div className="bg-[#F3B241] text-white text-3xl md:text-5xl font-bold rounded-xl md:rounded-2xl w-14 h-14 md:w-20 md:h-20 flex items-center justify-center shadow-sm">
                      {match[3]}
                    </div>
                    <span className="text-3xl md:text-4xl font-bold text-[#F3B241] mb-1 md:mb-2">:</span>
                    <div className="bg-[#F3B241] text-white text-3xl md:text-5xl font-bold rounded-xl md:rounded-2xl w-14 h-14 md:w-20 md:h-20 flex items-center justify-center shadow-sm">
                      {match[4]}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Product Card Container */}
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">
          
          {/* Left side: Product Info */}
          <div className="p-8 lg:p-12 lg:w-2/3">
            <h3 className="text-2xl font-bold text-[#111928] mb-4">The Diamond Platinum Membership: Product Recap</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              By combining the highest tiers of the core plans and all premium add-ons, your exclusive package will include the following lifetime benefits:
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="16 16 40 40" fill="none" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                    <rect width="72" height="72" rx="16" fill="transparent"></rect>
                    <path d="M38.8604 24.7997C38.8604 27.5059 40.987 29.7001 43.6104 29.7001H48.3604C48.3649 29.7001 48.3695 29.6991 48.374 29.6991V44.4335C48.374 47.6457 45.6535 50.2499 42.2979 50.2499H30.4502C27.0945 50.2499 24.374 47.6457 24.374 44.4335V27.5663C24.374 24.354 27.0945 21.7499 30.4502 21.7499H38.8604V24.7997ZM28.3076 40.4764C27.6748 40.4764 27.1612 41.148 27.1611 41.9764C27.1611 42.8049 27.6748 43.4764 28.3076 43.4764H30.1406C30.7734 43.4763 31.2861 42.8048 31.2861 41.9764C31.2861 41.1481 30.7734 40.4765 30.1406 40.4764H28.3076ZM34.624 40.4764C33.8159 40.4765 33.1612 41.1481 33.1611 41.9764C33.1611 42.8048 33.8159 43.4764 34.624 43.4764H43.6973C44.5055 43.4764 45.1611 42.8049 45.1611 41.9764C45.1611 41.148 44.5055 40.4764 43.6973 40.4764H34.624ZM28.3076 34.4764C27.6748 34.4764 27.1612 35.1481 27.1611 35.9764C27.1611 36.8049 27.6748 37.4764 28.3076 37.4764H30.1406C30.7734 37.4763 31.2861 36.8048 31.2861 35.9764C31.2861 35.1482 30.7733 34.4765 30.1406 34.4764H28.3076ZM34.624 34.4764C33.8159 34.4765 33.1612 35.1481 33.1611 35.9764C33.1611 36.8048 33.8159 37.4764 34.624 37.4764H43.6973C44.5055 37.4764 45.1611 36.8049 45.1611 35.9764C45.161 35.1481 44.5054 34.4764 43.6973 34.4764H34.624ZM42.2979 21.7499C45.3883 21.7499 47.9383 23.9589 48.3223 26.8173H43.6104C42.5301 26.8173 41.6543 25.914 41.6543 24.7997V21.7499H42.2979Z" fill="#6FB100"></path>
                  </svg>
                  <h4 className="font-bold text-[#111928]">Core Business and Invoicing (Professional Plan & Contract Pro+)</h4>
                </div>
                <ul className="list-disc pl-5 text-gray-600 space-y-1.5 text-sm leading-relaxed">
                  <li><strong className="text-gray-800">Unlimited Invoices:</strong> Create and send an unlimited number of invoices.</li>
                  <li><strong className="text-gray-800">Unlimited eSignatures:</strong> Unlimited document signing (upgrading the standard 3 per month).</li>
                  <li><strong className="text-gray-800">Unlimited AI Contracts:</strong> Full access to AI contract generation and review.</li>
                  <li><strong className="text-gray-800">Advanced Payment Features:</strong> Accept card payments, accept deposits, and set up recurring invoices.</li>
                  <li><strong className="text-gray-800">Workflow Automation:</strong> Automatic overdue reminders, Gmail add-on, and real-time syncing across web and mobile apps.</li>
                  <li><strong className="text-gray-800">Document Management:</strong> Full storage, save as PDF, and document conversion features.</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="16 16 40 40" fill="none" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                    <rect width="72" height="72" rx="16" fill="transparent"></rect>
                    <path fillRule="evenodd" clipRule="evenodd" d="M21.375 29.1115C21.375 25.8739 23.8934 23.2493 27 23.2493C30.1066 23.2493 32.625 25.8739 32.625 29.1115V42.8879C32.625 46.1255 30.1066 48.7502 27 48.7502C23.8934 48.7502 21.375 46.1255 21.375 42.8879V29.1115ZM35.4375 43.0344C35.4375 39.8777 37.866 37.3187 40.8616 37.3187H45.2009C48.1965 37.3187 50.625 39.8777 50.625 43.0344C50.625 46.1911 48.1965 48.7502 45.2009 48.7502H40.8616C37.866 48.7502 35.4375 46.1911 35.4375 43.0344ZM35.4375 31.4565C35.4375 33.0753 36.6967 34.3876 38.25 34.3876H47.8125C49.3658 34.3876 50.625 33.0753 50.625 31.4564V26.1804C50.625 24.5616 49.3658 23.2493 47.8125 23.2493H38.25C36.6967 23.2493 35.4375 24.5616 35.4375 26.1804V31.4565Z" fill="#E47212"></path>
                  </svg>
                  <h4 className="font-bold text-[#111928]">Web Presence (AI Website Builder Pro)</h4>
                </div>
                <ul className="list-disc pl-5 text-gray-600 space-y-1.5 text-sm leading-relaxed">
                  <li><strong className="text-gray-800">Custom Domains:</strong> Connect a custom domain to the business website.</li>
                  <li><strong className="text-gray-800">Advanced Generation:</strong> AI page and content generation with multi-page support.</li>
                  <li><strong className="text-gray-800">Customization:</strong> Full access to page templates and style customizations.</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="16 16 40 40" fill="none" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                    <rect width="72" height="72" rx="16" fill="transparent"></rect>
                    <path d="M43.3635 35.6715C43.3635 34.0581 44.6822 32.7502 46.3089 32.7502H47.7817C50.2217 32.7502 52.1998 34.7121 52.1998 37.1321V38.5927C52.1998 41.0128 50.2217 42.9746 47.7817 42.9746H46.3089C44.6822 42.9746 43.3635 41.6667 43.3635 40.0534V35.6715Z" fill="#0694A2"></path>
                    <path d="M28.6361 35.6715C28.6361 34.0581 27.3174 32.7502 25.6907 32.7502H24.2179C21.7779 32.7502 19.7998 34.7121 19.7998 37.1321V38.5927C19.7998 41.0128 21.7779 42.9746 24.2179 42.9746H25.6907C27.3174 42.9746 28.6361 41.6667 28.6361 40.0534V35.6715Z" fill="#0694A2"></path>
                    <path d="M36.0011 20.7C43.2277 20.7004 48.8873 26.8621 48.8873 34.2108V37.1321C48.8873 38.1402 48.0628 38.9575 47.0465 38.9579C46.0298 38.9579 45.2056 38.1405 45.2056 37.1321V34.2108C45.2056 28.6532 40.9742 24.352 36.0011 24.3516C31.0277 24.3516 26.7966 28.6529 26.7966 34.2108V37.1321C26.7966 38.1402 25.9721 38.9575 24.9557 38.9579C23.939 38.9579 23.1148 38.1405 23.1148 37.1321V34.2108C23.1148 26.8618 28.7741 20.7 36.0011 20.7Z" fill="#0694A2"></path>
                    <path d="M48.5177 40.3458C48.5176 43.7822 46.9286 46.3495 44.4016 47.9941C41.9465 49.5917 38.6845 50.2778 35.2633 50.2778V47.3565C38.3485 47.3565 40.9776 46.728 42.7865 45.5507C44.5234 44.4202 45.5722 42.7514 45.5723 40.3458H48.5177Z" fill="#0694A2"></path>
                    <path d="M33.0542 48.3788C33.0542 46.7654 34.3729 45.4575 35.9997 45.4575C37.6264 45.4575 38.9451 46.7654 38.9451 48.3788C38.9451 49.9921 37.6264 51.3 35.9997 51.3C34.3729 51.3 33.0542 49.9921 33.0542 48.3788Z" fill="#0694A2"></path>
                  </svg>
                  <h4 className="font-bold text-[#111928]">Client Communication (AI Receptionist)</h4>
                </div>
                <ul className="list-disc pl-5 text-gray-600 space-y-1.5 text-sm leading-relaxed">
                  <li><strong className="text-gray-800">Virtual Assistant:</strong> Ensure you never miss a customer call.</li>
                  <li><strong className="text-gray-800">Customization:</strong> Access to 6 unique voices and 4 dynamic tones.</li>
                  <li><strong className="text-gray-800">Analytics:</strong> View all call insights on one simple dashboard to reduce overhead costs.</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="16 16 40 40" fill="none" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                    <rect width="72" height="72" rx="16" fill="transparent"></rect>
                    <path d="M23.1294 38.7773C24.4202 39.5668 25.9388 40.021 27.563 40.0137L32.937 39.9883C32.7103 40.8236 32.5874 41.7023 32.5874 42.6094C32.5875 45.4246 33.7539 47.9663 35.6284 49.7812H28.9312C25.048 49.7812 21.9001 46.6331 21.8999 42.75C21.8999 41.2758 22.354 39.9076 23.1294 38.7773ZM42.5718 35.4375C46.5326 35.4376 49.7437 38.6485 49.7437 42.6094C49.7435 46.5701 46.5325 49.7811 42.5718 49.7812C38.611 49.7812 35.4001 46.5701 35.3999 42.6094C35.3999 38.6485 38.6109 35.4375 42.5718 35.4375ZM42.4312 37.9688C41.6545 37.9687 41.0249 38.5983 41.0249 39.375V41.3438H39.0562C38.2795 41.3438 37.6499 41.9733 37.6499 42.75C37.6501 43.5265 38.2796 44.1563 39.0562 44.1562H41.0249V46.125C41.0251 46.9015 41.6546 47.5312 42.4312 47.5312C43.2076 47.5311 43.8372 46.9014 43.8374 46.125V44.1562H45.8062C46.5826 44.1561 47.2122 43.5264 47.2124 42.75C47.2124 41.9734 46.5827 41.3439 45.8062 41.3438H43.8374V39.375C43.8374 38.5984 43.2077 37.9689 42.4312 37.9688ZM42.4312 22.2188C43.2077 22.2189 43.8374 22.8484 43.8374 23.625V25.877L44.4507 25.875C47.5573 25.861 50.0871 28.368 50.1011 31.4746C50.1069 32.7708 49.6709 33.9641 48.938 34.918C47.2099 33.4859 44.9915 32.625 42.5718 32.625C39.064 32.625 35.9805 34.435 34.1997 37.1709L27.5503 37.2012C27.2507 37.2025 26.9565 37.1786 26.6694 37.1348C26.6574 37.1329 26.6453 37.1308 26.6333 37.1289C23.9608 36.7032 21.9125 34.3959 21.8999 31.6016C21.8859 28.495 24.3929 25.9652 27.4995 25.9512L28.0864 25.9482V23.625C28.0864 22.8483 28.716 22.2187 29.4927 22.2188C30.2693 22.2188 30.8989 22.8484 30.8989 23.625V25.9355L41.0249 25.8896V23.625C41.0249 22.8483 41.6545 22.2187 42.4312 22.2188Z" fill="#6FB100"></path>
                  </svg>
                  <h4 className="font-bold text-[#111928]">Meeting Management (AI Meeting Assistant Paid Tier)</h4>
                </div>
                <ul className="list-disc pl-5 text-gray-600 space-y-1.5 text-sm leading-relaxed">
                  <li><strong className="text-gray-800">High Capacity:</strong> 1,200 minutes of meeting assistance per month.</li>
                  <li><strong className="text-gray-800">Automation:</strong> AI scheduling via email, AI meeting notetaker, and AI summaries.</li>
                  <li><strong className="text-gray-800">Integrations:</strong> Google Calendar sync, booking links, and video recording capabilities.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-[#111928] mb-2">Premium Support</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1.5 text-sm leading-relaxed">
                  <li>Priority responsive chat and email support, alongside video tutorials and self-help guides.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right side: Checkout Box */}
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

            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Enter your email"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={saleStatus !== 'active' || isLoading}
                className="w-full p-4 border border-blue-400 bg-white rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#1361e9] outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              />

              <button
                onClick={handlePurchase}
                disabled={saleStatus !== 'active' || isLoading}
                className="w-full text-white font-semibold py-4 px-4 rounded-xl shadow-blue-500/40 shadow-xl hover:shadow-blue-500/60 hover:-translate-y-1 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed flex justify-center items-center text-lg active:scale-95"
                style={{ backgroundImage: 'linear-gradient(90deg, #095ae9 3%, #0047c4 100%)' }}
              >
                {isLoading ? <span className="animate-pulse">Processing...</span> : 'Claim My Lifetime Deal'}
              </button>
            </div>

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

        </div>
      </main>

      {/* Footer with Curved SVG */}
      <footer className="relative mt-24">
        {/* SVG Curve - mimics the screenshot curve */}
        <svg className="absolute top-0 w-full h-16 md:h-24 -translate-y-[99%] left-0" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
          <path d="M0 0 Q 720 100 1440 0 L 1440 100 L 0 100 Z" fill="#091028" />
        </svg>
        <div className="bg-[#091028] text-white py-12 px-4 text-center relative z-10">
          <p className="text-gray-400 font-medium tracking-wide">Bookipi Full Stack Engineer Take Home Test</p>
        </div>
      </footer>
    </div>
  );
}

export default App;