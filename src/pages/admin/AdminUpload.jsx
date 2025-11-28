import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Film,
  Music,
  X,
  CheckCircle,
  AlertCircle,
  FileVideo,
  FileAudio,
  Plus,
  User,
  Loader2,
} from 'lucide-react';
import { publicApi, adminApi } from '../../services/api';
import { useUIStore } from '../../store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { cn, formatFileSize } from '../../lib/utils';

export default function AdminUpload() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState('video');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Artist/Album selection
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [showNewArtistDialog, setShowNewArtistDialog] = useState(false);
  const [showNewAlbumDialog, setShowNewAlbumDialog] = useState(false);
  const [newArtistName, setNewArtistName] = useState('');
  const [newAlbumTitle, setNewAlbumTitle] = useState('');

  // Fetch artists from API
  const { data: artistsData } = useQuery({
    queryKey: ['artists'],
    queryFn: () => publicApi.getArtists({ limit: 200 }),
  });

  // Fetch albums for selected artist
  const { data: albumsData } = useQuery({
    queryKey: ['artist-albums', selectedArtistId],
    queryFn: () => publicApi.getArtistAlbums(selectedArtistId),
    enabled: !!selectedArtistId,
  });

  const artists = artistsData?.data || [];
  const artistAlbums = albumsData?.data || [];

  // Create artist mutation
  const createArtistMutation = useMutation({
    mutationFn: (data) => adminApi.createArtist(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['artists']);
      setSelectedArtistId(response.data.id);
      setNewArtistName('');
      setShowNewArtistDialog(false);
      addToast({ message: 'Artist created', type: 'success' });
    },
    onError: (error) => {
      addToast({
        message: error.response?.data?.message || 'Failed to create artist',
        type: 'error',
      });
    },
  });

  // Create album mutation
  const createAlbumMutation = useMutation({
    mutationFn: (data) => adminApi.createAlbum(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['artist-albums', selectedArtistId]);
      setSelectedAlbumId(response.data.id);
      setNewAlbumTitle('');
      setShowNewAlbumDialog(false);
      addToast({ message: 'Album created', type: 'success' });
    },
    onError: (error) => {
      addToast({
        message: error.response?.data?.message || 'Failed to create album',
        type: 'error',
      });
    },
  });

  // Upload mutation - now passes artistId and albumId to the API
  const uploadMutation = useMutation({
    mutationFn: ({ file, title, subtitle, type, artistId, albumId }) =>
      adminApi.uploadMedia(file, title, subtitle, type, setUploadProgress, artistId || null, albumId || null),
    onSuccess: async (data) => {
      queryClient.invalidateQueries(['media']);
      queryClient.invalidateQueries(['admin-media']);
      queryClient.invalidateQueries(['artist-media', selectedArtistId]);
      
      // If album is selected, also add media to album with track number
      const mediaId = data?.data?.id;
      if (mediaId && selectedAlbumId) {
        try {
          // Get current album track count to determine next track number
          const albumMediaResponse = await publicApi.getAlbumMedia(selectedAlbumId);
          const currentTracks = albumMediaResponse?.data || [];
          const nextTrackNumber = currentTracks.length + 1;
          
          await adminApi.addMediaToAlbum(selectedAlbumId, mediaId, nextTrackNumber);
          queryClient.invalidateQueries(['album-media', selectedAlbumId]);
        } catch (error) {
          console.error('Failed to add media to album:', error);
        }
      }
      
      resetForm();
      addToast({ message: 'Media uploaded successfully!', type: 'success' });
    },
    onError: (error) => {
      addToast({
        message: error.response?.data?.message || 'Upload failed',
        type: 'error',
      });
    },
  });

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setSubtitle('');
    setType('video');
    setUploadProgress(0);
    setSelectedArtistId('');
    setSelectedAlbumId('');
  };
  
  const handleCreateArtist = () => {
    if (!newArtistName.trim()) return;
    createArtistMutation.mutate({ name: newArtistName.trim() });
  };
  
  const handleCreateAlbum = () => {
    if (!newAlbumTitle.trim() || !selectedArtistId) return;
    createAlbumMutation.mutate({ 
      title: newAlbumTitle.trim(), 
      artistId: selectedArtistId 
    });
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer?.files[0] || e.target?.files[0];
    if (droppedFile) {
      const fileType = droppedFile.type;
      if (fileType.startsWith('video/') || fileType.startsWith('audio/')) {
        setFile(droppedFile);
        setType(fileType.startsWith('video/') ? 'video' : 'audio');
        // Auto-fill title from filename
        if (!title) {
          const name = droppedFile.name.replace(/\.[^/.]+$/, '');
          setTitle(name);
        }
      } else {
        addToast({
          message: 'Please upload a video (MP4) or audio (MP3) file',
          type: 'error',
        });
      }
    }
  }, [title, addToast]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      addToast({ message: 'Please select a file and enter a title', type: 'error' });
      return;
    }
    uploadMutation.mutate({ 
      file, 
      title: title.trim(), 
      subtitle: subtitle.trim(), 
      type,
      artistId: selectedArtistId || null,
      albumId: selectedAlbumId || null,
    });
  };

  const selectedArtist = artists.find((a) => a.id === selectedArtistId);
  const selectedAlbum = artistAlbums.find((a) => a.id === selectedAlbumId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Upload Media</h2>
        <p className="text-muted-foreground">
          Upload video or audio files to your media library
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop zone */}
        <Card>
          <CardContent className="p-6">
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50',
                file && 'border-primary bg-primary/5'
              )}
            >
              <input
                type="file"
                accept="video/mp4,audio/mp3,audio/mpeg"
                onChange={handleFileDrop}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div
                      key="file-selected"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-4"
                    >
                      <div className="inline-flex p-4 rounded-full bg-primary/20">
                        {type === 'video' ? (
                          <FileVideo className="h-8 w-8 text-primary" />
                        ) : (
                          <FileAudio className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="drop-zone"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-4"
                    >
                      <div className="inline-flex p-4 rounded-full bg-muted">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Drag and drop your file here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse
                        </p>
                      </div>
                      <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Film className="h-4 w-4" />
                          MP4 Videos
                        </span>
                        <span className="flex items-center gap-1">
                          <Music className="h-4 w-4" />
                          MP3 Audio
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum file size: 500MB
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Media details */}
        <Card>
          <CardHeader>
            <CardTitle>Media Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter media title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Description</Label>
              <Textarea
                id="subtitle"
                placeholder="Enter a description (optional)"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Media Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <span className="flex items-center gap-2">
                      <Film className="h-4 w-4" />
                      Video
                    </span>
                  </SelectItem>
                  <SelectItem value="audio">
                    <span className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Audio
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Artist & Album Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Artist & Album (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Artist</Label>
              <div className="flex gap-2">
                <Select value={selectedArtistId || "none"} onValueChange={(value) => {
                  setSelectedArtistId(value === "none" ? "" : value);
                  setSelectedAlbumId(''); // Reset album when artist changes
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select an artist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No artist</SelectItem>
                    {artists.map((artist) => (
                      <SelectItem key={artist.id} value={artist.id}>
                        {artist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewArtistDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedArtistId && (
              <div className="space-y-2">
                <Label>Album</Label>
                <div className="flex gap-2">
                  <Select value={selectedAlbumId || "none"} onValueChange={(value) => setSelectedAlbumId(value === "none" ? "" : value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select an album" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No album (singles)</SelectItem>
                      {artistAlbums.map((album) => (
                        <SelectItem key={album.id} value={album.id}>
                          {album.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewAlbumDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {selectedArtistId && (
              <p className="text-xs text-muted-foreground">
                This media will be assigned to{' '}
                <strong>{selectedArtist?.name}</strong>
                {selectedAlbumId && (
                  <>
                    {' '}in album{' '}
                    <strong>{selectedAlbum?.title}</strong>
                  </>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upload progress */}
        {uploadMutation.isPending && (
          <Card>
            <CardContent className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!file || !title.trim() || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </>
            )}
          </Button>
        </div>

        {/* Status messages */}
        <AnimatePresence>
          {uploadMutation.isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-green-500 bg-green-500/10 p-4 rounded-lg"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Upload successful!</span>
            </motion.div>
          )}

          {uploadMutation.isError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-lg"
            >
              <AlertCircle className="h-5 w-5" />
              <span>
                {uploadMutation.error?.response?.data?.message || 'Upload failed'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* New Artist Dialog */}
      <Dialog open={showNewArtistDialog} onOpenChange={setShowNewArtistDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Artist</DialogTitle>
            <DialogDescription>
              Add a new artist to organize your content
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Artist Name</Label>
            <Input
              value={newArtistName}
              onChange={(e) => setNewArtistName(e.target.value)}
              placeholder="e.g., Eckhart Tolle"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewArtistDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateArtist} 
              disabled={!newArtistName.trim() || createArtistMutation.isLoading}
            >
              {createArtistMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Artist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Album Dialog */}
      <Dialog open={showNewAlbumDialog} onOpenChange={setShowNewAlbumDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Album</DialogTitle>
            <DialogDescription>
              Add a new album for {selectedArtist?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Album Title</Label>
            <Input
              value={newAlbumTitle}
              onChange={(e) => setNewAlbumTitle(e.target.value)}
              placeholder="e.g., The Power of Now"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewAlbumDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAlbum} 
              disabled={!newAlbumTitle.trim() || createAlbumMutation.isLoading}
            >
              {createAlbumMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
