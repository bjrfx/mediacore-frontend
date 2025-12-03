import React, { useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store';
import useSubscriptionStore from '../../store/subscriptionStore';
import usePlayerStore from '../../store/playerStore';
import { userApi } from '../../services/api';
import {
  UpgradeModal,
  TimeLimitModal,
  LoginPromptModal,
  LanguageRestrictionModal,
} from '../subscription';
import { SUBSCRIPTION_TIERS } from '../../config/subscription';

/**
 * SubscriptionProvider
 * Wraps the app and handles subscription state, enforcement, and modals
 */
export default function SubscriptionProvider({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  const {
    setTierFromAuth,
    showUpgradeModal,
    showTimeLimitModal,
    showLoginModal,
    showLanguageRestrictionModal,
    upgradeReason,
    closeModal,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    checkAndResetLimits,
  } = useSubscriptionStore();
  
  const { isPlaying, currentTrack, pause } = usePlayerStore();

  // Sync subscription tier with auth state
  useEffect(() => {
    const fetchSubscription = async () => {
      if (isAuthenticated && user) {
        try {
          // Try to fetch user's subscription from API
          const response = await userApi.getMySubscription();
          // Handle both response formats: response.data.subscriptionTier or response.subscriptionTier
          const tier = response?.data?.subscriptionTier || response?.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
          console.log('[Subscription] Fetched tier:', tier);
          setTierFromAuth(true, tier);
        } catch (error) {
          // If API fails, default to free tier for authenticated users
          console.log('[Subscription] Failed to fetch subscription, defaulting to free tier:', error.message);
          setTierFromAuth(true, SUBSCRIPTION_TIERS.FREE);
        }
      } else {
        // Not authenticated = guest tier
        setTierFromAuth(false, null);
      }
    };

    fetchSubscription();
  }, [isAuthenticated, user, setTierFromAuth]);

  // Check and reset limits periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndResetLimits();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkAndResetLimits]);

  // Handle playback tracking based on player state
  useEffect(() => {
    if (isPlaying && currentTrack) {
      startTracking();
    } else {
      pauseTracking();
    }
  }, [isPlaying, currentTrack, startTracking, pauseTracking]);

  // CRITICAL: Pause playback when any restriction modal shows
  useEffect(() => {
    if (showTimeLimitModal || showLoginModal || showLanguageRestrictionModal) {
      if (isPlaying) {
        pause();
        stopTracking();
      }
    }
  }, [showTimeLimitModal, showLoginModal, showLanguageRestrictionModal, isPlaying, pause, stopTracking]);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Handle modal closes
  const handleUpgradeClose = useCallback((open) => {
    if (!open) closeModal('upgrade');
  }, [closeModal]);

  const handleTimeLimitClose = useCallback((open) => {
    if (!open) closeModal('timeLimit');
  }, [closeModal]);

  const handleLoginClose = useCallback((open) => {
    if (!open) closeModal('login');
  }, [closeModal]);

  const handleLanguageClose = useCallback((open) => {
    if (!open) closeModal('language');
  }, [closeModal]);

  return (
    <>
      {children}

      {/* Subscription Modals */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={handleUpgradeClose}
        reason={upgradeReason}
      />

      <TimeLimitModal
        open={showTimeLimitModal}
        onOpenChange={handleTimeLimitClose}
      />

      <LoginPromptModal
        open={showLoginModal}
        onOpenChange={handleLoginClose}
      />

      <LanguageRestrictionModal
        open={showLanguageRestrictionModal}
        onOpenChange={handleLanguageClose}
      />
    </>
  );
}
