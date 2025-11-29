import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Camera, 
  MapPin, 
  X, 
  Plus, 
  Loader2,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

// Image preview component
const ImagePreview = ({ src, onRemove, index }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative aspect-square rounded-xl overflow-hidden group"
    >
      <img
        src={src}
        alt={`Attachment ${index + 1}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// Camera capture component
const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
      onClose();
    }
  }, [onClose]);
  
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);
  
  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);
  
  const capturePhoto = () => {
    if (videoRef.current && isReady) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setCapturedImage({ blob, url });
      }, 'image/jpeg', 0.9);
    }
  };
  
  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage.blob);
      stopCamera();
      onClose();
    }
  };
  
  const retake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
          </>
        ) : (
          <img
            src={capturedImage.url}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      <div className="flex items-center justify-center gap-4">
        {!capturedImage ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={capturePhoto}
              disabled={!isReady}
              className="w-16 h-16 rounded-full bg-white border-4 border-primary flex items-center justify-center disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-primary" />
            </motion.button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={retake}>
              Retake
            </Button>
            <Button onClick={confirmCapture}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Use Photo
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// Location picker component
const LocationPicker = ({ location, onChange, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState(location);
  
  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding using Nominatim (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      
      const locationData = {
        name: data.display_name?.split(',').slice(0, 3).join(',') || 'Current Location',
        lat: latitude,
        lng: longitude,
        fullAddress: data.display_name,
      };
      
      setCurrentLocation(locationData);
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Could not get your location. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = () => {
    onChange(currentLocation);
    onClose();
  };
  
  const handleClear = () => {
    setCurrentLocation(null);
    onChange(null);
    onClose();
  };
  
  return (
    <div className="space-y-4">
      {/* Current Location Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={getCurrentLocation}
        disabled={isLoading}
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <Navigation className="w-5 h-5 text-primary" />
          )}
        </div>
        <div>
          <p className="font-medium">Use Current Location</p>
          <p className="text-sm text-muted-foreground">Automatically detect your location</p>
        </div>
      </motion.button>
      
      {/* Current selection */}
      {currentLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-secondary/50 space-y-2"
        >
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{currentLocation.name}</p>
              {currentLocation.fullAddress && (
                <p className="text-sm text-muted-foreground truncate">
                  {currentLocation.fullAddress}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {currentLocation && (
          <Button variant="ghost" onClick={handleClear}>
            Remove Location
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!currentLocation}>
          Save Location
        </Button>
      </div>
    </div>
  );
};

export default function MediaPicker({ 
  images = [], 
  location,
  onAddImage, 
  onRemoveImage,
  onLocationChange,
  maxImages = 10 
}) {
  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (images.length >= maxImages) break;
      
      if (file.type.startsWith('image/')) {
        onAddImage?.(file);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleCameraCapture = (blob) => {
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    onAddImage?.(file);
  };
  
  return (
    <div className="space-y-4">
      {/* Image grid */}
      {images.length > 0 && (
        <motion.div layout className="grid grid-cols-3 gap-2">
          <AnimatePresence mode="popLayout">
            {images.map((image, index) => (
              <ImagePreview
                key={image.id}
                src={image.url}
                index={index}
                onRemove={() => onRemoveImage?.(image.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Location badge */}
      {location && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm"
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground truncate">{location.name}</span>
          <button
            onClick={() => onLocationChange?.(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
      
      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ImageIcon className="w-4 h-4" />
          Add Photo
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCamera(true)}
          disabled={images.length >= maxImages}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Camera className="w-4 h-4" />
          Camera
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLocation(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            location
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          <MapPin className="w-4 h-4" />
          {location ? 'Edit Location' : 'Add Location'}
        </motion.button>
      </div>
      
      {/* Camera Dialog */}
      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Take a Photo</DialogTitle>
          </DialogHeader>
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Location Dialog */}
      <Dialog open={showLocation} onOpenChange={setShowLocation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>
          <LocationPicker
            location={location}
            onChange={onLocationChange}
            onClose={() => setShowLocation(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Compact location display
export function LocationBadge({ location, onClick }) {
  if (!location) return null;
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <MapPin className="w-3.5 h-3.5" />
      <span className="truncate max-w-[200px]">{location.name}</span>
    </motion.button>
  );
}
