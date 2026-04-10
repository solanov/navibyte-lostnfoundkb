# Prompt Log: Scrum Master - Solano, Vinz Eulo A.

## Entry 1 - (26/03/2026)

### **Task(s)**

- Project Structure (prompt-logs.md merging and logging)

### **Prompt (or Summary) provided to the AI**

I have a GitHub repository with branches main and dev. Main is for the deployment, and dev is for testing. I have 5 members in our group. I want each member to have a branch. And in their branch, I want them to have their own prompt-logs.md. The thing is, I want their prompt-logs.md to be only in their branch. That means that when I merge their branches with dev for testing, I don't want their prompt-logs to be in dev.

### **Output**

Managing branch-specific files can be tricky because Git's default behavior is to synchronize everything during a merge. To keep prompt-logs.md strictly on individual member branches and out of your dev branch, you have a few ways to handle this.

The most robust approach involves using a custom merge strategy or a GitHub Action to automate the exclusion.

Managing branch-specific files can be tricky because Git's default behavior is to synchronize everything during a merge. To keep prompt-logs.md strictly on individual member branches and out of your dev branch, you have a few ways to handle this.

The most robust approach involves using a custom merge strategy or a GitHub Action to automate the exclusion.

#### **Method 1: The .gitattributes "Ours" Strategy**

This is the standard way to tell Git: "When merging into this branch, always keep my version of this specific file and ignore changes from the other branch."

1. Setup the Merge Driver
   Each team member (and you, on the dev branch) needs to run this command once in their terminal to define a merge strategy called "ours":

Bash
git config --global merge.ours.driver true 2. Create the .gitattributes File
On your dev branch, create a file named .gitattributes in the root directory and add this line:

Plaintext
prompt-logs.md merge=ours 3. Create a Dummy File on Dev
For this to work, the file must exist on both branches.

Create a blank prompt-logs.md on the dev branch.

Commit it.

Now, when a member merges their branch into dev, Git will see the merge=ours attribute and automatically choose the dev version (the blank one) over the member's version.

#### **Method 2: GitHub Actions (The "Safety Net")**

If you are using GitHub for Pull Requests (PRs), you can use a workflow to automatically delete the file if it accidentally hit the dev branch, or fail the build if it's detected.

You can create a file at .github/workflows/clean-logs.yml on the dev branch:

```YAML
name: Remove Prompt Logs on Merge
on:
  push:
    branches:
      - dev

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Delete prompt-logs.md
        run: |
          if [ -f prompt-logs.md ]; then
            git config user.name "GitHub Action"
            git config user.email "action@github.com"
            rm prompt-logs.md
            git add .
            git commit -m "Chore: Remove branch-specific prompt-logs"
            git push
          fi
```

#### **Method 3: The Manual "Exclusion" Merge**

If you prefer not to mess with configurations and only merge occasionally, you can exclude the file manually during the merge process.

Start the merge without committing:

```Bash
git merge member-branch --no-commit --no-ff
Restore the file from the current branch (dev):
```

```Bash
git checkout HEAD -- prompt-logs.md
Finish the merge:
```

```Bash
git commit -m "Merged member-branch into dev (excluding prompt-logs)"
```

Comparison Table
|Feature|.gitattributes|GitHub Action| Manual Merge|
|---|---|---|---|
|Effort| Medium (One-time setup)| High (Initial script)| Low (Per merge)|
|Reliability| High |Very High| Low (Human error)|
|Automation| Automatic| Automatic| Manual|

> Pro Tip: If these logs are purely for personal notes and don't need to be backed up to the cloud, the simplest way is to add prompt-logs.md to the .gitignore file on the dev and main branches. However, this means they won't be saved on GitHub at all for the member branches either.

Are you using a specific platform for your project management (like Jira or Trello) where these logs might eventually be useful, or should they stay strictly within the Git environment?

### **What you changed/improved/rejected fom the AI's output**

I tried to impliment most of these, but none of them was good for maintaining the prompt-logs.md. This decision was made because majority of
members lack GitHub experiece.

### **Reason (Why?)**

To maintain prompt-logs properly

### **What you learned or the decision you made as a result**

I have learned that this can be pulled off, should we have been experienced. I went with making a branch specific for prompt-logs, then the prompt-logs in that branch will be pushed to members branches.

## Entry 2 - (26/03/2026)

### **Task(s)**

- Project Structure

### **Prompt (or Summary) provided to the AI**

What happens when I'm in a different branch and I pull from the main branch

### **Output**

When you are checked out on a different branch (let's call it feature-branch) and you pull from the main branch (using a command like git pull origin main), Git does two things in rapid succession: it fetches the newest updates from main and merges them directly into your current feature-branch.

Basically, you are syncing your current workspace with the latest official code.

Here is exactly what happens under the hood and what you can expect:

1. **The Two-Step Process**
   `git pull` is actually a combination of two separate commands:

`git fetch origin main`: Git reaches out to the remote server and downloads all the new commits, files, and history from main that your local machine doesn't have yet.

git merge FETCH_HEAD: Git immediately takes those downloaded changes and attempts to blend them into the branch you are currently standing on.

2. **The Three Possible Outcomes**
   Depending on what you've been working on and what changed in main, one of three things will happen during the merge phase:

Fast-Forward Merge (The easy way): If you created your branch, but haven't actually made any new commits to it yet, Git will simply "fast-forward" your branch's pointer to match the latest commit on main. No messy history, just an updated branch.

**Auto-Merge (The normal way)**: If you have made commits on your branch, and other people have made commits to main, Git will blend the two histories together. It will automatically generate a new "Merge Commit" on your feature branch. Your branch now contains all your work plus all the new work from main.

**Merge Conflict (The manual way)**: If you edited a specific line of code on your branch, and someone else edited that exact same line on main, Git won't know whose changes to keep. The pull will pause, and Git will flag the files in conflict. You will have to manually open those files, pick which code to keep, and then commit the resolved files to finish the merge.

**Why do this?**
Pulling main into your feature branch periodically is a great habit. It keeps your branch up-to-date with the rest of your team's work. If you wait weeks to do this, you risk facing a massive, painful merge conflict when it's finally time to submit your feature.

**Pro-Tip**: If you want a cleaner project history without the extra "Merge Commit" cluttering your log, you can use `git pull --rebase origin main`. This neatly rewrites your history by placing your new feature commits directly on top of the latest main commits, keeping everything in a straight, readable line.

### **What you changed/improved/rejected fom the AI's output**

I didn't change anything as this is mostly a refresher, I followed it's given output.

### **Reason (Why?)**

- Refresher for GitHub commands

### **What you learned or the decision you made as a result**

- I refreshed my knowledge on how to properly apply git pulling and fetching, their differences and similarities.

## Entry 3 - (06/04/2026)

### **Task(s)**

- Task Issuing/Delegation

### **Prompt (or Summary) provided to the AI**

### Test Cases

- Valid registration using institutional email
- Invalid registration using a non-institutional email
- Blocked user attempts to log in to the platform
- Successful posting of a "Lost" item with an image
- Attempt to post a "Found" item missing required fields
- Attempt to post an item using only whitespace and special characters
- Uploading an unsupported file format for an item image
- System rejects image uploads that exceed the maximum file size
- User successfully edits their own existing post
- User successfully deletes their own post
- User attempts to edit another user's post
- User submits an edit without making any changes
- Filtering items by exact category
- Searching items using special characters and partial words
- Submitting an excessively long search query
- Navigating between core pages and viewing specific listings
- Standard user attempts to access Admin Dashboard via URL
- Contacting another user regarding a listed item
- Attempting to send an empty message
- Admin moderates and removes an inappropriate post
- Admin searches for a specific student's posting history
- Admin successfully blocks a standard user account
- Admin successfully unblocks a previously blocked user
- Core platform features are accessible on mobile screen resolutions

### Core Features

- Authentication View
- Public Board & Search
- Refined Intake Form Card
- Staff/Admin Dashboard

We're making a Lost and Found Knowledge Board app. I'm the scrum, based on the core features and test cases I've provided you, give me a list of tasks for sprints 1 and 2. Where Sprint 1 handles the most important features, and Sprint 2 is for testing, adding more features, or bug fixing, basically polishing. We have 5 roles: Scrum, UI, Fullstack Dev, Quality Analyst, and Knowledge Management Analyst.

Think of these tasks as Github issues. I want you to be specific. The format is a list.

Example

- Task1, Assignee

### **Output**

Here is the updated list of tasks, keeping your original items and injecting the new ones based strictly on the visual elements in the wireframes.

### **Sprint 1: Core Functionalities**

- Implement User Authentication UI (Login and Registration Views) - UI
- Implement "Forgot Password" recovery flow - Fullstack Dev
- Integrate Supabase Auth and configure Institutional Email restrictions - Fullstack Dev
- Develop Top Navigation Bar with conditional "Admin" tab visibility - UI
- Develop Refined Intake Form Card including Drag-and-Drop file upload UI - UI
- Add "Primary Object Color" picker and "Hidden Note" fields to Intake Form and Database Schema - Fullstack Dev
- Implement 'Posts' database CRUD operations (Create, Read, Update, Delete) - Fullstack Dev
- Develop Image Upload logic with format (PNG/JPG) and max file size validation - Fullstack Dev
- Build Public Board UI to map and display active Lost/Found listings - UI
- Implement "Load More Archives" pagination on the Public Board - Fullstack Dev
- Implement Sidebar Filters (Categories, Colors, Buildings, Timeline, Storage Bins) and search query logic - Fullstack Dev
- Implement user-to-user messaging/contact interface and backend logic - Fullstack Dev
- Integrate the Knowledge Architecture taxonomy into the Intake Form categories and Search filters - Knowledge Management Analyst
- Write initial API integration tests for Post creation and Authentication - Quality Analyst
- Monitor Sprint 1 velocity and clear developer blockers - Scrum

### **Sprint 2: Admin Features, Testing, & Polish**

- Develop Staff/Admin Dashboard UI components (Tables, Status Tags) - UI
- wImplement Role-Based Access Control (RBAC) to protect Admin Dashboard URL routes - Fullstack Dev
- Build Admin moderation API (Remove inappropriate posts, Block/Unblock standard users) - Fullstack Dev
- Implement Admin search logic to fetch specific student posting histories - Fullstack Dev
- Build Notification System (Bell Icon UI and backend logic) - Fullstack Dev
- Implement 30-day lifecycle flagging for aged items on the Admin Dashboard - Fullstack Dev
- Develop "Mark as Returned" verification modal (Student ID lookup, E-signature checkboxes) - UI
- Add static placeholder pages for Footer Links (Privacy, Terms) - UI
- Audit and fix mobile screen resolution responsiveness across all core pages - UI
- Execute Test Suite: Authentication edge cases (invalid emails, blocked login attempts) - Quality Analyst
- Execute Test Suite: Intake Form edge cases (missing fields, whitespace entries, unsupported file uploads) - Quality Analyst
- Execute Test Suite: Post management (unauthorized cross-user edits, empty edit submissions) - Quality Analyst
- Execute Test Suite: Search/Filter stress tests (special characters, excessively long queries) - Quality Analyst
- Refine search algorithms and KM taxonomy based on initial QA feedback - Knowledge Management Analyst
- Address and patch bugs reported during QA execution - Fullstack Dev
- Conduct Sprint Review, Retrospective, and prep for launch - Scrum

### **What you changed/improved/rejected fom the AI's output**

- I moved task "Implement "Forgot Password" recovery flow - Fullstack Dev" fom Sprint 1 to 2, as that isn't a priority as of right now.

### **Reason (Why?)**

- For Task Delagation and clean project progress.

### **What you learned or the decision you made as a result**

- I learned how to properly delagate

## Entry 4 - (06/04/2026)

### **Task(s)**

### **Prompt (or Summary) provided to the AI**

### **Output**

### **What you changed/improved/rejected fom the AI's output**

### **Reason (Why?)**

### **What you learned or the decision you made as a result**
