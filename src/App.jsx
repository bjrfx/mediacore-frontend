import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { auth } from './config/firebase';
import { useAuthStore } from './store';

// Layout
import { MainLayout } from './components/layout';

// Auth components
import { LoginModal, ProtectedRoute } from './components/auth';

// Player
import { VideoPlayer } from './components/player';

// PWA
import { InstallPrompt } from './components/pwa';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Library = lazy(() => import('./pages/Library'));
const PlaylistDetail = lazy(() => import('./pages/PlaylistDetail'));
const LikedSongs = lazy(() => import('./pages/LikedSongs'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const MediaPlayer = lazy(() => import('./pages/MediaPlayer'));
const ArtistPage = lazy(() => import('./pages/ArtistPage'));
const AlbumPage = lazy(() => import('./pages/AlbumPage'));
const ArtistsPage = lazy(() => import('./pages/ArtistsPage'));
const Downloads = lazy(() => import('./pages/Downloads'));


// Admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'));
const AdminUpload = lazy(() => import('./pages/admin/AdminUpload'));
const AdminApiKeys = lazy(() => import('./pages/admin/AdminApiKeys'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminArtists = lazy(() => import('./pages/admin/AdminArtists'));
const AdminArtistDetail = lazy(() => import('./pages/admin/AdminArtistDetail'));

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </motion.div>
  </div>
);

// Not found page
const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
    <p className="mt-4 text-xl text-muted-foreground">Page not found</p>
    <a
      href="/"
      className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
    >
      Go Home
    </a>
  </div>
);

// Main app routes with animation
function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Main app routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="library" element={<Library />} />
            <Route path="artists" element={<ArtistsPage />} />
            <Route path="artist/:artistId" element={<ArtistPage />} />
            <Route path="album/:albumId" element={<AlbumPage />} />
            <Route path="playlist/:id" element={<PlaylistDetail />} />
            <Route path="liked" element={<LikedSongs />} />
            <Route path="downloads" element={<Downloads />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="play/:id" element={<MediaPlayer />} />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="upload" element={<AdminUpload />} />
            <Route path="artists" element={<AdminArtists />} />
            <Route path="artists/:artistId" element={<AdminArtistDetail />} />
            <Route path="api-keys" element={<AdminApiKeys />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

// Main App component
function App() {
  const { setUser, setLoading } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  // Listen for login modal trigger
  useEffect(() => {
    const handleShowLogin = () => setShowLoginModal(true);
    window.addEventListener('show-login-modal', handleShowLogin);
    return () => window.removeEventListener('show-login-modal', handleShowLogin);
  }, []);

  // Listen for video player trigger
  useEffect(() => {
    const handleShowVideo = () => setShowVideoPlayer(true);
    window.addEventListener('show-video-player', handleShowVideo);
    return () => window.removeEventListener('show-video-player', handleShowVideo);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <AppRoutes />

          {/* Login Modal */}
          <LoginModal
            open={showLoginModal}
            onOpenChange={setShowLoginModal}
          />

          {/* Video Player */}
          <AnimatePresence>
            {showVideoPlayer && (
              <VideoPlayer onClose={() => setShowVideoPlayer(false)} />
            )}
          </AnimatePresence>

          {/* PWA Install Prompt */}
          <InstallPrompt />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
