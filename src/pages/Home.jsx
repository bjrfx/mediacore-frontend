import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, Clock, TrendingUp } from 'lucide-react';
import { publicApi } from '../services/api';
import { usePlayerStore, useAuthStore } from '../store';
import { MediaGrid } from '../components/media';
import { Button } from '../components/ui/button';
import { cn, generateGradient } from '../lib/utils';

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const { playTrack, history } = usePlayerStore();

  // Fetch all media
  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ['media', 'all'],
    queryFn: () => publicApi.getMedia({ limit: 50 }),
  });

  // Fetch videos only
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['media', 'videos'],
    queryFn: () => publicApi.getMedia({ type: 'video', limit: 12 }),
  });

  // Fetch audio only
  const { data: audioData, isLoading: audioLoading } = useQuery({
    queryKey: ['media', 'audio'],
    queryFn: () => publicApi.getMedia({ type: 'audio', limit: 12 }),
  });

  const allMedia = mediaData?.data || [];
  const videos = videosData?.data || [];
  const audio = audioData?.data || [];
  const recentlyPlayed = history.slice(0, 6);

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
      <div className="px-6 space-y-10 pb-8">
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
            isLoading={videosLoading}
            title="Videos"
            emptyMessage="No videos available"
          />
        </section>

        {/* Audio section */}
        <section>
          <MediaGrid
            media={audio}
            isLoading={audioLoading}
            title="Audio"
            emptyMessage="No audio available"
          />
        </section>

        {/* All media section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Browse All</h2>
          </div>
          <MediaGrid
            media={allMedia}
            isLoading={mediaLoading}
            emptyMessage="No media available yet"
          />
        </section>
      </div>
    </div>
  );
}
