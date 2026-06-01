
interface HeroProps {
  timeLeft: string;
  saleStatus: string;
}

export default function Hero({ timeLeft, saleStatus }: HeroProps) {
  return (
    <>
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
    </>
  );
}
