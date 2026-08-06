(function () {
  "use strict";

  const storageKey = "slobberdog.problem-sketch.v1";
  const questions = Array.from(document.querySelectorAll("[data-question]"));
  const form = document.querySelector("[data-sketch-form]");
  const landing = document.querySelector('[data-view="landing"]');
  const review = document.querySelector('[data-view="review"]');
  const output = document.querySelector('[data-view="output"]');
  const progress = document.querySelector("[data-stage-label]");
  const saveStatus = document.querySelector("[data-save-status]");
  const generated = document.querySelector("[data-generated-sketch]");
  const printSketch = document.querySelector("[data-print-sketch]");
  const toast = document.querySelector("[data-toast]");
  let current = 0;
  let state = loadState();
  let toastTimer;

  const reviewDefinitions = [
    ["q1", "one real episode", ["q1_episode"]],
    ["q2", "dream-world outcome", ["q2_outcome"]],
    ["q3", "whose problem?", ["q3_version", "q3_others"]],
    ["q4", "what happens now", ["q4_mechanism"]],
    ["q5", "what should change", ["q5_proposal", "q5_proposed_mechanism", "q5_evidence"]],
    ["q6", "what gets worse", ["q6_worse"]],
    ["q7", "what stays / what's good", ["q7_cannot_change", "q7_working"]],
    ["q8", "dangerous assumption", ["q8_assumptions", "q8_dangerous", "q8_postmortem"]],
    ["q9", "strongest signal it's not working", ["q9_signal", "q9_source"]],
    ["q10", "what to test next", ["q10_tests", "q10_selected", "q10_positive", "q10_negative", "q10_ambiguous", "q10_decision"]]
  ];

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || { answers: {}, current: 0, sketch: "" };
    } catch (_) {
      return { answers: {}, current: 0, sketch: "" };
    }
  }

  function hasSavedWork() {
    return Object.values(state.answers || {}).some(value => value === true || String(value || "").trim());
  }

  function saveState(message) {
    state.current = current;
    localStorage.setItem(storageKey, JSON.stringify(state));
    if (saveStatus) {
      saveStatus.textContent = message || "saved locally";
      window.setTimeout(() => { saveStatus.textContent = "saved locally"; }, 900);
    }
  }

  function restoreFields() {
    Object.entries(state.answers || {}).forEach(([name, value]) => {
      const fields = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
      fields.forEach(field => {
        if (field.type === "checkbox") field.checked = Boolean(value);
        else if (field.type === "radio") field.checked = field.value === value;
        else field.value = value || "";
      });
    });
    if (state.sketch) generated.value = state.sketch;
  }

  function captureField(field) {
    if (!field.name) return;
    if (field.type === "checkbox") state.answers[field.name] = field.checked;
    else if (field.type === "radio") {
      if (field.checked) state.answers[field.name] = field.value;
    } else state.answers[field.name] = field.value;
    saveState("saved");
  }

  function value(name) {
    const answer = state.answers[name];
    return answer === true ? "yes" : String(answer || "").trim();
  }

  function excerpt(text, length) {
    const clean = String(text || "").trim();
    if (!clean) return "";
    return clean.length > length ? clean.slice(0, length).trim() + "…" : clean;
  }

  function updateReferences() {
    document.querySelectorAll("[data-reference]").forEach(reference => {
      const key = reference.dataset.reference;
      let lines = [];
      if (key === "q1-q2") lines = [
        value("q1_episode") && "the episode: " + excerpt(value("q1_episode"), 240),
        value("q2_outcome") && "dream-world outcome: " + excerpt(value("q2_outcome"), 180)
      ];
      if (key === "q5-q7") lines = [
        value("q5_proposal") && "current proposal: " + excerpt(value("q5_proposal"), 180),
        value("q5_evidence") && "steps with evidence: " + excerpt(value("q5_evidence"), 160),
        value("q6_worse") && "what may get worse: " + excerpt(value("q6_worse"), 160),
        value("q7_cannot_change") && "what cannot change: " + excerpt(value("q7_cannot_change"), 160)
      ];
      if (key === "q8") lines = [value("q8_dangerous") && "dangerous assumption: " + excerpt(value("q8_dangerous"), 220)];
      if (key === "q8-q9") lines = [
        value("q8_dangerous") && "dangerous assumption: " + excerpt(value("q8_dangerous"), 180),
        value("q9_signal") && "strongest signal: " + excerpt(value("q9_signal"), 160)
      ];
      reference.textContent = lines.filter(Boolean).join("\n");
    });
  }

  function showQuestion(index) {
    current = Math.max(0, Math.min(index, questions.length - 1));
    landing.hidden = true;
    output.hidden = true;
    review.hidden = true;
    form.hidden = false;
    questions.forEach((question, questionIndex) => { question.hidden = questionIndex !== current; });
    document.querySelector(".sketch-navigation").hidden = false;
    const question = questions[current];
    progress.textContent = `stage ${question.dataset.stage} of 5 — ${question.dataset.stageName}`;
    document.querySelector("[data-back]").disabled = current === 0;
    document.querySelector("[data-next]").textContent = current === questions.length - 1 ? "review your take →" : "continue →";
    updateReferences();
    saveState();
    question.querySelector("h1")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showReview() {
    questions.forEach(question => { question.hidden = true; });
    document.querySelector(".sketch-navigation").hidden = true;
    review.hidden = false;
    renderReview();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderReview() {
    const list = document.querySelector("[data-review-list]");
    list.innerHTML = "";
    reviewDefinitions.forEach(([questionId, title, names], index) => {
      const text = names.map(name => value(name)).filter(Boolean).join("\n\n");
      const item = document.createElement("article");
      item.className = "review-item";
      const header = document.createElement("header");
      const heading = document.createElement("h2");
      heading.textContent = title;
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "text-action";
      edit.textContent = "edit";
      edit.addEventListener("click", () => showQuestion(index));
      const copy = document.createElement("p");
      copy.textContent = text || "not answered";
      if (!text) copy.className = "empty";
      header.append(heading, edit);
      item.append(header, copy);
      list.appendChild(item);
    });
  }

  function section(title, entries) {
    const populated = entries.filter(([, content]) => String(content || "").trim());
    const lines = [title];
    populated.forEach(([label, content]) => {
      lines.push("", label, String(content).trim());
    });
    if (!populated.length) lines.push("", "not answered");
    return lines.join("\n");
  }

  function buildSketch() {
    const touches = selectedContextLabels();
    const date = new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date());
    return [
      "slobberdog",
      "problem sketch",
      "",
      "status: provisional",
      "created: " + date,
      touches.length ? "touches: " + touches.join(" / ") : "",
      "",
      section("what's real", [
        ["one real episode", value("q1_episode")],
        ["dream-world outcome", value("q2_outcome")],
        ["whose version", value("q3_version")],
        ["other people and perspectives", value("q3_others")]
      ]),
      "",
      section("mechanisms", [
        ["what happens now", value("q4_mechanism")],
        ["current proposal", value("q5_no_proposal") ? "we do not have one yet" : value("q5_proposal")],
        ["how the change produces the outcome", value("q5_proposed_mechanism")],
        ["steps supported by evidence", value("q5_evidence")]
      ]),
      "",
      section("what can move", [
        ["what may get worse", value("q6_worse")],
        ["what cannot change", value("q7_cannot_change")],
        ["what is already working well", value("q7_working")]
      ]),
      "",
      section("the important uncertainty", [
        ["assumptions that must be true", value("q8_assumptions")],
        ["most dangerous assumption", value("q8_dangerous")],
        ["how it plausibly failed", value("q8_postmortem")],
        ["strongest real-world signal", value("q9_signal")],
        ["source of that signal", value("q9_source")]
      ]),
      "",
      section("what to test next", [
        ["candidate tests", value("q10_tests")],
        ["small, reversible test", value("q10_selected")],
        ["positive result", value("q10_positive")],
        ["negative result", value("q10_negative")],
        ["result that would muddy the water", value("q10_ambiguous")],
        ["decision at the end", value("q10_decision")]
      ]),
      "",
      section("open questions", [["anything still nagging", value("open_questions")]]),
      "",
      "this sketch is a working frame assembled from your answers. it is not a feasibility assessment, diagnosis or recommendation from slobberdog. validate it with the people affected and revise it when the situation talks back."
    ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
  }

  function createSketch() {
    captureAllFields();
    state.sketch = buildSketch();
    generated.value = state.sketch;
    printSketch.textContent = state.sketch;
    saveState();
    form.hidden = true;
    landing.hidden = true;
    output.hidden = false;
    updateProposalEmail();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function captureAllFields() {
    form.querySelectorAll("input, textarea").forEach(captureField);
  }

  function selectedContextLabels() {
    const raw = new URLSearchParams(window.location.search).get("touches") || "";
    const names = {
      "hardware": "hardware", "software": "software", "firmware": "firmware", "electronics": "electronics",
      "frontier-ai": "frontier ai", "agentic-workflows": "agentic workflows", "embedded-systems": "embedded systems",
      "physical-objects": "physical objects", "interfaces": "interfaces", "data-knowledge": "data + knowledge",
      "networks-protocols": "networks + protocols", "reverse-engineering": "reverse engineering", "security": "security",
      "research-concepts": "research + concepts", "not-sure": "not sure yet"
    };
    return raw.split(",").map(item => names[item]).filter(Boolean);
  }

  function renderContext() {
    const container = document.querySelector("[data-sketch-context]");
    const labels = selectedContextLabels();
    if (!labels.length) return;
    container.hidden = false;
    labels.forEach(label => {
      const chip = document.createElement("span");
      chip.className = "context-chip";
      chip.textContent = label;
      container.appendChild(chip);
    });
  }

  function updateProposalEmail() {
    const link = document.querySelector("[data-propose-sketch]");
    const body = [
      "hello,",
      "",
      "i used the slobberdog problem sketch and would like another brain on the problem.",
      "i can attach the sketch i chose to share.",
      "",
      "the decision i am trying to make is:",
      value("q10_decision")
    ].join("\n");
    link.href = "mailto:schemes@slobberdog.fyi?subject=" + encodeURIComponent("problem proposal — problem sketch") + "&body=" + encodeURIComponent(body);
  }

  function aiPrompt() {
    return `i have worked through a problem-framing process and produced the problem sketch below.

help me interrogate and improve the sketch before trying to solve the problem.

please:

1. restate the problem as you understand it, preserving uncertainty;
2. separate what is observed, reported, inferred, assumed and unknown;
3. identify missing perspectives, context and boundary choices;
4. inspect the proposed mechanism step by step and identify unsupported links;
5. challenge the selected dangerous assumption and suggest other load-bearing assumptions i may have missed;
6. critique whether the proposed experiment could distinguish a positive, negative and ambiguous result;
7. propose three materially different ways to reframe the problem;
8. only after that analysis, suggest possible next experiments or approaches;
9. tell me where you are uncertain and what additional real-world evidence would be needed.

do not assume that my preferred technology or approach is appropriate. do not treat this sketch as verified fact. do not collapse the problem into one root cause. ask me questions where missing information would materially change your analysis.

--- problem sketch begins ---

${generated.value.trim()}

--- problem sketch ends ---`;
  }

  async function copyText(text, message) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    showToast(message);
  }

  function downloadMarkdown() {
    const blob = new Blob([generated.value], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `slobberdog-problem-sketch-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 1800);
  }

  function eraseAll() {
    if (!window.confirm("erase every locally saved answer and start again?")) return;
    localStorage.removeItem(storageKey);
    state = { answers: {}, current: 0, sketch: "" };
    form.reset();
    generated.value = "";
    output.hidden = true;
    form.hidden = true;
    landing.hidden = false;
    document.querySelector("[data-continue]").hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  form.addEventListener("input", event => captureField(event.target));
  form.addEventListener("change", event => captureField(event.target));
  generated.addEventListener("input", () => {
    state.sketch = generated.value;
    printSketch.textContent = generated.value;
    saveState("saved");
  });

  document.querySelectorAll(".prompt-toggle").forEach(button => button.addEventListener("click", () => {
    const prompt = button.nextElementSibling;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    prompt.hidden = expanded;
  }));

  document.querySelector("[data-start]").addEventListener("click", () => showQuestion(0));
  document.querySelector("[data-continue]").addEventListener("click", () => state.sketch ? createSketch() : showQuestion(state.current || 0));
  document.querySelector("[data-next]").addEventListener("click", () => {
    captureAllFields();
    if (current === questions.length - 1) showReview();
    else showQuestion(current + 1);
  });
  document.querySelector("[data-skip]").addEventListener("click", () => current === questions.length - 1 ? showReview() : showQuestion(current + 1));
  document.querySelector("[data-back]").addEventListener("click", () => showQuestion(current - 1));
  document.querySelector("[data-review-back]").addEventListener("click", () => showQuestion(questions.length - 1));
  document.querySelector("[data-create-sketch]").addEventListener("click", createSketch);
  document.querySelector("[data-edit-answers]").addEventListener("click", () => showQuestion(0));
  document.querySelectorAll("[data-erase]").forEach(button => button.addEventListener("click", eraseAll));
  document.querySelector("[data-copy-sketch]").addEventListener("click", () => copyText(generated.value, "problem sketch copied"));
  document.querySelector("[data-download-markdown]").addEventListener("click", downloadMarkdown);
  document.querySelector("[data-print]").addEventListener("click", () => { printSketch.textContent = generated.value; window.print(); });

  const dialog = document.querySelector("[data-ai-dialog]");
  const aiTextarea = document.querySelector("[data-ai-prompt]");
  document.querySelector("[data-review-ai]").addEventListener("click", () => {
    aiTextarea.value = aiPrompt();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  });
  document.querySelector("[data-copy-ai]").addEventListener("click", () => copyText(aiTextarea.value, "ai prompt copied"));

  restoreFields();
  renderContext();
  document.querySelector("[data-continue]").hidden = !hasSavedWork() && !state.sketch;
  if (state.sketch) {
    generated.value = state.sketch;
    printSketch.textContent = state.sketch;
  }
})();
