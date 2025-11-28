import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, User, Disc, Music } from 'lucide-react';
import { useContentStore } from '../store';
import { Input } from '../components/ui/input';
import { cn, generateGradient } from '../lib/utils';

export default function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { artists, getAlbumsByArtist, getMediaByArtist } = useContentStore();

  const filteredArtists = searchQuery
    ? artists.filter(
        (artist) =>
          artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          artist.genre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : artists;

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Artists</h1>
        <p className="text-muted-foreground">
          Browse all artists in your library
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search artists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Artists Grid */}
      {filteredArtists.length === 0 ? (
        <div className="text-center py-16">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No artists found</h2>
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Try a different search term'
              : 'No artists have been added yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredArtists.map((artist, index) => {
            const albumCount = getAlbumsByArtist(artist.id).length;
            const trackCount = getMediaByArtist(artist.id).length;

            return (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link to={`/artist/${artist.id}`}>
                  <div className="group p-4 rounded-lg bg-card hover:bg-card/80 transition-colors">
                    {/* Artist Image */}
                    <div
                      className={cn(
                        'aspect-square rounded-full mb-4 mx-auto w-full max-w-[160px] overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow',
                        !artist.image && `bg-gradient-to-br ${generateGradient(artist.id)}`
                      )}
                    >
                      {artist.image ? (
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-16 w-16 text-white/50" />
                        </div>
                      )}
                    </div>

                    {/* Artist Info */}
                    <div className="text-center">
                      <h3 className="font-semibold truncate">{artist.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Artist
                      </p>
                      <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Disc className="h-3 w-3" />
                          {albumCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          {trackCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
