'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Department, Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
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
  Loader2,
  UserCog,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  FileDown,
  ArrowRight,
  CheckCircle2,
  Play,
  Home,
  AlertTriangle,
} from 'lucide-react';
import { NavigationFooter } from '@/components/navigation-footer';
import { PWAInstallButton } from '@/components/pwa-install-button';

interface DirectoryEmployee {
  id: string;
  fullName: string;
  department: Department | null;
  teamHeadId: string | null;
  teamHeadName?: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const [storedEmployee, setStoredEmployee] = useLocalStorage<string | null>('currentUser', null);
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [companyName] = useLocalStorage<string>('companyName', 'Your Company');

  const [registeredEmployees, setRegisteredEmployees] = useState<DirectoryEmployee[]>([
    {
      id: 'Employee 1',
      fullName: 'Employee 1',
      department: 'Architecture',
      teamHeadId: 'arch-th-1',
      teamHeadName: 'Team Head 1',
    },
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState<string>('Employee 1');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Landing / StartScreen animation states
  const [isStartScreen, setIsStartScreen] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing architectural framework...');
  const [isResetAllDialogOpen, setIsResetAllDialogOpen] = useState(false);
  const [isClearEmployeeDialogOpen, setIsClearEmployeeDialogOpen] = useState(false);

  const [view, setView] = useState<'login' | 'changePassword'>('login');
  const { toast } = useToast();

  const syncAuthDirectory = useCallback(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.registeredEmployees) && data.registeredEmployees.length > 0) {
          setRegisteredEmployees(data.registeredEmployees);
          setSelectedEmployee((prev) => {
            if (prev && data.registeredEmployees.some((e: DirectoryEmployee) => e.id === prev)) {
              return prev;
            }
            return data.registeredEmployees[0].id;
          });
        }
        const activeEmp = data.employee || data.user;
        if (data.authenticated && activeEmp) {
          setStoredEmployee(activeEmp);
          setSelectedEmployee(activeEmp);
        }
      })
      .catch((err) => console.warn('Auth service check notice:', err));
  }, [setStoredEmployee]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('registeredUsers');
      localStorage.removeItem('userPasswords');
      sessionStorage.removeItem('isAdminAuthenticated');
    }
    syncAuthDirectory();
  }, [syncAuthDirectory]);

  useEffect(() => {
    if (isMounted && storedEmployee) {
      setSelectedEmployee(storedEmployee);
    }
  }, [isMounted, storedEmployee]);

  // Loading animation simulation on start screen
  useEffect(() => {
    if (!isStartScreen) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 14;
      if (progress >= 100) {
        progress = 100;
        setLoadingProgress(100);
        setLoadingStatus('Ready to build specifications.');
        clearInterval(interval);
      } else {
        setLoadingProgress(progress);
        if (progress < 35) {
          setLoadingStatus('Loading Material Catalog & Schema...');
        } else if (progress < 70) {
          setLoadingStatus('Configuring Gemini AI Assistant...');
        } else {
          setLoadingStatus('Preparing High-Resolution Workspace...');
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isStartScreen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !password) {
      toast({
        title: 'Please select an Employee ID and enter a password.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          action: 'login',
          employeeId: selectedEmployee,
          password,
        }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success) {
        const canonicalId = data.employee || selectedEmployee;
        setStoredEmployee(canonicalId);
        toast({ title: 'Login Successful', description: `Welcome back, ${canonicalId}.` });
        router.push('/projects');
      } else {
        toast({
          title: 'Invalid Credentials',
          description: data.error || 'The Employee ID or password you entered is incorrect.',
          variant: 'destructive',
        });
      }
    } catch {
      setIsLoading(false);
      toast({
        title: 'Authentication Service Unavailable',
        description: 'Could not connect to auth endpoint.',
        variant: 'destructive',
      });
    }
  };

  const handleInstantDemo = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          action: 'login',
          employeeId: 'Employee 1',
          password: 'Password 1',
        }),
      });
    } catch {
      // Continue with demo flow
    }
    setStoredEmployee('Employee 1');
    setIsLoading(false);

    const sampleProjects = [...projects];
    let defaultProj = sampleProjects.find(
      (p) => p.owner === 'Employee 1' || p.owner === 'User1' || !p.owner
    );
    if (!defaultProj) {
      const nowIso = new Date().toISOString();
      defaultProj = {
        id: crypto.randomUUID(),
        name: '01',
        companyName: 'Architectural Design Studio',
        createdAt: nowIso,
        lastModified: nowIso,
        date: nowIso.split('T')[0],
        owner: 'Employee 1',
        pageSize: 'A4',
        sections: [
          {
            id: crypto.randomUUID(),
            name: 'Section 1',
            columns: ['UTILITY AREA', 'SURFACE AREA', 'SIZE (MM)', 'MODEL NAME', 'COMPANY'],
            materials: [
              {
                id: crypto.randomUUID(),
                'UTILITY AREA': 'Living Room Flooring',
                'SURFACE AREA': 'Main Foyer & Lounge',
                'SIZE (MM)': '1200 x 600',
                'MODEL NAME': 'Statuary Marble Glazed Vitrified',
                COMPANY: 'Kajaria Ceramics',
              },
              {
                id: crypto.randomUUID(),
                'UTILITY AREA': 'Master Bathroom Wall',
                'SURFACE AREA': 'Shower Cubicle & Vanity',
                'SIZE (MM)': '600 x 300',
                'MODEL NAME': 'Calacatta Gold Matt Ceramic',
                COMPANY: 'Somany Tiles',
              },
              {
                id: crypto.randomUUID(),
                'UTILITY AREA': 'Kitchen Platform & Dado',
                'SURFACE AREA': 'Countertop & Splashback',
                'SIZE (MM)': '3200 x 800',
                'MODEL NAME': 'Jet Black Quartz Granite',
                COMPANY: 'Quantra Quartz',
              },
              {
                id: crypto.randomUUID(),
                'UTILITY AREA': 'Balcony Deck',
                'SURFACE AREA': 'Outdoor Sitout Area',
                'SIZE (MM)': '600 x 600',
                'MODEL NAME': 'Teak Wood Texture Anti-Skid',
                COMPANY: 'Simpolo Ceramics',
              },
            ],
          },
        ],
      };
      sampleProjects.push(defaultProj);
      setProjects(sampleProjects);
    }
    toast({ title: 'Welcome to Live Demo', description: 'Loaded workspace for Employee 1.' });
    router.push(`/project/${defaultProj.id}`);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !oldPassword || !password || !confirmPassword) {
      toast({ title: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          action: 'change-password',
          employeeId: selectedEmployee,
          oldPassword,
          newPassword: password,
        }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success) {
        toast({
          title: 'Password Changed',
          description: 'You can now log in with your new password.',
        });
        setView('login');
        setOldPassword('');
        setPassword('');
        setConfirmPassword('');
      } else {
        toast({
          title: 'Password Change Failed',
          description: data.error || 'Invalid current password.',
          variant: 'destructive',
        });
      }
    } catch {
      setIsLoading(false);
      toast({
        title: 'Update Error',
        description: 'Could not connect to auth service.',
        variant: 'destructive',
      });
    }
  };

  const confirmResetAllData = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // Continue
    }
    localStorage.clear();
    toast({ title: 'All local application data has been reset.' });
    setIsResetAllDialogOpen(false);
    window.location.reload();
  };

  const handleRequestClearEmployee = () => {
    if (!selectedEmployee) {
      toast({ title: 'Please select an Employee ID to clear.', variant: 'destructive' });
      return;
    }
    setIsClearEmployeeDialogOpen(true);
  };

  const confirmClearEmployeeData = () => {
    if (!selectedEmployee) return;
    if (storedEmployee === selectedEmployee) {
      setStoredEmployee(null);
    }
    toast({ title: `Local session for ${selectedEmployee} has been cleared.` });
    setIsClearEmployeeDialogOpen(false);
  };

  const renderAuthForm = () => {
    if (view === 'changePassword') {
      return (
        <>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-primary tracking-tight">
              Change Password
            </CardTitle>
            <CardDescription className="text-xs">
              Update your Employee login credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-change" className="text-left text-xs font-semibold">
                  Employee ID
                </Label>
                <Select onValueChange={setSelectedEmployee} value={selectedEmployee || ''}>
                  <SelectTrigger
                    id="employee-change"
                    className="bg-white/80 border-border shadow-sm min-h-[44px]"
                  >
                    <SelectValue placeholder="Select Employee ID" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel">
                    {registeredEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.id}
                        {emp.fullName && emp.fullName !== emp.id ? ` — ${emp.fullName}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="old-pass" className="text-left text-xs font-semibold">
                  Current Password
                </Label>
                <Input
                  id="old-pass"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="e.g. Password 1"
                  className="bg-white/80 border-border shadow-sm min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pass" className="text-left text-xs font-semibold">
                  New Password
                </Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="bg-white/80 border-border shadow-sm min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-pass" className="text-left text-xs font-semibold">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-new-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="bg-white/80 border-border shadow-sm min-h-[44px]"
                />
              </div>
              <Button
                type="submit"
                className="w-full min-h-[44px] shadow-md font-semibold"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Update Password'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
                Back to Employee Login
              </Button>
            </div>
          </CardContent>
        </>
      );
    }

    return (
      <>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-primary tracking-tight">
            Employee Login
          </CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground">
            {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee" className="text-left text-xs font-semibold">
                Employee ID
              </Label>
              <Select onValueChange={setSelectedEmployee} value={selectedEmployee || ''}>
                <SelectTrigger
                  id="employee"
                  className="bg-white/80 border-border shadow-sm min-h-[44px]"
                >
                  <SelectValue placeholder="Select Employee ID" />
                </SelectTrigger>
                <SelectContent className="glass-panel">
                  {registeredEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.id}
                      {emp.fullName && emp.fullName !== emp.id ? ` — ${emp.fullName}` : ''}
                      {emp.department ? ` (${emp.department})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="pass" className="text-left text-xs font-semibold">
                Password
              </Label>
              <Input
                id="pass"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password (e.g. Password 1)"
                className="bg-white/80 border-border shadow-sm min-h-[44px] pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-7 h-9 w-9 text-muted-foreground hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full min-h-[44px] shadow-md font-semibold"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground leading-relaxed">
            New Employee accounts are registered by your Admin. Default login follows{' '}
            <span className="font-mono font-semibold text-foreground">Employee 1</span> /{' '}
            <span className="font-mono font-semibold text-foreground">Password 1</span>.
          </p>
        </CardContent>
      </>
    );
  };

  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* Top Glassmorphic Header */}
      <header className="w-full glass-header px-4 py-3 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-[#023b4f] text-primary-foreground shadow-md shadow-primary/20 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-foreground truncate">
            Architectural Specification Suite
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton
            size="sm"
            variant="outline"
            className="text-xs bg-white/70 border-white/70 backdrop-blur-md hover:bg-white/90 shadow-sm text-primary font-semibold"
          />

          {isStartScreen ? (
            <Button
              size="sm"
              onClick={() => {
                syncAuthDirectory();
                setIsStartScreen(false);
              }}
              className="gap-1.5 shadow-sm text-xs font-semibold min-h-[40px]"
            >
              <span>Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsStartScreen(true)}
              className="gap-1.5 text-xs bg-white/60 border-white/70 backdrop-blur-md shadow-sm min-h-[40px]"
            >
              <Home className="h-3.5 w-3.5 text-primary" />
              <span>Home</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {isStartScreen ? (
          <div className="w-full max-w-4xl mx-auto space-y-8 py-4">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <p className="text-xs font-semibold tracking-wide text-primary">
                CodeTech Enterprise · Architecture & Interior Teams
              </p>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
                Architectural Specification Suite
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
                Precision architectural material schedules, surface dimensions, AI recommendations, and print-ready PDF export in a high-resolution workspace.
              </p>
            </div>

            {/* Launch Box */}
            <div className="glass-card rounded-2xl max-w-xl mx-auto overflow-hidden p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2 text-foreground font-semibold">
                  {loadingProgress < 100 ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {loadingStatus}
                </span>
                <span className="font-mono text-muted-foreground font-bold tabular-nums">
                  {loadingProgress}%
                </span>
              </div>

              <Progress
                value={loadingProgress}
                className="h-2.5 w-full bg-slate-200/70 transition-all duration-300"
              />

              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="flex-1 gap-2 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-12"
                  onClick={handleInstantDemo}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Try Live Demo</span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 gap-2 bg-white/80 border-slate-300 hover:bg-white shadow-sm font-semibold h-12"
                  onClick={() => {
                    syncAuthDirectory();
                    setView('login');
                    setIsStartScreen(false);
                  }}
                >
                  <Play className="h-4 w-4 fill-current text-primary" />
                  <span>Employee Login</span>
                </Button>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="glass-panel rounded-2xl p-5 space-y-2.5">
                <div className="p-2.5 w-fit rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Dynamic Scheduling</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Surface specifications, millimeter sizing, manufacturer companies, and drag-and-drop row ordering.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-5 space-y-2.5">
                <div className="p-2.5 w-fit rounded-xl bg-accent/20 text-accent-foreground border border-accent/30 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Gemini AI Assistant</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Instant smart alternatives, anti-skid specifications, compatibility checks, and section summaries.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-5 space-y-2.5">
                <div className="p-2.5 w-fit rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                  <FileDown className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Blueprint PDF Export</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  High-resolution vector PDF export with custom firm branding and full architectural headers.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs text-muted-foreground">
              <span>Desktop & Laptop</span>
              <span aria-hidden="true">·</span>
              <span>Tablet & Mobile</span>
              <span aria-hidden="true">·</span>
              <span>Architecture & Interior Teams</span>
            </div>
          </div>
        ) : (
          /* EMPLOYEE AUTHENTICATION VIEW */
          <div className="w-full max-w-sm mx-auto space-y-4">
            <div className="glass-card rounded-2xl overflow-hidden shadow-xl p-2 sm:p-4">
              {renderAuthForm()}
            </div>

            <div className="text-center flex flex-col items-center gap-2">
              <div className="flex gap-3">
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs"
                  onClick={() => setView(view === 'changePassword' ? 'login' : 'changePassword')}
                >
                  {view === 'changePassword' ? 'Employee Login' : 'Change Password'}
                </Button>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="flex-1 bg-white/70 border-border shadow-sm text-xs min-h-[40px]"
                  size="sm"
                >
                  <UserCog className="mr-1.5 h-3.5 w-3.5 text-primary" /> Admin Panel
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsStartScreen(true)}
                  className="flex-1 bg-white/70 border-border shadow-sm text-xs min-h-[40px]"
                  size="sm"
                >
                  <Home className="mr-1.5 h-3.5 w-3.5 text-primary" /> Home
                </Button>
              </div>

              <div className="pt-1 flex gap-3 text-xs">
                <Button
                  variant="link"
                  size="sm"
                  className="text-destructive h-auto p-0 text-[11px]"
                  onClick={handleRequestClearEmployee}
                >
                  Clear Employee Session
                </Button>
                <span className="text-border">·</span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-destructive font-bold h-auto p-0 text-[11px]"
                  onClick={() => setIsResetAllDialogOpen(true)}
                >
                  Reset All Data
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clear Single Employee Session Dialog */}
      <Dialog open={isClearEmployeeDialogOpen} onOpenChange={setIsClearEmployeeDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Clear Session for{' '}
              {selectedEmployee}?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Clear the saved local login selection for {selectedEmployee}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsClearEmployeeDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmClearEmployeeData}>
              Clear Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset All Application Data Dialog */}
      <Dialog open={isResetAllDialogOpen} onOpenChange={setIsResetAllDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Reset All Application Data?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              This will erase all locally saved projects, custom specifications, and settings from
              this browser. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsResetAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmResetAllData}>
              Erase Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NavigationFooter />
    </div>
  );
}
