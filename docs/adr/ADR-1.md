
# ADR 1: Tech Stack Selection (Next.js, Tailwind, Supabase) - Fullstack Developer
**Date:** 03/26/2026
**Status:** Decided  

## Context
The team needed to select a robust framework and backend for the NaviByte Lost and Found System that would allow for rapid development, efficient routing, and a reliable relational database to manage item tracking.

## Options Considered
- **Front-end:** React vs. Next.js  
- **Back-end:** Firebase/Google Studio vs. Supabase  

## Decision
We chose **Next.js** for the frontend and **Supabase** for the backend.

## Consequences
- **Easier:**  
  Next.js simplifies routing and utilization compared to standard React. Supabase provides a relational PostgreSQL database, which is essential for mapping the "digital twin" of physical storage bins.  

- **Harder:**  
  Requires the team to manage relational schemas and Next.js-specific server-side/client-side rendering logic.  

---




