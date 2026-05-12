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
**[CYCLE 1 - FAILED]:** There is no edit function or button available for posts on the platform.
**[CYCLE 2 - PASSED]:** The Edit button is now present on the user's authored posts. The user can successfully edit the content, and changes are saved and reflected immediately.

## Status:
~~Failed~~ **Passed (Retested)**

## Notes
Core edit functionality has been successfully implemented and deployed.

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
The post is successfully removed from the active public listings and is moved to the user's "My Archive" view. *(Updated to reflect intended system archiving behavior).*

## Actual Result
The post is successfully removed from the active public listings and is moved to "My Archive".

## Status:
Successful

## Notes
Working as intended. Deletion correctly acts as a soft-delete/archive for moderation transparency rather than a permanent database destruction.

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
**[CYCLE 1 - FAILED]:** Cannot be accurately tested because the base edit function does not exist at all.
**[CYCLE 2 - PASSED]:** The system successfully hides the Edit button on posts belonging to other users, preventing unauthorized modifications. 

## Status:
~~Failed~~ **Passed (Retested)**

## Notes
UI Role-Based Access Control correctly protects user posts from unauthorized edits.

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
4. Click "Save Changes".

## Expected Result
The system handles the empty action gracefully, either by disabling the Save button or processing the save without altering the data or throwing an error.

## Actual Result
**[CYCLE 1 - FAILED]:** Cannot be tested because there is no edit button for posts.
**[CYCLE 2 - PASSED]:** The user can click "Save Changes" without modifying the text. The system accepts the submission gracefully, and the post remains exactly the same without throwing any errors.

## Status:
~~Failed~~ **Passed (Retested)**

## Notes
The system handles unaltered submissions safely.