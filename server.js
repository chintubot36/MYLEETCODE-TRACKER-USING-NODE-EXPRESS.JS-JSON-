const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const USERNAME = process.env.LEETCODE_USERNAME || "kiran_sai45";
const API_BASE = process.env.LEETCODE_API || "https://alfa-leetcode-api.onrender.com";

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "solved.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

function loadSolved() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveSolved(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}

async function api(pathname) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    headers: { "Accept": "application/json", "User-Agent": "Sais-LeetCode/1.0" }
  });
  if (!response.ok) throw new Error(`LeetCode API returned ${response.status}`);
  return response.json();
}

function normalizeSubmission(s) {
  return {
    id: String(s.id ?? s.timestamp ?? `${s.titleSlug}-${s.lang}`),
    title: s.title || s.questionTitle || "Unknown Problem",
    titleSlug: s.titleSlug || s.slug || "",
    status: s.statusDisplay || s.status || "Accepted",
    lang: s.lang || s.language || "Unknown",
    timestamp: Number(s.timestamp || s.submitTime || Math.floor(Date.now() / 1000)),
    code: "",
    tags: [],
    difficulty: s.difficulty || "Unknown",
    source: "LeetCode"
  };
}

async function enrich(item) {
  if (!item.titleSlug) return item;
  try {
    const p = await api(`/select?titleSlug=${encodeURIComponent(item.titleSlug)}`);
    const problem = p.problem || p;
    const tags = problem.topicTags || problem.tags || [];
    item.tags = tags.map(t => typeof t === "string" ? t : t.name).filter(Boolean);
    item.difficulty = problem.difficulty || item.difficulty;
  } catch {}
  return item;
}

async function leetcodeGraphQL(query, variables) {
  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0"
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) throw new Error(`LeetCode GraphQL returned ${response.status}`);
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors[0].message || "LeetCode GraphQL error");
  return json.data;
}

async function getRecentAcceptedFromLeetCode() {
  const query = `
    query recentAccepted($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
  `;
  const data = await leetcodeGraphQL(query, { username: USERNAME, limit: 100 });
  return data.recentAcSubmissionList || [];
}

async function getProblemDetails(titleSlug) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags { name slug }
      }
    }
  `;
  const data = await leetcodeGraphQL(query, { titleSlug });
  return data.question || null;
}

function extractSolvedItems(payload) {
  // Different public wrappers use different property names. Normalize them
  // into a single array of problem-like objects.
  const candidates = [
    payload,
    payload?.solvedProblems,
    payload?.solved,
    payload?.questions,
    payload?.problems,
    payload?.data,
    payload?.data?.solvedProblems,
    payload?.data?.solved,
    payload?.data?.questions,
    payload?.data?.problems
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const items = candidate.filter(x => x && typeof x === "object");
    if (items.some(x => x.titleSlug || x.slug || x.title || x.questionTitle)) {
      return items;
    }
  }
  return [];
}

function normalizeSolvedProblem(s) {
  const tags = s.topicTags || s.tags || s.topics || [];
  return {
    id: String(s.id ?? s.questionId ?? s.questionFrontendId ?? s.titleSlug ?? s.slug ?? Math.random()),
    questionId: s.questionFrontendId ?? s.questionId ?? s.id ?? "",
    title: s.title || s.questionTitle || s.name || "Unknown Problem",
    titleSlug: s.titleSlug || s.slug || s.questionSlug || "",
    status: "Accepted",
    lang: s.lang || s.language || s.lastLanguage || "—",
    timestamp: Number(s.timestamp || s.submitTime || s.solvedAt || 0),
    code: s.code || "",
    tags: tags.map(t => typeof t === "string" ? t : (t.name || t.slug)).filter(Boolean),
    difficulty: s.difficulty || s.level || "Unknown",
    source: "All solved problems"
  };
}

async function getAllSolvedFromDedicatedApi() {
  // This endpoint is designed specifically to return a user's solved
  // problems, rather than only the last N submissions.
  const response = await fetch(
    `https://leetcode-api-pied.vercel.app/user/${encodeURIComponent(USERNAME)}/solved`,
    {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Sais-LeetCode/1.0"
      }
    }
  );
  if (!response.ok) throw new Error(`Solved-list API returned ${response.status}`);
  const payload = await response.json();
  const items = extractSolvedItems(payload);
  if (!items.length) {
    throw new Error("Solved-list API returned no problem list.");
  }
  return items.map(normalizeSolvedProblem).filter(x => x.titleSlug);
}

async function getAllSolvedFromLeetCodeGraphQL() {
  // LeetCode exposes the total solved count publicly. This is kept as a
  // validation/fallback path; the dedicated solved-list API is preferred for
  // obtaining the actual complete list.
  const query = `
    query userSolvedStats($username: String!) {
      matchedUser(username: $username) {
        username
        submitStatsGlobal {
          acSubmissionNum { difficulty count }
        }
      }
    }
  `;
  const data = await leetcodeGraphQL(query, { username: USERNAME });
  const rows = data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];
  const total = rows
    .filter(x => x.difficulty === "All")
    .reduce((sum, x) => sum + Number(x.count || 0), 0);

  if (!total) throw new Error("LeetCode did not return a solved count.");
  throw new Error(`LeetCode public GraphQL returned the solved count (${total}) but not the complete solved-problem list.`);
}

async function syncLeetCode() {
  const current = loadSolved();
  const bySlug = new Map(current.filter(x => x.titleSlug).map(x => [x.titleSlug, x]));
  let solvedList = [];
  let source = "Complete solved list";

  try {
    solvedList = await getAllSolvedFromDedicatedApi();
  } catch (allSolvedError) {
    // Fall back to recent accepted submissions so the site still keeps
    // updating when the complete-list service is temporarily unavailable.
    source = "Recent accepted submissions (fallback)";
    let submissions = [];
    try {
      submissions = await getRecentAcceptedFromLeetCode();
    } catch (primaryError) {
      try {
        const result = await api(`/${encodeURIComponent(USERNAME)}/acSubmission?limit=100`);
        submissions = Array.isArray(result)
          ? result
          : (result.submission || result.submissions || result.data || []);
      } catch (fallbackError) {
        throw new Error(
          `Could not read your complete solved list. ${allSolvedError.message}. ` +
          `Recent submissions also failed: ${fallbackError.message}`
        );
      }
    }
    solvedList = submissions.map(normalizeSolvedProblem).filter(x => x.titleSlug);
  }

  let newProblems = 0;

  for (const item of solvedList) {
    const existing = bySlug.get(item.titleSlug);

    if (existing) {
      // Keep locally saved code and any existing metadata.
      existing.title = item.title || existing.title;
      existing.questionId = item.questionId || existing.questionId;
      existing.difficulty = item.difficulty || existing.difficulty;
      existing.lang = item.lang && item.lang !== "—" ? item.lang : existing.lang;
      existing.timestamp = Math.max(existing.timestamp || 0, item.timestamp || 0);
      existing.status = "Accepted";
      existing.source = source;
      if ((!existing.tags || existing.tags.length === 0) && item.tags.length) {
        existing.tags = item.tags;
      }
    } else {
      bySlug.set(item.titleSlug, item);
      newProblems++;
    }
  }

  // Enrich every problem with difficulty/topics if the solved-list endpoint
  // doesn't include them. This is intentionally rate-limited by doing it only
  // when metadata is missing.
  for (const item of bySlug.values()) {
    if (!item.titleSlug) continue;
    if (!item.difficulty || item.difficulty === "Unknown" ||
        !Array.isArray(item.tags) || item.tags.length === 0) {
      try {
        const problem = await getProblemDetails(item.titleSlug);
        if (problem) {
          item.title = problem.title || item.title;
          item.questionId = problem.questionFrontendId || item.questionId;
          item.difficulty = problem.difficulty || item.difficulty;
          item.tags = (problem.topicTags || []).map(t => t.name).filter(Boolean);
        }
      } catch {}
    }
  }

  const merged = [...bySlug.values()]
    .sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

  saveSolved(merged);
  return {
    solved: merged,
    newProblems,
    source,
    complete: source === "Complete solved list"
  };
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (req, res) => {
  res.json({ username: USERNAME });
});


app.post("/api/import", (req, res) => {
  try {
    const incoming = Array.isArray(req.body?.submissions) ? req.body.submissions : [];
    const existing = loadSolved();
    const bySlug = new Map(existing.filter(x => x.titleSlug).map(x => [x.titleSlug, x]));

    let importedProblems = 0;
    let importedSubmissions = 0;

    for (const raw of incoming) {
      if (!raw || !raw.titleSlug || raw.statusDisplay !== "Accepted") continue;

      const item = {
        id: String(raw.id ?? raw.titleSlug),
        title: raw.title || raw.titleSlug,
        titleSlug: raw.titleSlug,
        difficulty: raw.difficulty || "Unknown",
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        lang: raw.lang || "Unknown",
        timestamp: Number(raw.timestamp || 0),
        code: typeof raw.code === "string" ? raw.code : "",
        status: "Accepted",
        source: "Authenticated LeetCode import",
        submissionHistory: Array.isArray(raw.submissionHistory) ? raw.submissionHistory : []
      };

      const existingItem = bySlug.get(item.titleSlug);

      if (!existingItem) {
        bySlug.set(item.titleSlug, item);
        importedProblems++;
      } else {
        // Keep the newest imported accepted code for the problem.
        if ((item.timestamp || 0) >= (existingItem.timestamp || 0)) {
          existingItem.id = item.id;
          existingItem.lang = item.lang;
          existingItem.timestamp = item.timestamp;
          existingItem.code = item.code || existingItem.code;
        }
        if (item.difficulty !== "Unknown") existingItem.difficulty = item.difficulty;
        if (item.tags.length) existingItem.tags = item.tags;
        existingItem.status = "Accepted";
        existingItem.source = "Authenticated LeetCode import";

        const histories = [
          ...(existingItem.submissionHistory || []),
          ...(item.submissionHistory || [])
        ];
        const unique = new Map(histories.map(h => [String(h.id), h]));
        existingItem.submissionHistory = [...unique.values()]
          .sort((a,b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
          .slice(0, 50);
      }
      importedSubmissions++;
    }

    const merged = [...bySlug.values()]
      .sort((a,b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

    saveSolved(merged);
    res.json({
      ok: true,
      importedProblems,
      importedSubmissions,
      totalProblems: merged.length
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/solved", (req, res) => {
  res.json(loadSolved());
});

app.post("/api/sync", async (req, res) => {
  try {
    const result = await syncLeetCode();
    res.json({ ok: true, count: result.solved.length, newProblems: result.newProblems, source: result.source, solved: result.solved });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

app.post("/api/solution", (req, res) => {
  const { titleSlug, code } = req.body || {};
  if (!titleSlug || typeof code !== "string") {
    return res.status(400).json({ error: "titleSlug and code are required" });
  }

  const solved = loadSolved();
  const item = solved.find(x => x.titleSlug === titleSlug);
  if (!item) return res.status(404).json({ error: "Problem not found" });

  item.code = code;
  saveSolved(solved);
  res.json({ ok: true, item });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, async () => {
  console.log(`Sai's LeetCode running at http://localhost:${PORT}`);
  console.log(`Tracking LeetCode username: ${USERNAME}`);
  try {
    const result = await syncLeetCode();
    console.log(`Initial LeetCode sync complete: ${result.solved.length} problems (${result.source})${result.complete ? "." : " [fallback mode]."}`);
  } catch (e) {
    console.log("Initial sync skipped:", e.message);
  }
});

// Poll every 20 seconds for newly accepted submissions.
setInterval(() => syncLeetCode().catch(error => {
  console.log("Background sync:", error.message);
}), 20_000);
