import React, { useState, useCallback, useRef } from 'react';
import { PhoneShell } from './components/PhoneShell';
import { MainScreen } from './components/MainScreen';
import { QuickSettings } from './components/QuickSettings';
import { OverlayControl } from './components/OverlayControl';
import { useVoiceChanger } from './hooks/useVoiceChanger';
import { VOICE_PROFILES } from './constants';
import type { VoiceProfile } from './types';

function App() {
  const [isQuickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [defaultVoiceId, setDefaultVoiceId] = useState(VOICE_PROFILES[0].id);

  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    isActive,
    start,
    stop,
    selectedVoice,
    setSelectedVoice,
    error,
    isInitializing
  } = useVoiceChanger(defaultVoiceId, visualizerCanvasRef);

  const handleTileClick = useCallback(() => {
    setOverlayVisible(prev => !prev);
    setQuickSettingsOpen(false);
  }, []);

  const handleVoiceSelect = (voice: VoiceProfile) => {
    setSelectedVoice(voice);
  };

  const handleStartStop = () => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-zinc-900 font-sans">
      <PhoneShell>
        <div className="relative w-full h-full bg-zinc-900 overflow-hidden">
          <MainScreen
            onPullDown={() => setQuickSettingsOpen(true)}
            defaultVoiceId={defaultVoiceId}
            setDefaultVoiceId={setDefaultVoiceId}
            visualizerCanvasRef={visualizerCanvasRef}
            isActive={isActive}
            isInitializing={isInitializing}
            error={error}
            onStart={start}
            onStop={stop}
          />
          <QuickSettings
            isOpen={isQuickSettingsOpen}
            onClose={() => setQuickSettingsOpen(false)}
            onTileClick={handleTileClick}
            isServiceActive={isActive}
          />
        </div>
      </PhoneShell>
      {isOverlayVisible && (
        <OverlayControl
          voices={VOICE_PROFILES}
          selectedVoice={selectedVoice}
          onVoiceChange={handleVoiceSelect}
          isActive={isActive}
          onStartStop={handleStartStop}
          onClose={() => setOverlayVisible(false)}
          isInitializing={isInitializing}
          error={error}
        />
      )}
    </div>
  );
}

export default App;