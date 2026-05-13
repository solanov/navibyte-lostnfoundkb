# `TC-ADMIN-FUNC-001`

## Feature
Moderation

## Scenario
Admin moderates and removes an inappropriate post

## Steps
1. Log in with Admin privileges.
2. Navigate to the "Flagged Posts" tab in the Admin Dashboard.
3. Locate a guideline-violating post.
4. Click the "Delete Post" button.

## Expected Result
The post is deleted from the public board, overriding original ownership, and removed from active circulation.

## Actual Result
The admin successfully navigated to the Flagged Posts tab and deleted the post. The item was removed from the public board as expected.

## Status:
Successful

## Notes
Core moderation flow is functioning perfectly.


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


# `TC-ADMIN-SEC-001`

## Feature
Secure Vault Privacy (RBAC)

## Scenario
Verify that Private Tier data (Hidden Notes) is strictly isolated from public users

## Steps
1. Log in as a standard student user.
2. Inspect an active post on the public board; ensure no "Hidden Note" or unredacted administrative details are visible in the UI or network payload.
3. Log out, then log back in using an Admin/Staff account.
4. Navigate to the "Secure Vault" dashboard.
5. Locate the same item.

## Expected Result
Role-Based Access Control (RBAC) properly gates the data. Standard users cannot see or fetch Private Tier data, while Admins have full unredacted views.

## Actual Result
Privacy tiers function exactly as intended. The hidden note is completely inaccessible to standard users and clearly visible to staff in the Secure Vault.

## Status:
Successful

## Notes
Core security requirement met.

---

# `TC-ADMIN-FUNC-005`

## Feature
Institutional Export

## Scenario
Admin generates and downloads system reports

## Steps
1. Log in with Admin/Staff privileges.
2. Navigate to "Export Reports" on the admin sidebar.
3. Select a specific Report Type (e.g., User Activity or Item Inventory).
4. Define a valid "From" and "To" Date Range.
5. Click "Download CSV".

## Expected Result
The system compiles the requested data and initiates a download of a properly formatted CSV file containing the accurate column headers and data rows.

## Actual Result
The CSV generates and downloads seamlessly with correct, time-filtered data.

## Status:
Successful

## Notes
Reporting functionality is stable and ready for administrative auditing.