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