/* The study-card deck on the glossary page: search, filters, and flashcard
   study in a popup. Every card and answer is already in the HTML,
   so the page stays readable without this script. Markup comes from deck.lua. */
(() => {
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
    // Every part is looked up once, here.
    const el = Object.fromEntries(Object.entries({
      controls: ".deck-controls", list: ".deck-list", search: ".deck-search", open: ".deck-study-open",
      picked: ".deck-picked", empty: ".deck-empty",
      study: ".deck-study", slot: ".deck-study-card", status: ".deck-study-status", bar: ".deck-study-progress",
      exit: ".deck-study-exit", again: ".deck-study-again", good: ".deck-study-good",
      restart: ".deck-study-restart", done: ".deck-study-done",
    }).map(([name, selector]) => [name, root.querySelector(selector)]));
    // One facet per filter menu; its key is the URL parameter and the card's
    // data attribute. Several values can be chosen at once. `badge` is the
    // number on the menu's button that says how many are chosen.
    const facets = [...root.querySelectorAll("[data-facet]")].map(group => ({
      key: group.dataset.facet,
      buttons: [...group.querySelectorAll("button[data-value]")],
      badge: root.querySelector(`[data-facet-count="${group.dataset.facet}"]`),
      chosen: new Set(),
    }));
    // The dropdown menus of the bar (one per filter). One is open at a time.
    const menus = [...root.querySelectorAll(".deck-menu")];
    const closeMenus = except => menus.forEach(menu => { if (menu !== except) menu.open = false; });
    const label = button => button.firstElementChild.textContent;
    const cards = [...root.querySelectorAll(".deck-card")].map(element => ({
      element,
      id: element.id,
      // Index before MathJax replaces the TeX with its accessibility markup.
      text: normalise(`${element.id} ${element.textContent}`),
      values: Object.fromEntries(facets.map(facet => [facet.key, (element.dataset[facet.key] || "").split(" ")])),
      details: [...element.querySelectorAll("details")],
    }));
    const setOpen = isOpen => cards.forEach(card => card.details.forEach(details => { details.open = isOpen(details); }));
    // The list at rest: layers marked data-collapsed (formal text, proofs)
    // stay closed until someone opens them; the others are open.
    const openAtRest = details => !("collapsed" in details.dataset);
    const restList = () => setOpen(openAtRest);

    // ---- Search and filters ------------------------------------------------
    // A card passes a facet when nothing is chosen there, or it has any chosen value.
    const matches = (card, words, except) => words.every(word => card.text.includes(word))
      && facets.every(facet => facet === except || !facet.chosen.size
        || card.values[facet.key].some(value => facet.chosen.has(value)));

    function filter({updateURL = true} = {}) {
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
        facet.badge.textContent = facet.chosen.size || "";
        facet.badge.toggleAttribute("data-zero", !facet.chosen.size);
      });
      // One chip per chosen value, in menu order; its × takes that value off.
      el.picked.replaceChildren(...facets.flatMap(facet => facet.buttons
        .filter(button => facet.chosen.has(button.dataset.value))
        .map(button => {
          const chip = document.createElement("span");
          const remove = document.createElement("button");
          chip.className = "deck-token";
          chip.textContent = label(button);
          remove.type = "button";
          remove.textContent = "×";
          remove.dataset.facet = facet.key;
          remove.dataset.remove = button.dataset.value;
          remove.setAttribute("aria-label", `Remove ${label(button)}`);
          chip.append(remove);
          return chip;
        })));
      el.empty.hidden = shown.length > 0;
      // The Study button quizzes exactly the cards that are shown.
      el.open.disabled = shown.length === 0;
      el.open.title = `Study ${shown.length === 1 ? "this card" : `these ${shown.length} cards`}`;
      el.open.setAttribute("aria-label", el.open.title);
      if (updateURL) {
        const url = new URL(window.location.href);
        const state = [["search", el.search.value.trim()], ...facets.map(facet => [facet.key, [...facet.chosen].join(",")])];
        for (const [key, value] of state) {
          if (value) url.searchParams.set(key, value);
          else url.searchParams.delete(key);
        }
        window.history.replaceState(null, "", url);
      }
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

    // ---- The popup: one card at a time over the page ------------------------
    // The popup (the <dialog> from deck.lua) opens over the page, which stays
    // where it was. It holds the real card from the list: the card moves into
    // the popup, and `place` marks the spot it returns to. Two uses:
    //   - reading one card, opened by clicking it or by a link to it;
    //   - a study session, which quizzes the shown cards one after another.
    let session = null; // the study session: {pool, queue, position, size, missed}
    let current = null; // the card in the popup
    const place = document.createComment("the card in the popup");

    // Puts the card of the popup back into the list, as the list shows it at rest.
    function returnCard() {
      if (!current) return;
      current.element.classList.remove("deck-current");
      place.replaceWith(current.element);
      current.details.forEach(details => { details.open = openAtRest(details); });
      current = null;
    }

    // Moves a card into the popup, with every layer open or every layer closed.
    function moveToPopup(card, open) {
      returnCard();
      current = card;
      card.element.hidden = false; // a link can name a card that the filter hides
      card.details.forEach(details => { details.open = open; });
      card.element.classList.add("deck-current");
      card.element.replaceWith(place);
      el.slot.append(card.element);
      closeMenus();
      if (!el.study.open) el.study.showModal();
      el.study.scrollTop = 0;
    }

    // Reading one card: all of it, large, with nothing to answer.
    function readCard(card) {
      session = null;
      el.status.textContent = "";
      [el.bar, el.again, el.good, el.restart, el.done].forEach(part => { part.hidden = true; });
      el.study.dataset.use = "read";
      moveToPopup(card, true);
      el.exit.focus({preventScroll: true});
      // The address names the card, so the view can be linked to; no scrolling.
      window.history.replaceState(null, "", `#${card.id}`);
    }

    // A link such as #term-latent-variable opens that card in the popup.
    function revealAnchor() {
      const card = cards.find(item => item.id && `#${item.id}` === window.location.hash);
      if (card && card !== current) readCard(card);
    }

    function startStudy(pool) {
      if (!pool.length) return;
      session = {pool, queue: shuffle([...pool]), position: 0, size: pool.length, missed: new Set()};
      el.bar.hidden = false;
      el.study.dataset.use = "study";
      showCard();
    }

    function showCard() {
      const card = session.queue[session.position] || null;
      el.bar.max = session.queue.length;
      el.bar.value = session.position;
      // While a card is up: "Learning" and "Mastered". At the end: start again or go back.
      el.again.hidden = el.good.hidden = !card;
      el.restart.hidden = el.done.hidden = Boolean(card);
      if (!card) {
        returnCard();
        const mastered = session.size - session.missed.size;
        el.status.textContent = `Finished. ${mastered} of ${plural(session.size, "card")} mastered on the first try.`;
        el.done.focus();
        return;
      }
      el.status.textContent = `Card ${session.position + 1} of ${session.queue.length}`;
      moveToPopup(card, false);
      // Focus rests on the card, not on a button, so Space reveals a layer
      // instead of pressing "Mastered".
      el.slot.focus({preventScroll: true});
    }

    // Opens the card's next closed layer: definition, then statement, then proof.
    function revealNext() {
      const next = current.details.find(details => !details.open);
      if (next) next.open = true;
    }

    // "Mastered" (true) moves on; "Learning" (false) also brings the card back
    // at the end of this round.
    function grade(mastered) {
      if (!mastered) {
        session.missed.add(current.id);
        session.queue.push(current);
      }
      session.position++;
      showCard();
    }

    // Empties and closes the popup, whichever use it had. The browser can also
    // close it by itself (Escape, the back gesture on a phone): it sends "cancel"
    // at once and "close" a moment later, so the card is put back on "cancel"
    // and the list is never without it; "close" is the safety net.
    function emptyPopup() {
      if (!session && !current) return;
      returnCard();
      session = null;
      // The address no longer names a card.
      const url = new URL(window.location.href);
      if (cards.some(card => `#${card.id}` === url.hash)) {
        url.hash = "";
        window.history.replaceState(null, "", url);
      }
      filter({updateURL: false});
    }
    function stopStudy() {
      emptyPopup();
      if (el.study.open) el.study.close();
    }
    el.study.addEventListener("cancel", emptyPopup);
    // "close" arrives late: if the popup has been opened again by then (a card
    // clicked right after closing), it must not empty the new one.
    el.study.addEventListener("close", () => { if (!el.study.open) emptyPopup(); });

    // ---- Events ------------------------------------------------------------
    el.search.addEventListener("input", () => filter());
    // A filter row switches its value on or off; the first row ("All") clears the filter.
    // The menu stays open, so several values can be picked in one go.
    facets.forEach(facet => facet.buttons.forEach(button => button.addEventListener("click", () => {
      const value = button.dataset.value;
      if (!value) facet.chosen.clear();
      else if (!facet.chosen.delete(value)) facet.chosen.add(value);
      filter();
    })));
    el.picked.addEventListener("click", event => {
      const remove = event.target.closest("button[data-remove]");
      if (!remove) return;
      facets.find(facet => facet.key === remove.dataset.facet).chosen.delete(remove.dataset.remove);
      filter();
      el.search.focus({preventScroll: true});
    });
    // A menu closes when another one opens, on a click outside it, and on Escape.
    menus.forEach(menu => menu.addEventListener("toggle", () => { if (menu.open) closeMenus(menu); }));
    document.addEventListener("click", event => {
      menus.forEach(menu => { if (!menu.contains(event.target)) menu.open = false; });
    });
    root.addEventListener("keydown", event => {
      const menu = event.key === "Escape" && event.target.closest?.(".deck-menu[open]");
      if (!menu) return;
      menu.open = false;
      menu.querySelector("summary").focus();
    });
    // A subject link on a card filters the whole deck by that subject alone.
    root.addEventListener("click", event => {
      const link = event.target.closest("a[data-facet-link]");
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      stopStudy();
      facets.forEach(facet => { facet.chosen = new Set(facet.key === link.dataset.facetLink ? [link.dataset.value] : []); });
      filter();
      el.search.focus({preventScroll: true});
      root.scrollIntoView({block: "start"});
    });
    el.open.addEventListener("click", () => startStudy(cards.filter(card => !card.element.hidden)));
    // A card in the list opens large in the popup: click anywhere on it that is
    // not a control of its own (a subject, a layer's toggle), or use its title,
    // which is a link so that the keyboard can reach it. Selecting text does not count.
    cards.forEach(card => {
      const title = card.element.querySelector(".deck-card-title");
      const link = document.createElement("a");
      link.className = "deck-card-link";
      link.href = `#${card.id}`;
      link.append(...title.childNodes);
      title.append(link);
    });
    el.list.addEventListener("click", event => {
      const link = event.target.closest(".deck-card-link");
      if (!link && (event.target.closest("a, button, summary") || String(window.getSelection()))) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const card = cards.find(item => item.element === event.target.closest(".deck-card"));
      if (!card) return;
      event.preventDefault();
      readCard(card);
    });
    el.restart.addEventListener("click", () => startStudy(session.pool));
    el.done.addEventListener("click", stopStudy);
    // The dialog's own box fills it, so a click that lands on the dialog itself is on the dimmed page.
    el.study.addEventListener("click", event => { if (event.target === el.study) stopStudy(); });
    el.again.addEventListener("click", () => grade(false));
    el.good.addEventListener("click", () => grade(true));
    el.exit.addEventListener("click", stopStudy);
    // While studying, a click on the card (not on a control of its own, and not
    // a text selection) reveals its next layer, like turning a flashcard over.
    el.slot.tabIndex = -1;
    el.slot.addEventListener("click", event => {
      if (!session || !current || event.target.closest("a, button, summary") || String(window.getSelection())) return;
      revealNext();
    });
    document.addEventListener("keydown", event => {
      // Escape closes the popup in either use, at once.
      if (event.key === "Escape" && el.study.open) { stopStudy(); return; }
      if (!session || !current || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
      // Space reveals the next layer; 1 is "Learning", 2 is "Mastered".
      if (event.key === " " && !event.target.closest?.("button, summary, a")) {
        event.preventDefault();
        revealNext();
      } else if (event.key === "1") grade(false);
      else if (event.key === "2") grade(true);
    });
    window.addEventListener("popstate", () => { readURL(); revealAnchor(); });
    window.addEventListener("hashchange", revealAnchor);
    // Print every card with its answers, then restore what was open.
    let printState;
    window.addEventListener("beforeprint", () => {
      stopStudy(); // the studied card goes back into the list first
      printState = cards.map(card => card.details.map(details => details.open));
      setOpen(() => true);
    });
    window.addEventListener("afterprint", () => {
      if (printState) cards.forEach((card, i) => card.details.forEach((details, j) => { details.open = printState[i][j]; }));
    });

    restList();
    readURL();
    el.controls.hidden = false;
    revealAnchor();
  });
})();
