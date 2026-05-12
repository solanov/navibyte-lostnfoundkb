# `TC-AUTH-FUNC-001`

## Feature
Authentication / Registration

## Scenario
Valid registration using institutional email

## Steps
1. Navigate to the platform's registration page.
2. Enter a valid student email address (e.g., juan.delacruz@neu.edu.ph).
3. Validate the password and account through Google Authentication.
4. Click the "Register" button.

## Expected Result
The account is successfully created, a confirmation message is displayed, and the user is redirected to the login or home page.

## Actual Result
The account is successfully created and redirected as expected.

## Status:
Successful

## Notes


---

# `TC-AUTH-NEG-001`

## Feature
Authentication / Registration

## Scenario
Invalid registration using non-institutional Google account

## Steps
1. Navigate to the registration/login page.
2. Click the "Sign in with Google" button.
3. Attempt to select or enter a Google account that does not use the institutional domain (e.g., a standard @gmail.com account).

## Expected Result
Registration fails. The Google Authentication prompt automatically restricts the allowed accounts to the `@neu.edu.ph` domain, preventing the user from successfully authenticating with an outside email.

## Actual Result
The system automatically enforces the `@neu.edu.ph` domain during the Google Sign-in flow, successfully preventing the input or selection of other email formats.

## Status:
Successful

## Notes
Security is handled correctly via Google OAuth domain restriction rather than manual form validation.


---

# `TC-AUTH-NEG-002`

## Feature
Authentication / Login

## Scenario
Blocked user attempts to log in to the platform

## Steps
1. Navigate to the platform's login page.
2. Enter the correct institutional email and password for an account that was recently blocked by an Admin.
3. Click "Login".

## Expected Result
Access is denied. The system prevents login and displays a specific error message (e.g., "Your account has been suspended. Please contact the administrator.").

## Actual Result
Access is successfully denied for the blocked user. 

## Status:
Successful

## Notes


---

# `TC-POST-FUNC-001`

## Feature
Item Management (Create)

## Scenario
Successful posting of a "Lost" item with an image

## Steps
1. Log in with a valid @neu.edu.ph account.
2. Navigate to "Create Post".
3. Select "Lost".
4. Enter title and description.
5. Upload a valid image (but if none, leave it blank or provide details in the description of its appearance).
6. Click "Submit Post".

## Expected Result
The post is successfully created and appears at the top of the "Lost" listings on the Home/Search pages.

## Actual Result
The post is successfully created and appears in the listings as expected.

## Status:
Successful

## Notes


---

# `TC-POST-EDGE-001`

## Feature
Item Management (Create)

## Scenario
Attempt to post a "Found" item missing required fields

## Steps
1. Log in to the platform.
2. Navigate to "Create Post".
3. Select the "Found" category.
4. Leave Title and Description empty.
5. Click "Submit Post".

## Expected Result
The system prevents form submission and displays red validation text indicating that "Title" and "Description" are required.

## Actual Result
The system prevents submission, but it does not display a red validation text on the fields. It relies on a system-level notification for the error instead.

## Status:
Failed

## Notes
UI needs to be updated to show inline red validation text for better user experience.


---

# `TC-POST-EDGE-002`

## Feature
Item Management (Create)

## Scenario
Attempt to post an item using only whitespace and special characters

## Steps
1. Log in to the platform.
2. Navigate to "Create Post".
3. Enter " " (spaces) in Title.
4. Enter `<script>alert('test');</script> #*!@` in Description.
5. Click "Submit".

## Expected Result
The system sanitizes the inputs, prevents XSS execution, and rejects the post due to the title resolving to empty/invalid characters.

## Actual Result
The system accepted the title with only whitespace and failed to sanitize the description, allowing the XSS script to execute.

## Status:
Failed

## Notes
CRITICAL FIX REQUIRED: Input sanitization and validation must be implemented immediately to prevent XSS vulnerabilities.


---

# `TC-POST-NEG-001`

## Feature
Item Management (Create)

## Scenario
Uploading an unsupported file format for an item image

## Steps
1. Log in and navigate to "Create Post".
2. Fill in all required text fields.
3. Attempt to upload a .pdf or .docx file.
4. Click "Submit Post".

## Expected Result
The system rejects the file upload, displaying an error stating "Unsupported file format. Please upload JPG or PNG files only."

## Actual Result
The system successfully rejects the file upload. It does not accept any file extensions besides valid image extensions.

## Status:
Successful

## Notes


---

# `TC-POST-NEG-002`

## Feature
Item Management (Create)

## Scenario
System rejects image uploads that exceed the maximum file size

## Steps
1. Log in to the platform and navigate to "Create Post".
2. Fill in all required text fields for a Lost/Found item.
3. Attempt to upload a high-resolution image file that exceeds the platform's limit (e.g., a 15MB raw photo).
4. Click "Submit Post".

## Expected Result
The post is not submitted. The system displays an error stating "File size too large. Maximum allowed size is [e.g., 5MB]."

## Actual Result
The system successfully rejects the large file. The platform correctly limits uploads up to 10MB only.

## Status:
Successful

## Notes
Expected Result documentation should be updated to reflect the actual 10MB limit.


---

# `TC-CRUD-FUNC-001`

## Feature
Item Management (Update)

## Scenario
User successfully edits their own existing post

## Steps
1. Log in and navigate to "Profile" or "My Posts".
2. Select an active post.
3. Click "Edit".
4. Append new text to the description.
5. Click "Save Changes".

## Expected Result
The post is updated successfully, and the revised description is immediately visible on the post details page.

## Actual Result
There is no edit function or button available for posts on the platform.

## Status:
Failed

## Notes
The core edit functionality is missing from the application.


---

# `TC-CRUD-FUNC-002`

## Feature
Item Management (Delete)

## Scenario
User successfully deletes their own post

## Steps
1. Log in and navigate to "Profile".
2. Locate an active post.
3. Click "Delete".
4. Confirm the deletion prompt.

## Expected Result
The post is permanently removed from the user's profile and is no longer visible in public listings.

## Actual Result
The post is successfully removed from the active public listings and is moved to "My Archive".

## Status:
Successful

## Notes
Expected Result should be updated to reflect that deleted items are correctly archived rather than permanently destroyed.


---

# `TC-CRUD-SEC-001`

## Feature
Security (Update)

## Scenario
User attempts to edit another user's post

## Steps
1. Log in as "User A".
2. Find a post by "User B".
3. Inspect the post details page.
4. Append edit URL parameter manually (e.g., /edit/postID).

## Expected Result
The UI hides edit controls. Direct URL manipulation results in a 403 Forbidden error page.

## Actual Result
Cannot be accurately tested because the base edit function does not exist at all.

## Status:
Failed

## Notes
Blocked by missing feature from TC-CRUD-FUNC-001.


---

# `TC-CRUD-EDGE-001`

## Feature
Item Management (Update)

## Scenario
User submits an edit without making any changes

## Steps
1. Log in and navigate to an existing authored post.
2. Click "Edit".
3. Make zero alterations.
4. The Save Changes button should not be clickable or active.

## Expected Result
The system should not activate the Save Changes Button, and instead click the cancel button.

## Actual Result
Cannot be tested because there is no edit button for posts.

## Status:
Failed

## Notes
Blocked by missing feature from TC-CRUD-FUNC-001.


---

# `TC-SRCH-FUNC-001`

## Feature
Search and Filter

## Scenario
Filtering items by exact category

## Steps
1. Log in and navigate to Search.
2. Select "Found" from the category filter.
3. Click "Search".

## Expected Result
The listing grid updates to display strictly "Found" items, filtering out all "Lost" items.

## Actual Result
The platform correctly filters by item categories, color, and location. However, there is no specific filter available for "Lost" or "Found" status.

## Status:
Failed

## Notes
The core "Lost" and "Found" status filter is missing and needs to be implemented.


---

# `TC-SRCH-EDGE-001`

## Feature
Search and Filter

## Scenario
Searching items using special characters and partial words

## Steps
1. Log in and navigate to Search.
2. Enter "W@ll3t!".
3. Clear, then enter "fol".
4. Click "Search".

## Expected Result
Special characters are handled without crashing. Partial searches return relevant results (e.g., "folder").

## Actual Result
Special characters are handled perfectly without crashing. The platform has real-time search that automatically reloads for matching items.

## Status:
Successful

## Notes
Excellent implementation of real-time search functionality.


---

# `TC-SRCH-NEG-001`

## Feature
Search and Filter

## Scenario
Submitting an excessively long search query

## Steps
1. Log in and navigate to Search.
2. Paste a string of 500+ random characters.
3. Click "Search".

## Expected Result
The system truncates the input or handles the query without performance degradation, returning "No results found".

## Actual Result
The system successfully handles the excessively long query without crashing.

## Status:
Successful

## Notes


---

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

# `TC-MSG-FUNC-001`

## Feature
Communication

## Scenario
Contacting another user regarding a listed item

## Steps
1. Log in and navigate to another user's post.
2. Click "Contact".
3. Type a message.
4. Click "Send".

## Expected Result
The message is sent successfully, and the platform notifies the recipient.

## Actual Result
The message is sent successfully.

## Status:
Successful

## Notes


---

# `TC-MSG-EDGE-001`

## Feature
Communication

## Scenario
Attempting to send an empty message

## Steps
1. Log in and navigate to a post.
2. Click "Contact".
3. Leave message body blank.
4. Click "Send".

## Expected Result
The send button is disabled or an error states "Message body cannot be empty."

## Actual Result
The send button is correctly disabled when there is no message typed.

## Status:
Successful

## Notes


---

# `TC-ADMIN-FUNC-001`

## Feature
Moderation

## Scenario
Admin moderates and removes an inappropriate post

## Steps
1. Log in with Admin privileges.
2. Locate a guideline-violating post.
3. Click the Admin-only "Delete" button.

## Expected Result
The post is deleted from the public board, overriding original ownership.

## Actual Result


## Status:


## Notes


---

# `TC-ADMIN-FUNC-002`

## Feature
Moderation

## Scenario
Admin searches for a specific student's posting history

## Steps
1. Log in as Admin.
2. Navigate to user management search.
3. Enter a student's institutional email.
4. Click "Search".

## Expected Result
The system retrieves all active and deleted posts associated with that email.

## Actual Result
The system successfully retrieves the student's posting history.

## Status:
Successful

## Notes


---

# `TC-ADMIN-FUNC-003`

## Feature
Moderation

## Scenario
Admin successfully suspends a standard user account

## Steps
1. Log in using an Admin account.
2. Navigate to the Admin Dashboard / User Management page.
3. Search for a specific student's email (e.g., juan.delacruz@neu.edu.ph).
4. Click the "Suspend" button next to their profile.
5. Confirm the action in the prompt.

## Expected Result
The user's account status is updated to "Blocked", and a success confirmation message is displayed to the Admin. The suspended user's active session should be immediately terminated.

## Actual Result
The system successfully updates the backend status and asks for an administrative reason. 

## Status:
Successful

## Notes


---

# `TC-ADMIN-FUNC-004`

## Feature
Moderation

## Scenario
Admin successfully restore a previously suspended user

## Steps
1. Log in using an Admin account.
2. Locate a previously blocked student account.
3. Click the "Restore" button.
4. Confirm the action.

## Expected Result
The account status reverts to "Active", restoring the user's ability to log in and interact with the board.

## Actual Result
The user's account is successfully restored.

## Status:
Successful

## Notes


---

# `TC-UI-FUNC-001`

## Feature
User Interface / Responsiveness

## Scenario
Core platform features are accessible on mobile screen resolutions

## Steps
1. Open the platform in a browser and use Developer Tools to simulate a mobile device (e.g., iPhone 13 or Android equivalent), or access it via a physical mobile device.
2. Log in.
3. Navigate through the Home, Search, and Create Post pages.
4. Open the navigation menu (hamburger menu).

## Expected Result
The layout adapts seamlessly. Text is readable without zooming, images scale correctly, buttons are tappable, and no elements overlap or push off-screen.

## Actual Result
There is a UI bug: When the Archive button is clicked on the mobile view, the navigation pane below it vanishes.

## Status:
Failed

## Notes
UI Bug: The bottom navigation pane needs to remain fixed/visible when interacting with the archive elements.