import prisma from './prisma';
import crypto from 'crypto-js';

export async function logAudit(
  actorId: string | null,
  action: string,
  resourceId: string | null,
  status: 'SUCCESS' | 'DENIED',
  details: any = {}
) {
  // 1. Fetch the most recent log to continue the chain
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  const previousHash = lastLog ? lastLog.currentHash : 'GENESIS_BLOCK';

  // 2. Prepare the exact payload to hash
  const payloadToHash = JSON.stringify({
    actorId,
    action,
    resourceId,
    status,
    details,
    previousHash
  });

  // 3. Generate the SHA-256 hash for this specific event
  const currentHash = crypto.SHA256(payloadToHash).toString();

  // 4. Save the immutable record to the database
  const newLog = await prisma.auditLog.create({
    data: {
      actorId,
      action,
      resourceId,
      status,
      details,
      previousHash,
      currentHash
    }
  });

  return newLog;
}