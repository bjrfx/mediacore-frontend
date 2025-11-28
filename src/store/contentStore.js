import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Content store for Artists, Albums, and organizing media
// This stores relationships locally and can be synced with backend when available

const useContentStore = create(
  persist(
    (set, get) => ({
      // Artists
      artists: [],
      
      // Albums
      albums: [],
      
      // Media-to-Artist/Album mappings
      mediaArtistMap: {}, // { mediaId: artistId }
      mediaAlbumMap: {}, // { mediaId: albumId }
      
      // ============================================
      // ARTIST ACTIONS
      // ============================================
      
      addArtist: (artist) => {
        const newArtist = {
          id: artist.id || `artist_${Date.now()}`,
          name: artist.name,
          bio: artist.bio || '',
          image: artist.image || null,
          genre: artist.genre || '',
          website: artist.website || '',
          socialLinks: artist.socialLinks || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          artists: [...state.artists, newArtist],
        }));
        return newArtist;
      },
      
      updateArtist: (id, updates) => {
        set((state) => ({
          artists: state.artists.map((artist) =>
            artist.id === id
              ? { ...artist, ...updates, updatedAt: new Date().toISOString() }
              : artist
          ),
        }));
      },
      
      deleteArtist: (id) => {
        const { albums, mediaArtistMap, mediaAlbumMap } = get();
        
        // Get all albums by this artist
        const artistAlbums = albums.filter((album) => album.artistId === id);
        const albumIds = artistAlbums.map((a) => a.id);
        
        // Remove media mappings for this artist
        const newMediaArtistMap = { ...mediaArtistMap };
        const newMediaAlbumMap = { ...mediaAlbumMap };
        
        Object.keys(newMediaArtistMap).forEach((mediaId) => {
          if (newMediaArtistMap[mediaId] === id) {
            delete newMediaArtistMap[mediaId];
          }
        });
        
        // Remove media mappings for artist's albums
        Object.keys(newMediaAlbumMap).forEach((mediaId) => {
          if (albumIds.includes(newMediaAlbumMap[mediaId])) {
            delete newMediaAlbumMap[mediaId];
          }
        });
        
        set((state) => ({
          artists: state.artists.filter((artist) => artist.id !== id),
          albums: state.albums.filter((album) => album.artistId !== id),
          mediaArtistMap: newMediaArtistMap,
          mediaAlbumMap: newMediaAlbumMap,
        }));
      },
      
      getArtist: (id) => {
        return get().artists.find((artist) => artist.id === id);
      },
      
      getArtistByName: (name) => {
        return get().artists.find(
          (artist) => artist.name.toLowerCase() === name.toLowerCase()
        );
      },
      
      // ============================================
      // ALBUM ACTIONS
      // ============================================
      
      addAlbum: (album) => {
        const newAlbum = {
          id: album.id || `album_${Date.now()}`,
          title: album.title,
          artistId: album.artistId,
          description: album.description || '',
          coverImage: album.coverImage || null,
          releaseDate: album.releaseDate || null,
          genre: album.genre || '',
          type: album.type || 'album', // 'album', 'single', 'ep', 'compilation'
          trackOrder: album.trackOrder || [], // Array of mediaIds in order
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          albums: [...state.albums, newAlbum],
        }));
        return newAlbum;
      },
      
      updateAlbum: (id, updates) => {
        set((state) => ({
          albums: state.albums.map((album) =>
            album.id === id
              ? { ...album, ...updates, updatedAt: new Date().toISOString() }
              : album
          ),
        }));
      },
      
      deleteAlbum: (id) => {
        const { mediaAlbumMap } = get();
        
        // Remove media mappings for this album
        const newMediaAlbumMap = { ...mediaAlbumMap };
        Object.keys(newMediaAlbumMap).forEach((mediaId) => {
          if (newMediaAlbumMap[mediaId] === id) {
            delete newMediaAlbumMap[mediaId];
          }
        });
        
        set((state) => ({
          albums: state.albums.filter((album) => album.id !== id),
          mediaAlbumMap: newMediaAlbumMap,
        }));
      },
      
      getAlbum: (id) => {
        return get().albums.find((album) => album.id === id);
      },
      
      getAlbumsByArtist: (artistId) => {
        return get().albums.filter((album) => album.artistId === artistId);
      },
      
      // ============================================
      // MEDIA MAPPING ACTIONS
      // ============================================
      
      assignMediaToArtist: (mediaId, artistId) => {
        set((state) => ({
          mediaArtistMap: {
            ...state.mediaArtistMap,
            [mediaId]: artistId,
          },
        }));
      },
      
      assignMediaToAlbum: (mediaId, albumId) => {
        const album = get().getAlbum(albumId);
        if (album) {
          // Also assign to artist
          set((state) => ({
            mediaAlbumMap: {
              ...state.mediaAlbumMap,
              [mediaId]: albumId,
            },
            mediaArtistMap: {
              ...state.mediaArtistMap,
              [mediaId]: album.artistId,
            },
          }));
          
          // Add to track order if not already there
          if (!album.trackOrder.includes(mediaId)) {
            get().updateAlbum(albumId, {
              trackOrder: [...album.trackOrder, mediaId],
            });
          }
        }
      },
      
      removeMediaFromArtist: (mediaId) => {
        set((state) => {
          const newMap = { ...state.mediaArtistMap };
          delete newMap[mediaId];
          return { mediaArtistMap: newMap };
        });
      },
      
      removeMediaFromAlbum: (mediaId) => {
        const { mediaAlbumMap } = get();
        const albumId = mediaAlbumMap[mediaId];
        
        if (albumId) {
          const album = get().getAlbum(albumId);
          if (album) {
            // Remove from track order
            get().updateAlbum(albumId, {
              trackOrder: album.trackOrder.filter((id) => id !== mediaId),
            });
          }
        }
        
        set((state) => {
          const newMap = { ...state.mediaAlbumMap };
          delete newMap[mediaId];
          return { mediaAlbumMap: newMap };
        });
      },
      
      getArtistForMedia: (mediaId) => {
        const artistId = get().mediaArtistMap[mediaId];
        return artistId ? get().getArtist(artistId) : null;
      },
      
      getAlbumForMedia: (mediaId) => {
        const albumId = get().mediaAlbumMap[mediaId];
        return albumId ? get().getAlbum(albumId) : null;
      },
      
      getMediaByArtist: (artistId) => {
        const { mediaArtistMap } = get();
        return Object.entries(mediaArtistMap)
          .filter(([_, aId]) => aId === artistId)
          .map(([mediaId]) => mediaId);
      },
      
      getMediaByAlbum: (albumId) => {
        const album = get().getAlbum(albumId);
        return album ? album.trackOrder : [];
      },
      
      // Reorder tracks in album
      reorderAlbumTracks: (albumId, newOrder) => {
        get().updateAlbum(albumId, { trackOrder: newOrder });
      },
      
      // Bulk assign media to album
      bulkAssignToAlbum: (mediaIds, albumId) => {
        const album = get().getAlbum(albumId);
        if (!album) return;
        
        const updates = {};
        mediaIds.forEach((mediaId) => {
          updates[mediaId] = albumId;
        });
        
        set((state) => ({
          mediaAlbumMap: { ...state.mediaAlbumMap, ...updates },
          mediaArtistMap: {
            ...state.mediaArtistMap,
            ...mediaIds.reduce((acc, id) => ({ ...acc, [id]: album.artistId }), {}),
          },
        }));
        
        // Add to track order
        const newTrackOrder = [...new Set([...album.trackOrder, ...mediaIds])];
        get().updateAlbum(albumId, { trackOrder: newTrackOrder });
      },
      
      // ============================================
      // SEARCH & FILTERING
      // ============================================
      
      searchArtists: (query) => {
        const q = query.toLowerCase();
        return get().artists.filter(
          (artist) =>
            artist.name.toLowerCase().includes(q) ||
            artist.bio?.toLowerCase().includes(q) ||
            artist.genre?.toLowerCase().includes(q)
        );
      },
      
      searchAlbums: (query) => {
        const q = query.toLowerCase();
        return get().albums.filter(
          (album) =>
            album.title.toLowerCase().includes(q) ||
            album.description?.toLowerCase().includes(q) ||
            album.genre?.toLowerCase().includes(q)
        );
      },
      
      // Get all content organized by artist
      getOrganizedContent: () => {
        const { artists, albums, mediaArtistMap } = get();
        
        return artists.map((artist) => ({
          ...artist,
          albums: albums.filter((album) => album.artistId === artist.id),
          unassignedMedia: Object.entries(mediaArtistMap)
            .filter(([mediaId, artistId]) => {
              if (artistId !== artist.id) return false;
              // Check if media is not in any album
              const albumId = get().mediaAlbumMap[mediaId];
              return !albumId;
            })
            .map(([mediaId]) => mediaId),
        }));
      },
    }),
    {
      name: 'content-storage',
      version: 1,
    }
  )
);

export default useContentStore;
