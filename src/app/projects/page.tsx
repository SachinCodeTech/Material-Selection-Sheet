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
import { useToast } from '@/hooks/use-toast';
import { Plus, ArrowLeft } from 'lucide-react';

export default function ProjectSelectPage() {
  const router = useRouter();
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [currentUser] = useLocalStorage<string | null>('currentUser', null);
  const [companyName] = useLocalStorage<string>('companyName', 'Your Company');
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
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
    // Clear session-based admin auth
    sessionStorage.removeItem('isAdminAuthenticated');
    router.push('/');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Button onClick={handleLogout} variant="ghost" className="absolute top-4 left-4 text-primary"><ArrowLeft className="mr-2" /> Back to Login</Button>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-primary">Project Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-primary">Create New Project</h3>
            <div className="space-y-2 p-4 border rounded-md">
              <Input
                placeholder="Enter new project name"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
              />
              <Button onClick={handleCreateProject} className="w-full"><Plus className="mr-2" /> New Project</Button>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-primary">Load Existing Project</h3>
            <Label htmlFor="projectList">
              {`Select Project (${currentUser}'s projects):`}
            </Label>
            <Select onValueChange={setSelectedProject} value={selectedProject}>
              <SelectTrigger id="projectList">
                <SelectValue placeholder="-- Select Project --" />
              </SelectTrigger>
              <SelectContent>
                {visibleProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                        {p.name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleLoadProject} disabled={!selectedProject}>📂 Load Project</Button>
              <Button className="flex-1" variant="destructive" onClick={handleDeleteProject} disabled={!selectedProject}>🗑 Delete Project</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
