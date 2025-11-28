import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronLeft, ChevronRight, Bell, User, LogOut, Settings, Shield } from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { signInWithGoogle, logOut } from '../../config/firebase';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function Header() {
  const navigate = useNavigate();
  const { toggleMobileSidebar } = useUIStore();
  const { user, isAuthenticated, isAdminUser } = useAuthStore();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-md">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileSidebar}
          className="lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Navigation arrows */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full bg-black/40 hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(1)}
            className="rounded-full bg-black/40 hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative flex items-center gap-2 rounded-full bg-black/40 hover:bg-black/60 pr-4"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                    <AvatarFallback>
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block font-medium text-sm">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                  {isAdminUser && (
                    <Shield className="h-4 w-4 text-primary ml-1" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.displayName || 'User'}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {user?.email}
                    </span>
                    {isAdminUser && (
                      <span className="text-xs text-primary font-medium mt-1">
                        Admin Account
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                {isAdminUser && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleSignIn}>
              Sign up
            </Button>
            <Button variant="spotify" onClick={handleSignIn}>
              Log in
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
