import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Pause, Play, Trash2, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Audio visualizer bars
const AudioVisualizer = ({ isRecording, audioData }) => {
  const bars = 20;
  
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const height = isRecording
          ? audioData?.[i] || Math.random() * 100
          : 20;
        
        return (
          <motion.div
            key={i}
            className={cn(
              'w-1 rounded-full transition-colors',
              isRecording ? 'bg-red-500' : 'bg-muted-foreground/30'
            )}
            animate={{
              height: `${Math.max(8, height * 0.6)}px`,
            }}
            transition={{
              duration: 0.1,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
};

// Waveform display for recorded audio
const Waveform = ({ audioUrl, currentTime, duration, isPlaying }) => {
  const [waveformData, setWaveformData] = useState([]);
  const canvasRef = useRef(null);
  
  useEffect(() => {
    // Generate fake waveform data for visual effect
    // In production, you'd analyze the actual audio
    const data = Array.from({ length: 50 }, () => Math.random() * 0.8 + 0.2);
    setWaveformData(data);
  }, [audioUrl]);
  
  const progress = duration > 0 ? currentTime / duration : 0;
  
  return (
    <div className="relative h-12 w-full flex items-center gap-0.5">
      {waveformData.map((value, i) => {
        const isPlayed = i / waveformData.length <= progress;
        return (
          <motion.div
            key={i}
            className={cn(
              'flex-1 rounded-full transition-colors duration-150',
              isPlayed ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
            style={{ height: `${value * 100}%` }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.01 }}
          />
        );
      })}
    </div>
  );
};

export default function AudioRecorder({ onSave, onCancel, existingAudio }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(existingAudio?.url || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(existingAudio?.duration || 0);
  const [audioData, setAudioData] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioUrl && !existingAudio) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl, existingAudio]);
  
  // Audio analysis for visualizer
  const startAnalyzer = useCallback((stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyzer = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyzer.fftSize = 64;
    source.connect(analyzer);
    analyzerRef.current = analyzer;
    
    const updateVisualization = () => {
      if (!isRecording) return;
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(dataArray);
      setAudioData(Array.from(dataArray));
      
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };
    
    updateVisualization();
  }, [isRecording]);
  
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Get duration
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start visualizer
      startAnalyzer(stream);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };
  
  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsRecording(false);
      setIsPaused(false);
    }
  };
  
  // Play/pause recorded audio
  const togglePlayback = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.ontimeupdate = () => {
        setPlaybackTime(audioRef.current.currentTime);
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  // Delete recording
  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl && !existingAudio) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setPlaybackTime(0);
    setDuration(0);
    setIsPlaying(false);
    setRecordingTime(0);
  };
  
  // Save recording
  const handleSave = () => {
    if (audioBlob) {
      onSave?.(audioBlob, duration);
    }
  };
  
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!audioUrl ? (
          // Recording UI
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Visualizer */}
            <AudioVisualizer isRecording={isRecording} audioData={audioData} />
            
            {/* Time display */}
            <div className="text-center">
              <motion.span
                className={cn(
                  'text-3xl font-mono font-medium',
                  isRecording && 'text-red-500'
                )}
                animate={{ opacity: isRecording && !isPaused ? [1, 0.5] : 1 }}
                transition={{ duration: 0.5, repeat: isRecording && !isPaused ? Infinity : 0, repeatType: 'reverse' }}
              >
                {formatTime(recordingTime)}
              </motion.span>
              {isRecording && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground mt-1"
                >
                  {isPaused ? 'Paused' : 'Recording...'}
                </motion.p>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"
                >
                  <Mic className="w-7 h-7 text-white" />
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={pauseRecording}
                    className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                  >
                    {isPaused ? (
                      <Play className="w-5 h-5 ml-0.5" />
                    ) : (
                      <Pause className="w-5 h-5" />
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"
                  >
                    <Square className="w-6 h-6 text-white fill-white" />
                  </motion.button>
                </>
              )}
            </div>
            
            {/* Cancel button */}
            <div className="text-center">
              <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          // Playback UI
          <motion.div
            key="playback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Waveform */}
            <div className="p-4 rounded-xl bg-secondary/30">
              <Waveform
                audioUrl={audioUrl}
                currentTime={playbackTime}
                duration={duration}
                isPlaying={isPlaying}
              />
              
              {/* Time indicators */}
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{formatTime(playbackTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* Playback controls */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={deleteRecording}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlayback}
                className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Check className="w-4 h-4 text-primary-foreground" />
              </motion.button>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={deleteRecording}>
                Re-record
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact audio player for viewing entries
export function AudioPlayer({ audioUrl, duration, name }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const togglePlayback = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current.currentTime);
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 cursor-pointer"
      onClick={togglePlayback}
    >
      <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
        {isPlaying ? (
          <Pause className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name || 'Voice Recording'}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
