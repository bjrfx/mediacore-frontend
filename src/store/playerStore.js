import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePlayerStore = create(
  persist(
    (set, get) => ({
      // Current playing track
      currentTrack: null,
      queue: [],
      queueIndex: 0,

      // Playback state
      isPlaying: false,
      isLoading: false,
      duration: 0,
      currentTime: 0,
      volume: 0.8,
      isMuted: false,
      isShuffled: false,
      repeatMode: 'off', // 'off', 'all', 'one'
      playbackSpeed: 1,

      // Video-specific state
      isVideoMode: true, // true = show video, false = audio only mode
      isFullscreen: false,
      showControls: true,
      buffered: 0,
      quality: 'auto',
      isPiP: false,

      // UI state
      isExpanded: false,
      isMiniPlayerVisible: false,

      // Actions
      setCurrentTrack: (track) => {
        set({
          currentTrack: track,
          isMiniPlayerVisible: !!track,
          isLoading: true,
          currentTime: 0,
          duration: 0,
          // Auto set video mode based on track type
          isVideoMode: track?.type === 'video',
        });
        // Add to history
        if (track) {
          get().addToHistory(track);
        }
      },

      setQueue: (queue, startIndex = 0) => {
        set({
          queue,
          queueIndex: startIndex,
          currentTrack: queue[startIndex] || null,
          isMiniPlayerVisible: queue.length > 0,
        });
      },

      playTrack: (track, queue = null) => {
        if (queue) {
          const index = queue.findIndex((t) => t.id === track.id);
          set({
            queue,
            queueIndex: index >= 0 ? index : 0,
            currentTrack: track,
            isPlaying: true,
            isMiniPlayerVisible: true,
          });
        } else {
          set({
            currentTrack: track,
            isPlaying: true,
            isMiniPlayerVisible: true,
          });
        }
        if (track) {
          get().addToHistory(track);
        }
      },

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),

      playNext: () => {
        const { queue, queueIndex, repeatMode, isShuffled } = get();
        if (queue.length === 0) return;

        let nextIndex;
        if (repeatMode === 'one') {
          nextIndex = queueIndex;
        } else if (isShuffled) {
          nextIndex = Math.floor(Math.random() * queue.length);
        } else {
          nextIndex = queueIndex + 1;
          if (nextIndex >= queue.length) {
            nextIndex = repeatMode === 'all' ? 0 : queueIndex;
          }
        }

        const nextTrack = queue[nextIndex];
        if (nextTrack) {
          set({
            queueIndex: nextIndex,
            currentTrack: nextTrack,
            isPlaying: true,
          });
          get().addToHistory(nextTrack);
        }
      },

      playPrevious: () => {
        const { queue, queueIndex, currentTime } = get();
        if (queue.length === 0) return;

        // If more than 3 seconds into the track, restart it
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }

        const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
        const prevTrack = queue[prevIndex];
        if (prevTrack) {
          set({
            queueIndex: prevIndex,
            currentTrack: prevTrack,
            isPlaying: true,
          });
        }
      },

      setDuration: (duration) => set({ duration }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setBuffered: (buffered) => set({ buffered }),

      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () =>
        set((state) => ({
          isMuted: !state.isMuted,
        })),

      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
      
      toggleRepeat: () =>
        set((state) => {
          const modes = ['off', 'all', 'one'];
          const currentIndex = modes.indexOf(state.repeatMode);
          const nextIndex = (currentIndex + 1) % modes.length;
          return { repeatMode: modes[nextIndex] };
        }),

      // Video-specific actions
      setVideoMode: (isVideoMode) => set({ isVideoMode }),
      toggleVideoMode: () => set((state) => ({ isVideoMode: !state.isVideoMode })),
      setFullscreen: (isFullscreen) => set({ isFullscreen }),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      setShowControls: (showControls) => set({ showControls }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      setQuality: (quality) => set({ quality }),
      setPiP: (isPiP) => set({ isPiP }),

      setExpanded: (expanded) => set({ isExpanded: expanded }),
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),

      closeMiniPlayer: () =>
        set({
          currentTrack: null,
          isPlaying: false,
          isMiniPlayerVisible: false,
          queue: [],
          queueIndex: 0,
        }),

      // History
      history: [],
      addToHistory: (track) => {
        set((state) => {
          const filteredHistory = state.history.filter((t) => t.id !== track.id);
          return {
            history: [
              { ...track, playedAt: new Date().toISOString() },
              ...filteredHistory,
            ].slice(0, 100),
          };
        });
      },
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'player-storage',
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        isShuffled: state.isShuffled,
        repeatMode: state.repeatMode,
        history: state.history,
      }),
    }
  )
);

export default usePlayerStore;
