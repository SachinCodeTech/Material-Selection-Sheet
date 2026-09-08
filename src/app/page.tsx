'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCog, Eye, EyeOff } from 'lucide-react';

const USER_IDS = Array.from({ length: 150 }, (_, i) => `User${i + 1}`);

export default function AuthPage() {
  const router = useRouter();
  const [storedUser, setStoredUser] = useLocalStorage<string | null>('currentUser', null);
  const [registeredUsers, setRegisteredUsers] = useLocalStorage<any>('registeredUsers', { 'User1': 'password' });
  const [companyName] = useLocalStorage<string>('companyName', 'Your Company');
  
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<'login' | 'register' | 'recover' | 'changePassword'>('login');
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Clear session-based admin auth on page load
      sessionStorage.removeItem('isAdminAuthenticated');
      setSelectedUser(storedUser);
    }
  }, [isMounted, storedUser]);

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
    if(registeredUsers[selectedUser]) {
        toast({ title: 'This User ID is already registered.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    setTimeout(() => {
        setRegisteredUsers({...registeredUsers, [selectedUser]: password});
        setIsLoading(false);
        toast({ title: 'Registration Successful!', description: 'You can now log in.' });
        setView('login');
        setPassword('');
        setConfirmPassword('');
    }, 500)
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
        setRegisteredUsers({...registeredUsers, [selectedUser]: password});
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
  }

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
  }

  const copyPassword = () => {
    if (selectedUser && registeredUsers[selectedUser]) {
      navigator.clipboard.writeText(registeredUsers[selectedUser]);
      toast({ title: "Password Copied!" });
    } else {
        toast({ title: "Please select a user first.", variant: "destructive" });
    }
  }
  
  if (!isMounted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </main>
    );
  }

  const renderContent = () => {
    switch(view) {
      case 'login':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">Material Selection Sheet</CardTitle>
              <CardDescription>{companyName}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user" className="text-left">User ID</Label>
                  <Select onValueChange={setSelectedUser} value={selectedUser || ''}>
                    <SelectTrigger id="user">
                      <SelectValue placeholder="Select User ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_IDS.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="pass" className="text-left">Password</Label>
                  <Input id="pass" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter password" />
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Don't have an account?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => setView('register')}>
                  Register
                </Button>
              </div>
            </CardContent>
          </>
        );
      case 'register':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">Create Account</CardTitle>
              <CardDescription>Create a new account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-reg" className="text-left">User ID</Label>
                   <Select onValueChange={setSelectedUser} value={selectedUser || ''}>
                    <SelectTrigger id="user-reg">
                      <SelectValue placeholder="Select User ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_IDS.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass-reg" className="text-left">Password</Label>
                  <Input id="pass-reg" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pass" className="text-left">Confirm Password</Label>
                  <Input id="confirm-pass" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm password" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Register'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
                  Login
                </Button>
              </div>
            </CardContent>
          </>
        );
      case 'recover':
        return (
           <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">Recover Password</CardTitle>
              <CardDescription>Select a user to see their password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-recover" className="text-left">User ID</Label>
                  <Select onValueChange={setSelectedUser} value={selectedUser || ''}>
                    <SelectTrigger id="user-recover">
                      <SelectValue placeholder="Select User ID to recover" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(registeredUsers).map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass-recover" className="text-left">Your Password</Label>
                  <Input id="pass-recover" type="text" value={(selectedUser && registeredUsers[selectedUser]) || ''} readOnly placeholder="Password will appear here" />
                </div>
                <Button variant="outline" className="w-full" onClick={copyPassword} disabled={!selectedUser}>Copy Password</Button>
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
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-primary">Change Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="user-change" className="text-left">User ID</Label>
                        <Select onValueChange={setSelectedUser} value={selectedUser || ''}>
                            <SelectTrigger id="user-change">
                                <SelectValue placeholder="Select User ID" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(registeredUsers).map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="old-pass" className="text-left">Old Password</Label>
                        <Input id="old-pass" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required placeholder="Enter old password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-pass" className="text-left">New Password</Label>
                        <Input id="new-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter new password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-new-pass" className="text-left">Confirm New Password</Label>
                        <Input id="confirm-new-pass" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm new password" />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
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
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-background">
      <div className="w-full flex-grow flex items-center justify-center">
        <div className="w-full max-w-sm">
            <Card>
            {renderContent()}
            </Card>
            
            <div className='mt-4 text-center flex flex-col items-center gap-2'>
                <div>
                  <Button variant="link" size="sm" onClick={() => setView('recover')}>
                      Forgot Password?
                  </Button>
                  <Button variant="link" size="sm" onClick={() => setView('changePassword')}>
                      Change Password
                  </Button>
                </div>
                 <Button variant="outline" onClick={() => router.push('/admin')} className="bg-card">
                    <UserCog className="mr-2" /> Admin Panel
                </Button>
                <div>
                  <Button variant="link" size="sm" className="text-destructive" onClick={clearUserData}>
                      Clear User Data
                  </Button>
                  <Button variant="link" size="sm" className="text-destructive font-bold" onClick={resetAllData}>
                      Reset All Data
                  </Button>
                </div>
            </div>
        </div>
      </div>
      
      <footer className="w-full flex flex-col items-center space-y-2 py-4">
        <p className="text-muted-foreground text-sm">MSS-v.1.0 | CodeTech | by Sachin's</p>
      </footer>
    </main>
  );
}
