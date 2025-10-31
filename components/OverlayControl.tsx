import React, { useState, useRef, useEffect } from 'react';
import type { VoiceProfile } from '../types';

interface OverlayControlProps {
  voices: VoiceProfile[];
  selectedVoice: VoiceProfile;
  onVoiceChange: (voice: VoiceProfile) => void;
  isActive: boolean;
  onStartStop: () => void;
  onClose: () => void;
  isInitializing: boolean;
  error: string | null;
}

export const OverlayControl: React.FC<OverlayControlProps> = ({
  voices,
  selectedVoice,
  onVoiceChange,
  isActive,
  onStartStop,
  onClose,
  isInitializing,
  error
}) => {
  const [position, setPosition] = useState({ x: 50, y: 100 });
  const dragRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      isDragging.current = true;
      offset.current = {
        x: e.clientX - dragRef.current.getBoundingClientRect().left,
        y: e.clientY - dragRef.current.getBoundingClientRect().top
      };
      // Prevent text selection while dragging
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={dragRef}
      className="absolute bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl shadow-violet-500/30 text-white w-80 z-50"
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
    >
      <div
        className="flex items-center justify-between p-2 cursor-move bg-zinc-800/50 rounded-t-lg"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-bold text-violet-400">🎙️ Voice FX</span>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label htmlFor="voice-select" className="sr-only">Select Voice</label>
          <select
            id="voice-select"
            value={selectedVoice.id}
            onChange={(e) => {
              const newVoice = voices.find(v => v.id === e.target.value);
              if (newVoice) onVoiceChange(newVoice);
            }}
            className="w-full bg-zinc-800 p-2 rounded border border-zinc-700 focus:ring-2 focus:ring-violet-500"
          >
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.icon} {voice.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onStartStop}
          disabled={isInitializing}
          className={`w-full py-3 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center
            ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            ${isInitializing ? 'bg-yellow-500 cursor-not-allowed' : ''}
          `}
        >
          {isInitializing ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : null}
          {isInitializing ? 'Initializing...' : (isActive ? 'Stop' : 'Start')}
        </button>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
};