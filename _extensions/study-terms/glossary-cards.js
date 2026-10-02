/* All cards and definitions are rendered in HTML; filtering is an enhancement. */
(() => {
  const root = document.querySelector(".glossary-browser");
  if (!root) return;
  const search = root.querySelector("#glossary-search");
  const practice = root.querySelector("#glossary-practice");
  const tagPicker = root.querySelector(".glossary-tag-picker");
  const buttons = [...root.querySelectorAll("[data-filter]")];
  const normalise = text => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  const cards = [...root.querySelectorAll(".glossary-card")].map(element => ({
    element,
    tags: JSON.parse(element.dataset.tags),
    text: normalise(`${element.dataset.key} ${element.textContent}`),
    definition: element.querySelector(".glossary-definition"),
  }));
  let selectedTag = "";

  function filter(updateURL = true) {
    const words = normalise(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      card.element.hidden = !((!selectedTag || card.tags.includes(selectedTag))
        && words.every(word => card.text.includes(word)));
      if (!card.element.hidden) count++;
    });
    buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === selectedTag)));
    tagPicker.querySelector("summary").textContent = "Filter by tag" + (selectedTag ? ` · #${selectedTag}` : "");
    root.querySelector(".glossary-count").textContent = `${count} of ${cards.length} cards`
      + (selectedTag ? ` · #${selectedTag}` : "");
    root.querySelector(".glossary-empty").hidden = count > 0;
    if (updateURL) {
      const url = new URL(window.location.href);
      for (const [key, value] of [["q", search.value.trim()], ["tag", selectedTag]]) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      window.history.replaceState(null, "", url);
    }
  }

  function readURL() {
    const params = new URLSearchParams(window.location.search);
    search.value = params.get("q") || "";
    const tag = params.get("tag") || "";
    selectedTag = buttons.some(button => button.dataset.filter === tag) ? tag : "";
    filter(false);
  }

  function revealAnchor() {
    const card = cards.find(item => `#${item.element.id}` === window.location.hash);
    if (!card) return;
    if (card.element.hidden) {
      search.value = "";
      selectedTag = "";
      filter();
    }
    card.definition.open = true;
    card.element.scrollIntoView({block: "start"});
  }

  search.addEventListener("input", () => filter());
  buttons.forEach(button => button.addEventListener("click", () => {
    selectedTag = button.dataset.filter;
    filter();
  }));
  root.querySelectorAll("[data-tag]").forEach(link => link.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    selectedTag = link.dataset.tag;
    filter();
    search.focus({preventScroll: true});
    root.scrollIntoView({block: "start"});
  }));
  practice.addEventListener("change", () => {
    cards.forEach(card => { card.definition.open = !practice.checked; });
  });
  root.querySelector(".glossary-reset").addEventListener("click", () => {
    search.value = "";
    selectedTag = "";
    filter();
    search.focus();
  });
  window.addEventListener("popstate", () => { readURL(); revealAnchor(); });
  window.addEventListener("hashchange", revealAnchor);
  readURL();
  tagPicker.open = window.matchMedia("(min-width: 768px)").matches;
  root.querySelector(".glossary-controls").hidden = false;
  revealAnchor();

  // Print the complete glossary, including definitions hidden for practice.
  let printState;
  window.addEventListener("beforeprint", () => {
    printState = cards.map(card => card.definition.open);
    cards.forEach(card => { card.definition.open = true; });
  });
  window.addEventListener("afterprint", () => {
    if (printState) cards.forEach((card, i) => { card.definition.open = printState[i]; });
  });
})();
