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