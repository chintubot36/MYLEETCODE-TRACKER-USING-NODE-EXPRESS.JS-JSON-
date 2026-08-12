# Sai's LeetCode Importer

This Chrome extension imports your authenticated LeetCode submissions into the local Sai's LeetCode website.

## What it imports

- Every accessible submission in your authenticated LeetCode account
- Accepted submissions
- Latest accepted code per problem/language
- Problem title and slug
- Difficulty
- Topics
- Programming language
- Submission timestamp

## Security model

- You do NOT type your LeetCode password into the extension.
- The extension uses the existing login session in your browser while you are on `leetcode.com`.
- The extension sends imported data only to `http://localhost:3000`.
- No LeetCode session cookie is saved to disk by the project.

## Install

1. Start Sai's LeetCode with `npm start`.
2. In Chrome open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this `extension` folder.
6. Open `https://leetcode.com/` and make sure you are logged in as `kiran_sai45`.
7. Refresh the LeetCode tab after installing the extension.
8. Click the extension icon.
9. Click **Import all accepted submissions**.
10. Wait for the import to finish. Large histories can take several minutes because each submission's code is retrieved separately.

The extension uses LeetCode's authenticated GraphQL `submissionList` and `submissionDetails` operations. The `leetcode-query` project documents authenticated access to all submissions and submission details, including code. 
