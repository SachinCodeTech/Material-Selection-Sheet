import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUserServer,
  registerUserServer,
  changeUserPasswordServer,
  resetUserPasswordServer,
  createSessionToken,
  verifySessionToken,
} from '@/lib/server-auth';

const SESSION_COOKIE_NAME = 'archspec_auth_session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (session) {
    return NextResponse.json({
      authenticated: true,
      user: session.userId,
    });
  }

  return NextResponse.json({
    authenticated: false,
    user: null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, password, oldPassword, newPassword } = body;

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
      response.cookies.set(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    if (action === 'login') {
      if (!userId || !password) {
        return NextResponse.json({ success: false, error: 'User ID and password are required.' }, { status: 400 });
      }

      const isValid = await authenticateUserServer(userId, password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid User ID or password.' }, { status: 401 });
      }

      const sessionToken = createSessionToken(userId);
      const response = NextResponse.json({ success: true, user: userId });
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    if (action === 'register') {
      if (!userId || !password) {
        return NextResponse.json({ success: false, error: 'User ID and password are required.' }, { status: 400 });
      }

      const result = await registerUserServer(userId, password);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || 'Registration failed.' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Registration successful. You can now log in.' });
    }

    if (action === 'change-password') {
      if (!userId || !oldPassword || !newPassword) {
        return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
      }

      const result = await changeUserPasswordServer(userId, oldPassword, newPassword);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || 'Password update failed.' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Password changed successfully.' });
    }

    if (action === 'reset-password') {
      if (!userId || !newPassword) {
        return NextResponse.json({ success: false, error: 'User ID and new password are required.' }, { status: 400 });
      }

      const result = await resetUserPasswordServer(userId, newPassword);
      return NextResponse.json({
        success: true,
        message: result.message || 'If an account exists, recovery instructions have been provided.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
