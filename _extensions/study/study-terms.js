/* Progressive enhancement: the source HTML contains every definition. */
(() => {
  let active = null;
  let closeTimer;

  function cancelClose() { window.clearTimeout(closeTimer); }

  function position(item) {
    const anchor = item.button.getBoundingClientRect();
    const box = item.panel.getBoundingClientRect();
    const margin = 12;
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const left = Math.max(margin, Math.min(anchor.left, width - box.width - margin));
    const below = anchor.bottom + 8;
    const above = anchor.top - box.height - 8;
    const top = below + box.height <= height - margin ? below : Math.max(margin, above);
    item.panel.style.left = `${left}px`;
    item.panel.style.top = `${top}px`;
  }

  function close({restoreFocus = false} = {}) {
    cancelClose();
    if (!active) return;
    const item = active;
    active = null;
    item.panel.hidden = true;
    item.button.setAttribute("aria-expanded", "false");
    item.pinned = false;
    if (restoreFocus) {
      item.ignoreFocus = true;
      item.button.focus({preventScroll: true});
      item.ignoreFocus = false;
    }
  }

  function open(item) {
    cancelClose();
    if (active !== item) close();
    active = item;
    item.panel.hidden = false;
    item.button.setAttribute("aria-expanded", "true");
    position(item);
  }

  function scheduleClose(item) {
    cancelClose();
    closeTimer = window.setTimeout(() => {
      if (active === item && !item.pinned && !item.root.contains(document.activeElement)) close();
    }, 220);
  }

  document.querySelectorAll(".study-term").forEach(root => {
    const label = root.querySelector(":scope > .study-term-label");
    const panel = root.querySelector(":scope > .study-term-definition");
    if (!label || !panel) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = label.className;
    button.append(...label.childNodes);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panel.id);
    button.setAttribute("aria-describedby", `${panel.id}-text`);
    label.replaceWith(button);
    panel.hidden = true;
    panel.setAttribute("role", "note");
    panel.setAttribute("aria-label", `Definition: ${panel.querySelector(".study-term-heading").textContent}`);
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "study-term-close";
    dismiss.setAttribute("aria-label", "Close definition");
    dismiss.textContent = "×";
    panel.append(dismiss);
    root.classList.add("study-term-ready");
    const item = {root, button, panel, pinned: false, ignoreFocus: false};

    button.addEventListener("pointerenter", event => {
      if (event.pointerType !== "touch") open(item);
    });
    button.addEventListener("pointerleave", () => scheduleClose(item));
    panel.addEventListener("pointerenter", cancelClose);
    panel.addEventListener("pointerleave", () => scheduleClose(item));
    button.addEventListener("focus", () => { if (!item.ignoreFocus) open(item); });
    button.addEventListener("click", () => {
      if (active === item && item.pinned) close();
      else { open(item); item.pinned = true; }
    });
    root.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (active === item && !root.contains(document.activeElement)) close();
      }, 0);
    });
    dismiss.addEventListener("click", () => close({restoreFocus: true}));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && active) {
      const restoreFocus = active.panel.contains(document.activeElement);
      event.preventDefault();
      close({restoreFocus});
    }
  });
  document.addEventListener("pointerdown", event => {
    if (active && !active.root.contains(event.target)) close();
  });
  window.addEventListener("resize", () => { if (active) position(active); });
  document.addEventListener("scroll", () => { if (active) position(active); }, true);
})();
