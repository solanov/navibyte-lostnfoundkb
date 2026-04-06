# Prompt Log: Scrum Master - Solano, Vinz Eulo A.

## Entry 1 - (26/03/2026)

### **Task(s)**

- Project Scaffolding (prompt-logs.md merging and logging)

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
