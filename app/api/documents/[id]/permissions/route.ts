import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeDocumentAccess } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> } // Next.js 15 async params
) {
  try {
    const params = await context.params;
    const documentId = params.id;
    const body = await request.json();
    const { ownerId, targetEmail, accessLevel, action } = body; 
    // action will be 'GRANT' or 'REVOKE'

    // 1. Verify the person making the request actually has EDIT rights
    const authResult = await authorizeDocumentAccess(ownerId, documentId);
    if (!authResult.authorized || authResult.accessLevel !== 'EDIT') {
      await logAudit(ownerId, 'PERMISSION_CHANGE_ATTEMPT', documentId, 'DENIED', { targetEmail });
      return NextResponse.json({ error: 'You do not have permission to share this document' }, { status: 403 });
    }

    // 2. Find the target user by email
    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Handle INSTANT REVOKE
    if (action === 'REVOKE') {
      await prisma.permission.deleteMany({
        where: { documentId: documentId, userId: targetUser.id }
      });
      await logAudit(ownerId, 'PERMISSION_REVOKED', documentId, 'SUCCESS', { targetUser: targetEmail });
      return NextResponse.json({ success: true, message: 'Access revoked instantly' });
    }

    // 4. Handle GRANT (Upsert prevents duplicate rows)
    if (action === 'GRANT') {
      await prisma.permission.upsert({
        where: { documentId_userId: { documentId: documentId, userId: targetUser.id } },
        update: { accessLevel, grantedById: ownerId },
        create: { documentId, userId: targetUser.id, accessLevel, grantedById: ownerId }
      });
      await logAudit(ownerId, 'PERMISSION_GRANTED', documentId, 'SUCCESS', { targetUser: targetEmail, accessLevel });
      return NextResponse.json({ success: true, message: 'Access granted securely' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}