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

## Entry 5
**Date:** May 11, 2026
**Task:** Satisfying QA Test Cases for User Moderation & Audit Trails.

**Prompt given to AI:** Generate an Audit Trail (System Logs) table showing chronological administrative actions. Also, generate a User Moderation table with "Active/Suspended" status pills and action buttons to suspend/restore accounts.

**What the AI produced:** Two distinct admin views that directly mapped to the QA requirements for tracking chain-of-custody and managing bad actors.

**What I changed / improved:** I realized the User Management table needed a way to view a student's history. I added a `#176B87` outline button labeled "View History" next to the suspend actions.

**What I learned / decided:** Every UI element must map back to a specific QA requirement. The UI is simply the visual execution of the project's testing and framework documents.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 6
**Date:** May 11, 2026
**Task:** Creating the "User Posting History" Modal.

**Prompt given to AI:** Generate a new overlay modal triggered from the User Management screen. Show a scrollable mini-feed of a specific student's posts. Next to every active post, place a stark red `#ba1a1a` "Force Delete" button for strict admin moderation.

**What the AI produced:** A centered modal overlay detailing the user's specific asset history alongside aggressive moderation controls.

**What I changed / improved:** I ensured this was an *overlay* rather than a new page.

**What I learned / decided:** Keeping the admin in the same view via a modal streamlines the moderation workflow. They can audit a user and immediately suspend them without losing their place in the student roster.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 7
**Date:** May 11, 2026
**Task:** Aligning Report Generation UI with strict institutional color palettes.

**Prompt given to AI:** Regenerate the "Report Generation" screen correcting color palette inconsistencies. Update primary actions ("Generate & Download") and download format icons to the `#64CCC5` action color, and secondary inputs to `#176B87`.

**What the AI produced:** A unified report panel that perfectly matched the visual hierarchy of the rest of the application.

**What I changed / improved:** Overrode the AI's default greenish-blue tints, forcing it to adhere strictly to the system's defined hex codes.

**What I learned / decided:** Establishing a clear visual language (Primary Action = Teal, Secondary = Dark Blue, Danger = Red) makes the application intuitive. AI needs strict hex code boundaries to maintain this.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 8
**Date:** May 12, 2026
**Task:** Designing static Legal & Compliance Pages (Privacy Policy, Terms of Service).

**Prompt given to AI:** Generate Legal pages keeping the global Top Nav, but swap the SideNav for a "Legal Directory". Use a large `#FFFFFF` document card in the center with generous padding (`p-12`) and high line-height. Use lore-accurate text explaining the SECI "Hidden Notes" and 30-Day Purge.

**What the AI produced:** Highly readable, typography-focused pages that looked like official institutional documents rather than standard web forms.

**What I changed / improved:** I rejected standard "Lorem Ipsum" and forced the use of lore-accurate placeholder text that actually references the system's architecture.

**What I learned / decided:** Contextual sidebars are great for grouping static pages without cluttering the main admin navigation. Furthermore, well-written placeholders prove to stakeholders that the UI/UX encompasses the entire system architecture.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 9
**Date:** May 12, 2026
**Task:** Building the Active Notification System (Bell Icon).

**Prompt given to AI:** Generate a "Notification Center" dropdown card triggered by the Top Nav bell icon. Create 3 distinct states: Critical Alert (red tint for 30-day lifecycle breaches), Action Required (teal tint for pending claims), and System Info (white).

**What the AI produced:** A dynamic dropdown panel with visual hierarchy indicating which system alerts required immediate human intervention.

**What I changed / improved:** I integrated the SECI concept directly into the notifications, ensuring alerts specifically call out physical bins (e.g., "Bin B-12") to bridge the digital-to-physical gap.

**What I learned / decided:** Notifications are not just UI flair; they are the active defense mechanism of the system. Proactive alerts prevent "Inventory Drift" before it happens.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 10
**Date:** May 12, 2026
**Task:** Formulating a professional rebuttal to developer pushback regarding Admin Verification.

**Prompt given to AI:** Help construct a Taglish rebuttal to the Dev team who wants to remove admin verification per post to save time. Base the argument on the SECI framework, QA test cases, and the purpose of the system.

**What the AI produced:** A highly structured, empathetic, but firm 4-point defense utilizing project documentation to justify the manual verification workflow.

**What I changed / improved:** I adjusted the tone to be collaborative, validating their scalability concerns ("1000 posts") while anchoring the final decision in our graded academic requirements.

**What I learned / decided:** A UI/UX Designer must advocate for the architecture. Design decisions aren't just about aesthetics; they are the execution of security frameworks (SECI) and QA testing mandates.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 11
**Date:** May 12, 2026
**Task:** Redesigning the Public Board (The Compact UI Shift).

**Prompt given to AI:** Redesign the Public Feed. Eliminate the Top Nav to maximize vertical space. Pin User Controls to the bottom of the left sidebar. Remove "View More" buttons to make cards fully clickable. Overlay LOST/FOUND status pills directly on the images. Add a clean, modern Pagination component at the bottom of the grid.

**What the AI produced:** A modernized, app-like interface that consolidated navigation, decluttered the item feed, and included robust pagination controls.

**What I changed / improved:** I added explicit conditional logic rules for the developer (If LOST, display "Lost: [Date]", if FOUND, display "Found: [Date]") to fix a known bug.

**What I learned / decided:** Removing redundant navigation elements (like stacking a Top Nav and a Side Nav on a public board) vastly improves the modern feel of the application and prioritizes user content.

*Next entries will be added as I continue using AI for UI/UX tasks.*

## Entry 12
**Date:** May 12, 2026
**Task:** Implementing Responsive Mobile Views for the Admin Portal.

**Prompt given to AI:** Generate mobile-responsive layouts for the Admin Portal to satisfy TC-UI-FUNC-001. Collapse the navigation into a hamburger menu and scale the dense data tables efficiently so unredacted thumbnails and action buttons remain usable.

**What the AI produced:** Mobile-friendly versions of the Secure Vault and Modals that preserved functionality on smaller viewports.

**What I changed / improved:** I ensured that overlay modals (like the Disposal and Verification pop-ups) took up the full viewport width on mobile to guarantee buttons were easily tappable.

**What I learned / decided:** Admin consoles are notoriously difficult to scale down for mobile. Prioritizing the visibility of "Hidden Notes" and primary action buttons ensures that on-the-go moderation is still highly effective.

*Next entries will be added as I continue using AI for UI/UX tasks.*