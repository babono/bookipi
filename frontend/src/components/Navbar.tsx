import React from 'react';
import logoBookipi from '../assets/logo-bookipi.png';
import DevSandbox from './DevSandbox';

interface NavbarProps {
  isScrolled: boolean;
  onConfigSaved: () => void;
}

export default function Navbar({ isScrolled, onConfigSaved }: NavbarProps) {
  return (
    <nav className={`sticky top-0 w-full p-4 flex items-center justify-between z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md border-b border-gray-200' : 'bg-transparent border-b border-transparent'}`}>
      <div className="flex items-center gap-3 ml-4">
        <img src={logoBookipi} alt="Bookipi Logo" className="h-8" />
        <span className="font-bold text-[#111928] text-xl tracking-tight hidden sm:block border-l-2 border-gray-300 pl-3">Flash Sale</span>
      </div>
      <div className="mr-4">
        <DevSandbox onConfigSaved={onConfigSaved} />
      </div>
    </nav>
  );
}
