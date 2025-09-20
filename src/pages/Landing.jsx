import React from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Centered panel */}
      <div className="flex flex-col items-center justify-center">
        {/* Overlapping squares */}
        <div className="relative flex flex-col items-center">
          <div className="absolute -top-2 -left-2 w-[340px] h-[110px] border-2 border-[#222] z-10"></div>
          <div className="absolute top-2 left-2 w-[340px] h-[110px] border-2 border-[#222] z-20"></div>
          <div className="w-[340px] h-[110px] flex items-center justify-center z-30 bg-transparent">
            <span className="text-xl text-[#222] font-medium text-center">
              FARD Stationery<br />Inventory App
            </span>
          </div>
        </div>
        {/* Login Button */}
        <button
          onClick={handleLoginClick}
          className="mt-8 px-4 py-1 border-2 border-[#222] bg-transparent text-base hover:bg-[#222] hover:text-[#e1ffa7] transition-colors duration-300">
          Login
        </button>
      </div>
    </div>
  );
};

export default Landing;