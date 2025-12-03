import React, { useMemo, useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, Clock, TrendingUp, RotateCcw, Video, Music, Upload, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../services/api';
import { usePlayerStore, useAuthStore } from '../store';
import { MediaGrid, LanguageCardGrid, CompactLanguageBadges } from '../components/media';
import { Button } from '../components/ui/button';
import { cn, generateGradient, formatDuration } from '../lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdminUser } = useAuthStore();
  const { playTrack, history, getResumeItems, playbackProgress } = usePlayerStore();
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  // Get items that can be resumed
  const resumeItems = useMemo(() => getResumeItems(), [getResumeItems, playbackProgress, history]);

  // Fetch all media (single request, filter client-side due to backend type filter bug)
  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ['media', 'all'],
    queryFn: () => publicApi.getMedia({ limit: 50 }),
  });

  const rawMedia = mediaData?.data || [];
  
  // Get unique album IDs from media
  const albumIds = useMemo(() => {
    const ids = [...new Set(rawMedia.filter(m => m.albumId).map(m => m.albumId))];
    return ids;
  }, [rawMedia]);

  // Fetch album details to get artist info
  const albumQueries = useQueries({
    queries: albumIds.map(albumId => ({
      queryKey: ['album', albumId],
      queryFn: () => publicApi.getAlbumById(albumId),
      staleTime: 5 * 60 * 1000,
      enabled: !!albumId,
    })),
  });

  // Build album map with artist info
  const albumMap = useMemo(() => {
    const map = {};
    albumQueries.forEach(query => {
      if (query.data?.data) {
        const album = query.data.data;
        map[album.id] = {
          title: album.title,
          coverImage: album.coverImage,
          artistName: album.artist?.name || '',
          artistId: album.artist?.id || album.artistId,
        };
      }
    });
    return map;
  }, [albumQueries]);

  // Enrich media with artist info from albums
  const allMedia = useMemo(() => {
    return rawMedia.map(item => {
      const albumInfo = item.albumId ? albumMap[item.albumId] : null;
      return {
        ...item,
        artistName: albumInfo?.artistName || item.subtitle || '',
        albumTitle: albumInfo?.title || '',
        albumCover: albumInfo?.coverImage || '',
      };
    });
  }, [rawMedia, albumMap]);

  // Extract available languages from media
  const availableLanguages = useMemo(() => {
    const languageCounts = {};
    allMedia.forEach(item => {
      const lang = item.language || 'en';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });
    
    // Sort by count (most content first)
    return Object.entries(languageCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }, [allMedia]);

  // Filter media by selected language
  const filteredMedia = useMemo(() => {
    if (!selectedLanguage) return allMedia;
    return allMedia.filter(item => (item.language || 'en') === selectedLanguage);
  }, [allMedia, selectedLanguage]);
  
  // Filter videos and audio client-side (from filtered media)
  const videos = useMemo(() => 
    filteredMedia.filter(item => item.type === 'video').slice(0, 12), 
    [filteredMedia]
  );
  
  const audio = useMemo(() => 
    filteredMedia.filter(item => item.type === 'audio').slice(0, 12), 
    [filteredMedia]
  );
  
  const recentlyPlayed = history.slice(0, 6);

  // Handle language selection from cards
  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
    // Scroll to content section
    document.getElementById('content-sections')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Featured/Hero section with first item
  const featuredItem = allMedia[0];

  const handlePlayAll = () => {
    if (allMedia.length > 0) {
      playTrack(allMedia[0], allMedia);
    }
  };

  // Handle resume play
  const handleResumePlay = (item) => {
    playTrack(item, null, true); // true = resume from saved position
  };

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-spotify opacity-50" />
        
        <div className="relative px-6 pt-4 pb-8">
          {/* Greeting */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            {getGreeting()}{isAuthenticated && user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </motion.h1>

          {/* Quick access grid */}
          {recentlyPlayed.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {recentlyPlayed.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => playTrack(item, recentlyPlayed)}
                  className="group flex items-center gap-4 bg-white/10 hover:bg-white/20 rounded-md overflow-hidden cursor-pointer transition-colors"
                >
                  <div
                    className={cn(
                      'w-14 h-14 shrink-0',
                      !item.thumbnail && `bg-gradient-to-br ${generateGradient(item.id)}`
                    )}
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white/50" />
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-sm truncate pr-4">
                    {item.title}
                  </span>
                  <Button
                    variant="spotify"
                    size="icon"
                    className="ml-auto mr-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Play className="h-5 w-5 ml-0.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Featured item (if no recent plays) */}
          {recentlyPlayed.length === 0 && featuredItem && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-xl overflow-hidden mb-8"
            >
              <div
                className={cn(
                  'aspect-[3/1] md:aspect-[4/1]',
                  !featuredItem.thumbnail && `bg-gradient-to-br ${generateGradient(featuredItem.id)}`
                )}
              >
                {featuredItem.thumbnail && (
                  <img
                    src={featuredItem.thumbnail}
                    alt={featuredItem.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-sm font-medium text-primary mb-2 block">
                  Featured
                </span>
                <h2 className="text-2xl md:text-4xl font-bold mb-2">
                  {featuredItem.title}
                </h2>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {featuredItem.subtitle || 'Start exploring amazing content'}
                </p>
                <Button variant="spotify" size="lg" onClick={handlePlayAll}>
                  <Play className="h-5 w-5 mr-2" />
                  Play All
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content sections */}
      <div id="content-sections" className="px-6 space-y-10 pb-8">
        {/* Browse by Language section */}
        {availableLanguages.length > 1 && (
          <LanguageCardGrid
            languages={availableLanguages}
            onLanguageSelect={handleLanguageSelect}
            title="Browse by Language"
          />
        )}

        {/* Language filter badges (when a language is selected) */}
        {selectedLanguage && availableLanguages.length > 1 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Filtering by Language</h2>
            </div>
            <CompactLanguageBadges
              languages={availableLanguages}
              selectedLanguage={selectedLanguage}
              onLanguageSelect={setSelectedLanguage}
            />
          </section>
        )}

        {/* Continue Watching/Listening section */}
        {resumeItems.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Continue Watching</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {resumeItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleResumePlay(item)}
                  className="group relative cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div
                    className={cn(
                      'aspect-video rounded-lg overflow-hidden mb-2 relative',
                      !item.thumbnail && `bg-gradient-to-br ${generateGradient(item.id)}`
                    )}
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.type === 'video' ? (
                          <Video className="w-12 h-12 text-white/50" />
                        ) : (
                          <Music className="w-12 h-12 text-white/50" />
                        )}
                      </div>
                    )}
                    
                    {/* Progress bar overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${item.progress?.percentage || 0}%` }}
                      />
                    </div>

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="spotify" size="icon" className="h-12 w-12">
                        <Play className="h-6 w-6 ml-0.5" />
                      </Button>
                    </div>

                    {/* Type badge */}
                    <span className={cn(
                      'absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded',
                      item.type === 'video' ? 'bg-blue-500/80' : 'bg-green-500/80'
                    )}>
                      {item.type === 'video' ? 'VIDEO' : 'AUDIO'}
                    </span>
                  </div>

                  {/* Info */}
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.progress?.percentage}% • {formatDuration(item.progress?.duration - item.progress?.currentTime)} left
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Recently played section */}
        {recentlyPlayed.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Recently Played</h2>
            </div>
            <MediaGrid media={recentlyPlayed} />
          </section>
        )}

        {/* Videos section */}
        <section>
          <MediaGrid
            media={videos}
            isLoading={mediaLoading}
            title="Videos"
            emptyMessage={
              <div className="text-center py-8">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-1">No videos available</p>
                <p className="text-sm text-muted-foreground/70">
                  {isAdminUser ? (
                    <>Videos will appear here once uploaded. <Link to="/admin/upload" className="text-primary hover:underline">Upload now</Link></>
                  ) : (
                    'Check back later for new video content'
                  )}
                </p>
              </div>
            }
          />
        </section>

        {/* Audio section */}
        <section>
          <MediaGrid
            media={audio}
            isLoading={mediaLoading}
            title="Audio"
            emptyMessage={
              <div className="text-center py-8">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-1">No audio available</p>
                <p className="text-sm text-muted-foreground/70">
                  {isAdminUser ? (
                    <>Audio tracks will appear here once uploaded. <Link to="/admin/upload" className="text-primary hover:underline">Upload now</Link></>
                  ) : (
                    'Check back later for new audio content'
                  )}
                </p>
              </div>
            }
          />
        </section>

        {/* All media section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold">
              {selectedLanguage ? `Browse All (${selectedLanguage.toUpperCase()})` : 'Browse All'}
            </h2>
            {selectedLanguage && (
              <button
                onClick={() => setSelectedLanguage(null)}
                className="text-sm text-muted-foreground hover:text-primary ml-2"
              >
                Clear filter
              </button>
            )}
          </div>
          <MediaGrid
            media={filteredMedia}
            isLoading={mediaLoading}
            emptyMessage={
              <div className="text-center py-12">
                <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {selectedLanguage ? 'No content in this language' : 'No media available yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {selectedLanguage ? (
                    <>
                      No content available in this language yet.
                      <button
                        onClick={() => setSelectedLanguage(null)}
                        className="text-primary hover:underline ml-1"
                      >
                        View all content
                      </button>
                    </>
                  ) : isAdminUser ? (
                    'Start by uploading your first video or audio file'
                  ) : (
                    'Content is being prepared. Check back soon!'
                  )}
                </p>
                {isAdminUser && !selectedLanguage && (
                  <Button asChild>
                    <Link to="/admin/upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Media
                    </Link>
                  </Button>
                )}
              </div>
            }
          />
        </section>
      </div>
    </div>
  );
}
