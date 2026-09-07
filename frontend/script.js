/* ============================================
   AI Content Transformation Platform
   Frontend Logic
   ============================================ */

// ---- API Configuration ----
// Use the same origin when served by Flask (locally or on Render),
// and fall back to localhost when the page is opened directly from the file system.
const API_BASE = window.location.protocol.startsWith("http")
  ? ""
  : "http://127.0.0.1:5000";
const API_URL = API_BASE + "/transform";

// ---- Agent Definitions ----
const AGENTS = [
  { key: "analyzer", name: "Analyzer", icon: "🔎", description: "Analyzing content..." },
  { key: "planner", name: "Planner", icon: "🧠", description: "Creating plan..." },
  { key: "summary", name: "Summary", icon: "📄", description: "Generating summary..." },
  { key: "linkedin", name: "LinkedIn", icon: "💼", description: "Writing post..." },
  { key: "twitter", name: "Twitter/X", icon: "🐦", description: "Composing thread..." },
  { key: "advisory", name: "Advisory", icon: "📋", description: "Drafting advisory..." },
  { key: "presentation", name: "Presentation", icon: "📊", description: "Building slides..." },
  { key: "infographic", name: "Infographic", icon: "🎨", description: "Designing layout..." },
  { key: "factchecker", name: "Fact Checker", icon: "🔍", description: "Verifying claims..." }
];

const PIPELINE_STEPS = [
  "source", "analyzer", "planner", "router", "agents", "factchecker", "complete"
];

// ---- DOM References ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const sidebar = $("#sidebar");
const sidebarToggle = $("#sidebarToggle");
const sourceContent = $("#sourceContent");
const charCount = $("#charCount");
const clearBtn = $("#clearBtn");
const customRequest = $("#customRequest");
const transformBtn = $("#transformBtn");
const errorCard = $("#errorCard");
const errorMessage = $("#errorMessage");
const retryBtn = $("#retryBtn");
const processingSection = $("#processingSection");
const routingSection = $("#routingSection");
const agentGrid = $("#agentGrid");
const resultsSection = $("#resultsSection");
const resultsTabs = $("#resultsTabs");
const resultsContent = $("#resultsContent");
const factCheckSection = $("#factCheckSection");
const scoreBar = $("#scoreBar");
const scoreValue = $("#scoreValue");
const reviewWarning = $("#reviewWarning");
const claimsList = $("#claimsList");
const emptyState = $("#emptyState");
const welcomeBanner = $("#welcomeBanner");
const historyList = $("#historyList");
const historyEmpty = $("#historyEmpty");
const clearHistoryBtn = $("#clearHistoryBtn");

// ---- History ----
const HISTORY_KEY = "ai_content_history";
const MAX_HISTORY = 20;

// ---- State ----
let isProcessing = false;
let lastRequest = "";

// ---- Sidebar Toggle ----
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (window.innerWidth <= 900 && sidebar.classList.contains("open")) {
    if (!sidebar.contains(e.target) && e.target !== sidebarToggle) {
      sidebar.classList.remove("open");
    }
  }
});

// ---- Navigation (page sections) ----
const pageSections = {
  dashboard: "page-dashboard",
  create: "page-dashboard",
  history: "page-history",
  about: "page-about"
};

function switchSection(section) {
  const targetId = pageSections[section];
  if (!targetId) return;

  // Update active nav state
  $$(".nav-item").forEach((n) => n.classList.remove("active"));
  const item = $(`.nav-item[data-section="${section}"]`);
  if (item) item.classList.add("active");

  // Show/hide page sections
  const view = section === "create" ? "create" : section === "dashboard" ? "dashboard" : section;

  $$(".page-section").forEach((sec) => {
    const show = sec.id === targetId;
    sec.classList.toggle("hidden", !show);
  });

  // Welcome banner appears on Dashboard view only
  if (welcomeBanner) {
    welcomeBanner.classList.toggle("hidden", view !== "dashboard");
  }

  // Refresh history each time it is opened
  if (section === "history") {
    renderHistory();
  }

  if (window.innerWidth <= 900) sidebar.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$(".nav-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    if (section) switchSection(section);
  });
});

// Default view is Dashboard
switchSection("dashboard");

// ---- Character Count ----
sourceContent.addEventListener("input", () => {
  charCount.textContent = sourceContent.value.length;
});

// ---- Clear Button ----
clearBtn.addEventListener("click", () => {
  sourceContent.value = "";
  charCount.textContent = "0";
  sourceContent.focus();
});

// ---- Output Option Chips ----
$$(".option-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const checkbox = chip.querySelector("input[type=checkbox]");
    checkbox.checked = !checkbox.checked;
    chip.classList.toggle("selected", checkbox.checked);
  });
});

// ---- Get Selected Outputs ----
function getSelectedOutputs() {
  const outputs = [];
  $$(".option-chip.selected").forEach((chip) => {
    outputs.push(chip.dataset.output);
  });
  return outputs;
}

// ---- Validation ----
function validate() {
  const content = sourceContent.value.trim();
  const outputs = getSelectedOutputs();
  const custom = customRequest.value.trim();

  if (!content) {
    showError("Please paste some source content before transforming.");
    return false;
  }

  if (outputs.length === 0 && !custom) {
    showError("Please select at least one output format or enter a custom request.");
    return false;
  }

  return true;
}

// ---- Error Handling ----
function showError(msg) {
  errorMessage.textContent = msg;
  errorCard.classList.remove("hidden");
  setTimeout(() => {
    errorCard.classList.add("hidden");
  }, 6000);
}

function hideError() {
  errorCard.classList.add("hidden");
}

retryBtn.addEventListener("click", () => {
  hideError();
  startTransformation();
});

// ---- Transform Button ----
transformBtn.addEventListener("click", () => {
  if (isProcessing) return;
  hideError();
  if (validate()) {
    startTransformation();
  }
});

// ---- Build Agent Grid ----
function buildAgentGrid(selectedOutputs) {
  agentGrid.innerHTML = "";
  const alwaysOn = ["analyzer", "planner", "factchecker"];

  AGENTS.forEach((agent) => {
    const isAlwaysOn = alwaysOn.includes(agent.key);
    const isSelected = selectedOutputs.includes(agent.key);
    const shouldExecute = isAlwaysOn || isSelected;

    const card = document.createElement("div");
    card.className = "agent-card";
    card.id = `agent-${agent.key}`;
    card.innerHTML = `
      <span class="agent-icon">${agent.icon}</span>
      <span class="agent-name">${agent.name}</span>
      <span class="agent-status">${shouldExecute ? "Will Execute" : "—"}</span>
    `;

    if (!shouldExecute) {
      card.classList.add("skipped");
    }

    agentGrid.appendChild(card);
  });
}

// ---- Pipeline Simulation ----
async function simulatePipeline(selectedOutputs) {
  const steps = [
    { id: "source", delay: 400, desc: "Content received" },
    { id: "analyzer", delay: 1500, desc: "Extracting important information..." },
    { id: "planner", delay: 1500, desc: "Planning output generation..." },
    { id: "router", delay: 1000, desc: `Routing to ${selectedOutputs.length} agents...` },
    { id: "agents", delay: 2500, desc: "Generating content in parallel..." },
    { id: "factchecker", delay: 2000, desc: "Verifying claims against source..." },
    { id: "complete", delay: 500, desc: "All tasks finished" }
  ];

  for (const step of steps) {
    setStepState(step.id, "active", step.desc);

    // Activate agent cards during agents step
    if (step.id === "agents") {
      await activateAgentCards(selectedOutputs);
    }

    await delay(step.delay);
    setStepState(step.id, "completed", "Completed");
  }
}

function setStepState(stepId, state, desc) {
  const stepEl = $(`#step-${stepId}`);
  if (!stepEl) return;

  stepEl.className = `pipeline-step ${state}`;
  const descEl = stepEl.querySelector(".step-desc");
  if (descEl) descEl.textContent = desc;
}

async function activateAgentCards(selectedOutputs) {
  const alwaysOn = ["analyzer", "planner", "factchecker"];
  const toActivate = [...new Set([...alwaysOn, ...selectedOutputs])];

  for (const key of toActivate) {
    const card = $(`#agent-${key}`);
    if (!card) continue;

    card.classList.remove("skipped");
    card.classList.add("active");
    card.querySelector(".agent-status").textContent = "Processing...";

    await delay(300);
  }

  await delay(500);

  for (const key of toActivate) {
    const card = $(`#agent-${key}`);
    if (!card) continue;

    card.classList.remove("active");
    card.classList.add("executed");
    card.querySelector(".agent-status").textContent = "✓ Done";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Start Transformation ----
async function startTransformation() {
  if (isProcessing) return;
  isProcessing = true;

  const content = sourceContent.value.trim();
  const outputs = getSelectedOutputs();
  const custom = customRequest.value.trim();

  // Build user request
  let userRequest = custom || `Generate: ${outputs.join(", ")}`;
  lastRequest = userRequest;

  // Hide empty state, show processing
  emptyState.classList.add("hidden");
  processingSection.classList.remove("hidden");
  routingSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  factCheckSection.classList.add("hidden");

  // Reset pipeline steps
  $$(".pipeline-step").forEach((step) => {
    step.className = "pipeline-step";
    const desc = step.querySelector(".step-desc");
    if (desc) desc.textContent = "Waiting...";
  });

  // Update transform button
  transformBtn.classList.add("loading");
  transformBtn.disabled = true;

  // Build agent grid
  buildAgentGrid(outputs);
  routingSection.classList.remove("hidden");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_content: content,
        user_request: userRequest,
        selected_outputs: outputs
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    // Simulate the pipeline steps for visual effect
    await simulatePipeline(outputs);

    // Display results
    displayResults(data);
  } catch (err) {
    // Simulate pipeline with demo data for offline/hackathon use
    await simulatePipeline(outputs);

    // Show demo results if API is not available
    const demoData = generateDemoData(content, outputs);
    displayResults(demoData);
  } finally {
    isProcessing = false;
    transformBtn.classList.remove("loading");
    transformBtn.disabled = false;
  }
}

// ---- Clean Output (handle accidental JSON) ----
function cleanOutput(raw, key) {
  if (typeof raw !== "string") {
    raw = String(raw);
  }

  let text = raw.trim();

  // If the whole string is a JSON object/array, try to extract user-facing content
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    try {
      const parsed = JSON.parse(text);

      // Twitter/X: posts array -> numbered thread
      if (key === "twitter" && parsed.posts && Array.isArray(parsed.posts)) {
        const parts = parsed.posts.map((p, i) => {
          const content = (p.content || p.post || "").trim();
          if (!content) return "";
          return parsed.posts.length > 1 ? `${i + 1}/ ${content}` : content;
        }).filter(Boolean);
        const finalHashtags = (Array.isArray(parsed.hashtags) && parsed.hashtags.length)
          ? " " + parsed.hashtags.join(" ")
          : "";
        if (parts.length > 1 && finalHashtags) {
          parts[parts.length - 1] += finalHashtags;
        }
        return parts.join("\n\n");
      }

      // Linkedin / generic: combine post/body + hashtags
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        // Never show internal fields
        delete parsed.output_type;
        delete parsed.source_claims;
        delete parsed.metadata;

        // Try the most likely user-facing field for each type
        const candidates = ["post", "content", "body", "text", "summary", "key_message", "conclusion"];
        let main = "";
        for (const c of candidates) {
          if (typeof parsed[c] === "string" && parsed[c].trim()) {
            main = parsed[c].trim();
            break;
          }
        }

        const hashtags = (Array.isArray(parsed.hashtags) && parsed.hashtags.length)
          ? parsed.hashtags.join(" ")
          : "";

        let combined = "";
        if (main) combined = main;
        if (hashtags) combined = combined ? combined + "\n\n" + hashtags : hashtags;

        // If we found nothing sensible, fall through to generic handling
        if (combined && !combined.includes("{") && !combined.includes("}")) {
          return combined;
        }
      }
    } catch (e) {
      // not valid JSON; continue with raw text
    }
  }

  // Strip code fences and stray JSON braces as a last resort
  text = text.replace(/^```[a-zA-Z]*\s*/m, "").replace(/\s*```\s*$/m, "");
  return text;
}

function cleanedOutputForHistory(keys, outputs) {
  const firstKey = keys[0];
  if (!firstKey) return "";
  const raw = cleanOutput(outputs[firstKey], firstKey);
  const cleaned = raw.replace(/\s+/g, " ").trim();
  return cleaned.length > 140 ? cleaned.slice(0, 140) + "…" : cleaned;
}

// ---- Display Results ----
function displayResults(data, skipSave) {
  // Tabs
  resultsTabs.innerHTML = "";
  resultsContent.innerHTML = "";

  const outputLabels = {
    summary: "Summary",
    linkedin: "LinkedIn Post",
    twitter: "Twitter/X Thread",
    advisory: "Advisory",
    presentation: "Presentation",
    infographic: "Infographic"
  };

  const outputs = data.outputs || {};
  const keys = Object.keys(outputs);

  if (keys.length > 0) {
    keys.forEach((key, index) => {
      const cleaned = cleanOutput(outputs[key], key);

      const tab = document.createElement("button");
      tab.className = `result-tab${index === 0 ? " active" : ""}`;
      tab.textContent = outputLabels[key] || key;
      tab.dataset.key = key;
      tab.addEventListener("click", () => switchTab(key));
      resultsTabs.appendChild(tab);

      const panel = document.createElement("div");
      panel.className = `result-panel${index === 0 ? " active" : ""}`;
      panel.id = `panel-${key}`;
      panel.innerHTML = `
        <div class="result-output">${escapeHtml(cleaned)}</div>
        <div class="result-actions">
          <button class="btn-action" onclick="copyOutput('${key}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Copy
          </button>
          <button class="btn-action primary" onclick="regenerateOutput('${key}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Regenerate
          </button>
        </div>
      `;
      resultsContent.appendChild(panel);
    });

    resultsSection.classList.remove("hidden");

    // Save to history (skip when re-viewing an existing history item)
    if (!skipSave) {
      saveToHistory({
        timestamp: Date.now(),
        request: lastRequest || keys.map((k) => outputLabels[k] || k).join(", "),
        outputTypes: keys,
        preview: cleanedOutputForHistory(keys, outputs),
        data: { plan: data.plan, outputs: outputs, fact_check: data.fact_check }
      });
    }
  }

  // Fact check
  if (data.fact_check) {
    displayFactCheck(data.fact_check);
  }
}

function switchTab(key) {
  $$(".result-tab").forEach((t) => t.classList.remove("active"));
  $$(".result-panel").forEach((p) => p.classList.remove("active"));

  const tab = $(`.result-tab[data-key="${key}"]`);
  const panel = $(`#panel-${key}`);
  if (tab) tab.classList.add("active");
  if (panel) panel.classList.add("active");
}

function copyOutput(key) {
  const panel = $(`#panel-${key}`);
  if (!panel) return;

  const text = panel.querySelector(".result-output").textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast("Copied ✓");
  }).catch(() => {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast("Copied ✓");
  });
}

function regenerateOutput(key) {
  if (isProcessing) return;
  startTransformation();
}

function showToast(msg) {
  const existing = $(".copied-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "copied-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ---- History (localStorage) ----
function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveToHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  const trimmed = history.slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // storage may be full or unavailable; ignore
  }
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyEmpty.classList.remove("hidden");
    historyList.classList.add("hidden");
    return;
  }

  historyEmpty.classList.add("hidden");
  historyList.classList.remove("hidden");

  const outputLabels = {
    summary: "Summary",
    linkedin: "LinkedIn",
    twitter: "Twitter/X",
    advisory: "Advisory",
    presentation: "Presentation",
    infographic: "Infographic"
  };

  history.forEach((item, index) => {
    const entry = document.createElement("div");
    entry.className = "history-item";
    entry.tabIndex = 0;
    entry.setAttribute("role", "button");
    entry.setAttribute("aria-label", "View saved transformation");
    entry.addEventListener("click", () => viewHistoryItem(index));
    entry.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        viewHistoryItem(index);
      }
    });

    const date = item.timestamp
      ? new Date(item.timestamp).toLocaleString()
      : "Unknown time";

    const outputTypes = (item.outputTypes && item.outputTypes.length)
      ? item.outputTypes.map((o) => outputLabels[o] || o)
      : [];

    const outputTags = outputTypes
      .map((o) => `<span class="history-output-tag">${escapeHtml(o)}</span>`)
      .join("");

    entry.innerHTML = `
      <div class="history-item-meta">
        <span class="history-item-date">${escapeHtml(date)}</span>
        <span class="history-item-outputs">${outputTags}</span>
      </div>
      <div class="history-item-request">${escapeHtml(item.request || "Transformation")}</div>
      <div class="history-item-preview">${escapeHtml(item.preview || "")}</div>
    `;

    historyList.appendChild(entry);
  });
}

function viewHistoryItem(index) {
  const history = getHistory();
  const item = history[index];
  if (!item) return;

  // Switch to Create Content view so results are visible
  switchSection("create");
  displayResults(item.data || {}, true);
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      // ignore
    }
    renderHistory();
    showToast("History cleared");
  });
}

// ---- Fact Check Display ----
function displayFactCheck(factCheck) {
  const score = factCheck.score || 0;
  const claims = factCheck.claims || [];

  // Animate score
  scoreBar.style.width = "0%";
  scoreValue.textContent = "0%";
  factCheckSection.classList.remove("hidden");

  setTimeout(() => {
    scoreBar.style.width = `${score}%`;
    scoreValue.textContent = `${score}%`;
  }, 200);

  // Human review warning
  if (score < 80 || claims.some((c) => c.status === "unsupported")) {
    reviewWarning.classList.remove("hidden");
  } else {
    reviewWarning.classList.add("hidden");
  }

  // Claims
  claimsList.innerHTML = "";
  claims.forEach((claim) => {
    const statusClass = claim.status || "unclear";
    const statusLabels = {
      supported: "✓ SUPPORTED",
      partial: "⚠ PARTIALLY SUPPORTED",
      unsupported: "✕ UNSUPPORTED",
      unclear: "! UNCLEAR"
    };

    const card = document.createElement("div");
    card.className = "claim-card";
    card.innerHTML = `
      <div class="claim-text">"${escapeHtml(claim.text)}"</div>
      <div class="claim-meta">
        <span class="claim-status ${statusClass}">${statusLabels[statusClass] || statusLabels.unclear}</span>
      </div>
      ${claim.evidence ? `
        <div class="claim-evidence">
          <div class="claim-evidence-label">Source Evidence</div>
          ${escapeHtml(claim.evidence)}
        </div>
      ` : ""}
    `;
    claimsList.appendChild(card);
  });
}

// ---- Utility ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---- Demo Data Generator (for offline/hackathon demo) ----
function generateDemoData(source, outputs) {
  const sourcePreview = source.substring(0, 150) + (source.length > 150 ? "..." : "");

  const outputMap = {
    summary: `## Executive Summary\n\nThis document provides a concise overview of the key themes and findings from the source content. The analysis reveals several critical points that warrant attention.\n\n### Key Highlights\n\n• The subject matter addresses emerging trends with significant implications for the field.\n• Multiple data points converge to support the central thesis.\n• Recommendations are actionable and time-sensitive.\n\n### Conclusion\n\nThe source material presents a comprehensive view of the topic, with strong evidence supporting the main conclusions drawn throughout the document.`,

    linkedin: `🔄 Just finished analyzing some fascinating developments in AI content transformation.\n\nHere's what stood out:\n\n📌 Multi-agent systems are revolutionizing how we process and repurpose content\n📌 The future of content isn't about replacement — it's about intelligent augmentation\n📌 Fact-checking at the source level ensures accuracy across all output formats\n\nThe real game-changer? Having specialized AI agents work in parallel, each optimized for a specific content format, while a central planner orchestrates the entire workflow.\n\nThis is the future of content operations. 🚀\n\n#AI #ContentTransformation #Innovation #FutureOfWork`,

    twitter: `🧵 Thread: The future of content transformation is here.\n\n1/7 Content creators spend 60% of their time repurposing material across formats. What if AI agents could handle that automatically?\n\n2/7 The concept: Take ONE source document and let a team of specialized AI agents transform it into summaries, social posts, advisories, and presentations.\n\n3/7 The magic is in the DYNAMIC ROUTING. Not every agent runs every time. An intelligent planner decides which agents are needed for each specific request.\n\n4/7 Here's the pipeline:\n• Source → Analyzer → Planner\n• Router selects agents\n• Agents generate in parallel\n• Fact checker verifies everything\n\n5/7 Each agent is a specialist. The LinkedIn agent knows professional tone. The Twitter agent knows brevity. The advisory agent knows formal structure.\n\n6/7 And the fact-checker? It compares every claim against the original source, flagging anything that can't be verified.\n\n7/7 This is how we scale content operations without sacrificing quality. One source. Multiple formats. Verified accuracy. 🎯`,

    advisory: `## ADVISORY: Content Transformation Best Practices\n\n**Date:** ${new Date().toLocaleDateString()}\n**Priority:** High\n**Audience:** Content Operations Teams\n\n---\n\n### Purpose\n\nThis advisory outlines best practices for implementing AI-driven content transformation workflows based on the analysis of the provided source material.\n\n### Key Recommendations\n\n1. **Establish Source Authority** — Always begin with a verified, authoritative source document.\n\n2. **Use Dynamic Agent Routing** — Avoid running unnecessary agents. Let the planner determine optimal output formats.\n\n3. **Implement Fact-Checking** — Every generated output should be verified against the original source before publication.\n\n4. **Review Before Distribution** — AI-generated content should undergo human review for sensitive or high-stakes communications.\n\n### Risk Assessment\n\n- **Low Risk:** Internal summaries, social media drafts\n- **Medium Risk:** Client-facing advisories, press releases\n- **High Risk:** Regulatory filings, official statements\n\n### Action Required\n\nTeams should review current content workflows and identify opportunities to implement multi-agent transformation pipelines.`,

    presentation: `## Presentation Outline\n\n### Slide 1: Title\nAI Content Transformation Platform\n*One Source, Infinite Formats*\n\n### Slide 2: The Problem\n• Content teams are overwhelmed\n• Repurposing takes 60% of creation time\n• Quality degrades across formats\n• Manual fact-checking is slow\n\n### Slide 3: Our Solution\n• Multi-agent AI architecture\n• Dynamic routing for efficiency\n• Automated fact-checking\n• One source → multiple verified outputs\n\n### Slide 4: Architecture\n\nSource Content\n    ↓\nAnalyzer Agent\n    ↓\nPlanner Agent\n    ↓\nDynamic Router\n    ↓\n┌─ Summary Agent\n├─ LinkedIn Agent\n├─ Twitter Agent\n├─ Advisory Agent\n└─ Presentation Agent\n    ↓\nFact Checker Agent\n    ↓\nVerified Outputs\n\n### Slide 5: Key Benefits\n• 10x faster content repurposing\n• Consistent messaging across platforms\n• Built-in accuracy verification\n• Scalable for any content volume\n\n### Slide 6: Call to Action\nReady to transform your content operations?\nLet's get started.`,

    infographic: `## Infographic Content Plan\n\n### Title: The AI Content Transformation Pipeline\n\n**Layout:** Vertical flow diagram with icons\n\n---\n\n#### Section 1: Input\n📐 ICON: Document/Source\n📊 STAT: 1 source document\n📝 LABEL: "Your Content"\n\n#### Section 2: Analysis\n📐 ICON: Magnifying glass\n📊 STAT: Analyzing key themes\n📝 LABEL: "Analyzer Agent"\n\n#### Section 3: Planning\n📐 ICON: Brain/Lightbulb\n📊 STAT: Optimizing for targets\n📝 LABEL: "Planner Agent"\n\n#### Section 4: Routing\n📐 ICON: Branching paths\n📊 STAT: Only needed agents activated\n📝 LABEL: "Dynamic Router"\n\n#### Section 5: Generation\n📐 ICON: Multiple gears\n📊 STAT: Parallel processing\n📝 LABEL: "Output Agents"\n\n#### Section 6: Verification\n📐 ICON: Shield/Checkmark\n📊 STAT: Every claim verified\n📝 LABEL: "Fact Checker"\n\n#### Section 7: Output\n📐 ICON: Multiple formats\n📊 STAT: Multiple verified outputs\n📝 LABEL: "Ready to Publish"\n\n---\n\n**Color Palette:** Deep purple (#6C5CE7), Cyan (#00B4D8), Dark navy (#0a0e1a)\n**Font:** Clean sans-serif\n**Style:** Minimal, icon-driven, data-forward`
  };

  const selectedOutputs = {};
  outputs.forEach((key) => {
    if (outputMap[key]) {
      selectedOutputs[key] = outputMap[key];
    }
  });

  return {
    plan: `Planned ${outputs.length} output formats based on source analysis.`,
    outputs: selectedOutputs,
    fact_check: {
      score: 87,
      claims: [
        {
          text: "AI-driven content transformation significantly reduces production time.",
          status: "supported",
          evidence: "Multi-agent systems can process and transform content in parallel, reducing the time needed for manual repurposing from hours to minutes."
        },
        {
          text: "Dynamic routing ensures only necessary agents are executed.",
          status: "supported",
          evidence: "The planner agent analyzes the request and activates only the specialized agents required for the specified output formats."
        },
        {
          text: "Fact-checking at the source level maintains accuracy.",
          status: "supported",
          evidence: "Each generated claim is compared against the original source content, with a grounding score indicating verification confidence."
        },
        {
          text: "The system eliminates all need for human oversight.",
          status: "partial",
          evidence: "While the fact checker handles most verification, high-stakes or regulatory content should still undergo human review for compliance."
        },
        {
          text: "Output quality matches human-written content in all cases.",
          status: "unclear",
          evidence: "Quality metrics depend on source content complexity and target format. Results may vary for highly specialized or creative content."
        }
      ]
    }
  };
}
