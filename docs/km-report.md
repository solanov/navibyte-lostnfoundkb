# Agile Project Framework and Deliverables: Lost and Found System (LFS)

## Problem Statement
The primary problem that the Lost and Found System(placeholder for project name) is to address the “Vocabulary Gap” in which the description of the lost item of the finder is subjective which can lead to a high percentage of messy data(Tacit Knowledge), which fails to align with the search criteria of the owner of the item. This Tacit-to-Tacit data mismatch occurs because traditional lost and found systems often rely on inconsistent “Human-Noise” or vague descriptions of an item such as “a dark colored bag” matching with another description such as “a dark navy colored bag”. This problem prevents the system from accurately matching the finder’s description and the owner’s description of the same item. Furthermore, the system also tackles the “Inventory Drift” wherein the information in the system is not matching with the information on the actual inventory of items. This happens through knowledge decay where the digital record claims an item has a specific information but the actual item has been moved, lost or it has been returned already. 

## KM Framework
The SECI model, originally proposed by Nonaka(1994), serves as the Knowledge Management Framework for the Lost and Found System(Project Name). The SECI model describes knowledge creation as a continuous process between tacit knowledge and explicit knowledge. In the context of this system, the model serves as the guideline for solving the problem statement which is the “Vocabulary Gap” or the misalignment of the information between the one who found the item and the owner of it which can lead to operational inefficiencies and inventory drift. With the SECI model, by treating lost items as knowledge objects that need to be processed through various stages, the system can ensure and improve the disorganization of human observation into reliable and structured organizational assets. 

The process begins with the first stage of SECI which is Socialization(Tacit-to-Tacit), which involves knowledge and experience sharing through direct interaction. This is applied into the system through the Staff/Admin Dashboard, where the team/staff members observe in real time the inventory trends and share their observations and “gut feelings” regarding suspicious claiming patterns or the most optimal bin and inventory organization strategies. According to Nonaka, Toyama and Konno(2000), this stage requires a “Ba” or shared space for interaction purposes. The dashboard provides this digital environment where the staff can align their intuition and shared intelligence to ensure that the human element of security and logistics is preserved through collective experiences and intellect. 

The next stage is the Externalization (Tacit-to-Explicit) where the critical phase takes place. The subjective observations are expected to be converted into meaningful, easy to understand and standardized analogy based on the specific categories available. The system achieves this through the use of Categorized Icon Grid and Fixed Color Palette. This prevents the “Vocabulary Gap” by eliminating free-text or input text by replacing it with a structured taxonomy. By ensuring that the item finder chooses a specific icon and item color, the system can codify these observations into a structured and searchable digital information that remains consistent across all user sessions.

The Combination stage (Explicit-to-Explicit) involves the systematic processing of data to merge and create a more complex knowledge. According to the system’s architecture, this is realized by using Public Metadata(category and color) with Private Metadata(hidden notes) and the Logistical Metadata(physical bin mapping). This creates a comprehensive digital information by merging these data points into a relational database. This ensures the system can achieve a high integrity of “Chain of Custody” allowing the digital data to be in sync with the physical items which prevents “Inventory Drift”

Finally the last stage is the Internalization (Explicit-to-Tacit) which occurs when individuals, specifically the staff, access the secure view of the restricted details that is only accessible to them, which is the hidden notes. This knowledge helps the staff to make valuable decisions during the item claiming process and confirming the ownership of the item through secret details not available to the public. 

## Framework to App Mapping
(No Visual Model yet, please refer to the Features and Deliverables in Framework Draft 3)

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

## Limitations and Future Work


## References

Nonaka, I. (1994). A Dynamic Theory of Organizational Knowledge Creation. Organization Science, 5(1), 14–37. https://ideas.repec.org/a/inm/ororsc/v5y1994i1p14-37.html

Nonaka, I., Toyama, R., and Konno, N. (2000). SECI, Ba and Leadership: A Unified Model of Dynamic Knowledge Creation. Long Range Planning, 33(1), 5–34. https://agileconsortium.pbworks.com/f/Nonaka_etal_2000_SECI.pdf