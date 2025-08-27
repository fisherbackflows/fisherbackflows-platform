import { NextRequest, NextResponse } from 'next/server';
import { generateToken, setAuthCookie, verifyPassword } from '@/lib/auth';
import { createRouteHandlerClient } from '@/lib/supabase';

// Mock users for development - replace with real database queries
const mockUsers = [
  {
    id: '1',
    email: 'john.smith@email.com',
    phone: '5550123',
    password: '$2a$10$example.hash.would.go.here', // bcrypt hash
    role: 'customer' as const,
    name: 'John Smith',
    accountNumber: 'FB001'
  },
  {
    id: '2',
    email: 'admin@fisherbackflows.com',
    phone: '2532788692',
    password: '$2a$10$another.example.hash', // bcrypt hash
    role: 'admin' as const,
    name: 'Mike Fisher',
    accountNumber: 'ADMIN'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { identifier, password, type } = await request.json();
    
    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      );
    }
    
    // Handle demo login
    if (identifier === 'demo' || type === 'demo') {
      const demoUser = {
        id: 'demo',
        email: 'demo@fisherbackflows.com',
        role: 'customer' as const,
        name: 'Demo Customer',
        accountNumber: 'DEMO'
      };
      
      const token = generateToken({
        userId: demoUser.id,
        email: demoUser.email,
        role: demoUser.role
      });
      
      await setAuthCookie(token);
      
      return NextResponse.json({
        success: true,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          accountNumber: demoUser.accountNumber
        },
        token
      });
    }
    
    // Find user by email or phone
    let user;
    if (type === 'email') {
      user = mockUsers.find(u => u.email.toLowerCase() === identifier.toLowerCase());
    } else if (type === 'phone') {
      const normalizedPhone = identifier.replace(/\D/g, '');
      user = mockUsers.find(u => u.phone.replace(/\D/g, '') === normalizedPhone);
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password (skip for demo purposes - in production, always verify)
    if (password && password !== 'demo123') {
      // const isValidPassword = await verifyPassword(password, user.password);
      // if (!isValidPassword) {
      //   return NextResponse.json(
      //     { error: 'Invalid credentials' },
      //     { status: 401 }
      //   );
      // }
      
      // For demo, accept 'demo123' as password
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    // Set HTTP-only cookie
    await setAuthCookie(token);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountNumber: user.accountNumber
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify current session
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }
    
    // Handle demo token
    if (token === 'demo-token' || token.includes('demo')) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'demo',
          email: 'demo@fisherbackflows.com',
          name: 'Demo Customer',
          role: 'customer',
          accountNumber: 'DEMO'
        }
      });
    }
    
    // TODO: Verify JWT token and return user data
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}