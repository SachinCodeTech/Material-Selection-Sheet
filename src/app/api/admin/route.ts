import { NextRequest, NextResponse } from 'next/server';
import {
  addTeamHeadServer,
  createAdminToken,
  deleteEmployeeServer,
  deleteTeamHeadServer,
  isAdminSetupRequiredServer,
  listEmployeesServer,
  listTeamHeadsServer,
  registerEmployeeByAdminServer,
  resetEmployeePasswordByAdminServer,
  setupInitialAdminPasswordServer,
  updateEmployeeByAdminServer,
  updateTeamHeadServer,
  verifyAdminPasswordServer,
  verifyAdminToken,
} from '@/lib/server-auth';
import type { Department } from '@/lib/types';

const ADMIN_COOKIE_NAME = 'archspec_admin_session';

function isSecureRequest(req: NextRequest): boolean {
  const proto = req.headers.get('x-forwarded-proto');
  if (proto) return proto === 'https';
  return req.nextUrl.protocol === 'https:';
}

function buildAdminCookieOptions(req: NextRequest, maxAge: number) {
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

function isAdminRequest(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieToken && verifyAdminToken(cookieToken)) {
    return true;
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (verifyAdminToken(bearer)) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const setupRequired = isAdminSetupRequiredServer();

  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { authenticated: false, setupRequired },
      { status: 401 }
    );
  }

  const [employees, teamHeads] = await Promise.all([
    listEmployeesServer(),
    listTeamHeadsServer(),
  ]);

  return NextResponse.json({
    authenticated: true,
    setupRequired: false,
    employees,
    teamHeads,
    // Legacy compatibility field
    users: employees.map((e) => e.id),
  });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginOrAjax(req)) {
    return NextResponse.json({ success: false, error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const action = body?.action;

    // One-time initial Admin setup when ADMIN_PASSWORD env var is unset
    if (action === 'setup-admin') {
      const password = typeof body?.password === 'string' ? body.password : '';
      const result = setupInitialAdminPasswordServer(password);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      const token = createAdminToken();
      const [employees, teamHeads] = await Promise.all([
        listEmployeesServer(),
        listTeamHeadsServer(),
      ]);
      const response = NextResponse.json({
        success: true,
        authenticated: true,
        token,
        employees,
        teamHeads,
        message: 'Admin password configured and signed in.',
      });
      response.cookies.set(ADMIN_COOKIE_NAME, token, buildAdminCookieOptions(req, 60 * 60 * 12));
      return response;
    }

    if (action === 'login') {
      const password = typeof body?.password === 'string' ? body.password : '';
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Admin password is required.' },
          { status: 400 }
        );
      }

      if (isAdminSetupRequiredServer()) {
        return NextResponse.json(
          {
            success: false,
            setupRequired: true,
            error: 'Please configure the initial Admin password first.',
          },
          { status: 400 }
        );
      }

      const isValid = verifyAdminPasswordServer(password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid admin credentials.' },
          { status: 401 }
        );
      }

      const token = createAdminToken();
      const [employees, teamHeads] = await Promise.all([
        listEmployeesServer(),
        listTeamHeadsServer(),
      ]);
      const response = NextResponse.json({
        success: true,
        authenticated: true,
        token,
        employees,
        teamHeads,
        message: 'Admin authenticated.',
      });
      response.cookies.set(ADMIN_COOKIE_NAME, token, buildAdminCookieOptions(req, 60 * 60 * 12));
      return response;
    }

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Admin logged out.' });
      response.cookies.set(ADMIN_COOKIE_NAME, '', buildAdminCookieOptions(req, 0));
      return response;
    }

    // All remaining actions strictly require authenticated Admin session
    if (!isAdminRequest(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    if (action === 'register-employee') {
      const employeeId = typeof body?.employeeId === 'string' ? body.employeeId : '';
      const fullName = typeof body?.fullName === 'string' ? body.fullName : '';
      const password = typeof body?.password === 'string' ? body.password : undefined;
      const department =
        body?.department === 'Architecture' || body?.department === 'Interior'
          ? (body.department as Department)
          : null;
      const teamHeadId = typeof body?.teamHeadId === 'string' && body.teamHeadId ? body.teamHeadId : null;

      const result = await registerEmployeeByAdminServer({
        employeeId,
        fullName,
        password,
        department,
        teamHeadId,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        employee: result.employee,
        defaultPassword: result.defaultPassword,
        message: `Registered ${result.employee?.id} with password "${result.defaultPassword}".`,
      });
    }

    if (action === 'update-employee') {
      const employeeId = typeof body?.employeeId === 'string' ? body.employeeId : '';
      const fullName = typeof body?.fullName === 'string' ? body.fullName : undefined;
      const department =
        body?.department === undefined
          ? undefined
          : body.department === 'Architecture' || body.department === 'Interior'
            ? (body.department as Department)
            : null;
      const teamHeadId =
        body?.teamHeadId === undefined
          ? undefined
          : typeof body.teamHeadId === 'string' && body.teamHeadId
            ? body.teamHeadId
            : null;

      const result = await updateEmployeeByAdminServer({
        employeeId,
        fullName,
        department,
        teamHeadId,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, employee: result.employee });
    }

    if (action === 'reset-employee-password') {
      const employeeId = typeof body?.employeeId === 'string' ? body.employeeId : '';
      const customPassword =
        typeof body?.newPassword === 'string' && body.newPassword.trim()
          ? body.newPassword
          : undefined;

      const result = await resetEmployeePasswordByAdminServer(employeeId, customPassword);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        passwordUsed: result.passwordUsed,
        message: `Password for ${employeeId} reset to "${result.passwordUsed}".`,
      });
    }

    if (action === 'add-team-head') {
      const department = body?.department as Department;
      const name = typeof body?.name === 'string' ? body.name : '';
      const leadName = typeof body?.leadName === 'string' ? body.leadName : '';

      const result = await addTeamHeadServer({ department, name, leadName });
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, teamHead: result.teamHead });
    }

    if (action === 'update-team-head') {
      const id = typeof body?.id === 'string' ? body.id : '';
      const name = typeof body?.name === 'string' ? body.name : undefined;
      const leadName = typeof body?.leadName === 'string' ? body.leadName : undefined;

      const result = await updateTeamHeadServer({ id, name, leadName });
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, teamHead: result.teamHead });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOriginOrAjax(req)) {
    return NextResponse.json({ success: false, error: 'Forbidden origin.' }, { status: 403 });
  }

  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const teamHeadId = searchParams.get('teamHeadId');
    const employeeId = searchParams.get('employeeId') || searchParams.get('userId');

    if (teamHeadId) {
      const deleted = await deleteTeamHeadServer(teamHeadId);
      if (!deleted) {
        return NextResponse.json({ success: false, error: 'Team Head not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Team Head removed.' });
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID or Team Head ID is required.' },
        { status: 400 }
      );
    }

    const success = await deleteEmployeeServer(employeeId);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Employee not found or cannot be deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: `Employee ${employeeId} deleted.` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
