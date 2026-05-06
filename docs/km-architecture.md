# Knowledge Management Architecture

The NaviByte Lost and Found System: Navibyte uses a structured Knowledge Management (KM) architecture designed to standardize the conversion of subjective human observations data into valuable and usable digital assets for the organization. This framework addresses the inherent "Vocabulary Gap" and "Inventory Drift" found in traditional lost and found systems by applying a process-driven approach to data schema, taxonomy, and retrieval logic.

## 1. Data Schema for Lost Items
The system’s data architecture is built on a tiered data schema that manages information visibility through structured item records. This ensures that every entry remains a distinct, trackable entity throughout its lifecycle.

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
| **Public Information Tier** | Contains the category, color, zone, and general item details accessible to all users for discovery. |
| **Private Information Tier** | Includes the "Hidden Note"—a field containing non-obvious identifiers used strictly for identity verification. Access is restricted to authorized staff and administrators. |
| **Administrative Tier** | Encompasses sensitive logistical data, including physical bin numbers and internal status logs, restricted to authenticated personnel. |

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

### Operational Requirements
| Requirement | Logic and Function |
| :--- | :--- |
| **Boolean Logic** | The search engine uses a strict AND-based filtering. Queries for "Phone" and "Black" will only return results satisfying both parameters, effectively excluding partial matches that could lead to verification fatigue. |
| **Redacted Discovery** | To prevent fraudulent claims, public-view queries are automatically filtered to exclude any record with a status of "Returned". Furthermore, the API protects sensitive data by only returning "Public Tags" to unauthorized endpoints. |
| **Staff-Specific Discovery** | The administrative interface view applies visual emphasis to the Hidden Note to facilitate rapid verification. |
| **Automated Lifecycle Management** | The system dynamically flags records exceeding a 30-day threshold. These items are highlighted on the dashboard to trigger mandatory inventory purging or disposition actions. |

### Integrity and Privacy Compliance
| Standard | Description |
| :--- | :--- |
| **Backend Enforcement** | Validation rules reject any submissions that deviate from the predefined taxonomy, preventing the injection of unstructured "human noise" into the database. |
| **Privacy Advocacy** | The user interface includes mandatory disclaimers and reminders advising users to  avoid capturing Personally Identifiable Information (PII) during the image upload process. |