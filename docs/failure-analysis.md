# Failure Analysis Report
**Prepared By:** Carl Geneson Ola (QA and Documentation Lead)

## Overview
This document outlines the critical bugs and vulnerabilities discovered during the QA testing phase of the NEUvigate platform. It details how each issue was reproduced, the severity of the failure, and the technical resolution implemented to maintain system integrity, security, and user experience.

---

## Identified Bugs & Resolutions

### 1. Mobile UI: Bottom Navigation Vanishes on Archive Route
* **Severity:** Medium (Usability)
* **Description:** When accessing the platform via a mobile viewport, the fixed bottom navigation pane disappears entirely upon clicking the "Archive" button, trapping the user on the page without native app navigation.
* **Reproduction Steps:**
  1. Open the application and simulate a mobile viewport (e.g., iPhone 13) via browser DevTools.
  2. Log in with a valid account.
  3. Tap the "Archive" icon on the bottom navigation bar.
  4. Observe the bottom navigation bar unmounting/disappearing from the DOM.
* **Resolution / Fix:** The issue was caused by conditional rendering logic in the mobile layout wrapper. The codebase was updated to ensure the `<BottomNav />` component sits outside the dynamic page content wrapper and utilizes CSS `position: fixed`, `bottom: 0`, and a high `z-index` so it remains universally persistent across all core routes.

### 2. Security: XSS Execution and Whitespace-Only Bypasses (`TC-POST-EDGE-002`)
* **Severity:** CRITICAL (Security)
* **Description:** The "Create Post" form failed to properly sanitize inputs. It accepted a title consisting entirely of whitespace ("   ") and allowed executable JavaScript `<script>` tags to be injected into the description field, leading to a Stored Cross-Site Scripting (XSS) vulnerability.
* **Reproduction Steps:**
  1. Navigate to the "Create Post" modal.
  2. Enter whitespace characters in the "Title" field.
  3. Enter `<script>alert('xss');</script>` in the "Description" field.
  4. Click Submit. The post saves, and the script executes when the post details are rendered.
* **Resolution / Fix:** Implemented strict backend and frontend validation. Added `.trim()` to all text inputs to reject empty/whitespace-only titles. Integrated an HTML sanitization library (e.g., DOMPurify) and custom regex scrubbing to automatically strip malicious tags and executable code from all textual payloads before they are written to the database.

### 3. Build & Deployment: Server Component Render Error (`TC-NAV-SEC-001`)
* **Severity:** High (System Crash)
* **Description:** When navigating the application, the UI completely broke, displaying the generic Next.js production error: *"An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details."*
* **Reproduction Steps:**
  1. Pull the latest code from the `dev` branch containing recent team commits.
  2. Attempt to load the application/admin route without resolving hidden merge conflicts or updating out-of-sync dependencies.
* **Resolution / Fix:** The root cause was a build environment mismatch rather than a permanent architectural flaw. The server failed to render due to broken code syntax from an unfixed Git merge conflict. It was successfully resolved by manually cleaning up the merge conflicts in the code and executing a fresh `npm install` to synchronize the `node_modules` tree.

### 4. Dependency Vulnerability: Next.js Denial of Service (DoS)
* **Severity:** High (Security)
* **Description:** An `npm audit` flagged a Denial of Service (DoS) vulnerability within the Next.js Server Components architecture (GHSA-q4gf-8mx6-v5v3) affecting versions `9.3.4-canary.0` through `16.3.0-canary.5`.
* **Reproduction Steps:**
  1. Run `npm audit` in the terminal.
  2. Review the high-severity alert targeting `node_modules/next`.
* **Resolution / Fix:** Executed `npm audit fix --force` to upgrade the framework outside the vulnerable dependency range. The system was successfully migrated to a stable, patched version (`next@16.2.5`), mitigating the risk of DoS attacks targeting server-side rendering pipelines.

### 5. Dependency Vulnerability: PostCSS XSS via Unescaped Style Tags
* **Severity:** Moderate (Security)
* **Description:** An `npm audit` identified a vulnerability in the `postcss` package (versions `<8.5.10`) regarding XSS vulnerabilities via unescaped `</style>` tags in its CSS stringify output (GHSA-qx2v-qp2m-jg93).
* **Reproduction Steps:**
  1. Run `npm audit` in the terminal.
  2. Review the moderate-severity alert targeting `node_modules/next/node_modules/postcss`.
* **Resolution / Fix:** Executed `npm audit fix --force` to force the resolution of the `postcss` dependency to a safe version (`>=8.5.10`). This ensures that dynamic CSS parsing and stringification can no longer be exploited to close style tags prematurely and inject malicious scripts.

---

## Lessons Learned

1. **Dependency & Git Hygiene is Crucial:** The Server Component crash (Bug #3) proved that after pulling new code from the `dev` branch, running `npm install` and double-checking for unresolved merge conflicts is a mandatory step before spinning up the local server.
2. **Never Trust User Input:** The discovery of the XSS vulnerability (`TC-POST-EDGE-002`) reinforced that frontend UI validation is not enough. Robust, server-side sanitization must be applied to every single input field to protect the database and end-users.
3. **Audit Your Packages:** The Next.js and PostCSS vulnerabilities highlighted that writing secure code is only half the battle. Regular monitoring via `npm audit` and keeping core frameworks updated is required to protect against zero-day exploits and DoS attacks.
4. **Mobile-First QA is Mandatory:** The disappearing bottom navigation bug proved that responsive design requires explicit mobile-state testing. A feature working flawlessly on desktop does not guarantee mobile functionality, especially concerning fixed UI elements and z-indexes.