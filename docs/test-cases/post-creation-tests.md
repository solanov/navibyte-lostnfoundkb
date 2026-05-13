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
Attempt to post a "Found" item missing required fields or acknowledgements

## Steps
1. Log in to the platform.
2. Navigate to "Create Post".
3. Select the "Found" category.
4. Leave Title and Description empty.
5. Leave the Posting Acknowledgement checkboxes unchecked.
6. Click "Submit Post".

## Expected Result
The system prevents form submission and displays appropriate validation text for the missing fields. Additionally, the system mandates that the user checks the explicit content and PII acknowledgement boxes before submission is allowed.

## Actual Result
**[CYCLE 1 - FAILED]:** System prevented submission but lacked inline red validation text.
**[CYCLE 2 - PASSED]:** The UI now correctly prevents submission, displays the proper validation warnings, and successfully blocks the post if the new Posting Acknowledgement checkboxes are left unchecked.

## Status:
~~Failed~~ **Passed (Retested)**

## Notes
Excellent UI/UX improvement. The addition of the mandatory Posting Acknowledgement checkboxes adds a strong layer of accountability to the SECI framework.


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
**[CYCLE 1 - FAILED]:** The system accepted the title with only whitespace and failed to sanitize the description, allowing the XSS script to execute.
**[CYCLE 2 - PASSED]:** The system successfully trimmed the whitespace, rejected the empty title, and sanitized the HTML tags before database insertion, preventing XSS execution.

## Status:
~~Failed~~ **Passed (Retested)**

## Notes
Original failure and fix documented in `failureanalysis.md`. Critical security vulnerability successfully patched.


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