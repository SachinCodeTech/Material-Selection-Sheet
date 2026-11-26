import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import type { Department, EmployeeProfile, TeamHead } from '@/lib/types';

interface EmployeeRecord {
  id: string;
  fullName: string;
  department: Department | null;
  teamHeadId: string | null;
  salt: string;
  hash: string;
  isDefaultPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminCredentialRecord {
  salt: string;
  hash: string;
  createdAt: string;
}

interface OrgAuthDatabase {
  adminCredential: AdminCredentialRecord | null;
  employees: Record<string, EmployeeRecord>;
  teamHeads: TeamHead[];
}

// Keep runtime signing secret and in-memory DB cache on globalThis so Next.js route modules stay in sync
const globalForAuth = globalThis as unknown as {
  __archspecSessionSecret?: string;
  __archspecOrgDb?: OrgAuthDatabase;
  __archspecDbPath?: string;
};

function getSessionSecret(): string {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim().length > 0) {
    return process.env.AUTH_SECRET.trim();
  }
  if (!globalForAuth.__archspecSessionSecret) {
    globalForAuth.__archspecSessionSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalForAuth.__archspecSessionSecret;
}

function getStorageFilePath(): string {
  if (globalForAuth.__archspecDbPath) {
    return globalForAuth.__archspecDbPath;
  }

  const localDir = path.join(process.cwd(), '.server-data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const probe = path.join(localDir, '.write-probe');
    fs.writeFileSync(probe, 'ok', 'utf-8');
    fs.unlinkSync(probe);
    globalForAuth.__archspecDbPath = path.join(localDir, 'org-auth.json');
    return globalForAuth.__archspecDbPath;
  } catch {
    // Serverless environments (e.g. Vercel) have a read-only cwd; fall back cleanly to os.tmpdir()
    const tmpDir = path.join(os.tmpdir(), 'archspec-suite-data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {
      // Ignore; in-memory singleton still maintains state
    }
    globalForAuth.__archspecDbPath = path.join(tmpDir, 'org-auth.json');
    return globalForAuth.__archspecDbPath;
  }
}

function hashPasswordScrypt(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function timingSafeCompareHex(aHex: string, bHex: string): boolean {
  const aBuf = Buffer.from(aHex, 'hex');
  const bBuf = Buffer.from(bHex, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function timingSafeCompareStrings(a: string, b: string): boolean {
  const aHash = crypto.createHash('sha256').update(a).digest();
  const bHash = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

/**
 * Generates the default password matching the employee ID convention:
 *   "Employee 1" -> "Password 1"
 *   "Employee 2" -> "Password 2"
 *   "Employee 15" -> "Password 15"
 */
export function getDefaultPasswordForEmployee(employeeId: string): string {
  const trimmed = employeeId.trim();
  const numMatch = trimmed.match(/(\d+)\s*$/);
  if (numMatch) {
    return `Password ${numMatch[1]}`;
  }
  return `Password ${trimmed}`;
}

function createDefaultTeamHeads(): TeamHead[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'arch-th-1',
      department: 'Architecture',
      name: 'Team Head 1',
      leadName: '',
      createdAt: now,
    },
    {
      id: 'arch-th-2',
      department: 'Architecture',
      name: 'Team Head 2',
      leadName: '',
      createdAt: now,
    },
    {
      id: 'int-th-1',
      department: 'Interior',
      name: 'Team Head 1',
      leadName: '',
      createdAt: now,
    },
    {
      id: 'int-th-2',
      department: 'Interior',
      name: 'Team Head 2',
      leadName: '',
      createdAt: now,
    },
  ];
}

function createInitialDb(): OrgAuthDatabase {
  const now = new Date().toISOString();
  const emp1Salt = crypto.randomBytes(16).toString('hex');
  return {
    adminCredential: null,
    employees: {
      'Employee 1': {
        id: 'Employee 1',
        fullName: 'Employee 1',
        department: 'Architecture',
        teamHeadId: 'arch-th-1',
        salt: emp1Salt,
        hash: hashPasswordScrypt('Password 1', emp1Salt),
        isDefaultPassword: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    teamHeads: createDefaultTeamHeads(),
  };
}

function saveOrgDb(db: OrgAuthDatabase): void {
  globalForAuth.__archspecOrgDb = db;
  const filePath = getStorageFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist org-auth.json to disk (in-memory store remains active):', err);
  }
}

function loadOrgDb(): OrgAuthDatabase {
  if (globalForAuth.__archspecOrgDb) {
    return globalForAuth.__archspecOrgDb;
  }

  const filePath = getStorageFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<OrgAuthDatabase>;
      const db: OrgAuthDatabase = {
        adminCredential: parsed.adminCredential ?? null,
        employees: parsed.employees && typeof parsed.employees === 'object' ? parsed.employees : {},
        teamHeads:
          Array.isArray(parsed.teamHeads) && parsed.teamHeads.length > 0
            ? parsed.teamHeads
            : createDefaultTeamHeads(),
      };

      // Guarantee Employee 1 exists if database had zero employees
      if (Object.keys(db.employees).length === 0) {
        const seeded = createInitialDb();
        db.employees = seeded.employees;
        saveOrgDb(db);
      }

      globalForAuth.__archspecOrgDb = db;
      return db;
    } catch (err) {
      console.warn('Error reading org-auth.json, initializing fresh store:', err);
    }
  }

  const initialDb = createInitialDb();
  saveOrgDb(initialDb);
  return initialDb;
}

function findEmployeeKey(db: OrgAuthDatabase, rawId: string): string | null {
  const normalized = rawId.trim().toLowerCase();
  if (!normalized) return null;
  for (const key of Object.keys(db.employees)) {
    if (key.trim().toLowerCase() === normalized) {
      return key;
    }
  }
  return null;
}

function toPublicProfile(db: OrgAuthDatabase, record: EmployeeRecord): EmployeeProfile {
  const teamHead = record.teamHeadId
    ? db.teamHeads.find((th) => th.id === record.teamHeadId) || null
    : null;
  return {
    id: record.id,
    fullName: record.fullName,
    department: record.department,
    teamHeadId: teamHead ? teamHead.id : null,
    teamHeadName: teamHead ? teamHead.name : null,
    isDefaultPassword: record.isDefaultPassword,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// ============================================================================
// ADMIN AUTHENTICATION (env ADMIN_PASSWORD takes precedence; otherwise one-time first-run claim)
// ============================================================================

export function isAdminSetupRequiredServer(): boolean {
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0) {
    return false;
  }
  const db = loadOrgDb();
  return !db.adminCredential;
}

export function setupInitialAdminPasswordServer(
  newPassword: string
): { success: boolean; error?: string } {
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0) {
    return { success: false, error: 'Admin password is already configured on the server.' };
  }
  const db = loadOrgDb();
  if (db.adminCredential) {
    return { success: false, error: 'Admin password has already been initialized.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Admin password must be at least 6 characters.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  db.adminCredential = {
    salt,
    hash: hashPasswordScrypt(newPassword, salt),
    createdAt: new Date().toISOString(),
  };
  saveOrgDb(db);
  return { success: true };
}

export function verifyAdminPasswordServer(password: string): boolean {
  if (!password || typeof password !== 'string') return false;

  // Environment variable always overrides any claimed fallback hash
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0) {
    return timingSafeCompareStrings(password, process.env.ADMIN_PASSWORD.trim());
  }

  const db = loadOrgDb();
  if (!db.adminCredential) {
    return false;
  }

  const candidateHash = hashPasswordScrypt(password, db.adminCredential.salt);
  return timingSafeCompareHex(candidateHash, db.adminCredential.hash);
}

// ============================================================================
// EMPLOYEE AUTHENTICATION & ADMIN-MANAGED REGISTRATION
// ============================================================================

export async function authenticateEmployeeServer(
  employeeId: string,
  password: string
): Promise<{ authenticated: boolean; employee?: EmployeeProfile }> {
  const db = loadOrgDb();
  const matchedKey = findEmployeeKey(db, employeeId);
  if (!matchedKey) {
    // Perform dummy scrypt work to avoid timing enumeration
    hashPasswordScrypt(password, '00000000000000000000000000000000');
    return { authenticated: false };
  }

  const record = db.employees[matchedKey];
  const candidateHash = hashPasswordScrypt(password, record.salt);
  const valid = timingSafeCompareHex(candidateHash, record.hash);

  if (!valid) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    employee: toPublicProfile(db, record),
  };
}

export async function getEmployeeProfileServer(employeeId: string): Promise<EmployeeProfile | null> {
  const db = loadOrgDb();
  const matchedKey = findEmployeeKey(db, employeeId);
  if (!matchedKey) return null;
  return toPublicProfile(db, db.employees[matchedKey]);
}

export async function listEmployeesServer(): Promise<EmployeeProfile[]> {
  const db = loadOrgDb();
  return Object.values(db.employees)
    .map((rec) => toPublicProfile(db, rec))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
}

export async function registerEmployeeByAdminServer(params: {
  employeeId: string;
  fullName?: string;
  password?: string;
  department?: Department | null;
  teamHeadId?: string | null;
}): Promise<{
  success: boolean;
  error?: string;
  employee?: EmployeeProfile;
  defaultPassword?: string;
}> {
  const db = loadOrgDb();
  const cleanId = params.employeeId.trim();

  if (!cleanId) {
    return { success: false, error: 'Employee ID is required.' };
  }
  if (cleanId.length > 60) {
    return { success: false, error: 'Employee ID must be 60 characters or fewer.' };
  }
  if (findEmployeeKey(db, cleanId)) {
    return { success: false, error: `Employee "${cleanId}" is already registered.` };
  }

  const computedDefaultPassword = getDefaultPasswordForEmployee(cleanId);
  const effectivePassword =
    params.password && params.password.trim().length > 0
      ? params.password
      : computedDefaultPassword;

  let validatedDepartment: Department | null =
    params.department === 'Architecture' || params.department === 'Interior'
      ? params.department
      : null;

  let validatedTeamHeadId: string | null = null;
  if (params.teamHeadId) {
    const th = db.teamHeads.find((t) => t.id === params.teamHeadId);
    if (th) {
      validatedTeamHeadId = th.id;
      validatedDepartment = th.department;
    }
  }

  const now = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');

  const record: EmployeeRecord = {
    id: cleanId,
    fullName: (params.fullName || '').trim() || cleanId,
    department: validatedDepartment,
    teamHeadId: validatedTeamHeadId,
    salt,
    hash: hashPasswordScrypt(effectivePassword, salt),
    isDefaultPassword: effectivePassword === computedDefaultPassword,
    createdAt: now,
    updatedAt: now,
  };

  db.employees[cleanId] = record;
  saveOrgDb(db);

  return {
    success: true,
    employee: toPublicProfile(db, record),
    defaultPassword: effectivePassword,
  };
}

export async function updateEmployeeByAdminServer(params: {
  employeeId: string;
  fullName?: string;
  department?: Department | null;
  teamHeadId?: string | null;
}): Promise<{ success: boolean; error?: string; employee?: EmployeeProfile }> {
  const db = loadOrgDb();
  const matchedKey = findEmployeeKey(db, params.employeeId);
  if (!matchedKey) {
    return { success: false, error: 'Employee not found.' };
  }

  const record = db.employees[matchedKey];

  if (typeof params.fullName === 'string' && params.fullName.trim()) {
    record.fullName = params.fullName.trim().slice(0, 80);
  }

  if (params.department !== undefined) {
    record.department =
      params.department === 'Architecture' || params.department === 'Interior'
        ? params.department
        : null;
    if (!record.department) {
      record.teamHeadId = null;
    }
  }

  if (params.teamHeadId !== undefined) {
    if (!params.teamHeadId) {
      record.teamHeadId = null;
    } else {
      const th = db.teamHeads.find((t) => t.id === params.teamHeadId);
      if (th) {
        record.teamHeadId = th.id;
        record.department = th.department;
      }
    }
  }

  record.updatedAt = new Date().toISOString();
  saveOrgDb(db);

  return { success: true, employee: toPublicProfile(db, record) };
}

export async function resetEmployeePasswordByAdminServer(
  employeeId: string,
  customPassword?: string
): Promise<{ success: boolean; error?: string; passwordUsed?: string }> {
  const db = loadOrgDb();
  const matchedKey = findEmployeeKey(db, employeeId);
  if (!matchedKey) {
    return { success: false, error: 'Employee not found.' };
  }

  const record = db.employees[matchedKey];
  const defaultPass = getDefaultPasswordForEmployee(record.id);
  const nextPass =
    customPassword && customPassword.trim().length > 0 ? customPassword : defaultPass;

  const newSalt = crypto.randomBytes(16).toString('hex');
  record.salt = newSalt;
  record.hash = hashPasswordScrypt(nextPass, newSalt);
  record.isDefaultPassword = nextPass === defaultPass;
  record.updatedAt = new Date().toISOString();
  saveOrgDb(db);

  return { success: true, passwordUsed: nextPass };
}

export async function changeEmployeePasswordServer(
  employeeId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const db = loadOrgDb();
  const matchedKey = findEmployeeKey(db, employeeId);
  if (!matchedKey) {
    return { success: false, error: 'Employee is not registered.' };
  }

  const record = db.employees[matchedKey];
  const candidateHash = hashPasswordScrypt(oldPassword, record.salt);
  if (!timingSafeCompareHex(candidateHash, record.hash)) {
    return { success: false, error: 'Invalid current password.' };
  }

  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: 'New password must be at least 4 characters.' };
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  record.salt = newSalt;
  record.hash = hashPasswordScrypt(newPassword, newSalt);
  record.isDefaultPassword = newPassword === getDefaultPasswordForEmployee(record.id);
  record.updatedAt = new Date().toISOString();
  saveOrgDb(db);

  return { success: true };
}

export async function deleteEmployeeServer(employeeId: string): Promise<boolean> {
  const db = loadOrgDb();
  const matchedKey = findEmployeeKey(db, employeeId);
  if (!matchedKey) return false;
  delete db.employees[matchedKey];
  saveOrgDb(db);
  return true;
}

// ============================================================================
// TEAM HEAD MANAGEMENT (Architecture & Interior — Maintained by Admin)
// ============================================================================

export async function listTeamHeadsServer(): Promise<TeamHead[]> {
  const db = loadOrgDb();
  return [...db.teamHeads];
}

export async function addTeamHeadServer(params: {
  department: Department;
  name: string;
  leadName?: string;
}): Promise<{ success: boolean; error?: string; teamHead?: TeamHead }> {
  const db = loadOrgDb();
  if (params.department !== 'Architecture' && params.department !== 'Interior') {
    return { success: false, error: 'Department must be Architecture or Interior.' };
  }

  const cleanName = params.name.trim();
  if (!cleanName) {
    return { success: false, error: 'Team Head name is required.' };
  }

  const duplicate = db.teamHeads.some(
    (th) =>
      th.department === params.department &&
      th.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (duplicate) {
    return {
      success: false,
      error: `"${cleanName}" already exists under ${params.department}.`,
    };
  }

  const prefix = params.department === 'Architecture' ? 'arch' : 'int';
  const newHead: TeamHead = {
    id: `${prefix}-th-${crypto.randomBytes(4).toString('hex')}`,
    department: params.department,
    name: cleanName.slice(0, 60),
    leadName: (params.leadName || '').trim().slice(0, 80),
    createdAt: new Date().toISOString(),
  };

  db.teamHeads.push(newHead);
  saveOrgDb(db);
  return { success: true, teamHead: newHead };
}

export async function updateTeamHeadServer(params: {
  id: string;
  name?: string;
  leadName?: string;
}): Promise<{ success: boolean; error?: string; teamHead?: TeamHead }> {
  const db = loadOrgDb();
  const target = db.teamHeads.find((th) => th.id === params.id);
  if (!target) {
    return { success: false, error: 'Team Head not found.' };
  }

  if (typeof params.name === 'string') {
    const cleanName = params.name.trim();
    if (!cleanName) {
      return { success: false, error: 'Team Head name cannot be empty.' };
    }
    const duplicate = db.teamHeads.some(
      (th) =>
        th.id !== target.id &&
        th.department === target.department &&
        th.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      return {
        success: false,
        error: `"${cleanName}" already exists under ${target.department}.`,
      };
    }
    target.name = cleanName.slice(0, 60);
  }

  if (typeof params.leadName === 'string') {
    target.leadName = params.leadName.trim().slice(0, 80);
  }

  saveOrgDb(db);
  return { success: true, teamHead: target };
}

export async function deleteTeamHeadServer(id: string): Promise<boolean> {
  const db = loadOrgDb();
  const exists = db.teamHeads.some((th) => th.id === id);
  if (!exists) return false;

  db.teamHeads = db.teamHeads.filter((th) => th.id !== id);
  // Unassign any employees previously linked to the deleted Team Head
  for (const record of Object.values(db.employees)) {
    if (record.teamHeadId === id) {
      record.teamHeadId = null;
      record.updatedAt = new Date().toISOString();
    }
  }
  saveOrgDb(db);
  return true;
}

// ============================================================================
// SESSION TOKENS (HMAC-SHA256)
// ============================================================================

export function createSessionToken(employeeId: string): string {
  const payload = JSON.stringify({
    employeeId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    nonce: crypto.randomBytes(8).toString('hex'),
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): { employeeId: string } | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(encodedPayload)
      .digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    const id = payload.employeeId || payload.userId;
    return id ? { employeeId: id } : null;
  } catch {
    return null;
  }
}

export function createAdminToken(): string {
  const payload = JSON.stringify({
    role: 'admin',
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
    nonce: crypto.randomBytes(8).toString('hex'),
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(`admin.${encodedPayload}`)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [encodedPayload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(`admin.${encodedPayload}`)
      .digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    return payload.role === 'admin' && (!payload.exp || Date.now() <= payload.exp);
  } catch {
    return false;
  }
}
