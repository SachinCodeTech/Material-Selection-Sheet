import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPasswordServer,
  createAdminToken,
  verifyAdminToken,
  listRegisteredUserIdsServer,
  deleteUserServer,
} from '@/lib/server-auth';

const ADMIN_COOKIE_NAME = 'archspec_admin_session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = token ? verifyAdminToken(token) : false;

  if (!isAdmin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const users = await listRegisteredUserIdsServer();
  return NextResponse.json({ authenticated: true, users });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, password } = body;

    if (action === 'login') {
      if (!password) {
        return NextResponse.json({ success: false, error: 'Admin password required.' }, { status: 400 });
      }

      const isValid = verifyAdminPasswordServer(password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid admin credentials.' }, { status: 401 });
      }

      const token = createAdminToken();
      const response = NextResponse.json({ success: true, message: 'Admin authenticated.' });
      response.cookies.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12, // 12 hours
      });
      return response;
    }

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Admin logged out.' });
      response.cookies.set(ADMIN_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = token ? verifyAdminToken(token) : false;

  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required.' }, { status: 400 });
    }

    const success = await deleteUserServer(userId);
    if (!success) {
      return NextResponse.json({ success: false, error: 'User not found or cannot be deleted.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `User ${userId} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error.' }, { status: 500 });
  }
}
