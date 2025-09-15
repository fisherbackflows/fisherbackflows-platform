/**
 * Authentication System Unit Tests
 * Tests for core auth functionality including requireSession, withAuth, and role management
 */

import { requireSession, withAuth, requireRole, hasPermission, ROLE_HIERARCHY } from '@/lib/auth/requireSession';
import { NextRequest, NextResponse } from 'next/server';

// Mock Next.js server functions
jest.mock('next/server');
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/logger');

const mockNextRequest = {
  headers: {
    get: jest.fn()
  },
  nextUrl: {
    pathname: '/test'
  }
} as unknown as NextRequest;

const mockNextResponse = {
  json: jest.fn().mockReturnValue(new Response())
} as unknown as typeof NextResponse;

(NextResponse.json as jest.Mock) = jest.fn().mockReturnValue(new Response());

describe('Auth System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock crypto.randomUUID
    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: jest.fn().mockReturnValue('test-request-id')
      }
    });
  });

  describe('requireRole', () => {
    test('should return true when user has required role', () => {
      expect(requireRole('admin', ['admin', 'manager'])).toBe(true);
      expect(requireRole('manager', ['admin', 'manager'])).toBe(true);
    });

    test('should return false when user does not have required role', () => {
      expect(requireRole('viewer', ['admin', 'manager'])).toBe(false);
      expect(requireRole('technician', ['admin'])).toBe(false);
    });

    test('should handle empty role arrays', () => {
      expect(requireRole('admin', [])).toBe(false);
    });
  });

  describe('hasPermission', () => {
    test('should correctly evaluate role hierarchy', () => {
      // Admin should have all permissions
      expect(hasPermission('admin', 'viewer')).toBe(true);
      expect(hasPermission('admin', 'technician')).toBe(true);
      expect(hasPermission('admin', 'manager')).toBe(true);

      // Manager should have permissions over lower roles
      expect(hasPermission('manager', 'viewer')).toBe(true);
      expect(hasPermission('manager', 'technician')).toBe(true);
      expect(hasPermission('manager', 'admin')).toBe(false);

      // Same level roles
      expect(hasPermission('technician', 'inspector')).toBe(true);
      expect(hasPermission('inspector', 'technician')).toBe(true);

      // Lower roles should not have permissions over higher roles
      expect(hasPermission('viewer', 'technician')).toBe(false);
      expect(hasPermission('technician', 'manager')).toBe(false);
    });

    test('should handle unknown roles', () => {
      expect(hasPermission('unknown', 'admin')).toBe(false);
      expect(hasPermission('admin', 'unknown')).toBe(true);
    });
  });

  describe('ROLE_HIERARCHY', () => {
    test('should have correct hierarchy values', () => {
      expect(ROLE_HIERARCHY.admin).toBe(100);
      expect(ROLE_HIERARCHY.manager).toBe(80);
      expect(ROLE_HIERARCHY.coordinator).toBe(60);
      expect(ROLE_HIERARCHY.inspector).toBe(40);
      expect(ROLE_HIERARCHY.technician).toBe(40);
      expect(ROLE_HIERARCHY.viewer).toBe(20);
    });

    test('should maintain proper hierarchy order', () => {
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.manager);
      expect(ROLE_HIERARCHY.manager).toBeGreaterThan(ROLE_HIERARCHY.coordinator);
      expect(ROLE_HIERARCHY.coordinator).toBeGreaterThan(ROLE_HIERARCHY.technician);
      expect(ROLE_HIERARCHY.technician).toEqual(ROLE_HIERARCHY.inspector);
      expect(ROLE_HIERARCHY.technician).toBeGreaterThan(ROLE_HIERARCHY.viewer);
    });
  });

  describe('withAuth', () => {
    test('should return 401 when no user ID provided', async () => {
      const mockRequest = {
        ...mockNextRequest,
        headers: { get: jest.fn().mockReturnValue(null) }
      } as unknown as NextRequest;

      const mockHandler = jest.fn();

      await withAuth(mockRequest, mockHandler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          })
        }),
        { status: 401 }
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });

    test('should return 400 when no org ID provided', async () => {
      const mockRequest = {
        ...mockNextRequest,
        headers: {
          get: jest.fn()
            .mockReturnValueOnce('test-request-id')
            .mockReturnValueOnce('test-user-id')
            .mockReturnValueOnce(null) // No org ID
        }
      } as unknown as NextRequest;

      const mockHandler = jest.fn();

      await withAuth(mockRequest, mockHandler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'NO_ORG_CONTEXT',
            message: 'Organization context required'
          })
        }),
        { status: 400 }
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('requireSession', () => {
    test('should create proper wrapper function', () => {
      const mockHandler = jest.fn();
      const allowedRoles = ['admin', 'manager'];

      const wrapper = requireSession(allowedRoles, mockHandler);

      expect(typeof wrapper).toBe('function');
      expect(wrapper.length).toBe(1); // Should accept request parameter
    });

    test('should pass context to handler when authorized', async () => {
      const mockHandler = jest.fn().mockResolvedValue(new Response());
      const allowedRoles = ['admin'];

      // Mock successful auth
      const mockWithAuth = jest.fn().mockImplementation(async (req, handler) => {
        return handler(
          { user: { id: 'test-user' } }, // session
          'test-org', // orgId
          'admin', // role
          'test-request-id' // requestId
        );
      });

      // Temporarily replace withAuth
      const originalWithAuth = withAuth;
      (requireSession as any).__proto__.withAuth = mockWithAuth;

      const wrapper = requireSession(allowedRoles, mockHandler);
      await wrapper(mockNextRequest);

      expect(mockHandler).toHaveBeenCalledWith({
        orgId: 'test-org',
        userId: 'test-user',
        session: { user: { id: 'test-user' } }
      });
    });
  });
});