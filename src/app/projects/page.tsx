'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, isValid, parseISO } from 'date-fns';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  ArrowLeft,
  FolderOpen,
  Trash2,
  Layers,
  AlertTriangle,
  Search,
  X,
  ArrowUpDown,
  Clock,
  FolderKanban,
  FileSpreadsheet,
} from 'lucide-react';
import { NavigationFooter } from '@/components/navigation-footer';
import { PWAInstallButton } from '@/components/pwa-install-button';

type SortOption = 'created-desc' | 'created-asc' | 'name-asc' | 'name-desc';

function parseDateValue(value?: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
}

function getCreatedTimestamp(project: Project): number {
  const dateObj =
    parseDateValue(project.createdAt) ||
    parseDateValue(project.date) ||
    parseDateValue(project.lastModified);
  return dateObj ? dateObj.getTime() : 0;
}

function getModifiedTimestamp(project: Project): number {
  const dateObj =
    parseDateValue(project.lastModified) ||
    parseDateValue(project.createdAt) ||
    parseDateValue(project.date);
  return dateObj ? dateObj.getTime() : 0;
}

function formatDisplayDate(value?: string, includeTime = false): string {
  const dateObj = parseDateValue(value);
  if (!dateObj) return '—';
  return includeTime ? format(dateObj, 'MMM d, yyyy · h:mm a') : format(dateObj, 'MMM d, yyyy');
}

export default function ProjectSelectPage() {
  const router = useRouter();
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [currentUser, setCurrentUser] = useLocalStorage<string | null>('currentUser', null);
  const [companyName] = useLocalStorage<string>('companyName', 'Your Company');
  const [newProjectName, setNewProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created-desc');
  const [projectPendingDelete, setProjectPendingDelete] = useState<Project | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Verify session with server-side auth cookie
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated && !currentUser) {
          router.push('/');
        } else if (data.authenticated && data.user && data.user !== currentUser) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {
        if (!currentUser) router.push('/');
      });

    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser, router, setCurrentUser]);

  // All projects owned by the active user
  const userProjects = useMemo(
    () => projects.filter((p) => p.owner === currentUser),
    [projects, currentUser]
  );

  // Summary metrics derived from all owned projects
  const summaryStats = useMemo(() => {
    const totalCount = userProjects.length;
    const totalSections = userProjects.reduce((acc, p) => acc + (p.sections?.length || 0), 0);

    let mostRecentProject: Project | null = null;
    let latestTime = -1;

    for (const project of userProjects) {
      const modTime = getModifiedTimestamp(project);
      if (modTime > latestTime) {
        latestTime = modTime;
        mostRecentProject = project;
      }
    }

    return {
      totalCount,
      totalSections,
      mostRecentProject,
      lastModifiedLabel: mostRecentProject
        ? formatDisplayDate(mostRecentProject.lastModified, true)
        : 'No activity yet',
    };
  }, [userProjects]);

  // Filtered by search query and sorted by Name or Date Created
  const filteredAndSortedProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = normalizedQuery
      ? userProjects.filter((p) => p.name.toLowerCase().includes(normalizedQuery))
      : userProjects;

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'name-desc':
          return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'created-asc':
          return getCreatedTimestamp(a) - getCreatedTimestamp(b);
        case 'created-desc':
        default:
          return getCreatedTimestamp(b) - getCreatedTimestamp(a);
      }
    });
  }, [userProjects, searchQuery, sortBy]);

  const handleCreateProject = () => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      toast({ title: 'Project name cannot be empty.', variant: 'destructive' });
      return;
    }

    const isDuplicate = userProjects.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: 'Project Name Exists',
        description: 'A project with this name already exists. Please choose a different name.',
        variant: 'destructive',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: trimmedName,
      companyName: companyName,
      createdAt: nowIso,
      lastModified: nowIso,
      sections: [],
      date: nowIso.split('T')[0],
      owner: currentUser,
    };

    setProjects([...projects, newProject]);
    setNewProjectName('');
    router.push(`/project/${newProject.id}`);
  };

  const confirmDeleteProject = () => {
    if (!projectPendingDelete) return;
    const deletedName = projectPendingDelete.name;
    const deletedId = projectPendingDelete.id;
    setProjects((prev) => prev.filter((p) => p.id !== deletedId));
    setProjectPendingDelete(null);
    toast({
      title: 'Project deleted',
      description: `"${deletedName}" was removed.`,
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // Continue offline sign-out
    }
    setCurrentUser(null);
    sessionStorage.removeItem('isAdminAuthenticated');
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* Top Bar */}
      <header className="w-full glass-header px-4 py-3 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-primary font-semibold min-h-[40px] px-2.5 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </Button>
          <span className="hidden sm:inline-block h-4 w-px bg-border" aria-hidden="true" />
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <span className="font-bold text-sm text-foreground truncate">
              Project Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {currentUser && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px] sm:max-w-[200px]">
              {currentUser}
            </span>
          )}
          <PWAInstallButton
            variant="outline"
            size="sm"
            className="bg-white/70 border-border hover:bg-white text-foreground text-xs font-semibold"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Page Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage architectural material schedules, search saved projects, or create a new specification.
          </p>
        </div>

        {/* Summary Card at the Top of Projects Page */}
        <section
          aria-label="Projects Summary"
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/70">
            {/* Total Project Count */}
            <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total Projects</p>
                <p
                  className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums"
                  data-testid="summary-total-projects"
                >
                  {summaryStats.totalCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summaryStats.totalCount === 1
                    ? '1 active material schedule'
                    : `${summaryStats.totalCount} saved material schedules`}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <FolderKanban className="h-5 w-5" />
              </div>
            </div>

            {/* Last Modified Date of Most Recent Project */}
            <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Last Modified</p>
                <p
                  className="text-base sm:text-lg font-bold tracking-tight text-foreground tabular-nums leading-snug"
                  data-testid="summary-last-modified"
                >
                  {summaryStats.lastModifiedLabel}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {summaryStats.mostRecentProject
                    ? `Most recent: ${summaryStats.mostRecentProject.name}`
                    : 'Create a project to begin'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Total Specification Sections */}
            <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Specification Sections</p>
                <p className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {summaryStats.totalSections}
                </p>
                <p className="text-xs text-muted-foreground">
                  Across all schedules on this device
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Create New Project Bar */}
        <section
          aria-label="Create New Project"
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-3"
        >
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-foreground">Create New Project</h2>
            <p className="text-xs text-muted-foreground">
              Start a fresh architectural material specification schedule.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              aria-label="New project name"
              placeholder="Enter project name (e.g., Villa 402, Loft Redesign)"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
              }}
              className="flex-1 min-h-[44px] bg-white/80 border-border"
            />
            <Button
              onClick={handleCreateProject}
              className="min-h-[44px] px-5 gap-2 font-semibold bg-primary hover:bg-primary/90 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>
        </section>

        {/* Existing Projects List with Search & Sort */}
        <section
          aria-label="Existing Projects"
          className="glass-card rounded-2xl overflow-hidden"
        >
          {/* Toolbar: Search Input & Sort Dropdown */}
          <div className="p-5 sm:p-6 border-b border-border/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-foreground">Existing Projects</h2>
              <p className="text-xs text-muted-foreground tabular-nums">
                {searchQuery.trim()
                  ? `Showing ${filteredAndSortedProjects.length} of ${userProjects.length} projects`
                  : `${userProjects.length} ${userProjects.length === 1 ? 'project' : 'projects'} saved`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input Field */}
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  aria-label="Search projects by name"
                  placeholder="Search projects by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 min-h-[44px] bg-white/80 border-border"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 sm:w-60 shrink-0">
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                >
                  <SelectTrigger
                    aria-label="Sort projects"
                    className="min-h-[44px] bg-white/80 border-border w-full"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="glass-panel">
                    <SelectItem value="created-desc">Date Created (Newest)</SelectItem>
                    <SelectItem value="created-asc">Date Created (Oldest)</SelectItem>
                    <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Project Rows */}
          {userProjects.length === 0 ? (
            <div className="p-10 sm:p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <FolderOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Enter a project name above to create your first architectural material specification schedule.
                </p>
              </div>
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <div className="p-10 sm:p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No matching projects found
                </p>
                <p className="text-xs text-muted-foreground">
                  No projects match &ldquo;{searchQuery.trim()}&rdquo;.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="min-h-[40px]"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/70" role="list">
              {filteredAndSortedProjects.map((project) => {
                const sectionCount = project.sections?.length || 0;
                const materialCount = (project.sections || []).reduce(
                  (sum, sec) => sum + (sec.materials?.length || 0),
                  0
                );
                const createdLabel = formatDisplayDate(project.createdAt || project.date);
                const modifiedLabel = formatDisplayDate(project.lastModified, true);

                return (
                  <li
                    key={project.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 sm:px-6 hover:bg-primary/[0.03] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/project/${project.id}`)}
                      className="flex-1 min-w-0 text-left space-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                    >
                      <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
                        <span>Created {createdLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>Modified {modifiedLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {materialCount} {materialCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => router.push(`/project/${project.id}`)}
                        className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[40px] px-4 gap-1.5 font-semibold bg-primary hover:bg-primary/90 whitespace-nowrap"
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span>Open</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setProjectPendingDelete(project)}
                        aria-label={`Delete ${project.name}`}
                        className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] px-3 text-destructive border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sm:sr-only">Delete</span>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Delete Project Confirmation Dialog */}
      <Dialog
        open={!!projectPendingDelete}
        onOpenChange={(open) => {
          if (!open) setProjectPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Project?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">{projectPendingDelete?.name}</strong> and all its
              material specifications? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[40px]"
              onClick={() => setProjectPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="min-h-[40px]"
              onClick={confirmDeleteProject}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NavigationFooter />
    </div>
  );
}
