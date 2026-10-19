import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Find the user in the database
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Check if user exists and password matches
    if (!user || user.passwordHash !== password) {
      await logAudit(user?.id || null, 'LOGIN_ATTEMPT', null, 'DENIED', { email });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Log the successful login
    await logAudit(user.id, 'LOGIN_ATTEMPT', null, 'SUCCESS', { role: user.role });
    
    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}