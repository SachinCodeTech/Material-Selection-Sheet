'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Users, Folder, Trash2, LogIn, Eye, EyeOff } from 'lucide-react';
import type { Project } from '@/lib/types';

const ADMIN_PASSWORD = 'admin123';

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [companyName, setCompanyName] = useLocalStorage('companyName', '');
  const [newCompanyName, setNewCompanyName] = useState(companyName);
  
  const [registeredUsers, setRegisteredUsers] = useLocalStorage<any>('registeredUsers', { 'User1': 'password' });
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);

  useEffect(() => {
    // Check session storage to see if admin is already authenticated
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);
  
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      toast({ title: 'Admin login successful.' });
    } else {
      toast({ title: 'Invalid admin password.', variant: 'destructive' });
    }
    setPassword('');
  };

  const handleSaveSettings = () => {
    setCompanyName(newCompanyName);
    toast({ title: 'Settings Saved!', description: 'The default company name has been updated.' });
  };

  const deleteUser = (userId: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userId}" and all their projects? This cannot be undone.`)) {
      // Delete user
      const updatedUsers = { ...registeredUsers };
      delete updatedUsers[userId];
      setRegisteredUsers(updatedUsers);

      // Delete user's projects
      const updatedProjects = projects.filter(p => p.owner !== userId);
      setProjects(updatedProjects);
      
      toast({ title: 'User Deleted', description: `User ${userId} and their projects have been deleted.` });
    }
  };

  const deleteProject = (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (window.confirm(`Are you sure you want to delete project "${projectToDelete?.name}"?`)) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      toast({ title: 'Project Deleted' });
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Button onClick={() => router.push('/')} variant="ghost" className="absolute top-4 left-4 text-primary">
          <ArrowLeft className="mr-2" /> Back to Login
        </Button>
        <Card className="w-full max-w-sm">
          <form onSubmit={handleAdminLogin}>
            <CardHeader>
              <CardTitle className="text-primary">Admin Access</CardTitle>
              <CardDescription>Enter the password to access the admin dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 relative">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                <LogIn className="mr-2" /> Authenticate
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-start p-4 sm:p-6 lg:p-8 bg-background gap-6">
       <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
        <Button onClick={() => router.push('/')} variant="outline" size="sm">
          <ArrowLeft className="mr-2" /> Back to Login
        </Button>
       </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Global Settings */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Global Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Default Company Name</Label>
              <Input
                id="companyName"
                placeholder="Enter your company name"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveSettings}>
              <Save className="mr-2" /> Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> User Management</CardTitle>
            <CardDescription>View and manage all registered users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {Object.keys(registeredUsers).length > 0 ? Object.keys(registeredUsers).map(userId => (
              <div key={userId} className="flex items-center justify-between p-2 border rounded-md">
                <span className="font-mono text-sm">{userId}</span>
                <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteUser(userId)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            )) : <p className="text-muted-foreground text-sm">No registered users.</p>}
          </CardContent>
        </Card>

        {/* Project Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Folder /> Project Management</CardTitle>
            <CardDescription>View, open, and delete any project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {projects.length > 0 ? projects.map(project => (
              <div key={project.id} className="flex items-center justify-between p-2 border rounded-md gap-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{project.name}</span>
                  <span className="text-xs text-muted-foreground">Owner: {project.owner}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/project/${project.id}`)}>Open</Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteProject(project.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )) : <p className="text-muted-foreground text-sm">No projects exist.</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
