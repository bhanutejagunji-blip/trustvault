# AI Prompt Log

## Entry 1: Infrastructure and Database Schema
**Date:** Oct 19, 2026
**Prompt:** "I need to finish it with zero investment. Give me the database schema."
**What the tool produced:** The AI provided a raw PostgreSQL schema with tables for Users, Documents, Permissions, and AuditLogs, and suggested using Next.js and Vercel.
**What was wrong with it:** The AI provided raw SQL, but in a modern Next.js stack, managing raw SQL migrations manually is error-prone. It missed setting up an ORM (like Prisma) to handle type-safe database queries and migrations, which is critical for preventing SQL injection in our authorization checks. 
**What I did instead:** I directed the AI to generate a Prisma schema instead, managing the database declaratively and ensuring type safety across the API routes.
## Entry 5: Next.js 15 Async Params Bug
**Date:** Oct 19, 2026
**Prompt:** Running the test script resulted in a 500 error when trying to access the download route.
**What the tool produced:** The AI originally wrote the Next.js API route using `const documentId = params.id;`, which is the standard Next.js 14 syntax.
**What was wrong with it:** The AI didn't account for the project using the brand new Next.js 15 (`@latest`), where route `params` are now asynchronous Promises. Trying to read `params.id` directly caused the server to crash.
**What I did instead:** I updated the route signature to expect a `Promise`, and used `const params = await context.params;` to properly resolve the ID before passing it to the security middleware.