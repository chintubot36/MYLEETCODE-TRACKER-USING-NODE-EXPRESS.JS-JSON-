let solved = [];
let currentSlug = null;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const date = ts => ts ? new Date(ts * 1000).toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"}) : "—";

function difficultyClass(d){
  return d === "Easy" ? "easy-pill" : d === "Medium" ? "medium-pill" : "hard-pill";
}

function renderProblem(p, i){
  const tags = (p.tags || []).slice(0,3).map(t => `<span class="pill">${esc(t)}</span>`).join("");
  return `<div class="problem">
    <div class="number">#${i + 1}</div>
    <div>
      <div class="problem-title">
        <a href="https://leetcode.com/problems/${encodeURIComponent(p.titleSlug)}/" target="_blank" rel="noreferrer">${esc(p.title)}</a>
      </div>
      <div class="meta">
        <span class="pill ${difficultyClass(p.difficulty)}">${esc(p.difficulty || "Unknown")}</span>
        <span class="pill">${esc(p.lang || "Unknown")}</span>
        <span class="pill">${date(p.timestamp)}</span>${tags}
      </div>
    </div>
    <button class="code-btn" onclick="openCode('${esc(p.titleSlug)}')">${p.code ? "View code" : "Add code"}</button>
  </div>`;
}

function renderAll(list = solved){
  $("#problemCount").textContent = `${list.length} problem${list.length === 1 ? "" : "s"}`;
  $("#allProblems").innerHTML = list.length ? list.map(renderProblem).join("") : empty();
}

function empty(){ return `<div style="padding:30px;color:#8e98a8;text-align:center">No solved problems found yet. Click “Sync now”.</div>`; }

function updateStats(){
  const counts = {Easy:0,Medium:0,Hard:0};
  solved.forEach(p => { if(counts[p.difficulty] !== undefined) counts[p.difficulty]++; });
  $("#totalSolved").textContent = solved.length;
  $("#easy").textContent = counts.Easy; $("#medium").textContent = counts.Medium; $("#hard").textContent = counts.Hard;
  const total = solved.length || 1;
  [["Easy", "easy"],["Medium","medium"],["Hard","hard"]].forEach(([d,id])=>{
    const pct = Math.round(counts[d]/total*100);
    $(`#${id}Pct`).textContent = `${pct}%`; $(`#${id}Bar`).style.width = `${pct}%`;
  });

  const topicMap = {};
  solved.forEach(p => (p.tags || []).forEach(t => topicMap[t] = (topicMap[t] || 0) + 1));
  const top = Object.entries(topicMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
  $("#topTopics").innerHTML = top.length ? top.map(([t,n])=>`<span class="topic">${esc(t)} <b>${n}</b></span>`).join("") : `<span class="topic">Syncing topics...</span>`;

  const topics = [...new Set(solved.flatMap(p => p.tags || []))].sort();
  $("#topicFilter").innerHTML = `<option value="all">All topics</option>` + topics.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join("");

  const categories = {};
  solved.forEach(p => (p.tags || []).forEach(t => categories[t] = (categories[t] || 0) + 1));
  $("#categoryGrid").innerHTML = Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([t,n]) =>
    `<div class="category-card" onclick="filterTopic('${esc(t)}')"><h3>${esc(t)}</h3><p>Problems solved</p><b>${n}</b></div>`
  ).join("") || `<div class="category-card"><h3>Categories will appear here</h3><p>Sync your profile to load topics.</p></div>`;
}

function renderLatest(){
  const latest = solved.slice(0,8);
  $("#latest").innerHTML = latest.length ? latest.map(renderProblem).join("") : empty();
  $("#recentProblems").innerHTML = solved.length ? solved.map(renderProblem).join("") : empty();
}

function applyFilters(){
  const q = $("#search").value.toLowerCase().trim();
  const d = $("#difficultyFilter").value;
  const t = $("#topicFilter").value;
  const list = solved.filter(p =>
    (!q || p.title.toLowerCase().includes(q) || (p.tags||[]).some(x=>x.toLowerCase().includes(q))) &&
    (d === "all" || p.difficulty === d) &&
    (t === "all" || (p.tags||[]).includes(t))
  );
  renderAll(list);
}

function filterTopic(topic){
  showSection("problems");
  $("#topicFilter").value = topic;
  applyFilters();
}

function showSection(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active", s.id === id));
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active", n.dataset.section === id));
  $("#pageTitle").textContent = ({dashboard:"Dashboard",problems:"All Problems",categories:"Categories",recent:"Recent Solves"})[id] || "Dashboard";
}

async function load(){
  try{
    const [configRes, solvedRes] = await Promise.all([fetch("/api/config"), fetch("/api/solved")]);
    const config = await configRes.json(); solved = await solvedRes.json();
    $("#username").textContent = config.username;
    updateStats(); renderLatest(); renderAll();
  }catch(e){ toast("Could not load local data."); }
}

async function sync(){
  const btn = $("#syncBtn"); btn.textContent = "⟳ Syncing...";
  try{
    const r = await fetch("/api/sync",{method:"POST"});
    const data = await r.json();
    if(!data.ok) throw new Error(data.error);
    solved = data.solved;
    updateStats(); renderLatest(); renderAll();
    $("#lastSync").textContent = "Synced just now";
    if (data.newProblems > 0) {
      toast(`✅ ${data.newProblems} new problem${data.newProblems > 1 ? "s" : ""} added`);
    } else {
      toast(`✓ Already up to date (${solved.length} solved)`);
    }
  }catch(e){ toast("Sync failed. Check your internet/API."); }
  finally{ btn.textContent = "⟳ Sync now"; }
}

function openCode(slug){
  const p = solved.find(x=>x.titleSlug===slug); if(!p) return;
  currentSlug = slug;
  $("#modalTitle").textContent = p.title;
  $("#modalMeta").textContent = `${p.difficulty} · ${p.lang} · ${date(p.timestamp)}`;
  $("#codeBox").value = p.code || "";
  $("#leetcodeLink").href = `https://leetcode.com/problems/${encodeURIComponent(slug)}/`;
  $("#modal").classList.remove("hidden");
}

async function saveCode(){
  const code = $("#codeBox").value;
  const r = await fetch("/api/solution",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({titleSlug:currentSlug,code})});
  if(!r.ok){ toast("Could not save code."); return; }
  const data = await r.json();
  const i = solved.findIndex(x=>x.titleSlug===currentSlug); solved[i]=data.item;
  renderLatest(); renderAll(); $("#modal").classList.add("hidden"); toast("Solution saved.");
}

function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2400); }

document.querySelectorAll(".nav").forEach(n=>n.addEventListener("click",()=>showSection(n.dataset.section)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.go)));
$("#syncBtn").addEventListener("click",sync);
$("#search").addEventListener("input",applyFilters);
$("#difficultyFilter").addEventListener("change",applyFilters);
$("#topicFilter").addEventListener("change",applyFilters);
$("#closeModal").addEventListener("click",()=>$("#modal").classList.add("hidden"));
$("#saveCode").addEventListener("click",saveCode);
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal") $("#modal").classList.add("hidden")});
load();

$("#importHelpBtn").addEventListener("click",()=>$("#importHelp").classList.remove("hidden"));
$("#closeImportHelp").addEventListener("click",()=>$("#importHelp").classList.add("hidden"));
$("#importHelp").addEventListener("click",e=>{if(e.target.id==="importHelp") $("#importHelp").classList.add("hidden")});
