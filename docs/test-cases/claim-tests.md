# `TC-CLAIM-FUNC-001`

## Feature
Claims Management

## Scenario
User successfully initiates a claim on a found item

## Steps
1. Log in to the platform as a standard user.
2. Navigate to an active "Found" item on the Campus Board.
3. Click the item to view details, then click "Initiate Retrieval" or "Contact".
4. In the "Submit Claim" modal, verify the Claimant Name is pre-filled.
5. Enter a valid Student ID.
6. Enter an Ownership Description (e.g., describing a hidden identifying detail).
7. Click "Submit Claim".

## Expected Result
The system successfully logs the claim, generates a masked thread in the Claims Monitor, and notifies the original poster.

## Actual Result
The claim modal functions perfectly. The Student ID and description are captured, and the claim is successfully queued for the poster to review.

## Status:
Successful

## Notes
UI integration is clean. The ownership description field effectively supports the "Blind Verification" protocol defined in the KM architecture.

---

# `TC-CLAIM-FUNC-002`

## Feature
Claims Management

## Scenario
Poster successfully resolves an active claim

## Steps
1. Log in as the user who originally posted the "Found" item.
2. Navigate to "My Claims" via the side menu.
3. Locate the item in the Claim Queue and click "View Claims".
4. Review the claimant's submitted Ownership Description.
5. Click the "Mark as Returned" button.

## Expected Result
The system updates the item's status to "Returned", closes the loop, and securely archives the post, removing it from the public Campus Board.

## Actual Result
The action executes flawlessly. The item is removed from public circulation and transferred to the archive with the "Returned" status.

## Status:
Successful

## Notes
Effectively eliminates "Inventory Drift" as outlined in the project requirements.