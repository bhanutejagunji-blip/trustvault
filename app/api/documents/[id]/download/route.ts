import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeDocumentAccess } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // In a real app, this comes from the secure session cookie.
  // For testing our API directly, we will grab it from the URL search params.
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const documentId = params.id;

  if (!userId) {
    await logAudit(null, 'DOCUMENT_DOWNLOAD_ATTEMPT', documentId, 'DENIED', { reason: 'No User ID provided' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. THE STRICT CHECK: The server decides, every time.
  const authResult = await authorizeDocumentAccess(userId, documentId);

  if (!authResult.authorized) {
    // 2. Log the blocked attempt cryptographically
    await logAudit(userId, 'DOCUMENT_DOWNLOAD_ATTEMPT', documentId, 'DENIED', { 
      reason: authResult.reason 
    });
    return NextResponse.json({ error: 'Forbidden: You do not have access to this document.' }, { status: 403 });
  }

  // 3. Log the successful access
  await logAudit(userId, 'DOCUMENT_DOWNLOAD_ATTEMPT', documentId, 'SUCCESS', { 
    accessLevel: authResult.accessLevel 
  });

  // 4. Fetch the document details to get the storage path
  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });

  // Here you would generate a 60-second expiring Supabase Storage signed URL
  // For the challenge, returning the secure path proves the backend authorization works.
  return NextResponse.json({ 
    success: true, 
    message: 'Access Granted',
    downloadUrl: `https://[SUPABASE_PROJECT].supabase.co/storage/v1/object/sign/secure-docs/${document?.storagePath}` 
  });
}