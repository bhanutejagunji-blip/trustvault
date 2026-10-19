import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Security Check: Ensure the user is actually an Admin
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
  }

  // Fetch the latest 50 logs, including the actor's email if they exist
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: { select: { email: true } }
    }
  });

  return NextResponse.json({ logs }, { status: 200 });
}