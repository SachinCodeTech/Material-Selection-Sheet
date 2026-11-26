import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateEmployeeServer,
  changeEmployeePasswordServer,
  createSessionToken,
  getEmployeeProfileServer,
  listEmployeesServer,
  verifySessionToken,
} from '@/lib/server-auth';

const SESSION_COOKIE_NAME = 'archspec_auth_session';

function isSecureRequest(req: NextRequest): boolean {
  const proto = req.headers.get('x-forwarded-proto');
  if (proto) return proto === 'https';
  return req.nextUrl.protocol === 'https:';
}

function buildSessionCookieOptions(req: NextRequest, maxAge: number) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    secure,
    sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
    ...(secure ? { partitioned: true } : {}),
    path: '/',
    maxAge,
  };
}

function isSameOriginOrAjax(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host) return true;
  try {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.host === host) return true;
  } catch {
    return false;
  }
  return req.headers.get('x-requested-with') === 'XMLHttpRequest';
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const employees = await listEmployeesServer();

  if (session) {
    const profile = await getEmployeeProfileServer(session.employeeId);
    if (profile) {
      return NextResponse.json({
        authenticated: true,
        employee: profile.id,
        user: profile.id,
        employeeProfile: profile,
        registeredEmployees: employees.map((e) => ({
          id: e.id,
          fullName: e.fullName,
          department: e.department,
          teamHeadId: e.teamHeadId,
          teamHeadName: e.teamHeadName,
        })),
      });
    }
  }

  return NextResponse.json({
    authenticated: false,
    employee: null,
    user: null,
    employeeProfile: null,
    registeredEmployees: employees.map((e) => ({
      id: e.id,
      fullName: e.fullName,
      department: e.department,
      teamHeadId: e.teamHeadId,
      teamHeadName: e.teamHeadName,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginOrAjax(req)) {
    return NextResponse.json({ success: false, error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const action = body?.action;
    const rawEmployeeId = typeof body?.employeeId === 'string' ? body.employeeId : body?.userId;
    const employeeId = typeof rawEmployeeId === 'string' ? rawEmployeeId.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const oldPassword = typeof body?.oldPassword === 'string' ? body.oldPassword : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if (action === 'logout') {
      const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully.',
      });
      response.cookies.set(SESSION_COOKIE_NAME, '', buildSessionCookieOptions(req, 0));
      return response;
    }

    if (action === 'login') {
      if (!employeeId || !password) {
        return NextResponse.json(
          { success: false, error: 'Employee ID and password are required.' },
          { status: 400 }
        );
      }

      const authResult = await authenticateEmployeeServer(employeeId, password);
      if (!authResult.authenticated || !authResult.employee) {
        return NextResponse.json(
          { success: false, error: 'Invalid Employee ID or password.' },
          { status: 401 }
        );
      }

      const sessionToken = createSessionToken(authResult.employee.id);
      const response = NextResponse.json({
        success: true,
        employee: authResult.employee.id,
        user: authResult.employee.id,
        employeeProfile: authResult.employee,
      });
      response.cookies.set(
        SESSION_COOKIE_NAME,
        sessionToken,
        buildSessionCookieOptions(req, 60 * 60 * 24 * 7)
      );
      return response;
    }

    if (action === 'register') {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee registration is managed by the Admin Portal. Please contact your Admin.',
        },
        { status: 403 }
      );
    }

    if (action === 'change-password') {
      if (!employeeId || !oldPassword || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'Employee ID, current password, and new password are required.' },
          { status: 400 }
        );
      }

      const result = await changeEmployeePasswordServer(employeeId, oldPassword, newPassword);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Password update failed.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully. You can now sign in with your new password.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
