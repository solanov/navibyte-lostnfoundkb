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