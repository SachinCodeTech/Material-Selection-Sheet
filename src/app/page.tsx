'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ShieldCheck,
  HelpCircle,
  Info,
  CheckCircle2,
  Play,
  RotateCcw,
  Home,
  Download,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { NavigationFooter } from '@/components/navigation-footer';
import { PwaInstallDialog } from '@/components/pwa-install-dialog';

const USER_IDS = Array.from({ length: 150 }, (_, i) => `User${i + 1}`);

export default function HomePage() {
  const router = useRouter();
  const [storedUser, setStoredUser] = useLocalStorage<string | null>('currentUser', null);
  const [registeredUsers, setRegisteredUsers] = useLocalStorage<any>('registeredUsers', { 'User1': 'password' });
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [companyName] = useLocalStorage<string>('companyName', 'Your Company');
  
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
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
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);

  const [view, setView] = useState<'login' | 'register' | 'recover' | 'changePassword'>('login');
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      sessionStorage.removeItem('isAdminAuthenticated');
      setSelectedUser(storedUser);
    }
  }, [isMounted, storedUser]);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !password) {
      toast({ title: 'Please select a user and enter a password.', variant: 'destructive' });
      return;
    }
  
    setIsLoading(true);
  
    if (!registeredUsers[selectedUser]) {
      setTimeout(() => {
        setIsLoading(false);
        toast({ title: 'User not registered.', description: 'Please register first to log in.', variant: 'destructive' });
      }, 500);
      return;
    }
  
    if (registeredUsers[selectedUser] === password) {
      setTimeout(() => {
        setStoredUser(selectedUser);
        setIsLoading(false);
        router.push('/projects');
      }, 500);
    } else {
      setTimeout(() => {
        setIsLoading(false);
        toast({ title: 'Invalid password.', description: 'The password you entered is incorrect.', variant: 'destructive' });
      }, 500);
    }
  };

  const handleInstantDemo = () => {
    setStoredUser('User1');
    if (!registeredUsers['User1']) {
      setRegisteredUsers({ ...registeredUsers, 'User1': 'password' });
    }
    
    let sampleProjects = [...projects];
    let defaultProj = sampleProjects.find(p => p.owner === 'User1' || !p.owner);
    if (!defaultProj) {
      defaultProj = {
        id: crypto.randomUUID(),
        name: '01',
        companyName: 'Architectural Design Studio',
        lastModified: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        owner: 'User1',
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
                'COMPANY': 'Kajaria Ceramics',
              },
              {
                id: crypto.randomUUID(),
                'UTILITY AREA': 'Master Bathroom Wall',
                'SURFACE AREA': 'Shower Cubicle & Vanity',
                'SIZE (MM)': '600 x 300',
                'MODEL NAME': 'Calacatta Gold Matt Ceramic',
                'COMPANY': 'Somany Tiles',
              },
              {
                id: crypto.randomUUID(),
                'UTILITY AREA': 'Kitchen Platform & Dado',
                'SURFACE AREA': 'Countertop & Splashback',
                'SIZE (MM)': '3200 x 800',
                'MODEL NAME': 'Jet Black Quartz Granite',
                'COMPANY': 'Quantra Quartz',
              },
              {
                id: crypto.randomUUID(),
                'UTILITY AREA': 'Balcony Deck',
                'SURFACE AREA': 'Outdoor Sitout Area',
                'SIZE (MM)': '600 x 600',
                'MODEL NAME': 'Teak Wood Texture Anti-Skid',
                'COMPANY': 'Simpolo Ceramics',
              },
            ],
          },
        ],
      };
      sampleProjects.push(defaultProj);
      setProjects(sampleProjects);
    }
    toast({ title: 'Welcome to Live Demo!', description: 'Loaded project workspace.' });
    router.push(`/project/${defaultProj.id}`);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !password || !confirmPassword) {
      toast({ title: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (registeredUsers[selectedUser]) {
      toast({ title: 'This User ID is already registered.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setRegisteredUsers({ ...registeredUsers, [selectedUser]: password });
      setIsLoading(false);
      toast({ title: 'Registration Successful!', description: 'You can now log in.' });
      setView('login');
      setPassword('');
      setConfirmPassword('');
    }, 500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !oldPassword || !password || !confirmPassword) {
      toast({ title: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!registeredUsers[selectedUser] || registeredUsers[selectedUser] !== oldPassword) {
      toast({ title: 'Invalid old password.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setRegisteredUsers({ ...registeredUsers, [selectedUser]: password });
      setIsLoading(false);
      toast({ title: 'Password Changed Successfully!', description: 'You can now log in with your new password.' });
      setView('login');
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
    }, 500);
  };

  const resetAllData = () => {
    if (window.confirm("Are you sure you want to reset ALL application data, including all users and projects? This cannot be undone.")) {
      localStorage.clear();
      toast({ title: 'All data has been reset.' });
      window.location.reload();
    }
  };

  const clearUserData = () => {
    if (!selectedUser) {
      toast({ title: 'Please select a user to clear.', variant: 'destructive' });
      return;
    }
    if (!registeredUsers[selectedUser]) {
      toast({ title: 'This user is not registered.', variant: 'destructive' });
      return;
    }
    if (window.confirm(`Are you sure you want to delete all data for ${selectedUser}? This will remove their registration.`)) {
      const updatedUsers = { ...registeredUsers };
      delete updatedUsers[selectedUser];
      setRegisteredUsers(updatedUsers);

      if (storedUser === selectedUser) {
        setStoredUser(null);
      }
      
      toast({ title: `Data for ${selectedUser} has been cleared.` });
      setSelectedUser(null);
    }
  };

  const copyPassword = () => {
    if (selectedUser && registeredUsers[selectedUser]) {
      navigator.clipboard.writeText(registeredUsers[selectedUser]);
      toast({ title: "Password Copied!" });
    } else {
      toast({ title: "Please select a user first.", variant: "destructive" });
    }
  };
  
  if (!isMounted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </main>
    );
  }

  const renderAuthForm = () => {
    switch (view) {
      case 'login':
        return (
          <>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-primary tracking-tight">Material Selection Sheet</CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground">{companyName}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user" className="text-left text-xs font-semibold">User ID</Label>
                  <Select onValueChange={setSelectedUser} value={selectedUser || ''}>
                    <SelectTrigger id="user" className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md">
                      <SelectValue placeholder="Select User ID" />
                    </SelectTrigger>
                    <SelectContent className="glass-panel">
                      {USER_IDS.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="pass" className="text-left text-xs font-semibold">Password</Label>
                  <Input
                    id="pass"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                <Button type="submit" className="w-full shadow-md font-semibold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Don't have an account?{' '}
                <Button variant="link" className="p-0 h-auto font-semibold text-primary" onClick={() => setView('register')}>
                  Register
                </Button>
              </div>
            </CardContent>
          </>
        );
      case 'register':
        return (
          <>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-primary tracking-tight">Create Account</CardTitle>
              <CardDescription className="text-xs">Select your User ID and configure your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-reg" className="text-left text-xs font-semibold">User ID</Label>
                  <Select onValueChange={setSelectedUser} value={selectedUser || ''}>
                    <SelectTrigger id="user-reg" className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md">
                      <SelectValue placeholder="Select User ID" />
                    </SelectTrigger>
                    <SelectContent className="glass-panel">
                      {USER_IDS.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass-reg" className="text-left text-xs font-semibold">Password</Label>
                  <Input
                    id="pass-reg"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pass" className="text-left text-xs font-semibold">Confirm Password</Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm password"
                    className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md"
                  />
                </div>
                <Button type="submit" className="w-full shadow-md font-semibold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Register'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Button variant="link" className="p-0 h-auto font-semibold text-primary" onClick={() => setView('login')}>
                  Login
                </Button>
              </div>
            </CardContent>
          </>
        );
      case 'recover':
        return (
          <>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-primary tracking-tight">Recover Password</CardTitle>
              <CardDescription className="text-xs">Select a user to view their stored password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-recover" className="text-left text-xs font-semibold">User ID</Label>
                <Select onValueChange={setSelectedUser} value={selectedUser || ''}>
                  <SelectTrigger id="user-recover" className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md">
                    <SelectValue placeholder="Select User ID to recover" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel">
                    {Object.keys(registeredUsers).map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-recover" className="text-left text-xs font-semibold">Your Password</Label>
                <Input
                  id="pass-recover"
                  type="text"
                  value={(selectedUser && registeredUsers[selectedUser]) || ''}
                  readOnly
                  placeholder="Password will appear here"
                  className="bg-white/70 border-white/60 shadow-sm font-mono backdrop-blur-md"
                />
              </div>
              <Button variant="outline" className="w-full bg-white/60" onClick={copyPassword} disabled={!selectedUser}>
                Copy Password
              </Button>
              <div className="mt-4 text-center text-sm">
                <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </>
        );
      case 'changePassword':
        return (
          <>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-primary tracking-tight">Change Password</CardTitle>
              <CardDescription className="text-xs">Update your login credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-change" className="text-left text-xs font-semibold">User ID</Label>
                  <Select onValueChange={setSelectedUser} value={selectedUser || ''}>
                    <SelectTrigger id="user-change" className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md">
                      <SelectValue placeholder="Select User ID" />
                    </SelectTrigger>
                    <SelectContent className="glass-panel">
                      {Object.keys(registeredUsers).map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="old-pass" className="text-left text-xs font-semibold">Old Password</Label>
                  <Input
                    id="old-pass"
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    required
                    placeholder="Enter old password"
                    className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pass" className="text-left text-xs font-semibold">New Password</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-pass" className="text-left text-xs font-semibold">Confirm New Password</Label>
                  <Input
                    id="confirm-new-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className="bg-white/70 border-white/60 shadow-sm backdrop-blur-md"
                  />
                </div>
                <Button type="submit" className="w-full shadow-md font-semibold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Change Password'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* Top Glassmorphic Header */}
      <header className="w-full glass-header px-4 py-3 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-[#023b4f] text-primary-foreground shadow-md shadow-primary/20">
            <Layers className="h-5 w-5" />
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-foreground">
            Material Selection Sheet
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInstallDialogOpen(true)}
            className="hidden sm:inline-flex gap-1.5 text-xs bg-white/60 border-white/70 backdrop-blur-md hover:bg-white/90 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Install App</span>
          </Button>

          {isStartScreen ? (
            <Button
              size="sm"
              onClick={() => setIsStartScreen(false)}
              className="gap-1.5 shadow-sm text-xs font-semibold"
            >
              <span>Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsStartScreen(true)}
              className="gap-1.5 text-xs bg-white/60 border-white/70 backdrop-blur-md shadow-sm"
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
          /* START SCREEN / LANDING PAGE VIEW WITH GLASSMORPHISM & RESOLUTION */
          <div className="w-full max-w-4xl mx-auto space-y-8 py-4">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <Badge className="glass-badge text-primary px-3.5 py-1 text-xs font-semibold tracking-wide shadow-sm">
                Architectural Specification Suite
              </Badge>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground bg-clip-text">
                Material Selection Sheet
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
                Precision architectural material schedules, surface dimensions, AI recommendations, and print-ready PDF export in a high-resolution glass interface.
              </p>
            </div>

            {/* Glassmorphic Loading Animation & Launch Box */}
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
                <span className="font-mono text-muted-foreground font-bold">{loadingProgress}%</span>
              </div>

              <Progress value={loadingProgress} className="h-2.5 w-full bg-slate-200/70 transition-all duration-300" />

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
                    setView('login');
                    setIsStartScreen(false);
                  }}
                >
                  <Play className="h-4 w-4 fill-current text-primary" />
                  <span>Launch & Login</span>
                </Button>
              </div>
            </div>

            {/* Glassmorphic Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="glass-panel rounded-2xl p-5 space-y-2.5 hover:shadow-lg transition-all duration-200">
                <div className="p-2.5 w-fit rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Dynamic Scheduling</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Surface specifications, millimeter sizing, manufacturer companies, and room-by-room area breakdown.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-5 space-y-2.5 hover:shadow-lg transition-all duration-200">
                <div className="p-2.5 w-fit rounded-xl bg-accent/20 text-accent-foreground border border-accent/30 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Gemini AI Assistant</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Instant smart alternatives, anti-skid specifications, compatibility checks, and section summaries.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-5 space-y-2.5 hover:shadow-lg transition-all duration-200">
                <div className="p-2.5 w-fit rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                  <FileDown className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Blueprint PDF Export</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  High-resolution vector PDF export with custom firm branding and full architectural headers.
                </p>
              </div>
            </div>

            {/* Platform Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-white/60 border-white/70 backdrop-blur-sm text-[11px] gap-1.5 py-1 text-foreground/80">
                <Monitor className="h-3 w-3 text-primary" /> Desktop & Laptop
              </Badge>
              <Badge variant="outline" className="bg-white/60 border-white/70 backdrop-blur-sm text-[11px] gap-1.5 py-1 text-foreground/80">
                <Smartphone className="h-3 w-3 text-primary" /> Tablet & Mobile
              </Badge>
              <Badge variant="outline" className="bg-white/60 border-white/70 backdrop-blur-sm text-[11px] gap-1.5 py-1 text-foreground/80">
                <ShieldCheck className="h-3 w-3 text-primary" /> Encrypted Local Data
              </Badge>
            </div>
          </div>
        ) : (
          /* AUTHENTICATION FORM VIEW WITH GLASSMORPHIC CARD */
          <div className="w-full max-w-sm mx-auto space-y-4">
            <div className="glass-card rounded-2xl overflow-hidden shadow-xl p-2 sm:p-4">
              {renderAuthForm()}
            </div>
            
            <div className="text-center flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <Button variant="link" size="sm" className="text-xs" onClick={() => setView('recover')}>
                  Forgot Password?
                </Button>
                <Button variant="link" size="sm" className="text-xs" onClick={() => setView('changePassword')}>
                  Change Password
                </Button>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="flex-1 bg-white/70 border-white/70 backdrop-blur-md shadow-sm text-xs"
                  size="sm"
                >
                  <UserCog className="mr-1.5 h-3.5 w-3.5 text-primary" /> Admin Panel
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsStartScreen(true)}
                  className="flex-1 bg-white/70 border-white/70 backdrop-blur-md shadow-sm text-xs"
                  size="sm"
                >
                  <Home className="mr-1.5 h-3.5 w-3.5 text-primary" /> Home
                </Button>
              </div>

              <div className="pt-1 flex gap-3 text-xs">
                <Button variant="link" size="sm" className="text-destructive h-auto p-0 text-[11px]" onClick={clearUserData}>
                  Clear User Data
                </Button>
                <span className="text-border">•</span>
                <Button variant="link" size="sm" className="text-destructive font-bold h-auto p-0 text-[11px]" onClick={resetAllData}>
                  Reset All Data
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Navigation Footer */}
      <NavigationFooter />

      {/* Standalone PWA Installation Modal */}
      <PwaInstallDialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen} />
    </div>
  );
}
