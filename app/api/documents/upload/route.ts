import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    // In a real app, you get this from your session/cookies (e.g. next-auth or raw JWT)
    // For testing our security engine right now, we will expect it in the JSON body.
    const body = await request.json();
    const { userId, name, category, storagePath } = body;

    if (!userId || !name || !storagePath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create the Document and the Owner's Permission in ONE transaction
    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          ownerId: userId,
          name,
          category,
          storagePath, // This would be the path to the secure Supabase Storage bucket
        }
      });

      // Automatically grant the uploader EDIT access
      await tx.permission.create({
        data: {
          documentId: doc.id,
          userId: userId,
          accessLevel: 'EDIT',
          grantedById: userId, // Granted by themselves
        }
      });

      return doc;
    });

    // 2. Cryptographically Log the Upload
    await logAudit(userId, 'DOCUMENT_UPLOAD', document.id, 'SUCCESS', { name, category });

    return NextResponse.json({ success: true, document }, { status: 201 });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}