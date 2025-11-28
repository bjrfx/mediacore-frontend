import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings as SettingsIcon, Palette, Bell, Shield, Download, Info } from 'lucide-react';
import { publicApi } from '../services/api';
import { useAuthStore, useUIStore } from '../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

export default function Settings() {
  const { user, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useUIStore();

  // Fetch app settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => publicApi.getSettings(),
    enabled: true,
  });

  const settings = settingsData?.data || {};

  return (
    <div className="min-h-full px-6 py-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Customize your experience
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how MediaCore looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for the interface
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Playback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Playback
            </CardTitle>
            <CardDescription>
              Configure playback settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autoplay</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically play similar content when queue ends
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Crossfade</Label>
                <p className="text-sm text-muted-foreground">
                  Smooth transition between tracks
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Downloads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Offline Mode
            </CardTitle>
            <CardDescription>
              Manage offline playback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Offline Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Cache played media for offline access
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-2">
                Cached data: ~0 MB
              </p>
              <Button variant="outline" size="sm">
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Display Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.displayName || 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>App Name: {settings.appName || 'MediaCore'}</p>
                <p>Version: {settings.version || '1.0.0'}</p>
                <p className="pt-4">
                  MediaCore - Premium Audio & Video Streaming Platform
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
