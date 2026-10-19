# AI Prompt Log

## Entry 1: Infrastructure and Database Schema
**Date:** Oct 19, 2026
**Prompt:** "I need to finish it with zero investment. Give me the database schema."
**What the tool produced:** The AI provided a raw PostgreSQL schema with tables for Users, Documents, Permissions, and AuditLogs, and suggested using Next.js and Vercel.
**What was wrong with it:** The AI provided raw SQL, but in a modern Next.js stack, managing raw SQL migrations manually is error-prone. It missed setting up an ORM (like Prisma) to handle type-safe database queries and migrations, which is critical for preventing SQL injection in our authorization checks. 
**What I did instead:** I directed the AI to generate a Prisma schema instead, managing the database declaratively and ensuring type safety across the API routes.