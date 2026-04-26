# KM Rationale

## 1. Login / Auth Page

**KM Focus:** Access Governance & Security
* **Callout 1 (Email Input):** Institutional email gating (@neu.edu.ph) prevents unauthorized access and signals privacy to the user.
* **Callout 2 (Form Structure):** Enforces Role-Based Access Control (RBAC) by acting as the gateway that securely segregates users into Public and Administrative data tiers before they enter the system.

## 2. Public Board View

**KM Focus:** Combination (Explicit-to-Explicit) & Cognitive Load
* **Callout 1 (Overall Layout):** Mimics familiar social media UI patterns (sticky navigation, left-hand filters, scrolling feed) to drastically reduce user cognitive load and eliminate the need for onboarding tutorials.
* **Callout 2 (Item Cards / Locked Placeholders):** Utilizes a "Redacted View" logic that only displays Public Information Tier data (Category, Color, Zone). Sensitive visual evidence is locked to prevent malicious actors from studying items to make fraudulent claims.

## 3. Intake Form View

**KM Focus:** Externalization (Tacit-to-Explicit)
* **Callout 1 (Category & Color Selectors):** Solves the "Vocabulary Gap" by replacing subjective free-text inputs with a Categorical Icon Grid and Fixed Color Palette. This forces standard inputs, converting messy tacit knowledge into strict explicit data.
* **Callout 2 (Hidden Note Field):** Captures non-obvious identifiers strictly for identity verification, safely routing this data to the restricted Private Information Tier.

## 4. Admin Dashboard

**KM Focus:** Internalization (Explicit-to-Tacit) & Socialization
* **Callout 1 (Unredacted Data Table):** Shifts the UI from a social feed to a functional, data-dense "Secure Vault" designed for rapid item verification by staff.
* **Callout 2 (Hidden Note & Verification Modal):** Allows staff to read the restricted "Hidden Note" (Explicit), internalize that information, and use it to execute a Challenge Question to verify an owner's identity (Tacit).
* **Callout 3 (Red Highlight on Old Items):** An Automated Lifecycle Management alert highlights items older than 30 days in red. This visual trigger forces inventory purging to prevent "Inventory Drift" between the app and the physical bins.