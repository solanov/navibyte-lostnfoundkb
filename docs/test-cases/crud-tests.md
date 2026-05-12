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