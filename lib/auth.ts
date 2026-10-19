import prisma from '@/lib/prisma';

/**
 * STRICT AUTHORIZATION CHECK
 * Requirement 1: The server decides, every time.
 * Requirement 3: Immediate revocation.
 */
export async function authorizeDocumentAccess(userId: string, documentId: string) {
  // We do a LIVE database lookup. No caching, no relying on old JWT tokens.
  const permission = await prisma.permission.findUnique({
    where: {
      documentId_userId: { // This uses the @@unique constraint from our schema
        documentId: documentId,
        userId: userId
      }
    }
  });

  // If the row doesn't exist, access is instantly denied.
  if (!permission) {
    // We will hook this into our Audit Log later to record the failed attempt
    return { authorized: false, reason: "Access Denied: No permissions found." };
  }

  return { authorized: true, accessLevel: permission.accessLevel };
}