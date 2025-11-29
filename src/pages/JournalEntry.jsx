import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Check, 
  Mic, 
  Image as ImageIcon,
  Smile,
  MoreHorizontal,
  Trash2,
  X,
  Clock,
  MapPin
} from 'lucide-react';
import { cn, debounce } from '../lib/utils';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { 
  MoodSelector,
  AudioRecorder,
  AudioPlayer,
  MediaPicker,
  RichTextEditor,
  TitleInput,
  getMoodInfo
} from '../components/journal';
import useJournalStore from '../store/journalStore';

// Auto-save debounce delay (ms)
const AUTO_SAVE_DELAY = 1000;

// Format date for display
const formatEntryDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function JournalEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { 
    getEntry, 
    createEntry, 
    updateEntry, 
    publishEntry, 
    deleteEntry,
    addMedia,
    removeMedia,
    setLocation,
    currentDraft,
    setCurrentDraft,
  } = useJournalStore();
  
  // Local state for current entry
  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // UI state
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Initialize entry
  useEffect(() => {
    if (id === 'new') {
      // Create new entry
      const newEntry = createEntry();
      setEntry(newEntry);
      setCurrentDraft(newEntry);
    } else if (id) {
      // Load existing entry
      const existingEntry = getEntry(id);
      if (existingEntry) {
        setEntry(existingEntry);
        setCurrentDraft(existingEntry);
      } else {
        // Entry not found, redirect to journal list
        navigate('/journal', { replace: true });
        return;
      }
    }
    setIsLoading(false);
  }, [id, createEntry, getEntry, setCurrentDraft, navigate]);
  
  // Debounced auto-save
  const debouncedSave = useMemo(
    () => debounce((entryId, updates) => {
      updateEntry(entryId, updates);
      setLastSaved(new Date());
      setIsSaving(false);
    }, AUTO_SAVE_DELAY),
    [updateEntry]
  );
  
  // Handle field changes with auto-save
  const handleChange = useCallback((field, value) => {
    if (!entry) return;
    
    setIsSaving(true);
    setEntry(prev => ({ ...prev, [field]: value }));
    
    const updates = { [field]: value };
    
    // If content changed, also update plainText
    if (field === 'content') {
      // Plain text is updated via onPlainTextChange
    }
    
    debouncedSave(entry.id, updates);
  }, [entry, debouncedSave]);
  
  // Handle plain text change (for search indexing)
  const handlePlainTextChange = useCallback((plainText) => {
    if (!entry) return;
    setEntry(prev => ({ ...prev, plainText }));
    debouncedSave(entry.id, { plainText });
  }, [entry, debouncedSave]);
  
  // Handle mood change
  const handleMoodChange = useCallback((mood) => {
    handleChange('mood', mood);
  }, [handleChange]);
  
  // Handle image add
  const handleAddImage = useCallback(async (file) => {
    if (!entry) return;
    
    try {
      await addMedia(entry.id, file, 'image');
      // Refresh entry from store
      const updated = getEntry(entry.id);
      setEntry(updated);
    } catch (error) {
      console.error('Error adding image:', error);
    }
  }, [entry, addMedia, getEntry]);
  
  // Handle image remove
  const handleRemoveImage = useCallback(async (mediaId) => {
    if (!entry) return;
    
    await removeMedia(entry.id, mediaId);
    const updated = getEntry(entry.id);
    setEntry(updated);
  }, [entry, removeMedia, getEntry]);
  
  // Handle audio save
  const handleAudioSave = useCallback(async (blob, duration) => {
    if (!entry) return;
    
    try {
      await addMedia(entry.id, blob, 'audio');
      const updated = getEntry(entry.id);
      setEntry(updated);
      setShowAudioRecorder(false);
    } catch (error) {
      console.error('Error saving audio:', error);
    }
  }, [entry, addMedia, getEntry]);
  
  // Handle audio remove
  const handleRemoveAudio = useCallback(async (mediaId) => {
    if (!entry) return;
    
    await removeMedia(entry.id, mediaId);
    const updated = getEntry(entry.id);
    setEntry(updated);
  }, [entry, removeMedia, getEntry]);
  
  // Handle location change
  const handleLocationChange = useCallback((location) => {
    if (!entry) return;
    setLocation(entry.id, location);
    setEntry(prev => ({ ...prev, location }));
  }, [entry, setLocation]);
  
  // Save and publish entry
  const handlePublish = useCallback(() => {
    if (!entry) return;
    
    // Validate entry has some content
    if (!entry.title?.trim() && !entry.plainText?.trim() && !entry.media?.length) {
      alert('Please add some content to your entry');
      return;
    }
    
    publishEntry(entry.id);
    navigate('/journal', { replace: true });
  }, [entry, publishEntry, navigate]);
  
  // Delete entry
  const handleDelete = useCallback(async () => {
    if (!entry) return;
    
    await deleteEntry(entry.id);
    setShowDeleteDialog(false);
    navigate('/journal', { replace: true });
  }, [entry, deleteEntry, navigate]);
  
  // Go back
  const handleBack = () => {
    if (entry?.isDraft && !entry.title?.trim() && !entry.plainText?.trim() && !entry.media?.length) {
      // Delete empty draft
      deleteEntry(entry.id);
    }
    navigate('/journal');
  };
  
  // Get images and audio from media
  const images = entry?.media?.filter(m => m.type === 'image') || [];
  const audioRecordings = entry?.media?.filter(m => m.type === 'audio') || [];
  
  // Mood info
  const moodInfo = entry?.mood ? getMoodInfo(entry.mood.value) : null;
  
  if (isLoading || !entry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Save status */}
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-muted-foreground"
                >
                  Saving...
                </motion.span>
              ) : lastSaved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-primary" />
                  Saved
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handlePublish}
              className="rounded-full"
            >
              {entry.isDraft ? 'Save Entry' : 'Update'}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowMoodSelector(true)}>
                  <Smile className="w-4 h-4 mr-2" />
                  {entry.mood ? 'Edit Mood' : 'Add Mood'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAudioRecorder(true)}>
                  <Mic className="w-4 h-4 mr-2" />
                  Record Audio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowMediaPicker(true)}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Add Photos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Entry
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{formatEntryDate(entry.createdAt)}</span>
        </div>
        
        {/* Mood badge (if set) */}
        {moodInfo && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowMoodSelector(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <span className="text-lg">{moodInfo.emoji}</span>
            <span className="text-sm font-medium">{moodInfo.label}</span>
            {entry.mood.emotions?.length > 0 && (
              <span className="text-xs text-muted-foreground">
                • {entry.mood.emotions.slice(0, 2).join(', ')}
                {entry.mood.emotions.length > 2 && ` +${entry.mood.emotions.length - 2}`}
              </span>
            )}
          </motion.button>
        )}
        
        {/* Location badge */}
        {entry.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{entry.location.name}</span>
          </div>
        )}
        
        {/* Title */}
        <TitleInput
          value={entry.title || ''}
          onChange={(value) => handleChange('title', value)}
          placeholder="Title (optional)"
        />
        
        {/* Rich text editor */}
        <RichTextEditor
          content={entry.content || ''}
          placeholder="What's on your mind?"
          onChange={(content) => handleChange('content', content)}
          onPlainTextChange={handlePlainTextChange}
          autoFocus={id === 'new'}
          minHeight="300px"
        />
        
        {/* Audio recordings */}
        {audioRecordings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Voice Recordings</h4>
            {audioRecordings.map((audio) => (
              <div key={audio.id} className="relative group">
                <AudioPlayer
                  audioUrl={audio.url}
                  duration={audio.duration}
                  name={audio.name}
                />
                <button
                  onClick={() => handleRemoveAudio(audio.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Images */}
        {images.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Photos</h4>
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <img
                    src={image.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMoodSelector(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              entry.mood
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <Smile className="w-4 h-4" />
            Mood
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAudioRecorder(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Mic className="w-4 h-4" />
            Voice
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMediaPicker(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Photo
          </motion.button>
        </div>
      </div>
      
      {/* Mood Selector Dialog */}
      <Dialog open={showMoodSelector} onOpenChange={setShowMoodSelector}>
        <DialogContent className="sm:max-w-lg" preventClose>
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
          </DialogHeader>
          <MoodSelector
            mood={entry.mood}
            onChange={handleMoodChange}
            onDone={() => setShowMoodSelector(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Audio Recorder Dialog */}
      <Dialog open={showAudioRecorder} onOpenChange={setShowAudioRecorder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Voice Note</DialogTitle>
          </DialogHeader>
          <AudioRecorder
            onSave={handleAudioSave}
            onCancel={() => setShowAudioRecorder(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Media Picker Dialog */}
      <Dialog open={showMediaPicker} onOpenChange={setShowMediaPicker}>
        <DialogContent className="sm:max-w-lg" preventClose>
          <DialogHeader>
            <DialogTitle>Add Photos & Location</DialogTitle>
          </DialogHeader>
          <MediaPicker
            images={images}
            location={entry.location}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
            onLocationChange={handleLocationChange}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your journal entry and all its attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
