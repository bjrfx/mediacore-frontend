import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStatsStore = create(
  persist(
    (set, get) => ({
      // Total listening time in seconds
      totalListeningTime: 0,
      
      // Daily listening time (keyed by date string YYYY-MM-DD)
      dailyListeningTime: {},
      
      // Play counts per track (keyed by track ID)
      trackPlayCounts: {},
      
      // Artist play counts
      artistPlayCounts: {},
      
      // Album play counts  
      albumPlayCounts: {},
      
      // Genre play counts
      genrePlayCounts: {},
      
      // Listening streaks
      currentStreak: 0,
      longestStreak: 0,
      lastListenedDate: null,
      
      // Session tracking
      sessionStartTime: null,
      currentSessionDuration: 0,
      
      // Actions
      
      // Start a listening session
      startSession: () => {
        set({ sessionStartTime: Date.now() });
      },
      
      // Update listening time (called periodically during playback)
      addListeningTime: (seconds) => {
        const today = new Date().toISOString().split('T')[0];
        
        set((state) => {
          const newDailyTime = { ...state.dailyListeningTime };
          newDailyTime[today] = (newDailyTime[today] || 0) + seconds;
          
          return {
            totalListeningTime: state.totalListeningTime + seconds,
            dailyListeningTime: newDailyTime,
          };
        });
        
        // Update streak
        get().updateStreak();
      },
      
      // Record a track play
      recordTrackPlay: (track) => {
        if (!track || !track.id) return;
        
        const today = new Date().toISOString().split('T')[0];
        
        set((state) => {
          // Update track play counts
          const newTrackCounts = { ...state.trackPlayCounts };
          if (!newTrackCounts[track.id]) {
            newTrackCounts[track.id] = {
              count: 0,
              lastPlayed: null,
              trackInfo: {
                id: track.id,
                title: track.title,
                artist: track.artist,
                thumbnail: track.thumbnail,
                duration: track.duration,
                type: track.type,
              },
            };
          }
          newTrackCounts[track.id].count += 1;
          newTrackCounts[track.id].lastPlayed = new Date().toISOString();
          newTrackCounts[track.id].trackInfo = {
            id: track.id,
            title: track.title,
            artist: track.artist,
            thumbnail: track.thumbnail,
            duration: track.duration,
            type: track.type,
          };
          
          // Update artist play counts
          const newArtistCounts = { ...state.artistPlayCounts };
          if (track.artist) {
            if (!newArtistCounts[track.artist]) {
              newArtistCounts[track.artist] = { count: 0, lastPlayed: null };
            }
            newArtistCounts[track.artist].count += 1;
            newArtistCounts[track.artist].lastPlayed = new Date().toISOString();
          }
          
          // Update album play counts
          const newAlbumCounts = { ...state.albumPlayCounts };
          if (track.album) {
            if (!newAlbumCounts[track.album]) {
              newAlbumCounts[track.album] = { 
                count: 0, 
                lastPlayed: null,
                albumInfo: {
                  title: track.album,
                  artist: track.artist,
                  thumbnail: track.albumThumbnail || track.thumbnail,
                },
              };
            }
            newAlbumCounts[track.album].count += 1;
            newAlbumCounts[track.album].lastPlayed = new Date().toISOString();
          }
          
          // Update genre play counts
          const newGenreCounts = { ...state.genrePlayCounts };
          if (track.genre) {
            if (!newGenreCounts[track.genre]) {
              newGenreCounts[track.genre] = { count: 0 };
            }
            newGenreCounts[track.genre].count += 1;
          }
          
          return {
            trackPlayCounts: newTrackCounts,
            artistPlayCounts: newArtistCounts,
            albumPlayCounts: newAlbumCounts,
            genrePlayCounts: newGenreCounts,
          };
        });
      },
      
      // Update listening streak
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastListenedDate, currentStreak, longestStreak } = get();
        
        if (lastListenedDate === today) {
          // Already listened today, no change
          return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak = 1;
        if (lastListenedDate === yesterdayStr) {
          // Continued streak
          newStreak = currentStreak + 1;
        }
        
        set({
          currentStreak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
          lastListenedDate: today,
        });
      },
      
      // Get statistics summary
      getStatsSummary: () => {
        const state = get();
        
        // Total hours listened
        const totalHours = Math.floor(state.totalListeningTime / 3600);
        const totalMinutes = Math.floor((state.totalListeningTime % 3600) / 60);
        
        // Total play count
        const totalPlays = Object.values(state.trackPlayCounts).reduce(
          (sum, track) => sum + track.count,
          0
        );
        
        // Unique tracks played
        const uniqueTracks = Object.keys(state.trackPlayCounts).length;
        
        // Unique artists
        const uniqueArtists = Object.keys(state.artistPlayCounts).length;
        
        return {
          totalHours,
          totalMinutes,
          totalListeningTime: state.totalListeningTime,
          totalPlays,
          uniqueTracks,
          uniqueArtists,
          currentStreak: state.currentStreak,
          longestStreak: state.longestStreak,
        };
      },
      
      // Get top tracks
      getTopTracks: (limit = 10) => {
        const { trackPlayCounts } = get();
        return Object.entries(trackPlayCounts)
          .map(([id, data]) => ({
            id,
            ...data.trackInfo,
            playCount: data.count,
            lastPlayed: data.lastPlayed,
          }))
          .sort((a, b) => b.playCount - a.playCount)
          .slice(0, limit);
      },
      
      // Get top artists
      getTopArtists: (limit = 10) => {
        const { artistPlayCounts } = get();
        return Object.entries(artistPlayCounts)
          .map(([name, data]) => ({
            name,
            playCount: data.count,
            lastPlayed: data.lastPlayed,
          }))
          .sort((a, b) => b.playCount - a.playCount)
          .slice(0, limit);
      },
      
      // Get top genres
      getTopGenres: (limit = 5) => {
        const { genrePlayCounts } = get();
        return Object.entries(genrePlayCounts)
          .map(([name, data]) => ({
            name,
            playCount: data.count,
          }))
          .sort((a, b) => b.playCount - a.playCount)
          .slice(0, limit);
      },
      
      // Get listening time for a specific period
      getListeningTimeForPeriod: (days = 7) => {
        const { dailyListeningTime } = get();
        const result = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          result.push({
            date: dateStr,
            displayDate: date.toLocaleDateString('en-US', { weekday: 'short' }),
            seconds: dailyListeningTime[dateStr] || 0,
            minutes: Math.floor((dailyListeningTime[dateStr] || 0) / 60),
          });
        }
        
        return result;
      },
      
      // Get recent activity summary
      getRecentActivity: () => {
        const { trackPlayCounts } = get();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        let playsToday = 0;
        let playsThisWeek = 0;
        
        Object.values(trackPlayCounts).forEach((data) => {
          if (data.lastPlayed >= oneDayAgo) {
            playsToday += 1;
          }
          if (data.lastPlayed >= oneWeekAgo) {
            playsThisWeek += 1;
          }
        });
        
        return { playsToday, playsThisWeek };
      },
      
      // Clear all stats
      clearStats: () => {
        set({
          totalListeningTime: 0,
          dailyListeningTime: {},
          trackPlayCounts: {},
          artistPlayCounts: {},
          albumPlayCounts: {},
          genrePlayCounts: {},
          currentStreak: 0,
          longestStreak: 0,
          lastListenedDate: null,
        });
      },
    }),
    {
      name: 'stats-storage',
      partialize: (state) => ({
        totalListeningTime: state.totalListeningTime,
        dailyListeningTime: state.dailyListeningTime,
        trackPlayCounts: state.trackPlayCounts,
        artistPlayCounts: state.artistPlayCounts,
        albumPlayCounts: state.albumPlayCounts,
        genrePlayCounts: state.genrePlayCounts,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastListenedDate: state.lastListenedDate,
      }),
    }
  )
);

export default useStatsStore;
