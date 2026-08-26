'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Users, Folder, Trash2, LogIn, Eye, EyeOff, ShieldAlert, Layers, Download } from 'lucide-react';
import type { Project } from '@/lib/types';
import { NavigationFooter } from '@/components/navigation-footer';
import { PwaInstallDialog } from '@/components/pwa-install-dialog';

const ADMIN_PASSWORD = 'admin123';

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);

  const [companyName, setCompanyName] = useLocalStorage('companyName', '');
  const [newCompanyName, setNewCompanyName] = useState(companyName);
  
  const [registeredUsers, setRegisteredUsers] = useLocalStorage<any>('registeredUsers', { 'User1': 'password' });
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);

  useEffect(() => {
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
      const updatedUsers = { ...registeredUsers };
      delete updatedUsers[userId];
      setRegisteredUsers(updatedUsers);

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
      <div className="flex min-h-screen flex-col justify-between">
        {/* Frosted Glass Header */}
        <header className="w-full glass-header px-4 py-3 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <Button onClick={() => router.push('/')} variant="ghost" size="sm" className="gap-2 text-primary font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <Badge variant="outline" className="glass-badge text-primary text-xs">
            Admin Portal
          </Badge>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="text-center pb-2">
                <div className="p-3 w-fit mx-auto rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-2 shadow-sm">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-extrabold text-primary tracking-tight">Admin Access</h2>
                <p className="text-xs text-muted-foreground mt-1">Enter the master password to access system administration.</p>
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="admin-password" className="text-xs font-semibold">Password</Label>
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="bg-white/70 border-white/60 shadow-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-6 h-7 w-7 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <Button type="submit" className="w-full gap-2 font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground">
                <LogIn className="h-4 w-4" /> Authenticate
              </Button>
            </form>
          </div>
        </main>

        <NavigationFooter showAdmin={false} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* Frosted Glass Header */}
      <header className="w-full glass-header px-4 py-3 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-[#023b4f] text-primary-foreground shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-foreground">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/')} variant="outline" size="sm" className="gap-1.5 text-xs bg-white/60 border-white/70 shadow-sm font-semibold">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Global Settings */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-6 space-y-4 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-foreground">Global Organization Settings</h2>
              <p className="text-xs text-muted-foreground">Configure global defaults applied across new material projects.</p>
            </div>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs font-semibold">Default Company / Studio Name</Label>
                <Input
                  id="companyName"
                  placeholder="Enter your architectural firm name"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  className="bg-white/70 border-white/60 shadow-sm max-w-lg"
                />
              </div>
              <Button onClick={handleSaveSettings} className="gap-2 font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="h-4 w-4" /> Save Settings
              </Button>
            </div>
          </div>

          {/* User Management */}
          <div className="lg:col-span-1 glass-card rounded-2xl p-6 space-y-4 shadow-xl">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Users className="h-5 w-5 text-primary" /> User Management
              </h2>
              <p className="text-xs text-muted-foreground">Inspect and purge registered users.</p>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {Object.keys(registeredUsers).length > 0 ? (
                Object.keys(registeredUsers).map(userId => (
                  <div key={userId} className="flex items-center justify-between p-2.5 rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm text-sm shadow-sm">
                    <span className="font-mono font-semibold text-xs">{userId}</span>
                    <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg" onClick={() => deleteUser(userId)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-xs py-4 text-center">No registered users.</p>
              )}
            </div>
          </div>

          {/* Project Management */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-4 shadow-xl">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Folder className="h-5 w-5 text-primary" /> Project Management
              </h2>
              <p className="text-xs text-muted-foreground">View, launch, or purge any material schedule in the workspace.</p>
            </div>
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {projects.length > 0 ? (
                projects.map(project => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm gap-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">{project.name}</span>
                      <span className="text-xs text-muted-foreground">Owner: {project.owner} | Date: {project.date}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-white/80 border-white/80 shadow-sm text-xs" onClick={() => router.push(`/project/${project.id}`)}>
                        Open
                      </Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg" onClick={() => deleteProject(project.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-xs py-4 text-center">No projects exist.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <NavigationFooter showAdmin={false} />
      <PwaInstallDialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen} />
    </div>
  );
}
