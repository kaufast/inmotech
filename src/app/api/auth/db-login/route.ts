import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSecureToken, verifyPassword, createSecureJWT } from '@/lib/edge-crypto';
import { createId } from '@paralleldrive/cuid2';
import { sendAuditLog, extractClientInfo } from '@/lib/edge-audit';
import { AuditEventType, AuditEventAction, AuditSeverity } from '@/lib/audit-log';

export const runtime = 'edge';

// Helper functions for device detection
const extractPlatform = (userAgent: string): string => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Unknown';
};

const extractBrowser = (userAgent: string): string => {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

// Get Supabase configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({
        error: 'Email and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if Supabase configuration is available
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration not found in environment');
      return new Response(JSON.stringify({
        error: 'Database configuration error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user from database with roles and permissions
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(`
        id, 
        email, 
        password_hash,
        first_name,
        last_name,
        is_active,
        is_verified,
        is_admin,
        kyc_status,
        login_attempts,
        locked_until,
        two_factor_enabled,
        two_factor_secret
      `)
      .eq('email', email.toLowerCase())
      .limit(1);
    
    if (userError) {
      console.error('Database error:', userError);
      return new Response(JSON.stringify({
        error: 'Database error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const user = users?.[0];
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Invalid email or password'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user roles and permissions
    const { data: rolesResult, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        roles!inner(
          name,
          description,
          is_active,
          role_permissions!inner(
            permissions!inner(
              name,
              resource,
              action,
              description
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('roles.is_active', true);

    if (rolesError) {
      console.error('Roles query error:', rolesError);
    }

    // Process roles and permissions
    const roleMap = new Map();
    const allPermissions: string[] = [];
    
    if (rolesResult) {
      rolesResult.forEach(userRole => {
        const role = userRole.roles as any;
        if (role && !roleMap.has(role.name)) {
          roleMap.set(role.name, {
            name: role.name,
            description: role.description,
            permissions: []
          });
        }
        
        const roleData = roleMap.get(role.name);
        role?.role_permissions?.forEach((rp: any) => {
          const permission = rp.permissions;
          roleData.permissions.push({
            name: permission.name,
            resource: permission.resource,
            action: permission.action,
            description: permission.description
          });
          allPermissions.push(permission.name);
        });
      });
    }

    const userRoles = Array.from(roleMap.values());

    // Check if account is active
    if (!user.is_active) {
      return new Response(JSON.stringify({
        error: 'Account is deactivated'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if account is temporarily locked
    const now = new Date();
    const lockedUntil = user.locked_until ? new Date(user.locked_until) : null;
    if (lockedUntil && lockedUntil > now) {
      const lockDuration = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
      
      // Log blocked login attempt
      const clientInfo = extractClientInfo(request);
      await sendAuditLog({
        eventType: AuditEventType.LOGIN_FAILED,
        eventAction: AuditEventAction.BLOCKED,
        severity: AuditSeverity.WARNING,
        userId: user.id,
        metadata: {
          email,
          reason: 'account_locked',
          lockedUntil: lockedUntil.toISOString(),
          remainingMinutes: lockDuration
        },
        ...clientInfo
      });
      
      return new Response(JSON.stringify({
        error: `Account temporarily locked. Try again in ${lockDuration} minutes.`
      }), {
        status: 423, // HTTP 423 Locked
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password using proper bcrypt checking
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const maxAttempts = 5;
      const lockoutDuration = 15; // minutes
      
      const newAttempts = (user.login_attempts || 0) + 1;
      const lockUntil = newAttempts >= maxAttempts 
        ? new Date(now.getTime() + lockoutDuration * 60 * 1000)
        : null;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          login_attempts: newAttempts,
          locked_until: lockUntil?.toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update login attempts:', updateError);
      }

      const remainingAttempts = maxAttempts - newAttempts;
      let errorMessage = 'Invalid email or password';
      
      if (lockUntil) {
        errorMessage = `Account locked after ${maxAttempts} failed attempts. Try again in ${lockoutDuration} minutes.`;
      } else if (remainingAttempts <= 2 && remainingAttempts > 0) {
        errorMessage = `Invalid email or password. ${remainingAttempts} attempts remaining before account lock.`;
      }

      // Log failed login attempt
      const clientInfo = extractClientInfo(request);
      await sendAuditLog({
        eventType: AuditEventType.LOGIN_FAILED,
        eventAction: lockUntil ? AuditEventAction.BLOCKED : AuditEventAction.FAILURE,
        severity: lockUntil ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
        userId: user.id,
        metadata: {
          email,
          attempts: newAttempts,
          lockedUntil: lockUntil?.toISOString(),
          reason: 'invalid_password'
        },
        ...clientInfo
      });

      return new Response(JSON.stringify({
        error: errorMessage
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user has 2FA enabled
    if (user.two_factor_enabled) {
      return new Response(JSON.stringify({
        requiresTwoFactor: true,
        message: 'Two-factor authentication required',
        email: user.email
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reset login attempts on successful login
    if (user.login_attempts > 0 || user.locked_until) {
      const { error: resetError } = await supabase
        .from('users')
        .update({
          login_attempts: 0,
          locked_until: null
        })
        .eq('id', user.id);

      if (resetError) {
        console.error('Failed to reset login attempts:', resetError);
      }
    }

    // Generate secure tokens with HMAC-SHA256 signatures including roles
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      roles: userRoles.map(r => r.name),
      permissions: allPermissions
    };
    const accessToken = await createSecureJWT(jwtPayload, '15m'); // Short-lived access token
    const refreshToken = generateSecureToken();

    // Store refresh token in database (30 days expiry)
    const refreshTokenId = createId();
    const { error: tokenError } = await supabase
      .from('refresh_tokens')
      .insert({
        id: refreshTokenId,
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (tokenError) {
      console.error('Failed to store refresh token:', tokenError);
    }

    // Create a tracked session for this login
    const sessionToken = generateSecureToken();
    const sessionId = createId();
    
    // Extract request info for session tracking
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'Unknown';
    
    // Create device fingerprint
    const deviceInfo = {
      userAgent,
      platform: extractPlatform(userAgent),
      browser: extractBrowser(userAgent),
      timestamp: new Date().toISOString()
    };

    // Store the session
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        session_token: sessionToken,
        device_info: deviceInfo,
        ip_address: ipAddress,
        user_agent: userAgent,
        last_activity: new Date().toISOString(),
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
    }

    // Update last login and reset failed attempts
    const { error: loginUpdateError } = await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        login_attempts: 0,
        locked_until: null
      })
      .eq('id', user.id);

    if (loginUpdateError) {
      console.error('Failed to update last login:', loginUpdateError);
    }

    // Log successful login
    const clientInfo = extractClientInfo(request);
    await sendAuditLog({
      eventType: AuditEventType.LOGIN_SUCCESS,
      eventAction: AuditEventAction.SUCCESS,
      userId: user.id,
      metadata: {
        email: user.email,
        sessionId,
        deviceInfo,
        roles: userRoles.map(r => r.name),
        isAdmin: user.is_admin
      },
      ...clientInfo
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isVerified: user.is_verified,
        isAdmin: user.is_admin,
        kycStatus: user.kyc_status,
        roles: userRoles,
        permissions: allPermissions
      },
      tokens: {
        accessToken,
        refreshToken,
        sessionToken,
        expiresIn: 15 * 60 // 15 minutes for access token
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return new Response(JSON.stringify({
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}