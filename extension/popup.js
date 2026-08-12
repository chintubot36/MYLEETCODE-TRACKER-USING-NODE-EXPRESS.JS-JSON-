const status = document.getElementById("status");
const btn = document.getElementById("import");

function show(text, cls=""){ status.className=cls; status.textContent=text; }

btn.addEventListener("click", async () => {
  btn.disabled = true;
  show("Connecting to the LeetCode tab...");

  try {
    const tabs = await chrome.tabs.query({active:true,currentWindow:true});
    const tab = tabs[0];
    if (!tab?.url?.startsWith("https://leetcode.com/")) {
      throw new Error("Open leetcode.com in the current tab first.");
    }

    const response = await chrome.tabs.sendMessage(tab.id, {type:"SAI_IMPORT_ALL"});
    if (!response?.ok) throw new Error(response?.error || "Import failed.");

    show(response.message, "ok");
  } catch (e) {
    show(
      "Could not start import.\n\n" + e.message +
      "\n\nIf you just installed the extension, refresh the LeetCode tab and try again.",
      "err"
    );
  } finally {
    btn.disabled = false;
  }
});
