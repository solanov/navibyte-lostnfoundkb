# Agile Project Framework and Deliverables: Lost and Found System (LFS)

## Problem Statement
The primary problem that the Navibyte: Lost and Found System is to address the **Vocabulary Gap** in which the description of the lost item of the finder is subjective which can lead to a high percentage of messy data(Tacit Knowledge), which fails to align with the search criteria of the owner of the item. This Tacit-to-Tacit data mismatch occurs because traditional lost and found systems often rely on inconsistent “Human-Noise” or vague descriptions of an item such as “a dark colored bag” matching with another description such as *a dark navy colored bag*. This problem prevents the system from accurately matching the finder’s description and the owner’s description of the same item. Furthermore, the system also tackles the **Inventory Drift** wherein the information in the system is not matching with the information on the actual inventory of items. This happens through knowledge decay where the digital record claims an item has a specific information but the actual item has been moved, lost or it has been returned already. 

## KM Framework
The SECI model, originally proposed by Nonaka(1994), serves as the Knowledge Management Framework for the Lost and Found System(Project Name). The SECI model describes knowledge creation as a continuous process between tacit knowledge and explicit knowledge. In the context of this system, the model serves as the guideline for solving the problem statement which is the **Vocabulary Gap** or the misalignment of the information between the one who found the item and the owner of it which can lead to operational inefficiencies and inventory drift. With the SECI model, by treating lost items as knowledge objects that need to be processed through various stages, the system can ensure and improve the disorganization of human observation into reliable and structured organizational assets. 

The process begins with the first stage of SECI which is **Socialization(Tacit-to-Tacit)**, which involves knowledge and experience sharing through direct interaction. This is applied into the system through the Staff/Admin Dashboard, where the team/staff members observe in real time the inventory trends and share their observations and *gut feelings* regarding suspicious claiming patterns or the most optimal bin and inventory organization strategies. According to Nonaka, Toyama and Konno(2000), this stage requires a “Ba” or shared space for interaction purposes. The dashboard provides this digital environment where the staff can align their intuition and shared intelligence to ensure that the human element of security and logistics is preserved through collective experiences and intellect. 

The next stage is the **Externalization (Tacit-to-Explicit)** where the critical phase takes place. The subjective observations are expected to be converted into meaningful, easy to understand and standardized analogy based on the specific categories available. The system achieves this through the use of Categorized Icon Grid and Fixed Color Palette. This prevents the “Vocabulary Gap” by eliminating free-text or input text by replacing it with a structured taxonomy. By ensuring that the item finder chooses a specific icon and item color, the system can codify these observations into a structured and searchable digital information that remains consistent across all user sessions.

The **Combination stage (Explicit-to-Explicit)**involves the systematic processing of data to merge and create a more complex knowledge. According to the system’s architecture, this is realized by using Public Metadata(category and color) with Private Metadata(hidden notes) and the Logistical Metadata(physical bin mapping). This creates a comprehensive digital information by merging these data points into a relational database. This ensures the system can achieve a high integrity of “Chain of Custody” allowing the digital data to be in sync with the physical items which prevents **Inventory Drift**.

Finally the last stage is the **Internalization (Explicit-to-Tacit)** which occurs when individuals, specifically the staff, access the secure view of the restricted details that is only accessible to them, which is the hidden notes. This knowledge helps the staff to make valuable decisions during the item claiming process and confirming the ownership of the item through secret details not available to the public. 

## Framework to App Mapping
# Framework-to-App Mapping: NaviByte Lost and Found System

This section maps the theoretical Knowledge Management (KM) Architecture and the framework used in alignment to the specific functionalities and user interface (UI) requirements within the NaviByte Lost and Found system.

---

## I. Data Schema & Database Mapping
**Goal:** Transform unstructured human observations into standardized *Digital Assets*.

| KM Component | App Feature/Module | Technical Implementation |
| :--- | :--- | :--- |
| **Unique Identifier** | **Post ID Generator** | Automated generation of alphanumeric strings (e.g., NB-2026-X) upon form submission. |
| **Accountability Metadata** | **Audit Log Module** | Backend recorder that saves `user_id` and `timestamp` for every status change (e.g., from *Found* to *Claimed*). |
| **Data Tiering** | **Access Control Layer** | UI logic that hides/shows fields based on user role (Admin vs. Public User). |
| **Private Tier** | **The *Hidden Note* Vault** | An encrypted part of the database field that can only be decrypted by authorized Staff or within the Verification Chat. |

---

## II. Taxonomy & UI Mapping
**Goal:** Eliminate the *Vocabulary Gap* through a Fixed Choice model.

| KM Component | App Feature/Module | UI/UX Element |
| :--- | :--- | :--- |
| **Categorical Logic** | **Icon Grid Picker** | A non-scrollable grid of SVG icons representing categories (Electronics, Keys, etc.). No text input allowed. |
| **Attribute Standardization** | **Fixed Color Palette** | An 8-button color picker using hex-code constants to ensure "Navy" and "Blue" are classified identically. |
| **Spatial Logic (Zones)** | **Zone Dropdown** | A hard-coded list of locations (e.g., "Main Library") to prevent disparate naming (e.g., *Library* vs *The Lib*). |
| **Physical Logistics** | **Bin Mapping System** | A *Storage Location* field in the Admin Edit view that matches the item to a physical barcode/bin. |

---

## III. Retrieval Logic & Workflow Mapping
**Goal:** Convert digital data into secure, real-world handovers of the items.

### Phase 1 & 2: Initiation & Verification
* **Feature:** **Initiate Retrieval Button**
    * **App Logic:** Triggers a modal asking the user for their privacy state (Public/Anonymous).
* **Feature:** **Masked Chat Module**
    * **App Logic:** Opens an ephemeral messaging window.
    * **KM Implementation:** Displays the "Blind Verification" prompt requiring the Claimant to provide the "Hidden Note" detail.
* **Feature:** **Information Scrubbing Filter**
    * **App Logic:** A Regex-based script that scans chat inputs for `(xxx) xxx-xxxx` or `@` symbols and censors them to protect anonymity.

### Phase 3 & 4: Handover & Resolution
* **Feature:** **Retrieval ID Generator**
    * **App Logic:** Generates a unique 4-digit code (e.g., 883A) once a claim is *Approved for Handover*.
* **Feature:** **Safe Drop Point Interface**
    * **App Logic:** Displays a list of verified physical drop-off locations with a *Confirm Drop-off* button for the Poster.
* **Feature:** **Resolution Trigger**
    * **App Logic:** A "Handover Complete" button that simultaneously updates the DB status to `Resolved` and archives the chat logs to the cold storage server.

---

## IV. Operational Security Mapping
**Goal:** System integrity and data lifecycle management.

| KM Requirement | App Feature/Module | Function |
| :--- | :--- | :--- |
| **Boolean Logic** | **Search Engine API** | Filters results using `WHERE category = X AND color = Y` logic exclusively. |
| **Redacted Discovery** | **API Response Scrubber** | Middleware that removes the `returned_status` items from the JSON payload sent to the public frontend. |
| **Lifecycle Management** | **Audit Trailing** | An automated script that runs every 24 hours to flag posts where `current_date - created_at > 30 days`. |
| **Backend Enforcement** | **Server-side Validation** | Rejects API requests that contain strings in fields designated for enum/integer values (Categorical Logic). |

---

## V. Privacy Compliance Mapping
* **Module:** **Image Upload Pre-processor**
    * **KM Link:** Privacy Policy.
    * **App Function:** Displays a mandatory popup disclaimer before opening the camera roll, advising users to crop out faces or license plates.
* **Module:** **Identity Masking Engine**
    * **KM Link:** User Privacy States.
    * **App Function:** Replaces the `username` string with `Anonymous User + [Post ID last 4]` in all public-facing views if the *Anonymous* state is toggled.

---
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

## Limitations and Future Work


## References

Nonaka, I. (1994). A Dynamic Theory of Organizational Knowledge Creation. Organization Science, 5(1), 14–37. https://ideas.repec.org/a/inm/ororsc/v5y1994i1p14-37.html

Nonaka, I., Toyama, R., and Konno, N. (2000). SECI, Ba and Leadership: A Unified Model of Dynamic Knowledge Creation. Long Range Planning, 33(1), 5–34. https://agileconsortium.pbworks.com/f/Nonaka_etal_2000_SECI.pdf