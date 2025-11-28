import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  Maximize2,
  ListMusic,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import { cn, formatDuration, generateGradient } from '../../lib/utils';
import { usePlayerStore, useLibraryStore } from '../../store';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';

function MiniPlayer() {
  const playerRef = useRef(null);
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const {
    currentTrack,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    isExpanded,
    isMiniPlayerVisible,
    togglePlay,
    playNext,
    playPrevious,
    setDuration,
    setCurrentTime,
    setIsLoading,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setExpanded,
  } = usePlayerStore();

  const { toggleFavorite, isFavorite } = useLibraryStore();

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            playNext();
          } else {
            const newTime = Math.min(currentTime + 10, duration);
            playerRef.current?.seekTo(newTime, 'seconds');
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            playPrevious();
          } else {
            const newTime = Math.max(currentTime - 10, 0);
            playerRef.current?.seekTo(newTime, 'seconds');
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(volume - 0.1, 0));
          break;
        case 'KeyM':
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, volume, togglePlay, playNext, playPrevious, setVolume, toggleMute]);

  const handleProgress = useCallback(
    (state) => {
      if (!seeking) {
        setCurrentTime(state.playedSeconds);
      }
    },
    [seeking, setCurrentTime]
  );

  const handleDuration = useCallback(
    (dur) => {
      setDuration(dur);
    },
    [setDuration]
  );

  const handleSeekStart = () => {
    setSeeking(true);
  };

  const handleSeekChange = (value) => {
    setSeekValue(value[0]);
  };

  const handleSeekEnd = (value) => {
    setSeeking(false);
    const seekTime = (value[0] / 100) * duration;
    playerRef.current?.seekTo(seekTime, 'seconds');
    setCurrentTime(seekTime);
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      playerRef.current?.seekTo(0);
    } else {
      playNext();
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const isLiked = currentTrack ? isFavorite(currentTrack.id) : false;

  if (!isMiniPlayerVisible || !currentTrack) return null;

  // Single shared player - always rendered, position changes based on view
  const AudioPlayer = (
    <ReactPlayer
      ref={playerRef}
      url={currentTrack.fileUrl}
      playing={isPlaying}
      volume={isMuted ? 0 : volume}
      onProgress={handleProgress}
      onDuration={handleDuration}
      onEnded={handleEnded}
      onReady={() => setIsLoading(false)}
      onBuffer={() => setIsLoading(true)}
      onBufferEnd={() => setIsLoading(false)}
      width="0"
      height="0"
      progressInterval={500}
      config={{
        file: {
          forceAudio: currentTrack.type === 'audio',
        }
      }}
      style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
    />
  );

  // Expanded full-screen player
  if (isExpanded) {
    return (
      <>
        {/* Hidden audio player - persists across view changes */}
        <div className="fixed" style={{ top: -9999, left: -9999 }}>
          {AudioPlayer}
        </div>
        
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-gradient-to-b from-zinc-900 to-black flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(false)}
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Now Playing
            </span>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-6 w-6" />
            </Button>
          </div>

          {/* Album art */}
          <div className="flex-1 flex items-center justify-center px-8 py-4">
            <div
              className={cn(
                'w-64 h-64 md:w-80 md:h-80 rounded-lg shadow-2xl overflow-hidden',
                !currentTrack.thumbnail && `bg-gradient-to-br ${generateGradient(currentTrack.id)}`
              )}
            >
              {currentTrack.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ListMusic className="w-24 h-24 text-white/50" />
                </div>
              )}
            </div>
          </div>

          {/* Track info */}
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
                <p className="text-muted-foreground truncate">{currentTrack.subtitle || 'Unknown artist'}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(currentTrack)}
              >
                <Heart
                  className={cn('h-6 w-6', isLiked && 'fill-primary text-primary')}
                />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-8 py-2">
            <Slider
              value={[seeking ? seekValue : progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeekChange}
              onPointerDown={handleSeekStart}
              onValueCommit={handleSeekEnd}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 px-8 py-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleShuffle}
              className={cn(isShuffled && 'text-primary')}
            >
              <Shuffle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="iconLg" onClick={playPrevious}>
              <SkipBack className="h-8 w-8" />
            </Button>
            <Button
              variant="spotify"
              size="iconLg"
              onClick={togglePlay}
              className="h-16 w-16"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
            <Button variant="ghost" size="iconLg" onClick={playNext}>
              <SkipForward className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRepeat}
              className={cn(repeatMode !== 'off' && 'text-primary')}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="h-5 w-5" />
              ) : (
                <Repeat className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Volume (desktop) */}
          <div className="hidden md:flex items-center justify-center gap-4 px-8 pb-8">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="w-32"
            />
          </div>
        </motion.div>
      </>
    );
  }

  // Mini player bar
  return (
    <>
      {/* Hidden audio player - persists across view changes */}
      <div className="fixed" style={{ top: -9999, left: -9999 }}>
        {AudioPlayer}
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="mini-player flex items-center px-4 gap-4"
      >
        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Track info */}
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(true)}
        >
          <div
            className={cn(
              'w-14 h-14 rounded-md overflow-hidden shrink-0',
              !currentTrack.thumbnail && `bg-gradient-to-br ${generateGradient(currentTrack.id)}`
            )}
          >
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ListMusic className="w-6 h-6 text-white/50" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate hover:underline">
              {currentTrack.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentTrack.subtitle || 'Unknown'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentTrack);
            }}
            className="hidden sm:flex"
          >
            <Heart
              className={cn('h-4 w-4', isLiked && 'fill-primary text-primary')}
            />
          </Button>
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={toggleShuffle}
                  className={cn('hidden md:flex', isShuffled && 'text-primary')}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Shuffle</TooltipContent>
            </Tooltip>

            <Button variant="ghost" size="icon" onClick={playPrevious}>
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="spotify"
              size="icon"
              onClick={togglePlay}
              className="rounded-full"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button variant="ghost" size="icon" onClick={playNext}>
              <SkipForward className="h-5 w-5" />
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={toggleRepeat}
                  className={cn('hidden md:flex', repeatMode !== 'off' && 'text-primary')}
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="h-4 w-4" />
                  ) : (
                    <Repeat className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {repeatMode === 'off' ? 'Enable repeat' : repeatMode === 'all' ? 'Repeat one' : 'Disable repeat'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-2 w-48 justify-end">
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatDuration(currentTime)}
          </span>
          <Slider
            value={[seeking ? seekValue : progress]}
            max={100}
            step={0.1}
            onValueChange={handleSeekChange}
            onPointerDown={handleSeekStart}
            onValueCommit={handleSeekEnd}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground w-10">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Volume */}
        <div className="hidden lg:flex items-center gap-2 w-32">
          <Button variant="ghost" size="iconSm" onClick={toggleMute}>
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0] / 100)}
            className="w-20"
          />
        </div>

        {/* Expand button */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setExpanded(true)}
          className="hidden sm:flex"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </motion.div>
    </>
  );
}

export default memo(MiniPlayer);
