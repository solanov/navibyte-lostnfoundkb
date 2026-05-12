# Prompt Log – Ortiz, Julius Albert D.
**Project:** NEUvigate
**Branch:** main, dev, ortiz-ui
**Role:** UI/UX Developer

## Entry 1
**Date:** May 10, 2026
**Task:** Redesigning the Admin Dashboard from a social-media feed into a Data-Dense Management Console.

**Prompt given to AI:** Act as an Expert UI/UX Designer. Generate a developer-ready "Staff/Admin Dashboard" for a Lost & Found web app. Use a strict color palette (#EEEEEE, #053B50, #176B87, #64CCC5, #ba1a1a). Replace card feeds with an unredacted data table including columns for Asset ID, Unredacted Image, Hidden Note (High Security), Storage Bin Mapping, and Action buttons (Verify/Delete).

**What the AI produced:** The AI generated a highly structured table layout that prioritized information density, featuring an unredacted view and specific action buttons for staff.

**What I changed / improved:** The AI initially used an "Eye" icon to hide the unredacted image. I prompted it again to replace the icon with actual high-fidelity image thumbnails right inside the table cell.

**What I learned / decided:** I learned that for the SECI "Internalization" phase to work, staff need instant visual access to explicit data. Hiding critical verification images behind an extra click defeats the purpose of an efficient administrative workflow.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 2
**Date:** May 10, 2026
**Task:** Enforcing Master Layout Consistency across all Admin pages.

**Prompt given to AI:** Unify the 4 main dashboard screens. The previous generations were inconsistent. Establish a Strict Master Layout: Top Navigation (Fixed 100% Width, #053B50) and Left SideNav (Fixed Below Top Nav, #FFFFFF) with exactly 4 tabs: Secure Vault, User Management, Disposal Queue, and Audit Trail. Apply this to all subsequent generations.

**What the AI produced:** The AI corrected the drifting layouts and generated four perfectly aligned screens that shared the exact same global header and sidebar structure.

**What I changed / improved:** I removed the public "Archive Filters" (Categories, Colors) from the Admin SideNav, as admins search by exact ID/Email rather than filtering by color.

**What I learned / decided:** AI UI generators often "drift" from established design systems. Establishing and enforcing a strict Master Layout first ensures that developers can build reusable `TopNav` and `SideNav` components, saving massive amounts of coding time.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 3
**Date:** May 10, 2026
**Task:** Designing the "Disposal Queue" to solve the Inventory Drift problem.

**Prompt given to AI:** Generate the "Disposal Queue" screen. Filter the table specifically for overdue items. Give all rows a subtle `#ba1a1a` (red) tint to remind the admin they are past due. Emphasize the "Physical Location" column and include an "Initiate Audit" button.

**What the AI produced:** A focused "Purge List" that visually highlights items exceeding the 30-day retention policy, along with bulk selection checkboxes.

**What I changed / improved:** I added a "Batch Print Disposal Manifest" button to the utility bar and defined an empty state showing "Queue Clear" to improve user satisfaction.

**What I learned / decided:** Separating the purge list from the main vault provides a clear, actionable checklist for staff. Visual alerts (red highlights) are highly effective operational triggers.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 4
**Date:** May 11, 2026
**Task:** Designing Modals for Claimant Verification and Item Disposal.

**Prompt given to AI:** Generate a modal overlay titled "Claim Audit Protocol". Display the unredacted photo and "Hidden Note" at the top. Include a checkbox for "Digital E-Signature provided and identity verified" and a large `#64CCC5` "Mark as Returned" button.

**What the AI produced:** A clean, 2-step verification overlay and a disposal routing modal (University Surplus, Donation, Permanent Disposal).

**What I changed / improved:** The AI originally used a solid blue square for the "Visual Evidence". I explicitly instructed the AI to use a mock photograph of a real item (e.g., a satchel) to accurately simulate the admin comparing visual evidence.

**What I learned / decided:** Using high-fidelity mockups (real image placeholders instead of colored boxes) makes the UI intent instantly understandable during developer handoff.

*Next entries will be added as I continue using AI for UI/UX tasks.*