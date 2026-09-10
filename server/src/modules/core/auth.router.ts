import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { tokenService, TokenPayload } from './token.service';
import { authRateLimiter } from '../../middleware/rate-limit';
import { logger } from '../../config/logger';

const router = Router();
const authLogger = logger.child({ module: 'auth' });

// ─── Password Policy ────────────────────────────────────
const PASSWORD_MIN_LENGTH = 8;

function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
}

/**
 * Derive role from employee data (department + title).
 */
function deriveRole(employee: { department: string; roleTitle: string }): string {
  const title = employee.roleTitle.toLowerCase();
  if (title.includes('ceo') || title.includes('chief') || title.includes('founder')) {
    return 'super_admin';
  }
  if (title.includes('vp') || title.includes('director') || title.includes('head')) {
    if (employee.department === 'HR' || title.includes('people')) return 'hr_admin';
    if (employee.department === 'Finance') return 'fin_admin';
    if (employee.department === 'Engineering' || employee.department === 'IT') return 'it_admin';
    return 'manager';
  }
  if (title.includes('manager') || title.includes('lead')) return 'manager';
  return 'employee';
}

/**
 * POST /api/core/auth/login
 * JWT-based login — validates email + password against bcrypt hashes in DB.
 * Returns access token + refresh token pair.
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const employee = await prisma.employee.findUnique({
      where: { email: normalizedEmail },
    });

    if (!employee) {
      // Constant-time response to prevent user enumeration
      await bcrypt.hash('dummy', 10);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (employee.status === 'TERMINATED') {
      return res.status(403).json({ error: 'Account has been deactivated. Contact your administrator.' });
    }

    // Password is always required — no dev bypass
    if (!employee.passwordHash) {
      return res.status(403).json({
        error: 'Account requires password setup. Please register or contact your administrator.',
        code: 'PASSWORD_SETUP_REQUIRED',
      });
    }

    const isValid = await bcrypt.compare(password, employee.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const role = deriveRole(employee);

    const tokenPayload: TokenPayload = {
      employeeId: employee.id,
      email: employee.email,
      role,
    };

    const { accessToken, refreshToken } = tokenService.generateTokenPair(tokenPayload);

    // Store refresh token for revocation
    await tokenService.storeRefreshToken(employee.id, refreshToken);

    authLogger.info('Login successful', { employeeId: employee.id, role });

    res.json({
      token: accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRY,
      user: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role,
        roleTitle: employee.roleTitle,
        department: employee.department,
        avatarUrl: employee.avatarUrl,
      },
    });
  } catch (error: any) {
    authLogger.error('Login error', { error });
    res.status(500).json({ error: 'Authentication service error' });
  }
});

/**
 * POST /api/core/auth/register
 * Self-service registration for employees whose email already exists in the system
 * (pre-provisioned by admin/seed). Sets their password and activates the account.
 */
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    // Check if employee exists (pre-provisioned by admin)
    const existing = await prisma.employee.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Employee was pre-provisioned — set their password
      if (existing.passwordHash) {
        return res.status(409).json({ error: 'Account already registered. Please sign in.' });
      }

      const hash = await bcrypt.hash(password, 12);
      const employee = await prisma.employee.update({
        where: { id: existing.id },
        data: {
          passwordHash: hash,
          status: existing.status === 'ONBOARDING' ? 'ACTIVE' : existing.status,
        },
      });

      const role = deriveRole(employee);
      const tokenPayload: TokenPayload = { employeeId: employee.id, email: employee.email, role };
      const { accessToken, refreshToken } = tokenService.generateTokenPair(tokenPayload);
      await tokenService.storeRefreshToken(employee.id, refreshToken);

      authLogger.info('Employee registered (pre-provisioned)', { employeeId: employee.id });

      return res.status(201).json({
        token: accessToken,
        refreshToken,
        expiresIn: env.JWT_ACCESS_EXPIRY,
        user: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          role,
          roleTitle: employee.roleTitle,
          department: employee.department,
          avatarUrl: employee.avatarUrl,
        },
      });
    }

    // Self-registration for new employees (if enabled)
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required for new accounts' });
    }

    const hash = await bcrypt.hash(password, 12);
    const newEmployee = await prisma.employee.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        passwordHash: hash,
        department: 'General',
        roleTitle: 'Employee',
        hireDate: new Date(),
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
      },
    });

    const role = deriveRole(newEmployee);
    const tokenPayload: TokenPayload = { employeeId: newEmployee.id, email: newEmployee.email, role };
    const { accessToken, refreshToken } = tokenService.generateTokenPair(tokenPayload);
    await tokenService.storeRefreshToken(newEmployee.id, refreshToken);

    authLogger.info('New employee registered', { employeeId: newEmployee.id, email: normalizedEmail });

    res.status(201).json({
      token: accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRY,
      user: {
        id: newEmployee.id,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        role,
        roleTitle: newEmployee.roleTitle,
        department: newEmployee.department,
        avatarUrl: newEmployee.avatarUrl,
      },
    });
  } catch (error: any) {
    authLogger.error('Registration error', { error });
    res.status(500).json({ error: 'Registration service error' });
  }
});

/**
 * POST /api/core/auth/refresh
 * Refresh access token using a valid refresh token.
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify the refresh token
    const decoded = tokenService.verifyRefreshToken(refreshToken);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Lookup the employee to get current role (may have changed)
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.employeeId },
    });

    if (!employee || employee.status === 'TERMINATED') {
      return res.status(401).json({ error: 'Account no longer active' });
    }

    const role = deriveRole(employee);

    const tokenPayload: TokenPayload = {
      employeeId: employee.id,
      email: employee.email,
      role,
    };

    const newTokens = tokenService.generateTokenPair(tokenPayload);

    // Blacklist old refresh token and store new one
    await tokenService.blacklistToken(refreshToken);
    await tokenService.storeRefreshToken(employee.id, newTokens.refreshToken);

    res.json({
      token: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired — please log in again', code: 'REFRESH_EXPIRED' });
    }
    authLogger.error('Token refresh error', { error });
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /api/core/auth/logout
 * Blacklist the current access token + refresh token.
 */
router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    const { refreshToken } = req.body;

    if (token) {
      await tokenService.blacklistToken(token);
    }
    if (refreshToken) {
      await tokenService.blacklistToken(refreshToken);
    }

    // Revoke all stored refresh tokens for this user
    if (req.user?.employeeId) {
      await tokenService.revokeAllTokens(req.user.employeeId);
    }

    authLogger.info('Logout successful', { employeeId: req.user?.employeeId });
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    authLogger.error('Logout error', { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/core/auth/me
 * Returns current user info from JWT.
 */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.user!.employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleTitle: true,
        department: true,
        avatarUrl: true,
        status: true,
        location: true,
        pronouns: true,
        bio: true,
        phone: true,
        hireDate: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...employee,
      role: req.user!.role,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/core/auth/change-password
 */
router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: req.user!.employeeId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password if one exists
    if (employee.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      const isValid = await bcrypt.compare(currentPassword, employee.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.employee.update({
      where: { id: employee.id },
      data: { passwordHash: hash },
    });

    // Revoke all existing tokens (force re-login with new password)
    await tokenService.revokeAllTokens(employee.id);

    authLogger.info('Password changed', { employeeId: employee.id });
    res.json({ message: 'Password updated successfully. Please log in again.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const authRouter = router;
