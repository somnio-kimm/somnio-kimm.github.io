/* The study-card deck on the glossary page: search, filters, practice, and
   flashcard study. Every card and answer is already in the HTML,
   so the page stays readable without this script. Markup comes from deck.lua. */
(() => {
  const DAY = 24 * 60 * 60 * 1000;
  // Leitner boxes: "Got it" moves a card up one box, "Again" back to box 0.
  // A card in box n is due again after INTERVALS[n] days.
  const INTERVALS = [0, 1, 3, 7, 14, 30];
  const normalise = text => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;
  const shuffle = list => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };

  document.querySelectorAll(".deck").forEach(root => {
    const find = selector => root.querySelector(selector);
    const controls = find(".deck-controls");
    const search = find(".deck-search");
    const practice = find(".deck-practice");
    // One facet per button group; its key is the URL parameter and the card's data attribute.
    const facets = [...root.querySelectorAll("[data-facet]")].map(group => ({
      key: group.dataset.facet,
      buttons: [...group.querySelectorAll("button[data-value]")],
      summary: group.closest(".deck-facet-picker").querySelector("summary"),
      value: "",
    }));
    const cards = [...root.querySelectorAll(".deck-card")].map(element => ({
      element,
      id: element.id,
      // Index before MathJax replaces the TeX with its accessibility markup.
      text: normalise(`${element.id} ${element.textContent}`),
      values: Object.fromEntries(facets.map(facet => [facet.key, (element.dataset[facet.key] || "").split(" ")])),
      details: [...element.querySelectorAll("details")],
    }));
    // Sidebar links to this page with a filter in the query, e.g. glossary.html?tag=physics.
    const sidebarLinks = [...document.querySelectorAll("#quarto-sidebar a.sidebar-link[href]")]
      .map(link => ({link, url: new URL(link.href)}))
      .filter(item => item.url.pathname === window.location.pathname);
    const sidebarFacets = facets.filter(facet => sidebarLinks.some(item => item.url.searchParams.has(facet.key)));
    const setOpen = isOpen => cards.forEach(card => card.details.forEach(details => { details.open = isOpen(details); }));
    // The list at rest: practice hides every answer; otherwise layers marked
    // data-collapsed (formal text, proofs) stay closed until someone opens them.
    const restList = () => setOpen(details => !practice.checked && !("collapsed" in details.dataset));

    // ---- Search and filters ------------------------------------------------
    const matches = (card, words, except) => words.every(word => card.text.includes(word))
      && facets.every(facet => facet === except || !facet.value || card.values[facet.key].includes(facet.value));

    function filter({updateURL = true, keepHash = false} = {}) {
      const words = normalise(search.value.trim()).split(/\s+/).filter(Boolean);
      cards.forEach(card => { card.element.hidden = !matches(card, words); });
      const shown = cards.filter(card => !card.element.hidden);
      facets.forEach(facet => {
        // A value that would leave no cards, given the other filters, is disabled.
        const available = new Set(cards.filter(card => matches(card, words, facet)).flatMap(card => card.values[facet.key]));
        facet.buttons.forEach(button => {
          const value = button.dataset.value;
          button.setAttribute("aria-pressed", String(value === facet.value));
          button.disabled = Boolean(value) && value !== facet.value && !available.has(value);
        });
        // The toggle shows the chosen value, so a folded filter still says what it does.
        const chosen = facet.buttons.find(button => button.dataset.value === facet.value);
        facet.summary.textContent = facet.summary.dataset.label + (facet.value ? ` · ${chosen?.textContent || facet.value}` : "");
      });
      if (sidebarFacets.length) {
        sidebarLinks.forEach(({link, url}) => {
          const active = sidebarFacets.every(facet => (url.searchParams.get(facet.key) || "") === facet.value);
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        });
      }
      const due = shown.filter(isDue).length;
      find(".deck-count").textContent = `${shown.length} of ${plural(cards.length, "card")}`;
      find(".deck-due").textContent = `${due} due for review`;
      find(".deck-empty").hidden = shown.length > 0;
      find('[data-study="due"]').disabled = due === 0;
      find('[data-study="all"]').disabled = shown.length === 0;
      find(".deck-forget").hidden = Object.keys(progress).length === 0;
      if (updateURL) {
        const url = new URL(window.location.href);
        for (const [key, value] of [["search", search.value.trim()], ...facets.map(facet => [facet.key, facet.value])]) {
          if (value) url.searchParams.set(key, value);
          else url.searchParams.delete(key);
        }
        if (!keepHash && cards.some(card => `#${card.id}` === url.hash)) url.hash = "";
        window.history.replaceState(null, "", url);
      }
    }

    function clearFilters() {
      search.value = "";
      facets.forEach(facet => { facet.value = ""; });
    }

    function readURL() {
      const params = new URLSearchParams(window.location.search);
      search.value = params.get("search") || "";
      facets.forEach(facet => {
        const wanted = (params.get(facet.key) || "").toLowerCase();
        // Accept only values offered by a button or a sidebar link.
        facet.value = [...facet.buttons.map(button => button.dataset.value),
          ...sidebarLinks.map(item => item.url.searchParams.get(facet.key) || "")]
          .find(value => value.toLowerCase() === wanted) || "";
      });
      filter({updateURL: false});
    }

    // A link such as #term-latent-variable shows that card with its answers open.
    function revealAnchor() {
      const card = cards.find(item => item.id && `#${item.id}` === window.location.hash);
      if (!card) return;
      if (session) stopStudy();
      if (card.element.hidden) {
        clearFilters();
        filter({keepHash: true});
      }
      card.details.forEach(details => { details.open = true; });
      card.element.scrollIntoView({block: "start"});
    }

    // ---- Flashcard study ---------------------------------------------------
    // Progress is kept per deck in this browser only: {cardId: {box, due}}.
    const storageKey = `study-deck:${root.dataset.deck}`;
    let progress = {};
    try { progress = JSON.parse(window.localStorage.getItem(storageKey)) || {}; } catch { /* storage unavailable */ }
    const saveProgress = () => {
      try { window.localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { /* keep it for this visit */ }
    };
    const isDue = card => !progress[card.id] || progress[card.id].due <= Date.now();

    const study = find(".deck-study");
    const actions = find(".deck-study-actions");
    const reveal = find(".deck-study-reveal");
    const again = find(".deck-study-again");
    const good = find(".deck-study-good");
    const skip = find(".deck-study-skip");
    let session = null; // {queue, position, size, missed}
    let current = null;

    function startStudy(mode) {
      const pool = cards.filter(card => !card.element.hidden && (mode === "all" || isDue(card)));
      if (!pool.length) return;
      session = {queue: shuffle(pool), position: 0, size: pool.length, missed: new Set()};
      root.classList.add("deck-studying");
      controls.hidden = true;
      study.hidden = false;
      showCard();
    }

    function showCard() {
      current?.element.classList.remove("deck-current");
      current = session.queue[session.position] || null;
      const bar = find(".deck-study-progress");
      bar.max = session.queue.length;
      bar.value = session.position;
      actions.hidden = !current;
      if (!current) {
        const recalled = session.size - session.missed.size;
        find(".deck-study-status").textContent = `Finished. ${recalled} of ${plural(session.size, "card")} recalled on the first try.`;
        find(".deck-study-exit").focus();
        return;
      }
      find(".deck-study-status").textContent = `Card ${session.position + 1} of ${session.queue.length}`;
      current.details.forEach(details => { details.open = false; });
      current.element.classList.add("deck-current");
      updateActions();
      reveal.focus({preventScroll: true});
      root.scrollIntoView({block: "start"});
    }

    // The buttons follow the card's disclosures, however they were opened.
    function updateActions() {
      const next = current.details.find(details => !details.open);
      const box = progress[current.id]?.box || 0;
      const focused = actions.contains(document.activeElement);
      reveal.hidden = skip.hidden = !next;
      again.hidden = good.hidden = Boolean(next);
      if (next) reveal.textContent = `Show ${next.querySelector("summary").textContent.toLowerCase()}`;
      find(".deck-study-schedule").textContent = next ? ""
        : `“Got it” brings this card back in ${plural(INTERVALS[Math.min(box + 1, INTERVALS.length - 1)], "day")}.`;
      if (focused) (next ? reveal : good).focus({preventScroll: true});
    }

    function revealNext() {
      const next = current.details.find(details => !details.open);
      if (next) next.open = true;
      updateActions();
    }

    function grade(known) {
      const box = known ? Math.min((progress[current.id]?.box || 0) + 1, INTERVALS.length - 1) : 0;
      progress[current.id] = {box, due: Date.now() + INTERVALS[box] * DAY};
      saveProgress();
      if (!known) {
        // A missed card comes back at the end of this round.
        session.missed.add(current.id);
        session.queue.push(current);
      }
      session.position++;
      showCard();
    }

    function skipCard() {
      session.queue.push(...session.queue.splice(session.position, 1));
      showCard();
    }

    function stopStudy() {
      current?.element.classList.remove("deck-current");
      session = current = null;
      root.classList.remove("deck-studying");
      study.hidden = actions.hidden = true;
      controls.hidden = false;
      restList();
      filter({updateURL: false});
    }

    // ---- Events ------------------------------------------------------------
    search.addEventListener("input", () => filter());
    facets.forEach(facet => facet.buttons.forEach(button => button.addEventListener("click", () => {
      facet.value = button.dataset.value;
      filter();
    })));
    // A subject link on a card filters the whole deck by that subject.
    root.addEventListener("click", event => {
      const link = event.target.closest("a[data-facet-link]");
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      if (session) stopStudy();
      facets.forEach(facet => { facet.value = facet.key === link.dataset.facetLink ? link.dataset.value : ""; });
      filter();
      search.focus({preventScroll: true});
      root.scrollIntoView({block: "start"});
    });
    practice.addEventListener("change", restList);
    find(".deck-reset").addEventListener("click", () => {
      clearFilters();
      filter();
      search.focus();
    });
    root.querySelectorAll("[data-study]").forEach(button => {
      button.addEventListener("click", () => startStudy(button.dataset.study));
    });
    find(".deck-forget").addEventListener("click", () => {
      if (!window.confirm("Forget which cards you have learned in this deck?")) return;
      progress = {};
      saveProgress();
      filter({updateURL: false});
    });
    reveal.addEventListener("click", revealNext);
    again.addEventListener("click", () => grade(false));
    good.addEventListener("click", () => grade(true));
    skip.addEventListener("click", skipCard);
    find(".deck-study-exit").addEventListener("click", stopStudy);
    cards.forEach(card => card.details.forEach(details => details.addEventListener("toggle", () => {
      if (current === card) updateActions();
    })));
    document.addEventListener("keydown", event => {
      if (!session || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
      const revealed = current?.details.every(details => details.open);
      if (event.key === "Escape") stopStudy();
      else if (!current) return;
      else if (event.key === " " && !event.target.closest?.("button, summary, a")) {
        event.preventDefault();
        if (revealed) grade(true);
        else revealNext();
      } else if (event.key === "1" && revealed) grade(false);
      else if (event.key === "2" && revealed) grade(true);
      else if (event.key === "ArrowRight" && !revealed) skipCard();
    });
    window.addEventListener("popstate", () => { readURL(); revealAnchor(); });
    window.addEventListener("hashchange", revealAnchor);
    // Print every card with its answers, then restore what was open.
    let printState;
    window.addEventListener("beforeprint", () => {
      printState = cards.map(card => card.details.map(details => details.open));
      setOpen(() => true);
    });
    window.addEventListener("afterprint", () => {
      if (printState) cards.forEach((card, i) => card.details.forEach((details, j) => { details.open = printState[i][j]; }));
    });

    restList();
    readURL();
    controls.hidden = false;
    revealAnchor();
  });
})();
