import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from './auth';

export interface AuthMiddlewareOptions {
  requiredRole?: 'customer' | 'admin';
  allowUnauthenticated?: boolean;
}

export async function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest) => {
    try {
      const user = await getUserFromRequest(request);
      
      // Check if authentication is required
      if (!options.allowUnauthenticated && !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Check role if required
      if (options.requiredRole && user?.role !== options.requiredRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      return await handler(request, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

export function requireAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(handler, { allowUnauthenticated: false });
}

export function requireAdmin(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(handler, { 
    allowUnauthenticated: false,
    requiredRole: 'admin'
  });
}

export function requireCustomer(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(handler, { 
    allowUnauthenticated: false,
    requiredRole: 'customer'
  });
}