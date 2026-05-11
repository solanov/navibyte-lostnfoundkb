
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

# ADR 2: Knowledge Management Framework (SECI Model) - Fullstack Developer
**Date:** 03/30/2026
**Status:** Decided  

## Context
The system faced a "Vocabulary Gap" (mismatch between finder descriptions and owner searches) and "Inventory Drift" (digital records not matching physical storage). We needed a framework to standardize knowledge transfer.

## Options Considered
- **Communities of Practice (CoP):** Focused on social collaboration  
- **SECI Model:** Process-driven transformation of tacit knowledge to explicit data  

## Decision
We chose the **SECI Model**.

## Consequences
- **Easier:**  
  Allows every software feature to be mapped to a specific knowledge outcome. It effectively eliminates Inventory Drift by turning subjective observations into structured digital facts (Externalization).  

- **Harder:**  
  Requires a disciplined, restricted intake process (Categorized Icon Grids) rather than simple open-text fields.  

---

# ADR 3: UX Architecture (Facebook/Instagram Hybrid) - Fullstack Developer
**Date:** 03/30/2026
**Status:** Decided  

## Context
The platform needed to be intuitive for students and staff at New Era University to ensure high engagement and low learning curves.

## Options Considered
- Facebook  
- Twitter  
- YouTube  
- Instagram  
- Reddit  
- Pinterest  

## Decision
A combination of **Facebook Marketplace** and **Instagram UI patterns**.

## Consequences
- **Easier:**  
  Leverages existing mental models with a central scrolling card feed and sticky navigation, reducing cognitive load. Combines easy local searching with instant messaging capabilities.  

- **Harder:**  
  Maintaining a high-engagement "social" feel while enforcing strict "Redacted View" security logic for sensitive item data.  

---

# ADR 4: Visual Identity and Color Palette - Fullstack Developer
**Date:** 03/30/2026
**Status:** Decided  

## Context
The UI needed to bridge institutional authority (security) with a modern, professional look.

## Options Considered
- Blue-cyan palette  
- Sky blue-yellow palette  

## Decision
Blue-cyan (**Midnight Navy #053B50** and **Bright Aqua #64CCC5**).

## Consequences
- **Easier:**  
  Establishes a "safe feeling" and makes the app easy to remember. Midnight Navy establishes trust and authority, while Bright Aqua creates clear visual targets for primary actions.  

- **Harder:**  
  Requires strict adherence to contrast ratios to ensure accessibility against the Soft Grey (**#EEEEEE**) background.

 # ADR 5: Decentralized User Communication (User-to-User Chat System) - Fullstack Developer

**Date:** 04/23/2026  
**Status:** Decided  

## Context  
Initially, the system design included an administrative layer responsible for mediating interactions between users during item claims (e.g., verification of ownership claims). However, this approach introduced a scalability bottleneck, as all communications and validations would need to pass through admins.

To improve scalability and reduce administrative overhead, the team redesigned the interaction flow to allow direct communication between users. Specifically, the system now includes a chat feature enabling the item poster (finder) to communicate directly with the claimant. This allows real-time verification of claims and reduces reliance on centralized moderation.

## Options Considered  
- **Admin-mediated verification:** Admin acts as intermediary in all user claim validations  
- **Direct user-to-user chat system:** Users communicate directly for verification and confirmation  

## Decision  
We chose to implement a **direct user-to-user chat system**, removing admins from the user interaction flow and limiting their role to system-level moderation only.

## Consequences  

### Easier  
- Significantly improves scalability by removing admin bottlenecks in claim verification  
- Enables faster resolution of item claims through real-time communication between users  
- Reduces operational load on administrators, allowing focus on edge cases and system integrity  

### Harder  
- Requires robust chat infrastructure (message persistence, real-time updates, delivery handling)  
- Increases reliance on user honesty, requiring better UI cues and trust indicators  
- Introduces potential risks of misuse or misinformation, requiring future features like reporting, blocking, or verification enhancements.


