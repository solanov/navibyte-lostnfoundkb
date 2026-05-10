# Knowledge Management Architecture

The NaviByte LFS uses a structured Knowledge Management (KM) architecture designed to standardize the conversion of subjective human observations into valuable digital assets. By integrating the **User-to-User Retrieval Workflow** into our existing SECI-based framework, the system addresses the **Vocabulary Gap**, **Inventory Drift**, and **Identity Risk** through a process-driven approach to data schema, taxonomy, and retrieval logic.

## 1. Data Schema for Lost Items
The system’s data architecture is built on a tiered schema that manages information visibility while strictly governing user privacy states (Public vs. Anonymous)

### Core Data Fields
| Field | Original Description |
| :--- | :--- |
| **Unique Identifier (post_id)** | An alphanumeric identification ID assigned to every entry to provide a precise tracking of an item throughout its whole lifecycle as well as for database normalization. |
| **Categorization of Metadata** | Includes a predefined category (icon-based) and a standardized color grid designed to eliminate "human noise"or the use of input field and subjective description errors. |
| **Timestamp Metadata** | Captures created_timestamp and last_edited_timestamp values to maintain chronological integrity. |
| **Accountability Metadata** | The system automatically logs the Staff Name or ID for every state change, such as inventory relocation or status updates, ensuring comprehensive audit trail of every item or changes made in the system. |

### Data Tiering and Access Governance
Security is maintained through Role-Based Access Control (RBAC), which segregates data into three layers:

| Tier | Access Governance Description |
| :--- | :--- |
| **Public Information Tier** | Contains the category, color, zone, and general item details accessible to all. Users can opt for a Public Profile (visible username/location) or Anonymous State (masked as "User #4592").. |
| **Private Information Tier** |Includes the "Hidden Note" (unlisted identifiers). Access is restricted to staff or used in the Blind Verification chat protocol. |
| **Administrative Tier** | Sensitive logistical data, including Physical Bin Numbers and internal status logs, restricted to authenticated personnel.. |

## 2. Taxonomy: Organizational Classification
The NaviByte' system taxonomy is created to eliminate descriptive inconsistencies by enforcing a Fixed Choice model. This ensures that knowledge classification remains uniform across the system, regardless of the user's subjective descriptions.

### Classification Methodology
The architecture utilizes a combination of static and dynamic structures to balance usability with system scalability:

| Methodology Component | Description |
| :--- | :--- |
| **Categorical Logic** | Features an icon-based grid that is managed via the admin dashboard, allowing for the addition or modification of categories without altering or editing the source code. |
| **Attribute Standardization** | Uses a fixed 8-option color grid and predefined dropdowns. This interface excludes free-text input fields for primary attributes, forcing users to select from standardized options. |
| **Spatial Logic (Zones)** | Uses a static structure for location identification of the item(e.g., "Building A"), which maintains system flexibility and reduces the cognitive load associated with hierarchical menus. |
| **Physical Logistics** | Links each digital record to a bin_number field that references a predefined physical storage list, ensuring a consistent digital-to-physical mapping. |

## 3. Retrieval Logic and Security Standards
The data retrieval logic is facilitated by strict requirements intended to maximize search precision while protecting sensitive information from data exploitation.

#### Retrieval Logic & User-to-User Process
The retrieval logic is facilitated by a four-phase workflow that transforms a digital match into a secure physical return.

### Phase 1: Item Discovery and Initiation
- **Action:** Claimant identifies a post and clicks *Initiate Retrieval*.
- **Privacy Policy:** The system prompts: *Interact as [Public] or [Anonymous]?*
- **Security:** The platform generates an internal, masked messaging thread. No personal contact info (email/phone) is ever shared.

### Phase 2: The Verification Protocol (Blind Verification)
To prevent theft, ownership must be established before a status change:
- **Logic:** The Claimant must describe an unlisted detail (from the Private Tier) or the Poster must challenge the Claimant to verify a specific attribute.
- **Verification Approval:** Once satisfied, the holding party accepts the claim, moving the item status from *Pending to Approved for Handover*.

### Phase 3: Coordination and Item Handover
The method of return is dictated by the chosen privacy states:
- **Scenario A (Mutual Public):** Direct meetup in a safe public location.
- **Scenario B (Anonymous Proxy):** The holding party drops the item at a Safe Drop Point (e.g., security station) labeled with the Retrieval ID. The receiver quotes this ID to collect the item, maintaining total anonymity.

### Phase 4: Resolution and Archiving
- **Confirmation:** Both users click *Handover Complete*.
- **Closure:** The system updates status to Resolved, removing the post from the active board.
- **Archiving:** The chat thread is locked and archived to prevent "Inventory Drift."

### Operational Requirements
| Requirement | Logic and Function |
| :--- | :--- |
| **Boolean Logic** | The search engine uses a strict AND-based filtering. Queries for "Phone" and "Black" will only return results satisfying both parameters, effectively excluding partial matches that could lead to verification fatigue. |
|Information Scrubbing |The chat interface automatically warns/blocks users if phone numbers or emails are detected in the masked chat.|
| Verification Failure |Poster clicks "Reject Claim," terminating the thread and blocking that user from re-claiming that specific ID.|
| Unresponsive Users | If a party is silent for 72 hours, the claim expires and the item returns to "Active" status. |
| **Redacted Discovery** | To prevent fraudulent claims, public-view queries are automatically filtered to exclude any record with a status of "Returned". Furthermore, the API protects sensitive data by only returning "Public Tags" to unauthorized endpoints. |
| **Staff-Specific Discovery** | The administrative interface view applies visual emphasis to the Hidden Note to facilitate rapid verification. |
| **Automated Lifecycle Management** | The system dynamically flags records exceeding a 30-day threshold. These items are highlighted on the dashboard to trigger mandatory inventory purging or disposition actions. |

### Integrity and Privacy Compliance
| Standard | Description |
| :--- | :--- |
| **Backend Enforcement** | Validation rules reject any submissions that deviate from the predefined taxonomy, preventing the injection of unstructured "human noise" into the database. |
| **Privacy Advocacy** | The user interface includes mandatory disclaimers and reminders advising users to  avoid capturing Personally Identifiable Information (PII) during the image upload process. |