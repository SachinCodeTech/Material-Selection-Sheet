'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, ArrowLeft, FolderOpen, Trash2, Layers, Download, Sparkles } from 'lucide-react';
import { NavigationFooter } from '@/components/navigation-footer';
import { PwaInstallDialog } from '@/components/pwa-install-dialog';

export default function ProjectSelectPage() {
  const router = useRouter();
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [currentUser] = useLocalStorage<string | null>('currentUser', null);
  const [companyName] = useLocalStorage<string>('companyName', 'Your Company');
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const { toast } = useToast();
  const [visibleProjects, setVisibleProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }
    
    // Regular user sees only their own projects
    setVisibleProjects(projects.filter(p => p.owner === currentUser));
  }, [projects, currentUser, router]);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({ title: 'Project name cannot be empty.', variant: 'destructive' });
      return;
    }
    
    // Check for duplicate project names for the current user
    const userProjects = projects.filter(p => p.owner === currentUser);
    const isDuplicate = userProjects.some(p => p.name.toLowerCase() === newProjectName.trim().toLowerCase());

    if (isDuplicate) {
      toast({
        title: 'Project Name Exists',
        description: 'A project with this name already exists. Please choose a different name.',
        variant: 'destructive',
      });
      return;
    }

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName.trim(),
      companyName: companyName,
      lastModified: new Date().toISOString(),
      sections: [],
      date: new Date().toISOString().split('T')[0],
      owner: currentUser,
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    router.push(`/project/${newProject.id}`);
  };

  const handleLoadProject = () => {
    if (selectedProject) {
      router.push(`/project/${selectedProject}`);
    } else {
      toast({ title: 'Please select a project to load.', variant: 'destructive' });
    }
  };

  const handleDeleteProject = () => {
    if (!selectedProject) {
      toast({ title: 'Please select a project to delete.', variant: 'destructive' });
      return;
    }

    const projectToDelete = projects.find(p => p.id === selectedProject);

    if (window.confirm(`Are you sure you want to delete project "${projectToDelete?.name}"?`)) {
      setProjects(prev => prev.filter(p => p.id !== selectedProject));
      setSelectedProject('');
      toast({ title: 'Project deleted.' });
    }
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* Frosted Glass Header */}
      <header className="w-full glass-header px-4 py-3 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2 text-primary font-semibold">
          <ArrowLeft className="h-4 w-4" />
          <span>Home</span>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="glass-badge text-primary text-xs font-mono">
            User: {currentUser}
          </Badge>
        </div>
      </header>

      {/* Main Glassmorphic Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md glass-card rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl">
          <div className="space-y-1 text-center pb-1">
            <div className="p-3 w-fit mx-auto rounded-2xl bg-gradient-to-br from-primary to-[#023b4f] text-primary-foreground shadow-md mb-2">
              <Layers className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Project Management</h2>
            <p className="text-xs text-muted-foreground">
              Create a new material schedule or load an existing project for <strong className="text-foreground">{currentUser}</strong>.
            </p>
          </div>

          <div className="space-y-5">
            {/* Create Project Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Create New Project</h3>
              <div className="space-y-2.5 p-4 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md shadow-sm">
                <Input
                  placeholder="Enter project name (e.g., Villa 402, Loft Redesign)"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateProject();
                  }}
                  className="bg-white/70 border-white/60 shadow-inner"
                />
                <Button onClick={handleCreateProject} className="w-full gap-2 font-semibold shadow-md bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" /> New Project
                </Button>
              </div>
            </div>

            {/* Load Existing Project */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Load Existing Project</h3>
              <div className="space-y-3 p-4 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md shadow-sm">
                <Label htmlFor="projectList" className="text-xs text-muted-foreground">
                  {`Select from ${visibleProjects.length} saved project${visibleProjects.length === 1 ? '' : 's'}:`}
                </Label>
                <Select onValueChange={setSelectedProject} value={selectedProject}>
                  <SelectTrigger id="projectList" className="bg-white/70 border-white/60">
                    <SelectValue placeholder="-- Select Project --" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel">
                    {visibleProjects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 gap-1.5 font-semibold"
                    onClick={handleLoadProject}
                    disabled={!selectedProject}
                  >
                    <FolderOpen className="h-4 w-4" /> Load Project
                  </Button>
                  <Button
                    className="flex-1 gap-1.5"
                    variant="destructive"
                    onClick={handleDeleteProject}
                    disabled={!selectedProject}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <NavigationFooter />
      <PwaInstallDialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen} />
    </div>
  );
}
