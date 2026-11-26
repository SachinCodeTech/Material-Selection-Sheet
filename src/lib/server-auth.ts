import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Protected server-only storage directory for credentials
const DATA_DIR = path.join(process.cwd(), '.server-data');
const AUTH_FILE = path.join(DATA_DIR, 'users-auth.json');

// Secret salt for password hashing and HMAC session signing
const SERVER_SECRET = process.env.AUTH_SECRET || 'archspec-suite-internal-server-secret-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

interface UserRecord {
  salt: string;
  hash: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthDatabase {
  users: Record<string, UserRecord>;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create data dir:', e);
    }
  }
}

function hashPasswordServer(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt + SERVER_SECRET, 10000, 64, 'sha512').toString('hex');
}

function loadAuthDb(): AuthDatabase {
  ensureDataDir();
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading auth db, reinitializing:', e);
    }
  }

  // Initialize with default User1
  const initialSalt = crypto.randomBytes(16).toString('hex');
  const initialDb: AuthDatabase = {
    users: {
      'User1': {
        salt: initialSalt,
        hash: hashPasswordServer('password', initialSalt),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };
  saveAuthDb(initialDb);
  return initialDb;
}

function saveAuthDb(db: AuthDatabase): void {
  ensureDataDir();
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing auth db:', e);
  }
}

export async function authenticateUserServer(userId: string, password: string): Promise<boolean> {
  const db = loadAuthDb();
  const user = db.users[userId];
  if (!user) {
    // Perform dummy hash to prevent timing-based user enumeration
    const dummyHash = hashPasswordServer(password, '00000000000000000000000000000000');
    crypto.timingSafeEqual(Buffer.from(dummyHash), Buffer.from(dummyHash));
    return false;
  }

  const candidateHash = hashPasswordServer(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(user.hash));
}

export async function registerUserServer(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
  const db = loadAuthDb();
  if (db.users[userId]) {
    return { success: false, error: 'User ID is already registered.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  db.users[userId] = {
    salt,
    hash: hashPasswordServer(password, salt),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveAuthDb(db);
  return { success: true };
}

export async function changeUserPasswordServer(userId: string, oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> {
  const db = loadAuthDb();
  const user = db.users[userId];
  if (!user) {
    return { success: false, error: 'User not registered.' };
  }

  const candidateHash = hashPasswordServer(oldPass, user.salt);
  const isValid = crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(user.hash));
  if (!isValid) {
    return { success: false, error: 'Invalid current password.' };
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  user.salt = newSalt;
  user.hash = hashPasswordServer(newPass, newSalt);
  user.updatedAt = new Date().toISOString();
  saveAuthDb(db);
  return { success: true };
}

export async function resetUserPasswordServer(userId: string, newPass: string): Promise<{ success: boolean; message: string }> {
  const db = loadAuthDb();
  const user = db.users[userId];
  if (user) {
    const newSalt = crypto.randomBytes(16).toString('hex');
    user.salt = newSalt;
    user.hash = hashPasswordServer(newPass, newSalt);
    user.updatedAt = new Date().toISOString();
    saveAuthDb(db);
  } else {
    // Perform dummy hash to equalize processing time and prevent enumeration
    const dummySalt = crypto.randomBytes(16).toString('hex');
    hashPasswordServer(newPass, dummySalt);
  }

  return { success: true, message: 'If an account exists, recovery instructions have been provided.' };
}

export async function listRegisteredUserIdsServer(): Promise<string[]> {
  const db = loadAuthDb();
  return Object.keys(db.users);
}

export async function deleteUserServer(userId: string): Promise<boolean> {
  const db = loadAuthDb();
  if (!db.users[userId]) return false;
  delete db.users[userId];
  saveAuthDb(db);
  return true;
}

// Session Token Generation & Verification (HMAC-SHA256 signed tokens)
export function createSessionToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    nonce: crypto.randomBytes(8).toString('hex'),
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SERVER_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;

    const expectedSig = crypto.createHmac('sha256', SERVER_SECRET).update(encodedPayload).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

// Admin Token
export function verifyAdminPasswordServer(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createAdminToken(): string {
  const payload = JSON.stringify({
    role: 'admin',
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SERVER_SECRET).update(`admin.${encodedPayload}`).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [encodedPayload, signature] = parts;

    const expectedSig = crypto.createHmac('sha256', SERVER_SECRET).update(`admin.${encodedPayload}`).digest('base64url');
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
