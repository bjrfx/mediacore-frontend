import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Shield,
  Clock,
  Mail,
  MoreVertical,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { formatDate, cn } from '../../lib/utils';
import { ScrollArea } from '../../components/ui/scroll-area';

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  // Fetch users
  const {
    data: usersData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getUsers(),
  });

  const users = usersData?.data?.users || [];

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query) ||
      user.uid?.toLowerCase().includes(query)
    );
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const getInitials = (name, email) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || '?';
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-muted-foreground">
            View and manage Firebase authenticated users
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={cn('h-4 w-4 mr-2', isRefetching && 'animate-spin')}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Users',
            value: users.length,
            icon: Users,
            color: 'text-blue-500',
          },
          {
            title: 'Verified',
            value: users.filter((u) => u.emailVerified).length,
            icon: UserCheck,
            color: 'text-green-500',
          },
          {
            title: 'Unverified',
            value: users.filter((u) => !u.emailVerified).length,
            icon: UserX,
            color: 'text-orange-500',
          },
          {
            title: 'Disabled',
            value: users.filter((u) => u.disabled).length,
            icon: Shield,
            color: 'text-red-500',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                {isLoading ? (
                  <Skeleton className="h-16" />
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <span className="text-sm text-muted-foreground">
                        {stat.title}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users list */}
      <Card>
        <CardHeader>
          <CardTitle>
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="space-y-4 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'No users found matching your search'
                    : 'No users registered yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL} alt={user.displayName} />
                      <AvatarFallback>
                        {getInitials(user.displayName, user.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.displayName || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                      {user.emailVerified ? (
                        <Badge variant="success" className="text-xs">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Unverified
                        </Badge>
                      )}
                      {user.disabled && (
                        <Badge variant="destructive" className="text-xs">
                          Disabled
                        </Badge>
                      )}
                    </div>

                    <div className="hidden lg:flex flex-col items-end text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(user.metadata?.lastSignInTime)}
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(user.uid)}
                        >
                          Copy UID
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(user.email)}
                        >
                          Copy Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User details dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User avatar and name */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedUser.photoURL}
                    alt={selectedUser.displayName}
                  />
                  <AvatarFallback className="text-xl">
                    {getInitials(
                      selectedUser.displayName,
                      selectedUser.email
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">
                    {selectedUser.displayName || 'Unknown'}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {selectedUser.emailVerified ? (
                      <Badge variant="success" className="text-xs">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Unverified
                      </Badge>
                    )}
                    {selectedUser.disabled && (
                      <Badge variant="destructive" className="text-xs">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* User info grid */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Email
                  </label>
                  <p className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedUser.email}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">
                    UID
                  </label>
                  <p className="mt-1 font-mono text-sm break-all">
                    {selectedUser.uid}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Created
                    </label>
                    <p className="mt-1 text-sm">
                      {formatDate(selectedUser.metadata?.creationTime)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Last Sign In
                    </label>
                    <p className="mt-1 text-sm">
                      {formatDate(selectedUser.metadata?.lastSignInTime) ||
                        'Never'}
                    </p>
                  </div>
                </div>

                {selectedUser.providerData && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Sign-in Providers
                    </label>
                    <div className="flex gap-2 mt-2">
                      {selectedUser.providerData.map((provider) => (
                        <Badge
                          key={provider.providerId}
                          variant="secondary"
                        >
                          {provider.providerId.replace('.com', '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUser.uid);
                  }}
                >
                  Copy UID
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUser.email);
                  }}
                >
                  Copy Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
