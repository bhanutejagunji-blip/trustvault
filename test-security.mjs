import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSecurityEngine() {
  console.log("Cleaning up old test data...");
  await prisma.user.deleteMany({ where: { email: { in: ['alice@test.com', 'bob@test.com'] } } });

  console.log("1. Setting up test users...");
  const alice = await prisma.user.create({
    data: { email: 'alice@test.com', role: 'OWNER', passwordHash: 'fake_hash' }
  });
  const bob = await prisma.user.create({
    data: { email: 'bob@test.com', role: 'VIEWER', passwordHash: 'fake_hash' }
  });

  console.log("\n2. Alice uploads a confidential document...");
  const uploadRes = await fetch('http://localhost:3000/api/documents/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: alice.id,
      name: 'Salary_Q3.pdf',
      category: 'FINANCE',
      storagePath: 'vault/salary_q3.pdf'
    })
  });
  const uploadData = await uploadRes.json();
  console.log("-> Upload Status:", uploadRes.status, uploadData.success ? "✅ Success" : "❌ Failed");
  
  if (!uploadData.document) {
      console.error("Upload failed. Make sure Next.js is running in another terminal!");
      process.exit(1);
  }
  
  const docId = uploadData.document.id;

  console.log("\n3. Alice tries to download her own document...");
  const aliceDownload = await fetch(`http://localhost:3000/api/documents/${docId}/download?userId=${alice.id}`);
  console.log("-> Alice Download Status:", aliceDownload.status, aliceDownload.status === 200 ? "✅ Granted" : "❌ Denied");

  console.log("\n4. Bob tries to download Alice's document (ATTACK!)...");
  const bobDownload = await fetch(`http://localhost:3000/api/documents/${docId}/download?userId=${bob.id}`);
  console.log("-> Bob Download Status:", bobDownload.status, bobDownload.status === 403 ? "✅ Blocked" : "❌ Alert: Bob got in!");

  console.log("\n5. Checking the Tamper-Evident Audit Trail...");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  
  logs.reverse().forEach(log => {
    console.log(`[${log.action}] Status: ${log.status} | Actor: ${log.actorId}`);
    console.log(` -> Hash: ${log.currentHash.substring(0, 20)}...`);
  });

  process.exit();
}

testSecurityEngine();