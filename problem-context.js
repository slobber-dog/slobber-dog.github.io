(function () {
  const materials = [
    ["hardware", "hardware"],
    ["software", "software"],
    ["firmware", "firmware"],
    ["electronics", "electronics"],
    ["frontier-ai", "frontier ai"],
    ["agentic-workflows", "agentic workflows"],
    ["embedded-systems", "embedded systems"],
    ["physical-objects", "physical objects"],
    ["interfaces", "interfaces"],
    ["data-knowledge", "data + knowledge"],
    ["networks-protocols", "networks + protocols"],
    ["reverse-engineering", "reverse engineering"],
    ["security", "security"],
    ["research-concepts", "research + concepts"],
    ["not-sure", "not sure yet"]
  ];

  const labels = new Map(materials);
  const allowed = new Set(labels.keys());

  function selectedFromUrl() {
    const raw = new URLSearchParams(window.location.search).get("touches") || "";
    return raw.split(",").map(value => value.trim()).filter(value => allowed.has(value));
  }

  function initialisePicker() {
    const picker = document.querySelector("[data-context-picker]");
    if (!picker) return;

    const selected = new Set();
    const buttons = Array.from(picker.querySelectorAll("[data-material]"));
    const routes = Array.from(document.querySelectorAll("[data-problem-route]"));

    function update() {
      const values = Array.from(selected);
      buttons.forEach(button => button.setAttribute("aria-pressed", String(selected.has(button.dataset.material))));
      routes.forEach(route => {
        const url = new URL(route.dataset.problemRoute, window.location.href);
        if (values.length) url.searchParams.set("touches", values.join(","));
        else url.searchParams.delete("touches");
        route.href = url.pathname + url.search;
      });
    }

    buttons.forEach(button => button.addEventListener("click", () => {
      const value = button.dataset.material;
      if (value === "not-sure") {
        const wasSelected = selected.has(value);
        selected.clear();
        if (!wasSelected) selected.add(value);
      } else {
        selected.delete("not-sure");
        if (selected.has(value)) selected.delete(value);
        else selected.add(value);
      }
      update();
    }));

    update();
  }

  function initialiseDestination() {
    const container = document.querySelector("[data-selected-context]");
    if (!container) return;

    const selected = selectedFromUrl();
    if (!selected.length) return;

    container.hidden = false;
    selected.forEach(value => {
      const chip = document.createElement("span");
      chip.className = "context-chip";
      chip.textContent = labels.get(value);
      container.appendChild(chip);
    });

    const email = document.querySelector("[data-problem-email]");
    if (!email) return;

    const route = document.querySelector(".intro")?.textContent.trim() || "a difficult problem";
    const href = email.getAttribute("href");
    const query = href.includes("?") ? href.split("?")[1] : "";
    const params = new URLSearchParams(query);
    const subject = params.get("subject") || "problem proposal";
    const body = [
      "hello,",
      "",
      "the situation that sounds closest is:",
      route,
      "",
      "my problem touches:",
      selected.map(value => labels.get(value)).join(" / "),
      "",
      "here's what i can tell you so far:",
      ""
    ].join("\n");
    email.href = "mailto:schemes@slobberdog.fyi?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  initialisePicker();
  initialiseDestination();
})();
