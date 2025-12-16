import React from "react";

interface HeaderProps {
  onAboutClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAboutClick }) => (
  <header className="bg-gradient-to-r from-[#f47321] to-[#003057] text-white shadow-lg">
    <div className="container mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={require('../../Pickmark_Flat_Pick_Orange.svg').default}
              alt="UTEP Logo"
              className="w-full h-full object-contain scale-[1.5]"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">
              University of Texas at El Paso
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              AI-Powered Support Assistant
            </p>
          </div>
        </div>
        <button
          onClick={onAboutClick}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          About
        </button>
      </div>
    </div>
  </header>
);

export default Header;
