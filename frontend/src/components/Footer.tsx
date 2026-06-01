import React from 'react';

export default function Footer() {
  return (
    <footer className="relative mt-24">
      {/* SVG Curve - mimics the screenshot curve */}
      <svg className="absolute top-0 w-full h-16 md:h-24 -translate-y-[99%] left-0" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
        <path d="M0 0 Q 720 100 1440 0 L 1440 100 L 0 100 Z" fill="#091028" />
      </svg>
      <div className="bg-[#091028] text-white py-12 px-4 text-center relative z-10">
        <p className="text-gray-400 font-medium tracking-wide">Bookipi Full Stack Engineer Take Home Test</p>
      </div>
    </footer>
  );
}
