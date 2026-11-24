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
    // Every part is looked up once, here, because the filters and the study
    // buttons can move out of the deck into the page sidebar (see placeSide).
    const el = Object.fromEntries(Object.entries({
      controls: ".deck-controls", side: ".deck-side", search: ".deck-search", practice: ".deck-practice",
      count: ".deck-count", due: ".deck-due", empty: ".deck-empty", reset: ".deck-reset", forget: ".deck-forget",
      studyDue: '[data-study="due"]', studyAll: '[data-study="all"]',
      study: ".deck-study", status: ".deck-study-status", bar: ".deck-study-progress", exit: ".deck-study-exit",
      actions: ".deck-study-actions", reveal: ".deck-study-reveal", again: ".deck-study-again",
      good: ".deck-study-good", skip: ".deck-study-skip", schedule: ".deck-study-schedule",
    }).map(([name, selector]) => [name, root.querySelector(selector)]));
    // One facet per button group; its key is the URL parameter and the card's
    // data attribute. Several values can be chosen at once.
    const facets = [...root.querySelectorAll("[data-facet]")].map(group => ({
      key: group.dataset.facet,
      buttons: [...group.querySelectorAll("button[data-value]")],
      summary: group.closest(".deck-facet-picker").querySelector("summary"),
      chosen: new Set(),
    }));
    const cards = [...root.querySelectorAll(".deck-card")].map(element => ({
      element,
      id: element.id,
      // Index before MathJax replaces the TeX with its accessibility markup.
      text: normalise(`${element.id} ${element.textContent}`),
      values: Object.fromEntries(facets.map(facet => [facet.key, (element.dataset[facet.key] || "").split(" ")])),
      details: [...element.querySelectorAll("details")],
    }));
    const setOpen = isOpen => cards.forEach(card => card.details.forEach(details => { details.open = isOpen(details); }));
    // The list at rest: practice hides every answer; otherwise layers marked
    // data-collapsed (formal text, proofs) stay closed until someone opens them.
    const restList = () => setOpen(details => !el.practice.checked && !("collapsed" in details.dataset));

    // ---- Search and filters ------------------------------------------------
    // A card passes a facet when nothing is chosen there, or it has any chosen value.
    const matches = (card, words, except) => words.every(word => card.text.includes(word))
      && facets.every(facet => facet === except || !facet.chosen.size
        || card.values[facet.key].some(value => facet.chosen.has(value)));

    function filter({updateURL = true, keepHash = false} = {}) {
      const words = normalise(el.search.value.trim()).split(/\s+/).filter(Boolean);
      cards.forEach(card => { card.element.hidden = !matches(card, words); });
      const shown = cards.filter(card => !card.element.hidden);
      facets.forEach(facet => {
        // A value that would add no cards, given the other filters, is disabled.
        const available = new Set(cards.filter(card => matches(card, words, facet)).flatMap(card => card.values[facet.key]));
        facet.buttons.forEach(button => {
          const value = button.dataset.value;
          const pressed = value ? facet.chosen.has(value) : facet.chosen.size === 0;
          button.setAttribute("aria-pressed", String(pressed));
          button.disabled = Boolean(value) && !pressed && !available.has(value);
        });
        // The toggle names what is chosen, so a folded filter still says what it does.
        const names = facet.buttons.filter(button => facet.chosen.has(button.dataset.value)).map(button => button.textContent);
        facet.summary.textContent = facet.summary.dataset.label
          + (names.length ? ` · ${names.length > 3 ? `${names.length} chosen` : names.join(", ")}` : "");
      });
      const due = shown.filter(isDue).length;
      el.count.textContent = `${shown.length} of ${plural(cards.length, "card")}`;
      el.due.textContent = `${due} due for review`;
      el.empty.hidden = shown.length > 0;
      el.studyDue.disabled = due === 0;
      el.studyAll.disabled = shown.length === 0;
      el.forget.hidden = Object.keys(progress).length === 0;
      if (updateURL) {
        const url = new URL(window.location.href);
        const state = [["search", el.search.value.trim()], ...facets.map(facet => [facet.key, [...facet.chosen].join(",")])];
        for (const [key, value] of state) {
          if (value) url.searchParams.set(key, value);
          else url.searchParams.delete(key);
        }
        if (!keepHash && cards.some(card => `#${card.id}` === url.hash)) url.hash = "";
        window.history.replaceState(null, "", url);
      }
    }

    function clearFilters() {
      el.search.value = "";
      facets.forEach(facet => facet.chosen.clear());
    }

    function readURL() {
      const params = new URLSearchParams(window.location.search);
      el.search.value = params.get("search") || "";
      facets.forEach(facet => {
        // Accept only values offered by a button; several are separated by commas.
        const offered = new Map(facet.buttons.map(button => [button.dataset.value.toLowerCase(), button.dataset.value]));
        facet.chosen = new Set((params.get(facet.key) || "").toLowerCase().split(",")
          .map(value => offered.get(value)).filter(Boolean));
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

    // On wide screens the filters and the study buttons sit in the page sidebar,
    // under its links. On narrow screens that sidebar is folded away, so they
    // stay above the cards. The "deck" class keeps deck.css applying to them there.
    const sidebar = document.querySelector("#quarto-sidebar .sidebar-menu-container");
    const wide = window.matchMedia("(min-width: 992px)");
    function placeSide() {
      const inSidebar = Boolean(sidebar) && wide.matches;
      el.side.classList.toggle("deck", inSidebar);
      el.side.classList.toggle("deck-in-sidebar", inSidebar);
      (inSidebar ? sidebar : el.controls).append(el.side);
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

    let session = null; // {queue, position, size, missed}
    let current = null;

    function startStudy(mode) {
      const pool = cards.filter(card => !card.element.hidden && (mode === "all" || isDue(card)));
      if (!pool.length) return;
      session = {queue: shuffle(pool), position: 0, size: pool.length, missed: new Set()};
      root.classList.add("deck-studying");
      el.controls.hidden = el.side.hidden = true;
      el.study.hidden = false;
      showCard();
    }

    function showCard() {
      current?.element.classList.remove("deck-current");
      current = session.queue[session.position] || null;
      el.bar.max = session.queue.length;
      el.bar.value = session.position;
      el.actions.hidden = !current;
      if (!current) {
        const recalled = session.size - session.missed.size;
        el.status.textContent = `Finished. ${recalled} of ${plural(session.size, "card")} recalled on the first try.`;
        el.exit.focus();
        return;
      }
      el.status.textContent = `Card ${session.position + 1} of ${session.queue.length}`;
      current.details.forEach(details => { details.open = false; });
      current.element.classList.add("deck-current");
      updateActions();
      el.reveal.focus({preventScroll: true});
      root.scrollIntoView({block: "start"});
    }

    // The buttons follow the card's disclosures, however they were opened.
    function updateActions() {
      const next = current.details.find(details => !details.open);
      const box = progress[current.id]?.box || 0;
      const focused = el.actions.contains(document.activeElement);
      el.reveal.hidden = el.skip.hidden = !next;
      el.again.hidden = el.good.hidden = Boolean(next);
      if (next) el.reveal.textContent = `Show ${next.querySelector("summary").textContent.toLowerCase()}`;
      el.schedule.textContent = next ? ""
        : `“Got it” brings this card back in ${plural(INTERVALS[Math.min(box + 1, INTERVALS.length - 1)], "day")}.`;
      if (focused) (next ? el.reveal : el.good).focus({preventScroll: true});
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
      el.study.hidden = el.actions.hidden = true;
      el.controls.hidden = el.side.hidden = false;
      restList();
      filter({updateURL: false});
    }

    // ---- Events ------------------------------------------------------------
    el.search.addEventListener("input", () => filter());
    // A filter button switches its value on or off; the first button ("All") clears the filter.
    facets.forEach(facet => facet.buttons.forEach(button => button.addEventListener("click", () => {
      const value = button.dataset.value;
      if (!value) facet.chosen.clear();
      else if (!facet.chosen.delete(value)) facet.chosen.add(value);
      filter();
    })));
    // A subject link on a card filters the whole deck by that subject alone.
    root.addEventListener("click", event => {
      const link = event.target.closest("a[data-facet-link]");
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      if (session) stopStudy();
      facets.forEach(facet => { facet.chosen = new Set(facet.key === link.dataset.facetLink ? [link.dataset.value] : []); });
      filter();
      el.search.focus({preventScroll: true});
      root.scrollIntoView({block: "start"});
    });
    el.practice.addEventListener("change", restList);
    el.reset.addEventListener("click", () => {
      clearFilters();
      filter();
      el.search.focus();
    });
    [el.studyDue, el.studyAll].forEach(button => {
      button.addEventListener("click", () => startStudy(button.dataset.study));
    });
    el.forget.addEventListener("click", () => {
      if (!window.confirm("Forget which cards you have learned in this deck?")) return;
      progress = {};
      saveProgress();
      filter({updateURL: false});
    });
    el.reveal.addEventListener("click", revealNext);
    el.again.addEventListener("click", () => grade(false));
    el.good.addEventListener("click", () => grade(true));
    el.skip.addEventListener("click", skipCard);
    el.exit.addEventListener("click", stopStudy);
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
    wide.addEventListener("change", placeSide);
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
    placeSide();
    el.controls.hidden = false;
    revealAnchor();
  });
})();
