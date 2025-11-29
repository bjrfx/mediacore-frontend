import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Journal Entry Schema
// {
//   id: string,
//   title: string,
//   content: string (HTML from rich editor),
//   plainText: string (for search),
//   mood: { value: number (0-100), emotions: string[] },
//   media: [{ id, type: 'image'|'audio', url, name, size, duration? }],
//   location: { name, lat, lng } | null,
//   createdAt: ISO string,
//   updatedAt: ISO string,
//   isDraft: boolean,
// }

const STORAGE_KEY = 'mediacore-journal';

// Generate unique ID
const generateId = () => `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// IndexedDB helpers for media blobs
const DB_NAME = 'MediaCoreJournalDB';
const DB_VERSION = 1;
const MEDIA_STORE = 'journalMedia';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      }
    };
  });
};

const saveMediaToDB = async (id, blob, metadata) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDIA_STORE], 'readwrite');
    const store = transaction.objectStore(MEDIA_STORE);
    const request = store.put({ id, blob, ...metadata });
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const getMediaFromDB = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDIA_STORE], 'readonly');
    const store = transaction.objectStore(MEDIA_STORE);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const deleteMediaFromDB = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDIA_STORE], 'readwrite');
    const store = transaction.objectStore(MEDIA_STORE);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const useJournalStore = create(
  persist(
    (set, get) => ({
      // State
      entries: [],
      currentDraft: null,
      isLoading: false,
      searchQuery: '',
      filterMood: null, // 'positive' | 'neutral' | 'negative' | null
      sortBy: 'newest', // 'newest' | 'oldest'
      
      // Computed
      getEntry: (id) => get().entries.find(e => e.id === id),
      
      getFilteredEntries: () => {
        const { entries, searchQuery, filterMood, sortBy } = get();
        
        let filtered = [...entries].filter(e => !e.isDraft);
        
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(e => 
            e.title?.toLowerCase().includes(query) ||
            e.plainText?.toLowerCase().includes(query) ||
            e.mood?.emotions?.some(em => em.toLowerCase().includes(query))
          );
        }
        
        // Mood filter
        if (filterMood) {
          filtered = filtered.filter(e => {
            const moodValue = e.mood?.value ?? 50;
            if (filterMood === 'positive') return moodValue >= 60;
            if (filterMood === 'negative') return moodValue <= 40;
            return moodValue > 40 && moodValue < 60;
          });
        }
        
        // Sort
        filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });
        
        return filtered;
      },
      
      getDrafts: () => get().entries.filter(e => e.isDraft),
      
      // Actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterMood: (mood) => set({ filterMood: mood }),
      setSortBy: (sort) => set({ sortBy: sort }),
      
      // Create new entry or draft
      createEntry: (data = {}) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const newEntry = {
          id,
          title: '',
          content: '',
          plainText: '',
          mood: { value: 50, emotions: [] },
          media: [],
          location: null,
          createdAt: now,
          updatedAt: now,
          isDraft: true,
          ...data,
        };
        
        set(state => ({
          entries: [newEntry, ...state.entries],
          currentDraft: newEntry,
        }));
        
        return newEntry;
      },
      
      // Update entry
      updateEntry: (id, updates) => {
        const now = new Date().toISOString();
        
        set(state => ({
          entries: state.entries.map(entry =>
            entry.id === id
              ? { ...entry, ...updates, updatedAt: now }
              : entry
          ),
          currentDraft: state.currentDraft?.id === id
            ? { ...state.currentDraft, ...updates, updatedAt: now }
            : state.currentDraft,
        }));
      },
      
      // Save draft as entry (publish)
      publishEntry: (id) => {
        get().updateEntry(id, { isDraft: false });
        set({ currentDraft: null });
      },
      
      // Delete entry
      deleteEntry: async (id) => {
        const entry = get().getEntry(id);
        
        // Clean up media from IndexedDB
        if (entry?.media?.length) {
          for (const media of entry.media) {
            try {
              await deleteMediaFromDB(media.id);
            } catch (e) {
              console.error('Error deleting media:', e);
            }
          }
        }
        
        set(state => ({
          entries: state.entries.filter(e => e.id !== id),
          currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
        }));
      },
      
      // Set current draft for editing
      setCurrentDraft: (entry) => set({ currentDraft: entry }),
      clearCurrentDraft: () => set({ currentDraft: null }),
      
      // Auto-save draft (debounced in component)
      autoSaveDraft: (id, updates) => {
        get().updateEntry(id, updates);
      },
      
      // Media management
      addMedia: async (entryId, file, type) => {
        const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          // Save blob to IndexedDB
          await saveMediaToDB(mediaId, file, {
            name: file.name || `Recording ${new Date().toLocaleTimeString()}`,
            type,
            size: file.size,
            mimeType: file.type,
          });
          
          // Create object URL for preview
          const url = URL.createObjectURL(file);
          
          const mediaItem = {
            id: mediaId,
            type,
            url,
            name: file.name || `Recording ${new Date().toLocaleTimeString()}`,
            size: file.size,
          };
          
          // If audio, try to get duration
          if (type === 'audio') {
            const audio = new Audio(url);
            await new Promise(resolve => {
              audio.onloadedmetadata = () => {
                mediaItem.duration = audio.duration;
                resolve();
              };
              audio.onerror = resolve;
            });
          }
          
          set(state => ({
            entries: state.entries.map(entry =>
              entry.id === entryId
                ? { ...entry, media: [...entry.media, mediaItem], updatedAt: new Date().toISOString() }
                : entry
            ),
            currentDraft: state.currentDraft?.id === entryId
              ? { ...state.currentDraft, media: [...state.currentDraft.media, mediaItem] }
              : state.currentDraft,
          }));
          
          return mediaItem;
        } catch (error) {
          console.error('Error adding media:', error);
          throw error;
        }
      },
      
      removeMedia: async (entryId, mediaId) => {
        try {
          await deleteMediaFromDB(mediaId);
        } catch (e) {
          console.error('Error deleting media from DB:', e);
        }
        
        set(state => ({
          entries: state.entries.map(entry =>
            entry.id === entryId
              ? { ...entry, media: entry.media.filter(m => m.id !== mediaId), updatedAt: new Date().toISOString() }
              : entry
          ),
          currentDraft: state.currentDraft?.id === entryId
            ? { ...state.currentDraft, media: state.currentDraft.media.filter(m => m.id !== mediaId) }
            : state.currentDraft,
        }));
      },
      
      // Get media blob from IndexedDB
      getMediaBlob: async (mediaId) => {
        try {
          const data = await getMediaFromDB(mediaId);
          return data?.blob;
        } catch (error) {
          console.error('Error getting media blob:', error);
          return null;
        }
      },
      
      // Location
      setLocation: (entryId, location) => {
        get().updateEntry(entryId, { location });
      },
      
      // Stats
      getStats: () => {
        const entries = get().entries.filter(e => !e.isDraft);
        const totalEntries = entries.length;
        
        // Entries per month (last 6 months)
        const monthlyEntries = {};
        const now = new Date();
        for (let i = 0; i < 6; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          monthlyEntries[key] = 0;
        }
        
        entries.forEach(entry => {
          const date = new Date(entry.createdAt);
          const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (monthlyEntries[key] !== undefined) {
            monthlyEntries[key]++;
          }
        });
        
        // Average mood
        const avgMood = entries.length
          ? entries.reduce((sum, e) => sum + (e.mood?.value ?? 50), 0) / entries.length
          : 50;
        
        // Most used emotions
        const emotionCounts = {};
        entries.forEach(entry => {
          entry.mood?.emotions?.forEach(emotion => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
          });
        });
        
        const topEmotions = Object.entries(emotionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([emotion, count]) => ({ emotion, count }));
        
        // Streak calculation
        const sortedDates = [...new Set(
          entries.map(e => new Date(e.createdAt).toDateString())
        )].sort((a, b) => new Date(b) - new Date(a));
        
        let currentStreak = 0;
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (const dateStr of sortedDates) {
          const date = new Date(dateStr);
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - currentStreak);
          
          if (date.toDateString() === expectedDate.toDateString()) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        return {
          totalEntries,
          monthlyEntries,
          avgMood: Math.round(avgMood),
          topEmotions,
          currentStreak,
        };
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        entries: state.entries,
        sortBy: state.sortBy,
      }),
    }
  )
);

export default useJournalStore;
