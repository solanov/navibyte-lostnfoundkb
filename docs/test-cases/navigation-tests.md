# `TC-NAV-FUNC-001`

## Feature
Navigation

## Scenario
Navigating between core pages and viewing specific listings

## Steps
1. Log in.
2. Click through Home, My Archive, My Claims, Inbox, Notifications, and more links.
3. Click an existing post to view details.

## Expected Result
Smooth transitions occur without dead links (404s). Post details load correctly.

## Actual Result
Transitions occur correctly without dead links, but the loading takes a few seconds between pages.

## Status:
Successful

## Notes
Performance optimization is needed to improve page load times.


---

# `TC-NAV-SEC-001`

## Feature
Navigation

## Scenario
Standard user attempts to access Admin Dashboard via URL

## Steps
1. Log in with standard student account.
2. Manually type admin route (e.g., /admin).
3. Press Enter.

## Expected Result
Access is denied. User is redirected to Home or shown a 403 Forbidden error.

## Actual Result
Access is correctly denied, but a bug occurs: The system displays a Next.js Server Components render error instead of a clean 403 Forbidden page or redirect.

## Status:
Successful

## Notes
The security block works, but the UI error handling needs to be fixed. Exposing Server Component errors in production is bad practice.


---