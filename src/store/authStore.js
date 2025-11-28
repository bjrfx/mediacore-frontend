import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, isAdmin } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isAdminUser: false,

      setUser: (user) => {
        const adminStatus = user ? isAdmin(user.email) : false;
        console.log('Auth setUser:', { email: user?.email, isAdmin: adminStatus, adminEmail: process.env.REACT_APP_ADMIN_EMAIL });
        
        set({
          user: user
            ? {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              }
            : null,
          isAuthenticated: !!user,
          isAdminUser: adminStatus,
          isLoading: false,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isAdminUser: false,
        });
      },

      // Initialize auth listener
      initAuthListener: () => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          get().setUser(user);
        });
        return unsubscribe;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdminUser: state.isAdminUser,
      }),
    }
  )
);

export default useAuthStore;
