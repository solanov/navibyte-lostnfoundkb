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