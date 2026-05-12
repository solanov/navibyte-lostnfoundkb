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