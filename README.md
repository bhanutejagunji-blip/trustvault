# TrustVault - Secure Document Sharing

**Live Demo:** trustvault-ezwm-aedcf7zj5-apex-76a2.vercel.app

TrustVault is a secure document-sharing platform where the server decides access on every single request, and every action is recorded in a tamper-evident cryptographic audit log.

## Test Credentials (Judges)
- **Admin:** `admin@trustvault.com` / `password123`
- **Owner:** `owner@trustvault.com` / `password123`
- **Viewer:** `viewer@trustvault.com` / `password123`

---

## The Permission Model & Design Decisions

### 1. What I Built and the Permission Model
I implemented a strict **Per-Document Grant** model. 
Permissions are not stored in JWTs or session cookies. Instead, the system does a live database lookup against the `Permission` table on every single request. 
- **Owner:** The user who uploads a file is granted `EDIT` access.
- **Viewer:** Owners can grant `READ` access to specific emails. 
- **Revocation:** "Taking access away immediately" means deleting the row from the `Permission` table. Because there is no caching and no reliance on token expiration, the very next millisecond, any download request fails instantly.

### 2. The Cryptographic Audit Trail
To ensure the audit log cannot be quietly altered by an administrator, I implemented a **Cryptographic Hash Chain**. Every action (Upload, Download Attempt, Permission Change) generates a SHA-256 hash combining its payload and the hash of the *previous* log entry. If a row is manually modified in the database, the chain breaks, proving tampering.

### 3. What I Deliberately Left Out
- I skipped folder inheritance and groups to keep the permission model mathematically simple and bulletproof for a 7-day timeline. A small system with a perfect permission model beats a large one with holes.
- I skipped AWS S3 integration for the demo, instead verifying the security logic by returning signed-URL string paths upon successful authorization.

### 4. How I Used AI
I used an AI pair programmer heavily to generate the Next.js boilerplate, Prisma schema, and UI components. 
**Where it went wrong:** The AI confidently hallucinated several times regarding dependency versions (e.g., trying to use deprecated Prisma 8 RC commands, and missing Next.js 15 async route param updates). I caught these errors, forced version downgrades, and re-wrote the middleware logic. *See `PROMPTS.md` for a full breakdown of catching the AI's mistakes.*

---

## API Documentation

| Endpoint | Method | Allowed Roles | Description |
|---|---|---|---|
| `/api/auth/login` | POST | Public | Authenticates users. |
| `/api/documents/upload` | POST | Any logged-in user | Uploads a document and grants the uploader `EDIT` permissions. |
| `/api/documents` | GET | Any logged-in user | Returns a list of documents the user has explicitly been granted access to. |
| `/api/documents/[id]/download` | GET | `READ` or `EDIT` | The core security gate. Checks the DB live. Blocks instantly with 403 if no permission row exists. |
| `/api/documents/[id]/permissions` | POST | `EDIT` only | Grants or revokes access for a target user. |
| `/api/audit` | GET | `ADMIN` only | Returns the tamper-evident cryptographic hash chain of all system events. |

---

## Deployment & Setup Instructions
To run this locally from a clean clone:

1. **Install dependencies:**
   ```bash
   npm install