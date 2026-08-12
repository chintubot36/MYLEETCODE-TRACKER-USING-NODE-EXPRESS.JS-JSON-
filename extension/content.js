
const LC_GRAPHQL = "https://leetcode.com/graphql";
const LOCAL_API = "http://localhost:3000/api/import";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function gql(query, variables = {}, operationName = undefined) {
  const res = await fetch(LC_GRAPHQL, {
    method: "POST",
    credentials: "include",
    headers: {"content-type":"application/json"},
    body: JSON.stringify({query, variables, operationName})
  });
  if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map(x=>x.message).join("; "));
  return json.data;
}

const SUBMISSIONS_QUERY = `
query ($offset: Int!, $limit: Int!, $slug: String) {
  submissionList(offset: $offset, limit: $limit, questionSlug: $slug) {
    hasNext
    submissions {
      id
      lang
      timestamp
      statusDisplay
      runtime
      memory
      title
      titleSlug
    }
  }
}`;

const DETAILS_QUERY = `
query submissionDetails($id: Int!) {
  submissionDetails(submissionId: $id) {
    id
    code
    timestamp
    statusCode
    lang { name verboseName }
    question {
      questionId
      titleSlug
      title
      difficulty
    }
    topicTags { tagId slug name }
  }
}`;

async function getAllSubmissions() {
  const all = [];
  let offset = 0;
  const limit = 20;

  while (true) {
    const data = await gql(SUBMISSIONS_QUERY, {offset, limit, slug:null});
    const page = data?.submissionList;
    if (!page) throw new Error("LeetCode returned no submission list.");

    const rows = page.submissions || [];
    all.push(...rows);

    if (!page.hasNext || rows.length === 0) break;
    offset += rows.length;
    await sleep(350);
  }
  return all;
}

async function getDetail(id) {
  const data = await gql(DETAILS_QUERY, {id:Number(id)}, "submissionDetails");
  return data?.submissionDetails;
}

async function importAll() {
  if (!location.hostname.endsWith("leetcode.com")) {
    throw new Error("This importer must run on leetcode.com.");
  }

  // Verify login first.
  try {
    const who = await gql(`query { userStatus { isSignedIn username } }`);
    if (!who?.userStatus?.isSignedIn) {
      throw new Error("You are not logged in to LeetCode.");
    }
  } catch (e) {
    throw new Error("Please log in to LeetCode first. " + e.message);
  }

  const submissions = await getAllSubmissions();
  const accepted = submissions.filter(s => s.statusDisplay === "Accepted");

  // Keep the newest accepted submission for each problem+language.
  const latest = new Map();
  for (const s of accepted) {
    const key = `${s.titleSlug}|${s.lang}`;
    const old = latest.get(key);
    if (!old || Number(s.timestamp) > Number(old.timestamp)) latest.set(key, s);
  }

  const rows = [...latest.values()];
  const imported = [];

  for (let i = 0; i < rows.length; i++) {
    const s = rows[i];
    try {
      const d = await getDetail(s.id);
      if (d?.code && d?.question?.titleSlug) {
        imported.push({
          id: String(d.id),
          title: d.question.title || s.title,
          titleSlug: d.question.titleSlug,
          difficulty: d.question.difficulty || "Unknown",
          tags: (d.topicTags || []).map(t=>t.name).filter(Boolean),
          lang: d.lang?.name || s.lang || "Unknown",
          timestamp: Number(d.timestamp || s.timestamp || 0),
          code: d.code,
          statusDisplay: "Accepted",
          submissionHistory: [{
            id: String(d.id),
            timestamp: Number(d.timestamp || s.timestamp || 0),
            lang: d.lang?.name || s.lang || "Unknown"
          }]
        });
      }
    } catch (e) {
      console.warn("Could not import submission", s.id, e);
    }

    // Avoid hammering LeetCode.
    await sleep(300);
  }

  const res = await fetch(LOCAL_API, {
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({submissions:imported})
  });
  if (!res.ok) throw new Error(`Sai's LeetCode server returned HTTP ${res.status}`);
  const result = await res.json();
  if (!result.ok) throw new Error(result.error || "Local import failed.");

  return {
    ok:true,
    message:
      `Import complete!\n\n` +
      `Accepted submissions found: ${accepted.length}\n` +
      `Programs imported: ${imported.length}\n` +
      `Problems now in Sai's LeetCode: ${result.totalProblems}`
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SAI_IMPORT_ALL") return;

  importAll()
    .then(sendResponse)
    .catch(e => sendResponse({ok:false,error:e.message}));

  return true;
});
