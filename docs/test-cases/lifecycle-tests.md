# `TC-LIFE-FUNC-001`

## Feature
Lifecycle Control

## Scenario
Automated flagging of items exceeding the institutional retention window

## Steps
1. Identify or simulate an active post that has been on the board for longer than the 30-day retention limit.
2. Log in with Admin privileges.
3. Navigate to the "Disposal Queue" dashboard.

## Expected Result
The system automatically identifies the aged item and flags it as "Overdue," displaying it in the queue for administrative purging.

## Actual Result
The automated lifecycle management successfully captures the aged item and routes it to the Disposal Queue without manual intervention.

## Status:
Successful

## Notes
Crucial for automated database and physical inventory cleanup.


---

# `TC-LIFE-FUNC-002`

## Feature
Content Moderation

## Scenario
Public user flags an inappropriate post for administrative review

## Steps
1. Log in as a standard user.
2. Open an active item post on the Campus Board.
3. Click the Flag/Report button.
4. In the "Report Post" modal, select a specific Reason (e.g., Inappropriate Content, Fake/Scam).
5. Add optional context in the Additional Details textarea.
6. Click "Submit Report".
7. Log in as an Admin and check the "Flagged Posts" dashboard.

## Expected Result
The system logs the user's report, and the post immediately populates in the Admin's Flagged Posts view for moderation.

## Actual Result
The Report Post modal captures the defined reasons correctly, and the report is instantly routed to the administrative dashboard. 

## Status:
Successful

## Notes
Community moderation tools are fully operational.