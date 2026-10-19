# Threat Model & Defenses

## 1. Broken Object Level Authorization (BOLA / IDOR)
**The Threat:** A logged-in user (Bob) changes the document ID in the URL to try and download a document owned by another user (Alice). 
**Our Defense:** UI hiding is not enough. The `authorizeDocumentAccess` middleware runs on the server for *every single request*. It performs a live SQL query against the `Permission` table matching the `documentId` and the requesting `userId`. If no direct map exists, it throws a 403. Automated tests prove Bob is blocked.

## 2. Delayed Permission Revocation via Tokens
**The Threat:** An owner revokes a user's access, but the user still has a valid JWT (JSON Web Token) that doesn't expire for another hour, allowing them to keep downloading the file.
**Our Defense:** We do not encode document permissions into JWTs. The system does a live database lookup for every download attempt. "Taking access away immediately" means deleting the row in the `Permission` table. The very next millisecond, any download request will fail because the database row is gone. 
**The Cost:** This costs us a database read query on every download, increasing latency slightly, but guarantees instant revocation.

## 3. Silent Alteration of the Audit Trail
**The Threat:** A malicious system administrator with database access deletes an embarrassing download attempt from the `AuditLog` table to cover their tracks.
**Our Defense:** We implemented a Cryptographic Hash Chain. Every audit log entry computes a SHA-256 hash of its own payload combined with the `currentHash` of the previous log entry. If an administrator deletes or alters a historical row, the hashes of all subsequent rows will break, instantly proving the ledger was tampered with.

## 4. Known Accepted Risk: Total Database Compromise
**The Threat:** If a highly sophisticated attacker gains root access to the PostgreSQL database, they could theoretically recalculate and rewrite the entire cryptographic hash chain from the point of alteration down to the present to hide their tracks.
**Why we accepted it:** Defending against root-level database compromise requires off-site, write-once-read-many (WORM) storage or external blockchain logging, which is beyond the scope of a 7-day CRUD application. We rely on managed Supabase security for infrastructure defense.