🚀 Sai's LeetCode

Sai's LeetCode is a personal LeetCode solution management and progress-tracking website. It imports accepted LeetCode submissions from the user's logged-in LeetCode session and organizes solved problems, source code, difficulty, topics, language, and submission information in a personal dashboard.

The project is designed to help developers keep all their LeetCode practice in one place and quickly review previously solved programs.

WEBSITE LINK :https://agent-6a8498db468170341--mypersonalcodingtracker.netlify.app/

✨ Features

📊 Personal LeetCode dashboard

🔐 Works with the user's existing logged-in LeetCode browser session

📥 Import accepted LeetCode submissions

💻 Import submitted source code

📚 Store solved problems in one place

🏷️ Organize problems by topics/categories

🟢 Easy / 🟠 Medium / 🔴 Hard classification

🔎 Search solved problems

🎯 Filter by difficulty

🏷️ Filter by topic

🕒 View recent solves

🔗 Open the original LeetCode problem

👨‍💻 View imported solution code

🔄 Re-import submissions when new problems are solved

📱 Responsive dashboard UI

🌙 Dark-themed developer dashboard

🛠️ Technologies Used

Frontend

HTML5

CSS3

JavaScript

Fetch API

Responsive Web Design

Backend

Node.js

Express.js

REST API

Node.js File System (fs)

Browser Integration

Chrome Extension APIs

LeetCode authenticated browser session

LeetCode API / GraphQL-based submission access

Data & Tools

JSON

npm

Git

GitHub

Visual Studio Code

🏗️ Project Architecture

                    ┌──────────────────────┐
                    │       LeetCode       │
                    │  Logged-in Account   │
                    └──────────┬───────────┘
                               │
                               │ Accepted submissions
                               │ + source code
                               ▼
                    ┌──────────────────────┐
                    │ Chrome Extension     │
                    │ Sai's LeetCode       │
                    │ Importer             │
                    └──────────┬───────────┘
                               │
                               │ HTTP / JSON
                               ▼
                    ┌──────────────────────┐
                    │ Node.js + Express.js │
                    │ Local Backend        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Local Data Storage   │
                    │ JSON / File System   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ HTML + CSS + JS      │
                    │ Sai's LeetCode UI    │
                    └──────────────────────┘

📁 Project Structure

sais-leetcode-full-code-import/
│
├── extension/
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   └── README.md
│
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── data/
│   └── solved.json
│
├── server.js
├── package.json
├── package-lock.json
└── README.md

⚙️ How It Works

1. Login to LeetCode

The user logs into LeetCode normally in Chrome.

The project does not require storing the LeetCode password.

2. Chrome Extension

The Sai's LeetCode Importer extension runs on LeetCode pages and uses the existing authenticated browser session.

It retrieves accessible accepted submissions and their source code.

3. Import

The extension sends the imported information to the local Node.js server.

Example:

Problem:
Two Sum

Difficulty:
Easy

Language:
Java

Status:
Accepted

Source Code:
Your submitted Java program

4. Backend

The Express.js server receives the imported information and stores it locally.

5. Dashboard

The frontend displays the imported problems in:

Dashboard

All Problems

Categories

Recent Solves

🚀 Installation

Prerequisites

Install:

Node.js 18 or newer

npm

Google Chrome

A LeetCode account

Check Node.js:

node -v

Check npm:

npm -v

📥 Setup

Clone the repository:

git clone https://github.com/YOUR_USERNAME/sais-leetcode.git

Move into the project:

cd sais-leetcode

Install dependencies:

npm install

▶️ Start the Website

Run:

npm start

The server will run at:

http://localhost:3000

Open the URL in Chrome.

🧩 Install the Chrome Extension

Open Chrome.

Go to:

chrome://extensions

Enable Developer mode.

Click Load unpacked.

Select:

sais-leetcode/extension

Make sure Sai's LeetCode Importer is enabled.

📥 Import Your LeetCode Solutions

Open LeetCode in Chrome.

Log in to your account.

Open a LeetCode page.

Click the Chrome Extensions icon.

Select Sai's LeetCode Importer.

Click:

Import all accepted submissions

Wait for the import to complete.

Open:

http://localhost:3000

Your imported solutions will appear in the dashboard.

📊 Example Import

For example, if the account has:

187 Accepted submissions

and those submissions represent:

128 unique problems

the dashboard can store:

128 solved problems

along with the imported accepted source code where available.

Multiple submissions for the same problem can exist on LeetCode, while the dashboard can keep one primary/latest accepted solution for the problem.

🔎 Dashboard

The dashboard provides:

Total Solved

Displays the number of unique solved problems.

Difficulty

Problems are categorized as:

Easy
Medium
Hard

Categories

Topics such as:

Array
String
Two Pointers
Sliding Window
Binary Search
Linked List
Stack
Queue
Tree
Graph
Dynamic Programming
Hash Table

can be displayed based on the imported problem metadata.

Search

Search by:

Problem name

Topic

Filters

Filter by:

Difficulty

Topic

Recent Solves

Displays the most recently imported solutions.

🔐 Security

The project is designed so that the user's LeetCode password does not need to be stored.

Never commit or share:

LEETCODE_SESSION

or other authentication cookies/tokens.

Do not place credentials in:

server.js
app.js
GitHub
README.md

If authentication data is ever added to a local configuration file, keep it outside Git and add it to .gitignore.

⚠️ Important Limitations

LeetCode's publicly accessible APIs and authenticated browser endpoints can change over time.

Therefore:

Import availability may depend on the current LeetCode interface/API.

Very large submission histories may take time to import.

Some submissions may not be accessible through the current endpoint.

The extension should be used only with your own LeetCode account.

The project should not attempt to bypass LeetCode authentication or access another user's private data.

🔄 Updating After New Problems

After solving new problems:

Solve problem
      ↓
Submit
      ↓
Accepted ✅
      ↓
Open LeetCode
      ↓
Run Sai's LeetCode Importer
      ↓
Import accepted submissions
      ↓
Dashboard updated

💡 Future Enhancements

Possible future improvements:

Automatic new-submission detection

PostgreSQL / MySQL database

User authentication

Cloud deployment

GitHub integration

Progress charts

Daily/weekly solving streak

Calendar heatmap

Difficulty-wise analytics

Topic-wise analytics

Language-wise analytics

Solution notes

Bookmarks

Favorite problems

Interview preparation mode

Company-wise problem filtering

Export solutions as ZIP

Export solutions as PDF

PWA/mobile support

🎯 Resume Description

You can describe this project on your resume as:

Sai's LeetCode — Personal Coding Progress & Solution Management Platform: Developed a full-stack web application using HTML, CSS, JavaScript, Node.js, Express.js, and Chrome Extension APIs to import and organize accepted LeetCode solutions. Implemented problem search, topic and difficulty filtering, solution-code storage, recent-solve tracking, and a responsive dashboard for managing competitive-programming practice.

🧠 Key Learning Outcomes

Through this project, the following concepts are demonstrated:

Frontend development

DOM manipulation

JavaScript event handling

REST API communication

JSON data handling

Node.js backend development

Express.js routing

Browser extension development

Chrome Extension APIs

Client-server communication

Local file storage

Authentication/session-aware browser integration

Responsive UI development

Git/GitHub project management

📌 Project Information

Project Name: Sai's LeetCode

Developer: Sai Kiran

LeetCode Username: kiran_sai45

Frontend: HTML5, CSS3, JavaScript

Backend: Node.js, Express.js

Browser Integration: Chrome Extension

Data Format: JSON

Development Tool: Visual Studio Code

🔗 Links

LeetCode Profile:

https://leetcode.com/u/kiran_sai45/

GitHub Repository:

https://github.com/YOUR_USERNAME/sais-leetcode

Replace YOUR_USERNAME with your GitHub username before publishing.

📄 License

This project is intended for personal educational and portfolio use.

Make sure your use of LeetCode data and browser automation complies with LeetCode's current Terms of Service and applicable policies.
