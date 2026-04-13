# How to Contribute

This document outlines the required workflows, branching strategies, and AI usage policies every team member must follow during development.

To maintain this project systematically, all pull requests must be compared against `dev`. Doing this leaves a safety net in an instance where a piece of code will render the entire codebase irreparable.

## How to Clone and Run the Project

1. **In your code editor terminal, preferably VSCode, **CLONE** the repository.**

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

The naming convention of branch names should be as follows.

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

## Fetch & Pull

To check whether the branch you're working on is updated, always run these commands before making your changes:

```bash

git fetch origin dev

git pull origin dev

```

## Commit Message Standards

Commit messages must be highly descriptive. You must write what you changed AND the underlying rationale for why you changed it.

- Bad: "fix stuff"

- Good: "Add search filter - improves knowledge retrieval per SECI externalisation phase"

## Document Files

Every document file has a statement or a template that will guide you on what to add to your respective document file. To make your changes in the documents, follow these steps.

> The docs/ branch does not need to be pull-requested. After pushing, just keep it as is; the scrum will handle the merging with `dev` and `main`.

1. **Switch to `docs/` branch**

> To check what branch you're in, always do `git status`

```bash

git checkout docs/

```

This should change your branch. You should only see the `docs/` folder alongside `README.md` and `CONTRIBUTING.md`

2. **Make your changes to your designated file (e.g. QA Analyst with test-cases/)**

3. **Commit and Push to `docs/` branch**

First, you need to add your files. **NEVER** do `git add .` as those files from the other branches for some reason.

```bash

git add <Your file>

# For a single file: git add <file>, e.g. git add file.md

# For multiple files: git add <file1> <file2>, e.g. git add file1.md file2.md

# For a directory: git add <directory/>, e.g. git add docs/

```

Then commit and push. Refer to [Commit Message Standards](#commit-message-standards) for commit messages.

```bash

git commit -m "<commit message>"

git push origin docs/

```

## Prompt-Logs

1. **Inside docs/prompt-logs/, create a `<surname>_prompt-log.md` file if yours doesn't exist.**

2. **Every member must maintain a prompt log.md file. For every instance where you use AI, your log entry must include this:**
   - The date and the specific task you were executing.

   - The exact prompt (or summary) provided to the AI.

   - The output produced by the AI.

   - What you specifically changed, improved, or rejected from the AI's output, and your reasoning (the "WHY").

   - What you learned or the decision you made as a result

## Pull Requests

Once you have made your changes and pushed them into your branch. Make a pull request, and the description should contain the following format:

> Exclude pull requests from docs/ branch.

```md
What Changed: # Describe the changes and which file you changed.

    e.g. Added function to file.tsx

Why: # Reference the deliverable, specific requirement, or issue

    e.g. #15 <- This is the issue number. When you put this in the description, it will automatically refer to the issue number, and it will include the issue title.

How to Test:

    1.

    2.
```

## Code Review Expectations

The Scrum/Dev will review the changes the contributor made.

- The changes will be `APPOVED` once the changes are good and there are no conflicts.

- There will be comments if there are any other issues or problems.
