# How to Contribute

This document outlines the required workflows, branching strategies, and AI usage policies every team member must follow during development.

To maintain this project systematically, all pull requests must be compared against `dev`. Doing this leaves a safety net in an instance where a piece of code will render the entire codebase irreparable.

## How to Clone and Run the Project

1. **In your code editor terminal, preferably VSCode, **CLONE** the `dev` branch. Don't, in any circumstance, clone `main`.**

```bash
git clone dev https://github.com/solanov/navibyte-lostnfoundkb.git
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

> Press Ctrl + C to stop the development server

```bash
npm run dev
```

## Making your own branch

The naming convention of branch names should be as follows

- All lower case
- Start with your last name
- Spaces should be indicated by a dash
- After your last name, it should indicate your role. Keep the role name short (e.g. Full Stack Developer => fullstack, Knowledge Management Analyst => km, UI/UX Designer => ui, QA & Document => qa)

Example: (solano-scrum)

1. **To create your own branch, type this command in your code editor terminal**

```bash
git checkout -b <branch name>

git push origin <branch name>
```

## Creation and usage of your prompt-log file

1. **On the root of the folder, create a `prompt-log.md` file.**

> Only create the file when you've cloned `dev` branch and created your own branch.

This file serves the purpose of logging every prompt you made for this project. As this file is in `.gitignore`, we will add this in the **FINAL** sprint.

```bash
git add -f prompt-log.md

git commit -m <commit message>

git push origin <your branch>
```

2. **Every member must maintain a prompt-log.md file in their feature branch. For every instance where you use AI, your log entry must include:**

- The date and the specific task you were executing.
- The exact prompt (or summary) provided to the AI.
- The output produced by the AI.
- What you specifically changed, improved, or rejected from the AI's output, and your reasoning (the "WHY").
- What you learned or the decision you made as a result

## Fetch & Pull

To check whether the branch your working on is updated, always run these commands:

```bash
git fetch origin dev
git pull origin dev
```

## Commit Message Standards

Commit messages must be highly descriptive. You must write what you changed AND the underlying rationale for why you changed it.

- Bad: "fix stuff"
- Good: "Add search filter - improves knowledge retrieval per SECI externalization phase"

## Pull Request (PR) Process and Code Review

- **Target Branch:** All PRs must target the dev branch.
- **Frequency:** Each team member must open at least one PR per development sprint.
- **Review Requirement:** Every PR must be reviewed by at least one other team member before it can be merged.
- **Scrum Approval:** The Scrum Master must review and approve all Pull Requests before they are officially merged into the dev branch. The scrum ensures the PR has a clear description and has met the peer-review requirement.
