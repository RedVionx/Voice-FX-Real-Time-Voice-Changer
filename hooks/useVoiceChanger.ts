import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { VOICE_PROFILES } from '../constants';
import type { VoiceProfile } from '../types';

// Audio Encoding/Decoding Helpers
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  // FIX: Corrected typo from dataInt116 to dataInt16
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const useVoiceChanger = (
  defaultVoiceId: string,
  canvasRef: React.RefObject<HTMLCanvasElement>
) => {
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialProfile = VOICE_PROFILES.find(p => p.id === defaultVoiceId) || VOICE_PROFILES[0];
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(initialProfile);

  // Refs for audio processing and API session
  const aiRef = useRef<GoogleGenAI | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    // Initialize GoogleGenAI instance
    if (!aiRef.current) {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }, []);

  const stop = useCallback(() => {
    // Stop visualizer
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (canvasRef.current) {
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx) {
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }

    // Stop microphone stream
    streamRef.current?.getTracks().forEach(track => track.stop());
    
    // Disconnect audio nodes
    sourceNodeRef.current?.disconnect();
    if(scriptNodeRef.current) {
      scriptNodeRef.current.onaudioprocess = null;
      scriptNodeRef.current.disconnect();
    }
    analyserNodeRef.current?.disconnect();

    // Close session and audio contexts
    sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
    inputAudioContextRef.current?.close().catch(console.error);
    outputAudioContextRef.current?.close().catch(console.error);

    // Stop any playing audio from AI
    outputSourcesRef.current.forEach(source => source.stop());
    outputSourcesRef.current.clear();

    // Reset refs
    sourceNodeRef.current = null;
    scriptNodeRef.current = null;
    analyserNodeRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    streamRef.current = null;
    sessionPromiseRef.current = null;
    
    // Reset state
    setIsActive(false);
    setError(null);
    nextStartTimeRef.current = 0;
  }, [canvasRef]);

  const start = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    stop();

    try {
      if (!aiRef.current) {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputCtx;
      
      const sourceNode = inputCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      const scriptNode = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptNodeRef.current = scriptNode;

      const analyserNode = inputCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNodeRef.current = analyserNode;
      
      sourceNode.connect(analyserNode);
      analyserNode.connect(scriptNode);
      scriptNode.connect(inputCtx.destination);
      
      const visualizer = () => {
        if (!analyserNodeRef.current || !canvasRef.current) {
            return;
        }
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        const bufferLength = analyserNodeRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        analyserNodeRef.current.getByteTimeDomainData(dataArray);

        if (canvasCtx) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(167, 139, 250)'; // violet-400
            canvasCtx.beginPath();
            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        }
        animationFrameIdRef.current = requestAnimationFrame(visualizer);
      };

      sessionPromiseRef.current = aiRef.current.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            scriptNode.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString =
              message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && outputCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const audioBuffer = await decodeAudioData(
                    decode(base64EncodedAudioString),
                    outputCtx,
                    24000,
                    1,
                );
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.addEventListener('ended', () => {
                    outputSourcesRef.current.delete(source);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                outputSourcesRef.current.add(source);
            }
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
                for (const source of outputSourcesRef.current.values()) {
                    source.stop();
                    outputSourcesRef.current.delete(source);
                }
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setError(`Session error: ${e.message || 'An unknown error occurred'}`);
            stop();
          },
          onclose: (e: CloseEvent) => {
            // Can be called on stop(), so don't call stop() again here to avoid infinite loop
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are a voice changer. Your goal is to repeat what I say in the voice of ${selectedVoice.name}. Do not add any extra words. Just repeat my words in the specified voice.`,
        },
      });
      
      setIsActive(true);
      animationFrameIdRef.current = requestAnimationFrame(visualizer);

    } catch (e: any) {
      console.error('Failed to start voice changer:', e);
      setError(e.message || 'An unknown error occurred.');
      stop();
    } finally {
      setIsInitializing(false);
    }
  }, [stop, canvasRef, selectedVoice]);

  useEffect(() => {
    // This effect handles changing the voice while the service is active.
    if (isActive) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoice]);

  return {
    isActive,
    isInitializing,
    error,
    selectedVoice,
    setSelectedVoice,
    start,
    stop,
  };
};
