import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Disc,
  Music,
  Film,
  Play,
  User,
  GripVertical,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useContentStore, useUIStore, usePlayerStore } from '../../store';
import { publicApi } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Checkbox } from '../../components/ui/checkbox';
import { cn, generateGradient } from '../../lib/utils';

const ALBUM_TYPES = [
  { value: 'album', label: 'Album' },
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'compilation', label: 'Compilation' },
  { value: 'audiobook', label: 'Audiobook' },
  { value: 'lecture', label: 'Lecture Series' },
];

export default function AdminArtistDetail() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { playTrack, setQueue } = usePlayerStore();

  const {
    getArtist,
    updateArtist,
    deleteArtist,
    addAlbum,
    updateAlbum,
    deleteAlbum,
    getAlbumsByArtist,
    getMediaByArtist,
    getMediaByAlbum,
    removeMediaFromAlbum,
    bulkAssignToAlbum,
    reorderAlbumTracks,
    mediaAlbumMap,
  } = useContentStore();

  const artist = getArtist(artistId);
  const artistAlbums = getAlbumsByArtist(artistId);
  const artistMediaIds = getMediaByArtist(artistId);

  // Fetch all media
  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ['admin-media'],
    queryFn: () => publicApi.getMedia({ limit: 500 }),
  });

  const allMedia = mediaData?.data || [];

  // Get media assigned to this artist
  const artistMedia = useMemo(() => {
    return allMedia.filter((m) => artistMediaIds.includes(m.id));
  }, [allMedia, artistMediaIds]);

  // Get unassigned media (not in any album)
  const unassignedMedia = useMemo(() => {
    return artistMedia.filter((m) => !mediaAlbumMap[m.id]);
  }, [artistMedia, mediaAlbumMap]);

  // State
  const [activeTab, setActiveTab] = useState('albums');
  const [showAddAlbumDialog, setShowAddAlbumDialog] = useState(false);
  const [showEditAlbumDialog, setShowEditAlbumDialog] = useState(false);
  const [showDeleteAlbumDialog, setShowDeleteAlbumDialog] = useState(false);
  const [showAssignMediaDialog, setShowAssignMediaDialog] = useState(false);
  const [showEditArtistDialog, setShowEditArtistDialog] = useState(false);
  const [showDeleteArtistDialog, setShowDeleteArtistDialog] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState([]);

  const [albumForm, setAlbumForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    releaseDate: '',
    genre: '',
    type: 'album',
  });

  const [artistForm, setArtistForm] = useState({
    name: '',
    bio: '',
    genre: '',
    image: '',
    website: '',
  });

  if (!artist) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Artist not found</h3>
        <Button asChild>
          <Link to="/admin/artists">Back to Artists</Link>
        </Button>
      </div>
    );
  }

  // Album handlers
  const handleAddAlbum = () => {
    setAlbumForm({
      title: '',
      description: '',
      coverImage: '',
      releaseDate: '',
      genre: artist.genre || '',
      type: 'album',
    });
    setShowAddAlbumDialog(true);
  };

  const handleEditAlbum = (album) => {
    setSelectedAlbum(album);
    setAlbumForm({
      title: album.title,
      description: album.description || '',
      coverImage: album.coverImage || '',
      releaseDate: album.releaseDate || '',
      genre: album.genre || '',
      type: album.type || 'album',
    });
    setShowEditAlbumDialog(true);
  };

  const handleDeleteAlbum = (album) => {
    setSelectedAlbum(album);
    setShowDeleteAlbumDialog(true);
  };

  const handleSaveNewAlbum = () => {
    if (!albumForm.title.trim()) {
      addToast({ message: 'Album title is required', type: 'error' });
      return;
    }
    addAlbum({ ...albumForm, artistId });
    setShowAddAlbumDialog(false);
    addToast({ message: 'Album created successfully', type: 'success' });
  };

  const handleSaveEditAlbum = () => {
    if (!albumForm.title.trim()) {
      addToast({ message: 'Album title is required', type: 'error' });
      return;
    }
    updateAlbum(selectedAlbum.id, albumForm);
    setShowEditAlbumDialog(false);
    setSelectedAlbum(null);
    addToast({ message: 'Album updated successfully', type: 'success' });
  };

  const confirmDeleteAlbum = () => {
    deleteAlbum(selectedAlbum.id);
    setShowDeleteAlbumDialog(false);
    setSelectedAlbum(null);
    addToast({ message: 'Album deleted successfully', type: 'success' });
  };

  // Media assignment handlers
  const handleAssignMedia = (album) => {
    setSelectedAlbum(album);
    setSelectedMediaIds([]);
    setShowAssignMediaDialog(true);
  };

  const toggleMediaSelection = (mediaId) => {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const confirmAssignMedia = () => {
    if (selectedMediaIds.length === 0) {
      addToast({ message: 'Select at least one track', type: 'error' });
      return;
    }
    bulkAssignToAlbum(selectedMediaIds, selectedAlbum.id);
    setShowAssignMediaDialog(false);
    setSelectedAlbum(null);
    setSelectedMediaIds([]);
    addToast({ message: `${selectedMediaIds.length} tracks added to album`, type: 'success' });
  };

  // Drag and drop for track reordering
  const handleDragEnd = (result, albumId) => {
    if (!result.destination) return;
    const album = artistAlbums.find((a) => a.id === albumId);
    if (!album) return;

    const newOrder = Array.from(album.trackOrder);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    reorderAlbumTracks(albumId, newOrder);
  };

  // Artist handlers
  const handleEditArtist = () => {
    setArtistForm({
      name: artist.name,
      bio: artist.bio || '',
      genre: artist.genre || '',
      image: artist.image || '',
      website: artist.website || '',
    });
    setShowEditArtistDialog(true);
  };

  const handleSaveEditArtist = () => {
    if (!artistForm.name.trim()) {
      addToast({ message: 'Artist name is required', type: 'error' });
      return;
    }
    updateArtist(artistId, artistForm);
    setShowEditArtistDialog(false);
    addToast({ message: 'Artist updated successfully', type: 'success' });
  };

  const confirmDeleteArtist = () => {
    deleteArtist(artistId);
    navigate('/admin/artists');
    addToast({ message: 'Artist deleted successfully', type: 'success' });
  };

  // Play handlers
  const handlePlayAlbum = (album) => {
    const trackIds = getMediaByAlbum(album.id);
    const tracks = trackIds
      .map((id) => allMedia.find((m) => m.id === id))
      .filter(Boolean);
    if (tracks.length > 0) {
      setQueue(tracks, 0);
      playTrack(tracks[0], tracks);
    }
  };

  const handlePlayTrack = (track, albumTracks) => {
    playTrack(track, albumTracks);
  };

  // Get track info
  const getTrackInfo = (trackId) => {
    return allMedia.find((m) => m.id === trackId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/artists">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex-1 flex flex-col md:flex-row gap-6">
          {/* Artist Image */}
          <div
            className={cn(
              'w-32 h-32 md:w-48 md:h-48 rounded-xl shrink-0 overflow-hidden',
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
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{artist.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {artist.genre && <Badge variant="secondary">{artist.genre}</Badge>}
                  <span className="text-muted-foreground">
                    {artistAlbums.length} albums • {artistMediaIds.length} tracks
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditArtist}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Artist
                  </DropdownMenuItem>
                  {artist.website && (
                    <DropdownMenuItem asChild>
                      <a href={artist.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Website
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteArtistDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Artist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {artist.bio && (
              <p className="text-muted-foreground mt-4 line-clamp-3">{artist.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="tracks">All Tracks</TabsTrigger>
          </TabsList>
          {activeTab === 'albums' && (
            <Button onClick={handleAddAlbum}>
              <Plus className="mr-2 h-4 w-4" />
              Add Album
            </Button>
          )}
        </div>

        {/* Albums Tab */}
        <TabsContent value="albums" className="space-y-6">
          {artistAlbums.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Disc className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No albums yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create albums to organize this artist's content
                </p>
                <Button onClick={handleAddAlbum}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Album
                </Button>
              </CardContent>
            </Card>
          ) : (
            artistAlbums.map((album) => {
              const albumTrackIds = getMediaByAlbum(album.id);
              const albumTracks = albumTrackIds
                .map((id) => getTrackInfo(id))
                .filter(Boolean);

              return (
                <Card key={album.id}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {/* Album Cover */}
                      <div
                        className={cn(
                          'w-24 h-24 rounded-lg shrink-0 overflow-hidden',
                          !album.coverImage && `bg-gradient-to-br ${generateGradient(album.id)}`
                        )}
                      >
                        {album.coverImage ? (
                          <img
                            src={album.coverImage}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Disc className="h-10 w-10 text-white/50" />
                          </div>
                        )}
                      </div>

                      {/* Album Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{album.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Badge variant="outline">
                                {ALBUM_TYPES.find((t) => t.value === album.type)?.label || 'Album'}
                              </Badge>
                              <span>{albumTracks.length} tracks</span>
                              {album.releaseDate && <span>• {album.releaseDate}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {albumTracks.length > 0 && (
                              <Button
                                variant="spotify"
                                size="icon"
                                onClick={() => handlePlayAlbum(album)}
                              >
                                <Play className="h-5 w-5 ml-0.5" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAssignMedia(album)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Tracks
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditAlbum(album)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Album
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAlbum(album)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Album
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {album.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {album.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {albumTracks.length === 0 ? (
                      <div className="text-center py-6 border border-dashed rounded-lg">
                        <Music className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No tracks in this album</p>
                        <Button variant="outline" size="sm" onClick={() => handleAssignMedia(album)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Tracks
                        </Button>
                      </div>
                    ) : (
                      <DragDropContext onDragEnd={(result) => handleDragEnd(result, album.id)}>
                        <Droppable droppableId={album.id}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-1"
                            >
                              {albumTracks.map((track, index) => (
                                <Draggable key={track.id} draggableId={track.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        'flex items-center gap-3 p-2 rounded-lg group hover:bg-muted/50',
                                        snapshot.isDragging && 'bg-muted shadow-lg'
                                      )}
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        className="text-muted-foreground hover:text-foreground cursor-grab"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                      <span className="w-6 text-sm text-muted-foreground text-center">
                                        {index + 1}
                                      </span>
                                      <div
                                        className={cn(
                                          'w-10 h-10 rounded shrink-0',
                                          `bg-gradient-to-br ${generateGradient(track.id)}`
                                        )}
                                      >
                                        {track.thumbnail && (
                                          <img
                                            src={track.thumbnail}
                                            alt=""
                                            className="w-full h-full object-cover rounded"
                                          />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{track.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          {track.type === 'video' ? (
                                            <Film className="h-3 w-3" />
                                          ) : (
                                            <Music className="h-3 w-3" />
                                          )}
                                          <span>{track.type}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="iconSm"
                                          onClick={() => handlePlayTrack(track, albumTracks)}
                                        >
                                          <Play className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="iconSm"
                                          onClick={() => {
                                            removeMediaFromAlbum(track.id);
                                            addToast({ message: 'Track removed from album', type: 'success' });
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* All Tracks Tab */}
        <TabsContent value="tracks">
          <Card>
            <CardContent className="p-0">
              {artistMedia.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tracks assigned</h3>
                  <p className="text-muted-foreground">
                    Upload media and assign it to this artist
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {artistMedia.map((track, index) => {
                    const trackAlbum = artistAlbums.find(
                      (a) => a.id === mediaAlbumMap[track.id]
                    );
                    return (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 group"
                      >
                        <span className="w-8 text-sm text-muted-foreground text-center">
                          {index + 1}
                        </span>
                        <div
                          className={cn(
                            'w-10 h-10 rounded shrink-0',
                            `bg-gradient-to-br ${generateGradient(track.id)}`
                          )}
                        >
                          {track.thumbnail && (
                            <img
                              src={track.thumbnail}
                              alt=""
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{track.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {trackAlbum && (
                              <>
                                <Disc className="h-3 w-3" />
                                <span>{trackAlbum.title}</span>
                                <span>•</span>
                              </>
                            )}
                            <Badge variant={trackAlbum ? 'secondary' : 'outline'} className="text-xs">
                              {trackAlbum ? 'In Album' : 'Unassigned'}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={track.type === 'video' ? 'default' : 'secondary'}>
                          {track.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handlePlayTrack(track, artistMedia)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Album Dialog */}
      <Dialog open={showAddAlbumDialog} onOpenChange={setShowAddAlbumDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Album</DialogTitle>
            <DialogDescription>
              Create a new album for {artist.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={albumForm.title}
                onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                placeholder="Album title"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={albumForm.type}
                onValueChange={(value) => setAlbumForm({ ...albumForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ALBUM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Genre</Label>
              <Input
                value={albumForm.genre}
                onChange={(e) => setAlbumForm({ ...albumForm, genre: e.target.value })}
                placeholder="e.g., Spirituality, Jazz"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={albumForm.description}
                onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                placeholder="Album description"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={albumForm.coverImage}
                onChange={(e) => setAlbumForm({ ...albumForm, coverImage: e.target.value })}
                placeholder="https://example.com/cover.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Release Date</Label>
              <Input
                type="date"
                value={albumForm.releaseDate}
                onChange={(e) => setAlbumForm({ ...albumForm, releaseDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddAlbumDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewAlbum}>Create Album</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Album Dialog */}
      <Dialog open={showEditAlbumDialog} onOpenChange={setShowEditAlbumDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={albumForm.title}
                onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={albumForm.type}
                onValueChange={(value) => setAlbumForm({ ...albumForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALBUM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Genre</Label>
              <Input
                value={albumForm.genre}
                onChange={(e) => setAlbumForm({ ...albumForm, genre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={albumForm.description}
                onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={albumForm.coverImage}
                onChange={(e) => setAlbumForm({ ...albumForm, coverImage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Release Date</Label>
              <Input
                type="date"
                value={albumForm.releaseDate}
                onChange={(e) => setAlbumForm({ ...albumForm, releaseDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditAlbumDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditAlbum}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Album Dialog */}
      <Dialog open={showDeleteAlbumDialog} onOpenChange={setShowDeleteAlbumDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Album</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAlbum?.title}"?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            The tracks in this album will not be deleted, but they will become unassigned.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteAlbumDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAlbum}>
              Delete Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Media Dialog */}
      <Dialog open={showAssignMediaDialog} onOpenChange={setShowAssignMediaDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Tracks to {selectedAlbum?.title}</DialogTitle>
            <DialogDescription>
              Select tracks to add to this album
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {mediaLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : allMedia.length === 0 ? (
              <div className="text-center py-8">
                <Music className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No media available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {allMedia
                  .filter((m) => !mediaAlbumMap[m.id]) // Show only unassigned
                  .map((media) => (
                    <div
                      key={media.id}
                      onClick={() => toggleMediaSelection(media.id)}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                        selectedMediaIds.includes(media.id)
                          ? 'bg-primary/20 border border-primary'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <Checkbox
                        checked={selectedMediaIds.includes(media.id)}
                        onCheckedChange={() => toggleMediaSelection(media.id)}
                      />
                      <div
                        className={cn(
                          'w-10 h-10 rounded shrink-0',
                          `bg-gradient-to-br ${generateGradient(media.id)}`
                        )}
                      >
                        {media.thumbnail && (
                          <img
                            src={media.thumbnail}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{media.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {media.subtitle || 'No description'}
                        </p>
                      </div>
                      <Badge variant={media.type === 'video' ? 'default' : 'secondary'}>
                        {media.type}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedMediaIds.length} tracks selected
            </div>
            <Button variant="ghost" onClick={() => setShowAssignMediaDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAssignMedia} disabled={selectedMediaIds.length === 0}>
              <Check className="mr-2 h-4 w-4" />
              Add to Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Artist Dialog */}
      <Dialog open={showEditArtistDialog} onOpenChange={setShowEditArtistDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Artist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={artistForm.name}
                onChange={(e) => setArtistForm({ ...artistForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Genre</Label>
              <Input
                value={artistForm.genre}
                onChange={(e) => setArtistForm({ ...artistForm, genre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Biography</Label>
              <Textarea
                value={artistForm.bio}
                onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={artistForm.image}
                onChange={(e) => setArtistForm({ ...artistForm, image: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={artistForm.website}
                onChange={(e) => setArtistForm({ ...artistForm, website: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditArtistDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditArtist}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Artist Dialog */}
      <Dialog open={showDeleteArtistDialog} onOpenChange={setShowDeleteArtistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Artist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{artist.name}"?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            This will delete all albums associated with this artist.
            Media files will not be deleted but will become unassigned.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteArtistDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteArtist}>
              Delete Artist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
