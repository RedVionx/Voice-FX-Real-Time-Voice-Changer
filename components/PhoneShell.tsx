import React from 'react';

interface PhoneShellProps {
  children: React.ReactNode;
}

export const PhoneShell: React.FC<PhoneShellProps> = ({ children }) => {
  return (
    <div className="w-[380px] h-[820px] bg-black border-4 border-zinc-700 rounded-[40px] shadow-2xl shadow-violet-500/20 p-2.5">
      <div className="relative w-full h-full bg-zinc-900 rounded-[30px] overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-xl z-20 flex justify-center items-center">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div>
        </div>
        {children}
      </div>
    </div>
  );
};