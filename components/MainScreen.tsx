import React from 'react';
import { VOICE_PROFILES } from '../constants';

interface MainScreenProps {
  onPullDown: () => void;
  defaultVoiceId: string;
  setDefaultVoiceId: (id: string) => void;
  visualizerCanvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  isInitializing: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

const StartStopButton: React.FC<{
    isActive: boolean;
    isInitializing: boolean;
    onStart: () => void;
    onStop: () => void;
}> = ({ isActive, isInitializing, onStart, onStop }) => {
    const handleClick = () => {
        if (isActive) {
            onStop();
        } else {
            onStart();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isInitializing}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center
                ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                ${isInitializing ? 'bg-yellow-500 cursor-not-allowed' : ''}
            `}
        >
            {isInitializing ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Initializing...
                </>
            ) : (isActive ? 'Stop AI Voice Changer' : 'Start AI Voice Changer')}
        </button>
    );
};

export const MainScreen: React.FC<MainScreenProps> = ({ 
    onPullDown, 
    defaultVoiceId, 
    setDefaultVoiceId, 
    visualizerCanvasRef,
    isActive,
    isInitializing,
    error,
    onStart,
    onStop
}) => {
  return (
    <div className="absolute inset-0 bg-zinc-900 p-6 flex flex-col text-white z-0">
      <div
        className="absolute top-0 left-0 right-0 h-10 cursor-ns-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          onPullDown();
        }}
        title="Pull down for Quick Settings"
      ></div>

      <div className="text-center pt-10 mb-8">
        <h1 className="text-4xl font-bold text-violet-400">Voice FX</h1>
        <p className="text-zinc-400">Real-time AI Voice Changer</p>
      </div>

      <div className="space-y-6 flex-grow">
        <div>
          <label htmlFor="default-voice" className="block mb-2 text-lg text-zinc-100">
            Default Voice
          </label>
          <select
            id="default-voice"
            value={defaultVoiceId}
            onChange={(e) => setDefaultVoiceId(e.target.value)}
            className="w-full bg-zinc-800 p-4 rounded-lg border border-zinc-700 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none"
          >
            {VOICE_PROFILES.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.icon} {voice.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 border border-zinc-700 rounded-lg bg-zinc-800 space-y-4">
            <h3 className="text-lg text-violet-400 text-center">Test AI Voice</h3>
            <div className="flex justify-center items-center h-24">
                <canvas ref={visualizerCanvasRef} className="w-full h-full" />
            </div>
            <StartStopButton 
                isActive={isActive}
                isInitializing={isInitializing}
                onStart={onStart}
                onStop={onStop}
            />
             {error && <p className="text-xs text-red-400 text-center px-2">{error}</p>}
        </div>
      </div>
      
      <div className="text-center text-xs text-zinc-500 pb-2">
          <p>This is a web simulation of an Android App.</p>
          <p>Pull down from the top to access Quick Settings.</p>
      </div>
    </div>
  );
};