import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Strictly fetch ONLY documents where this user has a row in the Permission table
  const permissions = await prisma.permission.findMany({
    where: { userId: userId },
    include: { document: true },
    orderBy: { grantedAt: 'desc' }
  });

  // Flatten the result so the frontend gets a clean list of documents
  const documents = permissions.map(p => ({
    ...p.document,
    accessLevel: p.accessLevel
  }));

  return NextResponse.json({ documents }, { status: 200 });
}