import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Image as ImageIcon,
  Mic,
  Filter,
  SortAsc,
  SortDesc,
  Smile,
  Book,
  Flame,
  TrendingUp,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '../components/ui/dropdown-menu';
import { ScrollArea } from '../components/ui/scroll-area';
import { getMoodInfo, EMOTIONS } from '../components/journal';
import useJournalStore from '../store/journalStore';

// Format date for grouping
const formatGroupDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Format time
const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Entry card component
const EntryCard = ({ entry, onClick }) => {
  const moodInfo = entry.mood ? getMoodInfo(entry.mood.value) : null;
  const hasImages = entry.media?.some(m => m.type === 'image');
  const hasAudio = entry.media?.some(m => m.type === 'audio');
  const previewImage = entry.media?.find(m => m.type === 'image');
  
  // Truncate plain text
  const preview = entry.plainText?.slice(0, 150) || '';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all"
    >
      {/* Preview image */}
      {previewImage && (
        <div className="aspect-[2/1] relative">
          <img
            src={previewImage.url}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      
      <div className="p-4 space-y-3">
        {/* Header with time and mood */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatTime(entry.createdAt)}
          </span>
          
          {moodInfo && (
            <div className="flex items-center gap-1.5">
              <span className="text-base">{moodInfo.emoji}</span>
              <span className="text-xs text-muted-foreground">{moodInfo.label}</span>
            </div>
          )}
        </div>
        
        {/* Title */}
        {entry.title && (
          <h3 className="font-semibold text-lg line-clamp-1">{entry.title}</h3>
        )}
        
        {/* Preview text */}
        {preview && (
          <p className="text-sm text-muted-foreground line-clamp-3">{preview}</p>
        )}
        
        {/* Emotions */}
        {entry.mood?.emotions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.mood.emotions.slice(0, 4).map((emotionName) => {
              const emotion = EMOTIONS.find(e => e.name === emotionName);
              return (
                <span
                  key={emotionName}
                  className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 flex items-center gap-1"
                >
                  {emotion?.emoji}
                  <span className="text-muted-foreground">{emotionName}</span>
                </span>
              );
            })}
            {entry.mood.emotions.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{entry.mood.emotions.length - 4}
              </span>
            )}
          </div>
        )}
        
        {/* Footer with indicators */}
        <div className="flex items-center gap-3 pt-1">
          {entry.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{entry.location.name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 ml-auto">
            {hasImages && (
              <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            {hasAudio && (
              <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stats card component
const StatsCard = ({ icon: Icon, label, value, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={cn(
      'p-4 rounded-xl bg-gradient-to-br text-white',
      color
    )}
  >
    <Icon className="w-5 h-5 mb-2 opacity-80" />
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm opacity-80">{label}</p>
  </motion.div>
);

// Empty state component
const EmptyState = ({ onCreateEntry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
      <Book className="w-10 h-10 text-primary" />
    </div>
    <h3 className="text-xl font-semibold mb-2">Start Your Journal</h3>
    <p className="text-muted-foreground mb-6 max-w-sm">
      Capture your thoughts, feelings, and memories. Your journal is a safe space to reflect and grow.
    </p>
    <Button onClick={onCreateEntry} size="lg" className="rounded-full">
      <Plus className="w-5 h-5 mr-2" />
      Write Your First Entry
    </Button>
  </motion.div>
);

export default function Journal() {
  const navigate = useNavigate();
  
  const {
    searchQuery,
    setSearchQuery,
    filterMood,
    setFilterMood,
    sortBy,
    setSortBy,
    getFilteredEntries,
    getStats,
  } = useJournalStore();
  
  const [showStats, setShowStats] = useState(false);
  
  const entries = getFilteredEntries();
  const stats = useMemo(() => getStats(), [getStats]);
  
  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups = {};
    entries.forEach(entry => {
      const groupKey = formatGroupDate(entry.createdAt);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(entry);
    });
    return groups;
  }, [entries]);
  
  const handleCreateEntry = () => {
    navigate('/journal/new');
  };
  
  const handleEntryClick = (entry) => {
    navigate(`/journal/${entry.id}`);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setFilterMood(null);
  };
  
  const hasActiveFilters = searchQuery || filterMood;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg">
        <div className="px-4 py-4 space-y-4">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Journal</h1>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStats(!showStats)}
                className={cn(showStats && 'bg-secondary')}
              >
                <TrendingUp className="w-5 h-5" />
              </Button>
              
              <Button onClick={handleCreateEntry} size="sm" className="rounded-full">
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
          </div>
          
          {/* Search and filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full bg-secondary/50 border-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Mood filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    'rounded-full shrink-0',
                    filterMood && 'bg-primary text-primary-foreground border-primary'
                  )}
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Mood</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setFilterMood(null)}
                  className={cn(!filterMood && 'bg-secondary')}
                >
                  All Moods
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterMood('positive')}
                  className={cn(filterMood === 'positive' && 'bg-secondary')}
                >
                  😊 Positive
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterMood('neutral')}
                  className={cn(filterMood === 'neutral' && 'bg-secondary')}
                >
                  😐 Neutral
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterMood('negative')}
                  className={cn(filterMood === 'negative' && 'bg-secondary')}
                >
                  😔 Negative
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full shrink-0">
                  {sortBy === 'newest' ? (
                    <SortDesc className="w-4 h-4" />
                  ) : (
                    <SortAsc className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSortBy('newest')}
                  className={cn(sortBy === 'newest' && 'bg-secondary')}
                >
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy('oldest')}
                  className={cn(sortBy === 'oldest' && 'bg-secondary')}
                >
                  Oldest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Active filters indicator */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-muted-foreground">Filters:</span>
              {searchQuery && (
                <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                  "{searchQuery}"
                </span>
              )}
              {filterMood && (
                <span className="text-xs px-2 py-1 rounded-full bg-secondary capitalize">
                  {filterMood}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </div>
      </header>
      
      {/* Stats section */}
      <AnimatePresence>
        {showStats && stats.totalEntries > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatsCard
                icon={Book}
                label="Total Entries"
                value={stats.totalEntries}
                color="from-blue-500 to-blue-600"
              />
              <StatsCard
                icon={Flame}
                label="Day Streak"
                value={stats.currentStreak}
                color="from-orange-500 to-red-500"
              />
              <StatsCard
                icon={Smile}
                label="Avg Mood"
                value={`${stats.avgMood}%`}
                color="from-green-500 to-emerald-500"
              />
              <StatsCard
                icon={Calendar}
                label="This Month"
                value={Object.values(stats.monthlyEntries)[0] || 0}
                color="from-purple-500 to-pink-500"
              />
            </div>
            
            {/* Top emotions */}
            {stats.topEmotions.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-secondary/30">
                <h4 className="text-sm font-medium mb-3">Your Top Emotions</h4>
                <div className="flex flex-wrap gap-2">
                  {stats.topEmotions.map(({ emotion, count }) => {
                    const emotionData = EMOTIONS.find(e => e.name === emotion);
                    return (
                      <span
                        key={emotion}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm"
                      >
                        <span>{emotionData?.emoji}</span>
                        <span>{emotion}</span>
                        <span className="text-muted-foreground">({count})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 pb-24">
          {entries.length === 0 ? (
            hasActiveFilters ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No entries found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </motion.div>
            ) : (
              <EmptyState onCreateEntry={handleCreateEntry} />
            )
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEntries).map(([date, dateEntries]) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Date header */}
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background py-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium text-muted-foreground">{date}</h2>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  {/* Entries grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {dateEntries.map((entry) => (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          onClick={() => handleEntryClick(entry)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Floating action button (mobile) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleCreateEntry}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center md:hidden"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
