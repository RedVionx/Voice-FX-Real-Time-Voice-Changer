import React from 'react';

interface QuickSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onTileClick: () => void;
  isServiceActive: boolean;
}

const Tile: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void; }> = ({ icon, label, active = false, onClick }) => (
  <div
    className="flex flex-col items-center justify-center space-y-1 cursor-pointer"
    onClick={onClick}
  >
    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-violet-600' : 'bg-zinc-700'}`}>
      <span className="text-3xl">{icon}</span>
    </div>
    <span className="text-xs text-center">{label}</span>
  </div>
);

export const QuickSettings: React.FC<QuickSettingsProps> = ({ isOpen, onClose, onTileClick, isServiceActive }) => {
  return (
    <>
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 z-30 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <div
        className={`absolute top-0 left-0 right-0 bg-zinc-800/90 backdrop-blur-sm rounded-b-3xl shadow-lg shadow-violet-500/20 p-4 transform transition-transform duration-300 ease-in-out z-40 ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="grid grid-cols-3 gap-4 py-4">
          <Tile icon="📶" label="Wi-Fi" active />
          <Tile icon="🔄️" label="Rotation" />
          <Tile icon="🔦" label="Flashlight" />
          <Tile icon="✈️" label="Airplane Mode" />
          <Tile icon="🔵" label="Bluetooth" active />
          <Tile
            icon="🎙️"
            label="Voice FX"
            active={isServiceActive}
            onClick={onTileClick}
          />
        </div>
        <div className="w-24 h-1.5 bg-zinc-600 rounded-full mx-auto mt-4 cursor-pointer" onClick={onClose}></div>
      </div>
    </>
  );
};