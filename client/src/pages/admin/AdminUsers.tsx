import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Search,
  UserCheck,
  Shield,
  Users as UsersIcon,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import type { User } from "@shared/schema";

function AdminUsersContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  
  const authenticatedFetch = useAuthenticatedFetch();

  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json() as Promise<User[]>;
    }
  });

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage user accounts</p>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalUsers = users?.length || 0;
  const adminUsers = users?.filter(u => u.role === 'admin').length || 0;
  const regularUsers = users?.filter(u => u.role === 'user').length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-admin-users">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-users">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-admin-users">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">Admin accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-regular-users">{regularUsers}</div>
            <p className="text-xs text-muted-foreground">Customer accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
                data-testid="input-search-users"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            {totalUsers === 0 ? (
              "No users found. Users will appear here as they register for accounts."
            ) : (
              `Manage user accounts and view user information.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalUsers === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Yet</h3>
              <p className="text-muted-foreground mb-4">
                User accounts will appear here as customers register for your store.
              </p>
              <p className="text-sm text-muted-foreground">
                Users can register by creating an account during checkout or through the registration page.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {user.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {user.phoneNumber || 'Not provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`menu-user-${user.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => viewUserDetails(user)}
                            data-testid={`view-user-${user.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for user account
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedUser.profileImageUrl || undefined} />
                      <AvatarFallback className="text-lg">
                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.role === 'admin' ? 'Administrator' : 'Customer'}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p>{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p>{selectedUser.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">User ID</label>
                      <p className="font-mono text-sm">{selectedUser.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Role</label>
                      <p>
                        <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                          {selectedUser.role === 'admin' ? 'Administrator' : 'User'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Joined</label>
                      <p>{selectedUser.createdAt ? format(new Date(selectedUser.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p>{selectedUser.updatedAt ? format(new Date(selectedUser.updatedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Account Status:</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email Verified:</span>
                      <Badge variant="default">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Two-Factor Authentication:</span>
                      <Badge variant="secondary">Disabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminUsers() {
  return (
    <AdminRoute>
      <AdminUsersContent />
    </AdminRoute>
  );
}