# NEUvigate: Lost and Found System (LFS)

🌐 **Live Deployment:** [navibyte.vercel.app](https://navibyte.vercel.app/)

## 1. Overview
The NEUvigate Lost and Found System (LFS) is a secure, process-driven platform designed to modernize item recovery across campus. Traditional lost and found systems suffer from three critical failures:
* **The Vocabulary Gap:** A Tacit-to-Tacit knowledge mismatch where a finder's description fails to align with the owner's search criteria.
* **Identity Risk:** A breakdown in trust and verification, leading to potential theft or privacy breaches.
* **Inventory Drift:** A state where digital records fail to reflect the physical status of an item, destroying the organizational chain of custody.

NEUvigate solves these challenges by standardizing human observations into structured digital data, ensuring a high-integrity, secure, and fully auditable recovery process.

---

## 2. Knowledge Management (KM) Framework

### Framework Selection: SECI Model
To solve the challenges of subjective item reporting, the **SECI Model** was chosen over the Communities of Practice (CoP) framework. While CoP is great for social collaboration, the SECI model provides the technical structure required to synchronize a digital database with a physical warehouse, eliminating Inventory Drift.

#### The 4 Stages of Implementation
1. **Socialization (Tacit-to-Tacit):** Users share the intent to return or find items through a Public vs. Anonymous Sentiment workflow. By allowing an Anonymous State, the system respects the tacit way of sharing personal data with strangers while ensuring security.
2. **Externalization (Tacit-to-Explicit):** The *Discovery & Initiation Phase*. When a user clicks "Initiate Retrieval," they transform an internal belief into a formal digital request. Categorical Icon Grids and Fixed Color Palettes eliminate subjective free-text errors.
3. **Combination (Explicit-to-Explicit):** The *Verification Protocol*. The system merges the Poster's Private Description with the Claimant's Verification Response. Blind Verification compares explicit details within a masked chat, while Automated Information Scrubbing prevents unformatted explicit data (phone numbers) from compromising security.
4. **Internalization (Explicit-to-Tacit):** The *Coordination & Handover*. Digital data transforms back into physical action. Users either coordinate a direct meetup or utilize a Proxy Retrieval ID at a Safe Drop Point. Clicking *Handover Complete* ends the knowledge cycle and archives the data.

### KM Architecture
* **Data Schema:** A tiered schema (Public, Private, Administrative) governed by strict Role-Based Access Control (RBAC). Items are tracked via Unique Identifiers (post_id), Timestamp Metadata, and Accountability Metadata (Staff ID logging).
* **Taxonomy:** A Fixed Choice model utilizing Categorical Logic (icon grids), Attribute Standardization (fixed 8-option color grid), and Spatial Logic (static zones) mapped directly to Physical Logistics (bin numbers).

---

## 3. Team
* **Vinz Eulo Solano** - Scrum Master
* **Peja Latrell Escares** - Full Stack Developer
* **Albert Julius Ortiz** - UI/UX Designer
* **Saira Sofia De Mesa** - Knowledge Management Analyst
* **Carl Geneson Ola** - QA and Documentation Lead

---

## 4. Features
NEUvigate translates strict Knowledge Management architecture into an intuitive user interface, separated by Role-Based Access Controls (RBAC).

### Public / Student Capabilities
* **Real-Time Campus Board:** A dynamic home feed with advanced filtering by Type (Lost/Found), Category, Color, and Location.
* **Standardized Entry Creation:** A guided form utilizing icon-based categories and a fixed primary color grid to eliminate "human noise."
* **Claims Monitor & Management:** A dedicated queue where users review P2P claim requests and explicitly "Mark as Returned" to close the loop.
* **Integrated Inbox & Messaging:** An internal messaging thread for coordinating handoffs, protecting user privacy by avoiding external contact methods.
* **Post Deletion & Personal Archive:** Users can delete their posts. Deleted, returned, or purged items move to an archive displaying moderation transparency (e.g., "Media Redacted" tags).
* **Automated Notifications:** Real-time push alerts for new messages, claims, and status updates.

### Administrative & Staff Capabilities
* **System Analytics Dashboard:** Real-time overview of system metrics, asset statuses, activity trends, and pending tasks.
* **Secure Vault:** A central repository allowing staff to view unredacted item details and hidden notes for high-value asset verification.
* **User Management & Oversight:** Controls to review student posting histories and explicitly suspend or restore institutional accounts.
* **Lifecycle Control (Disposal Queue):** Automated flagging of items that have exceeded the institutional retention window, allowing for authorized purging.
* **Comprehensive Audit Trail:** Consolidated system logs tracking claim activity, account events, item deletions, and physical returns.
* **Content Moderation (Flagged Posts):** An interface to review, dismiss, or delete user-reported suspicious or inappropriate posts.
* **Institutional Export (System Reports):** Configurable CSV exports for user activity, audit logs, disposal manifests, and item inventory based on specified date ranges.

---

## 5. Tech Stack
* **Deployment:** [Vercel](https://navibyte.vercel.app/)
* **Frontend:** Next.js, React, Tailwind CSS
* **Language:** TypeScript
* **Backend / Database:** Supabase PostgreSQL
* **Authentication:** Supabase Auth
* **Storage:** Supabase Storage (for item images)
* **Security / Parsing:** Regex algorithms (for Information Scrubbing)

---

## 6. Setup and Installation
To run NEUvigate LFS locally, follow these steps:

1. Clone the repository:
   git clone https://github.com/solanov/navibyte-lostnfoundkb.git

2. Navigate to the project directory:
   cd navibyte-lostnfoundkb

3. Install dependencies:
   npm install

4. Set up environment variables:
   * Create a `.env.local` file in the root directory.
   * Add the required keys (e.g., Database URL, Auth keys).

5. Start the development server:
   npm run dev

---

## 7. Repository Structure
navibyte-lostnfoundkb/
├── docs/               # Project documentation, guidelines, and test cases
├── public/             # Static assets (images, icons)
├── src/
│   ├── app/            # Next.js App Router (pages, layouts, API routes)
│   ├── components/     # Reusable UI components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions and external integrations
├── eslint.config.mjs   # Linter configuration
├── next.config.ts      # Next.js configuration
├── package.json        # Project metadata and dependencies
├── postcss.config.mjs  # Tailwind/PostCSS configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # Project overview

---

## 8. Branch Strategy
We follow a structured Git workflow tailored to our team's roles to ensure code stability and organized integration:
* `main`: Production-ready code deployed to Vercel.
* `dev`: Active development and integration branch.
* `all/docs`: Core documentation and project assets.
* `solano-scrum`: Project management and workflow tracking.
* `escares-fullstack`: Core application logic, database, and API routing.
* `ortiz-ui`: User interface components and styling implementations.
* `demesa-km`: Knowledge Management architecture logic and analytics integration.
* `ola-qa`: Quality assurance testing, test cases, and documentation execution.

---

## 9. License
This project is licensed under the [MIT License](LICENSE).

---