'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  Save,
  Users,
  Folder,
  Trash2,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  ShieldAlert,
  Layers,
  AlertTriangle,
  UserPlus,
  KeyRound,
  Building2,
  Compass,
  Plus,
  Pencil,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import type { Department, EmployeeProfile, Project, TeamHead } from '@/lib/types';
import { NavigationFooter } from '@/components/navigation-footer';
import { PWAInstallButton } from '@/components/pwa-install-button';

function computeDefaultPassword(employeeId: string): string {
  const trimmed = employeeId.trim();
  if (!trimmed) return '';
  const numMatch = trimmed.match(/(\d+)\s*$/);
  if (numMatch) {
    return `Password ${numMatch[1]}`;
  }
  return `Password ${trimmed}`;
}

function getNextEmployeeId(employees: EmployeeProfile[]): string {
  let maxNum = 0;
  for (const emp of employees) {
    const match = emp.id.match(/^Employee\s+(\d+)$/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `Employee ${maxNum + 1}`;
}

function getNextTeamHeadName(teamHeads: TeamHead[], department: Department): string {
  let maxNum = 0;
  for (const th of teamHeads) {
    if (th.department !== department) continue;
    const match = th.name.match(/^Team Head\s+(\d+)$/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `Team Head ${maxNum + 1}`;
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  // Keep admin Bearer token strictly in React memory (never localStorage/sessionStorage)
  // so Admin access works reliably inside cross-site iframes as well as standalone browsers.
  const adminTokenRef = useRef<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmSetupPassword, setConfirmSetupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Admin-managed data from server
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [teamHeads, setTeamHeads] = useState<TeamHead[]>([]);

  // Employee Registration form state
  const [regEmployeeId, setRegEmployeeId] = useState('Employee 2');
  const [regFullName, setRegFullName] = useState('');
  const [regDepartment, setRegDepartment] = useState<Department | 'none'>('Architecture');
  const [regTeamHeadId, setRegTeamHeadId] = useState<string>('none');
  const [regCustomPassword, setRegCustomPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Team Head creation forms (Architecture & Interior)
  const [archNewHeadName, setArchNewHeadName] = useState('');
  const [archNewLeadName, setArchNewLeadName] = useState('');
  const [intNewHeadName, setIntNewHeadName] = useState('');
  const [intNewLeadName, setIntNewLeadName] = useState('');

  // Inline Team Head edit state
  const [editingHeadId, setEditingHeadId] = useState<string | null>(null);
  const [editingHeadName, setEditingHeadName] = useState('');
  const [editingHeadLead, setEditingHeadLead] = useState('');

  // Confirmation dialogs
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeProfile | null>(null);
  const [teamHeadToDelete, setTeamHeadToDelete] = useState<TeamHead | null>(null);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useLocalStorage('companyName', '');
  const [newCompanyName, setNewCompanyName] = useState(companyName);
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);

  const getAdminHeaders = useCallback((includeJson = false): Record<string, string> => {
    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
    };
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (adminTokenRef.current) {
      headers['Authorization'] = `Bearer ${adminTokenRef.current}`;
    }
    return headers;
  }, []);

  const applyAdminSnapshot = useCallback(
    (data: { employees?: EmployeeProfile[]; teamHeads?: TeamHead[]; token?: string }) => {
      if (typeof data.token === 'string' && data.token.length > 0) {
        adminTokenRef.current = data.token;
      }
      setIsAdminAuthenticated(true);
      setSetupRequired(false);
      const empList: EmployeeProfile[] = Array.isArray(data.employees) ? data.employees : [];
      const thList: TeamHead[] = Array.isArray(data.teamHeads) ? data.teamHeads : [];
      setEmployees(empList);
      setTeamHeads(thList);
      setRegEmployeeId(getNextEmployeeId(empList));
      setArchNewHeadName(getNextTeamHeadName(thList, 'Architecture'));
      setIntNewHeadName(getNextTeamHeadName(thList, 'Interior'));
    },
    []
  );

  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin', {
        headers: getAdminHeaders(false),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        applyAdminSnapshot(data);
      } else {
        if (res.status === 401) {
          adminTokenRef.current = null;
        }
        setIsAdminAuthenticated(false);
        setSetupRequired(Boolean(data.setupRequired));
      }
    } catch {
      setIsAdminAuthenticated(false);
    } finally {
      setCheckingSession(false);
    }
  }, [applyAdminSnapshot, getAdminHeaders]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('registeredUsers');
      localStorage.removeItem('userPasswords');
      sessionStorage.removeItem('isAdminAuthenticated');
    }
    fetchAdminData();
  }, [fetchAdminData]);

  const architectureHeads = useMemo(
    () => teamHeads.filter((th) => th.department === 'Architecture'),
    [teamHeads]
  );

  const interiorHeads = useMemo(
    () => teamHeads.filter((th) => th.department === 'Interior'),
    [teamHeads]
  );

  const availableRegTeamHeads = useMemo(() => {
    if (regDepartment === 'Architecture') return architectureHeads;
    if (regDepartment === 'Interior') return interiorHeads;
    return [];
  }, [regDepartment, architectureHeads, interiorHeads]);

  const autoDefaultPassword = useMemo(
    () => computeDefaultPassword(regEmployeeId),
    [regEmployeeId]
  );

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Please choose an admin password of at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirmSetupPassword) {
      toast({ title: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: getAdminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ action: 'setup-admin', password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Admin Portal Initialized',
          description: 'Your admin password has been saved securely on the server.',
        });
        setPassword('');
        setConfirmSetupPassword('');
        applyAdminSnapshot(data);
      } else {
        toast({
          title: 'Setup Failed',
          description: data.error || 'Could not initialize admin access.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not connect to server.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast({ title: 'Please enter the admin password.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: getAdminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ action: 'login', password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Admin login successful.' });
        setPassword('');
        applyAdminSnapshot(data);
      } else {
        if (data.setupRequired) {
          setSetupRequired(true);
        }
        toast({
          title: 'Access Denied',
          description: data.error || 'Invalid admin credentials.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Could not connect to admin auth endpoint.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: getAdminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // Continue
    }
    adminTokenRef.current = null;
    setIsAdminAuthenticated(false);
    toast({ title: 'Logged out from Admin Portal.' });
    router.push('/');
  };

  const handleSaveSettings = () => {
    setCompanyName(newCompanyName);
    toast({
      title: 'Settings Saved',
      description: 'The default studio name has been updated.',
    });
  };

  // Register Employee by Admin
  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = regEmployeeId.trim();
    if (!cleanId) {
      toast({ title: 'Employee ID is required.', variant: 'destructive' });
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: getAdminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({
          action: 'register-employee',
          employeeId: cleanId,
          fullName: regFullName.trim() || cleanId,
          department: regDepartment === 'none' ? null : regDepartment,
          teamHeadId: regTeamHeadId === 'none' ? null : regTeamHeadId,
          password: regCustomPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Employee Registered',
          description: `${data.employee.id} can now log in with password "${data.defaultPassword}".`,
        });
        setRegFullName('');
        setRegCustomPassword('');
        setRegTeamHeadId('none');
        await fetchAdminData();
      } else {
        toast({
          title: 'Registration Failed',
          description: data.error || 'Could not register employee.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Server Error', description: 'Could not register employee.', variant: 'destructive' });
    } finally {
      setIsRegistering(false);
    }
  };

  // Reassign employee department or team head
  const handleUpdateEmployeeTeam = async (
    employeeId: string,
    department: Department | null,
    teamHeadId: string | null
  ) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: getAdminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({
          action: 'update-employee',
          employeeId,
          department,
          teamHeadId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Team assignment updated' });
        await fetchAdminData();
      } else {
        toast({
          title: 'Update Failed',
          description: data.error || 'Could not update assignment.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  // Reset employee password back to default (Employee N -> Password N)
  const handleResetEmployeePassword = async (employeeId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: getAdminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({
          action: 'reset-employee-password',
          employeeId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Default Password Restored',
          description: `${employeeId} password reset to "${data.passwordUsed}".`,
        });
        await fetchAdminData();
      } else {
        toast({ title: 'Reset Failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    const id = employeeToDelete.id;
    try {
      const res = await fetch(`/api/admin?employeeId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(false),
        credentials: 'include',
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.owner !== id));
        toast({
          title: 'Employee Deleted',
          description: `${id} and their local projects have been removed.`,
        });
        await fetchAdminData();
      } else {
        toast({
          title: 'Delete Failed',
          description: 'Could not delete employee from server records.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Server error while deleting employee.', variant: 'destructive' });
    }
    setEmployeeToDelete(null);
  };

  // Add Team Head (Architecture or Interior)
  const handleAddTeamHead = async (department: Department) => {
    const name = department === 'Architecture' ? archNewHeadName.trim() : intNewHeadName.trim();
    const leadName = department === 'Architecture' ? archNewLeadName.trim() : intNewLeadName.trim();

    if (!name) {
      toast({ title: 'Please enter a Team Head title.', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: getAdminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({
          action: 'add-team-head',
          department,
          name,
          leadName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: `Added ${name} to ${department}` });
        if (department === 'Architecture') {
          setArchNewLeadName('');
        } else {
          setIntNewLeadName('');
        }
        await fetchAdminData();
      } else {
        toast({ title: 'Could not add Team Head', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  const handleSaveTeamHeadEdit = async (id: string) => {
    if (!editingHeadName.trim()) {
      toast({ title: 'Team Head name cannot be empty.', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: getAdminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({
          action: 'update-team-head',
          id,
          name: editingHeadName.trim(),
          leadName: editingHeadLead.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Team Head updated' });
        setEditingHeadId(null);
        await fetchAdminData();
      } else {
        toast({ title: 'Update Failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  const confirmDeleteTeamHead = async () => {
    if (!teamHeadToDelete) return;
    try {
      const res = await fetch(`/api/admin?teamHeadId=${encodeURIComponent(teamHeadToDelete.id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(false),
        credentials: 'include',
      });
      if (res.ok) {
        toast({
          title: 'Team Head Removed',
          description: `${teamHeadToDelete.name} (${teamHeadToDelete.department}) has been removed.`,
        });
        await fetchAdminData();
      } else {
        toast({ title: 'Remove Failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
    setTeamHeadToDelete(null);
  };

  const confirmDeleteProject = () => {
    if (!projectToDeleteId) return;
    const projectToDelete = projects.find((p) => p.id === projectToDeleteId);
    setProjects(projects.filter((p) => p.id !== projectToDeleteId));
    toast({
      title: 'Project Deleted',
      description: `"${projectToDelete?.name || 'Project'}" has been removed.`,
    });
    setProjectToDeleteId(null);
  };

  const renderDepartmentTeamPanel = (
    department: Department,
    heads: TeamHead[],
    newHeadName: string,
    setNewHeadName: (v: string) => void,
    newLeadName: string,
    setNewLeadName: (v: string) => void,
    Icon: typeof Building2
  ) => (
    <section className="glass-card rounded-2xl overflow-hidden flex flex-col">
      <div className="p-5 sm:p-6 border-b border-border/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{department} Team</h3>
            <p className="text-xs text-muted-foreground tabular-nums">
              {heads.length} {heads.length === 1 ? 'Team Head' : 'Team Heads'} ·{' '}
              {employees.filter((e) => e.department === department).length} assigned employees
            </p>
          </div>
        </div>
      </div>

      {/* Add Team Head Form */}
      <div className="p-4 sm:p-5 bg-muted/30 border-b border-border/70 space-y-2.5">
        <p className="text-xs font-semibold text-foreground">Add Team Head</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            aria-label={`${department} Team Head title`}
            placeholder={`e.g. ${getNextTeamHeadName(teamHeads, department)}`}
            value={newHeadName}
            onChange={(e) => setNewHeadName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTeamHead(department);
              }
            }}
            className="bg-white/90 border-border h-10 text-sm"
          />
          <Input
            aria-label={`${department} Team Head lead name`}
            placeholder="Lead name (optional)"
            value={newLeadName}
            onChange={(e) => setNewLeadName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTeamHead(department);
              }
            }}
            className="bg-white/90 border-border h-10 text-sm"
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => handleAddTeamHead(department)}
          className="gap-1.5 min-h-[40px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          <Plus className="h-4 w-4" /> Add {department} Team Head
        </Button>
      </div>

      {/* Team Heads List */}
      <div className="divide-y divide-border/70 flex-1">
        {heads.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">
            No Team Heads in {department} yet. Add one above.
          </p>
        ) : (
          heads.map((head) => {
            const assignedEmployees = employees.filter((e) => e.teamHeadId === head.id);
            const unassignedOrOtherEmployees = employees.filter((e) => e.teamHeadId !== head.id);
            const isEditing = editingHeadId === head.id;

            return (
              <div key={head.id} className="p-4 sm:p-5 space-y-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={editingHeadName}
                        onChange={(e) => setEditingHeadName(e.target.value)}
                        placeholder="Team Head title"
                        className="bg-white h-9 text-sm"
                      />
                      <Input
                        value={editingHeadLead}
                        onChange={(e) => setEditingHeadLead(e.target.value)}
                        placeholder="Lead name (optional)"
                        className="bg-white h-9 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveTeamHeadEdit(head.id)}
                        className="h-8 gap-1 bg-primary text-white text-xs"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingHeadId(null)}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{head.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {head.leadName ? `Lead: ${head.leadName} · ` : ''}
                        {assignedEmployees.length}{' '}
                        {assignedEmployees.length === 1 ? 'employee' : 'employees'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditingHeadId(head.id);
                          setEditingHeadName(head.name);
                          setEditingHeadLead(head.leadName || '');
                        }}
                        title={`Rename ${head.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setTeamHeadToDelete(head)}
                        title={`Remove ${head.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Assigned Employees */}
                <div className="space-y-2">
                  {assignedEmployees.length > 0 ? (
                    <ul className="space-y-1.5">
                      {assignedEmployees.map((emp) => (
                        <li
                          key={emp.id}
                          className="flex items-center justify-between gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-white/75 border border-border/60"
                        >
                          <div className="min-w-0 truncate">
                            <span className="font-mono font-semibold text-foreground">{emp.id}</span>
                            {emp.fullName && emp.fullName !== emp.id && (
                              <span className="text-muted-foreground"> · {emp.fullName}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdateEmployeeTeam(emp.id, emp.department, null)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title={`Unassign ${emp.id} from ${head.name}`}
                            aria-label={`Unassign ${emp.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No employees assigned yet.</p>
                  )}

                  {unassignedOrOtherEmployees.length > 0 && (
                    <Select
                      value=""
                      onValueChange={(empId) => {
                        if (empId) handleUpdateEmployeeTeam(empId, department, head.id);
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white/80 border-border">
                        <SelectValue placeholder={`Assign employee to ${head.name}...`} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {unassignedOrOtherEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id} className="text-xs">
                            {emp.id}
                            {emp.fullName && emp.fullName !== emp.id ? ` (${emp.fullName})` : ''}
                            {emp.department ? ` — ${emp.department}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );

  // Unauthenticated View (Initial Setup OR Login)
  if (!isAdminAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col justify-between">
        <header className="w-full glass-header px-4 py-3 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            size="sm"
            className="gap-2 text-primary font-semibold min-h-[40px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <span className="text-xs font-semibold text-primary">Admin Portal</span>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4">
            {checkingSession ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Checking admin session...
              </p>
            ) : setupRequired ? (
              <form onSubmit={handleInitialSetup} className="space-y-4">
                <div className="text-center pb-2 space-y-1">
                  <div className="p-3 w-fit mx-auto rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-2">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-extrabold text-primary tracking-tight">
                    First-Time Admin Setup
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Set your master Admin password to manage Employees, Architecture & Interior Teams, and studio settings.
                  </p>
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="setup-admin-pass" className="text-xs font-semibold">
                    Create Admin Password
                  </Label>
                  <Input
                    id="setup-admin-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="bg-white/80 border-border min-h-[44px] pr-10"
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

                <div className="space-y-2">
                  <Label htmlFor="confirm-admin-pass" className="text-xs font-semibold">
                    Confirm Admin Password
                  </Label>
                  <Input
                    id="confirm-admin-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmSetupPassword}
                    onChange={(e) => setConfirmSetupPassword(e.target.value)}
                    placeholder="Re-enter admin password"
                    required
                    minLength={6}
                    className="bg-white/80 border-border min-h-[44px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[44px] gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <KeyRound className="h-4 w-4" /> Set Admin Password & Enter
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="text-center pb-2 space-y-1">
                  <div className="p-3 w-fit mx-auto rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-2">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-extrabold text-primary tracking-tight">Admin Access</h2>
                  <p className="text-xs text-muted-foreground">
                    Enter your Admin password to register Employees and manage Architecture & Interior teams.
                  </p>
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="admin-password" className="text-xs font-semibold">
                    Admin Password
                  </Label>
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    className="bg-white/80 border-border min-h-[44px] pr-10"
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
                  disabled={isLoading}
                  className="w-full min-h-[44px] gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <LogIn className="h-4 w-4" /> Authenticate
                </Button>
              </form>
            )}
          </div>
        </main>

        <NavigationFooter showAdmin={false} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* Header */}
      <header className="w-full glass-header px-4 py-3 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-[#023b4f] text-primary-foreground shadow-sm shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-foreground truncate">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex text-xs bg-white/70 border-border text-foreground font-semibold"
          />
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs bg-white/70 border-border font-semibold min-h-[40px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Button>
          <Button
            onClick={handleAdminLogout}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 font-semibold min-h-[40px]"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Admin Overview Strip */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-border/70">
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">Registered Employees</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-1">
                {employees.length}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">Architecture Heads</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-1">
                {architectureHeads.length}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">Interior Heads</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-1">
                {interiorHeads.length}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">Saved Projects</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-1">
                {projects.length}
              </p>
            </div>
          </div>
        </section>

        {/* EMPLOYEE REGISTRATION & DIRECTORY (ADMIN-ONLY) */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border/70 space-y-1">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <UserPlus className="h-5 w-5 text-primary" /> Employee Registration & Management
            </h2>
            <p className="text-xs text-muted-foreground">
              Register new employees with automatic default passwords (e.g.,{' '}
              <span className="font-mono font-semibold text-foreground">Employee 1</span> →{' '}
              <span className="font-mono font-semibold text-foreground">Password 1</span>,{' '}
              <span className="font-mono font-semibold text-foreground">Employee 2</span> →{' '}
              <span className="font-mono font-semibold text-foreground">Password 2</span>) and assign them to Architecture or Interior teams.
            </p>
          </div>

          {/* Registration Form */}
          <form
            onSubmit={handleRegisterEmployee}
            className="p-5 sm:p-6 bg-muted/25 border-b border-border/70 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-emp-id" className="text-xs font-semibold">
                  Employee ID
                </Label>
                <Input
                  id="reg-emp-id"
                  value={regEmployeeId}
                  onChange={(e) => setRegEmployeeId(e.target.value)}
                  placeholder="Employee 2"
                  required
                  className="bg-white/90 border-border h-10 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-emp-name" className="text-xs font-semibold">
                  Employee Name
                </Label>
                <Input
                  id="reg-emp-name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Optional full name"
                  className="bg-white/90 border-border h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-dept" className="text-xs font-semibold">
                  Department
                </Label>
                <Select
                  value={regDepartment}
                  onValueChange={(val) => {
                    setRegDepartment(val as Department | 'none');
                    setRegTeamHeadId('none');
                  }}
                >
                  <SelectTrigger id="reg-dept" className="bg-white/90 border-border h-10 text-sm">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Architecture">Architecture</SelectItem>
                    <SelectItem value="Interior">Interior</SelectItem>
                    <SelectItem value="none">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-th" className="text-xs font-semibold">
                  Team Head
                </Label>
                <Select
                  value={regTeamHeadId}
                  onValueChange={setRegTeamHeadId}
                  disabled={regDepartment === 'none' || availableRegTeamHeads.length === 0}
                >
                  <SelectTrigger id="reg-th" className="bg-white/90 border-border h-10 text-sm">
                    <SelectValue placeholder="Select Team Head" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="none">No Team Head</SelectItem>
                    {availableRegTeamHeads.map((th) => (
                      <SelectItem key={th.id} value={th.id}>
                        {th.name}
                        {th.leadName ? ` (${th.leadName})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-pass" className="text-xs font-semibold">
                  Default Password
                </Label>
                <Input
                  id="reg-pass"
                  value={regCustomPassword}
                  onChange={(e) => setRegCustomPassword(e.target.value)}
                  placeholder={autoDefaultPassword || 'Auto-generated'}
                  className="bg-white/90 border-border h-10 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                Login credentials to share:{' '}
                <span className="font-mono font-semibold text-foreground">
                  {regEmployeeId.trim() || 'Employee N'}
                </span>{' '}
                /{' '}
                <span className="font-mono font-semibold text-primary">
                  {regCustomPassword.trim() || autoDefaultPassword || 'Password N'}
                </span>
              </p>
              <Button
                type="submit"
                disabled={isRegistering}
                className="min-h-[44px] px-5 gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap shrink-0"
              >
                <UserPlus className="h-4 w-4" /> Register Employee
              </Button>
            </div>
          </form>

          {/* Registered Employees Directory */}
          <div className="divide-y divide-border/70">
            {employees.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No employees registered yet.
              </p>
            ) : (
              employees.map((emp) => {
                const deptHeads =
                  emp.department === 'Architecture'
                    ? architectureHeads
                    : emp.department === 'Interior'
                      ? interiorHeads
                      : [];
                const expectedDefaultPass = computeDefaultPassword(emp.id);

                return (
                  <div
                    key={emp.id}
                    className="p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-primary/[0.02] transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {emp.id}
                        </span>
                        {emp.fullName && emp.fullName !== emp.id && (
                          <>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className="text-sm font-medium text-foreground">
                              {emp.fullName}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {emp.department ? emp.department : 'Unassigned'}
                        {emp.teamHeadName ? ` · ${emp.teamHeadName}` : ''}
                        {' · '}
                        {emp.isDefaultPassword
                          ? `Default password (${expectedDefaultPass})`
                          : 'Custom password active'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Inline Department Switch */}
                      <Select
                        value={emp.department || 'none'}
                        onValueChange={(val) =>
                          handleUpdateEmployeeTeam(
                            emp.id,
                            val === 'none' ? null : (val as Department),
                            null
                          )
                        }
                      >
                        <SelectTrigger className="h-9 w-36 text-xs bg-white border-border">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Architecture">Architecture</SelectItem>
                          <SelectItem value="Interior">Interior</SelectItem>
                          <SelectItem value="none">Unassigned</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Inline Team Head Switch */}
                      <Select
                        value={emp.teamHeadId || 'none'}
                        disabled={!emp.department || deptHeads.length === 0}
                        onValueChange={(val) =>
                          handleUpdateEmployeeTeam(
                            emp.id,
                            emp.department,
                            val === 'none' ? null : val
                          )
                        }
                      >
                        <SelectTrigger className="h-9 w-40 text-xs bg-white border-border">
                          <SelectValue placeholder="Team Head" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="none">No Team Head</SelectItem>
                          {deptHeads.map((th) => (
                            <SelectItem key={th.id} value={th.id}>
                              {th.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Reset to Default Password */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 text-xs bg-white border-border"
                        onClick={() => handleResetEmployeePassword(emp.id)}
                        title={`Reset password to "${expectedDefaultPass}"`}
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-primary" />
                        <span>Reset Password</span>
                      </Button>

                      {/* Delete Employee */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 text-destructive border-border hover:bg-destructive/10"
                        onClick={() => setEmployeeToDelete(emp)}
                        title={`Delete ${emp.id}`}
                        aria-label={`Delete ${emp.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* TEAM SECTION: ARCHITECTURE & INTERIOR (MAINTAINED BY ADMIN) */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Teams — Architecture & Interior
            </h2>
            <p className="text-xs text-muted-foreground">
              Add Team Heads as required under Architecture and Interior, rename leads, and assign registered employees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderDepartmentTeamPanel(
              'Architecture',
              architectureHeads,
              archNewHeadName,
              setArchNewHeadName,
              archNewLeadName,
              setArchNewLeadName,
              Building2
            )}
            {renderDepartmentTeamPanel(
              'Interior',
              interiorHeads,
              intNewHeadName,
              setIntNewHeadName,
              intNewLeadName,
              setIntNewLeadName,
              Compass
            )}
          </div>
        </section>

        {/* Global Organization Settings & Project Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Organization Settings</h2>
              <p className="text-xs text-muted-foreground">
                Default studio name applied to new specification schedules.
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs font-semibold">
                  Company / Studio Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="Enter your architectural firm name"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="bg-white/80 border-border h-10"
                />
              </div>
              <Button
                onClick={handleSaveSettings}
                className="w-full min-h-[40px] gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="h-4 w-4" /> Save Settings
              </Button>
            </div>
          </section>

          <section className="lg:col-span-2 glass-card rounded-2xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-border/70">
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Folder className="h-5 w-5 text-primary" /> Project Management
              </h2>
              <p className="text-xs text-muted-foreground">
                View, launch, or remove any material schedule stored on this device.
              </p>
            </div>
            <div className="divide-y divide-border/70 max-h-96 overflow-y-auto">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between px-5 py-3.5 gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Employee: {project.owner || 'Unassigned'} · Date: {project.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-border text-xs h-9"
                        onClick={() => router.push(`/project/${project.id}`)}
                      >
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 text-destructive border-border hover:bg-destructive/10"
                        onClick={() => setProjectToDeleteId(project.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-xs py-8 text-center">
                  No projects stored yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Delete Employee Confirmation Dialog */}
      <Dialog
        open={!!employeeToDelete}
        onOpenChange={(open) => !open && setEmployeeToDelete(null)}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Employee &ldquo;
              {employeeToDelete?.id}&rdquo;?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to remove {employeeToDelete?.id} and all projects assigned to
              this employee? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEmployeeToDelete(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmDeleteEmployee}>
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Head Confirmation Dialog */}
      <Dialog
        open={!!teamHeadToDelete}
        onOpenChange={(open) => !open && setTeamHeadToDelete(null)}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Remove &ldquo;
              {teamHeadToDelete?.name}&rdquo;?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Employees assigned to {teamHeadToDelete?.name} under {teamHeadToDelete?.department}{' '}
              will remain registered and become unassigned from this Team Head.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setTeamHeadToDelete(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmDeleteTeamHead}>
              Remove Team Head
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <Dialog
        open={!!projectToDeleteId}
        onOpenChange={(open) => !open && setProjectToDeleteId(null)}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Project?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to permanently delete this project? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setProjectToDeleteId(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NavigationFooter showAdmin={false} />
    </div>
  );
}
