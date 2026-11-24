-- The generic half of the card deck on the glossary page (cards.lua fills it).
-- A deck is `<div class="deck" data-deck="NAME">` holding controls(), a
-- `.deck-list` of `.deck-card` elements, and footer(). deck.js adds search,
-- filters, practice and flashcard study; deck.css styles all of it.
local M = {}

function M.escape(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;")
    :gsub('"', "&quot;"):gsub("'", "&#39;"))
end

-- Plain text of a metadata value; "" when it is missing.
function M.text(value)
  return value and pandoc.utils.stringify(value) or ""
end

-- Checks subject tags and returns them sorted without duplicates.
function M.tags(list, owner)
  local tags, seen = {}, {}
  for _, tag in ipairs(list) do
    if not tag:match("^[a-z0-9][a-z0-9%-]*$") then error("Invalid tag '" .. tag .. "' on " .. owner) end
    if not seen[tag] then tags[#tags + 1] = tag; seen[tag] = true end
  end
  table.sort(tags)
  return tags
end

-- How a subject tag is shown to readers: "machine-learning" -> "Machine Learning".
function M.tag_label(tag)
  local words = tag:gsub("%-", " ")
  local label = words:gsub("(%a)(%w*)", function(first, rest) return first:upper() .. rest end)
  return label
end

-- Subject links on a card; deck.js turns a click into the subject filter.
function M.tag_links(tags)
  local html = {}
  for _, tag in ipairs(tags) do
    html[#html + 1] = '<a class="deck-tag" href="?tag=' .. tag .. '" data-facet-link="tag" data-value="'
      .. tag .. '">' .. M.escape(M.tag_label(tag)) .. '</a>'
  end
  return table.concat(html)
end

-- A row of a dropdown menu: a name on the left, a number of cards on the right.
local function row(attributes, text, count)
  return '<button type="button" ' .. attributes .. '><span>' .. M.escape(text) .. '</span><span class="deck-n">'
    .. (count or "") .. '</span></button>'
end

-- One facet = one dropdown menu. Its button names the filter and what is
-- chosen; its list has one row per value with the number of cards.
-- `key` is both the URL parameter and the card attribute (`data-KEY`, values
-- separated by spaces).
-- facet = {key, label, all, total, values = {{value, text, count}}}
local function facet_html(facet)
  local html = {'<details class="deck-menu">',
    '<summary>' .. M.escape(facet.label) .. ': <span class="deck-menu-state" data-facet-state="' .. facet.key .. '">'
      .. M.escape(facet.all) .. '</span></summary>',
    '<div class="deck-menu-panel" role="group" aria-label="' .. M.escape(facet.label)
      .. '" data-facet="' .. facet.key .. '">',
    row('data-value="" aria-pressed="true"', facet.all, facet.total)}
  for _, item in ipairs(facet.values) do
    html[#html + 1] = row('data-value="' .. M.escape(item.value) .. '" aria-pressed="false"', item.text, item.count)
  end
  html[#html + 1] = '</div>\n</details>'
  return table.concat(html, "\n")
end

-- The controls: one row above the cards with the search box, one menu per
-- filter, and the Study menu. Under it, only while a search or filter is on,
-- the number of cards shown and "Clear filters". They start hidden: without
-- JavaScript the page is the plain list of cards with every answer open.
-- deck = {name, search_label, placeholder, facets}
function M.controls(deck)
  local id = deck.name
  local html = {'<div class="deck-controls" hidden>',
    '<div class="deck-bar">',
    '<input id="' .. id .. '-search" class="deck-search" type="search" aria-label="' .. M.escape(deck.search_label)
      .. '" placeholder="' .. M.escape(deck.placeholder) .. '" autocomplete="off">'}
  for _, facet in ipairs(deck.facets) do html[#html + 1] = facet_html(facet) end
  html[#html + 1] = '<details class="deck-menu">\n<summary>Study</summary>\n<div class="deck-menu-panel">'
  html[#html + 1] = row('data-study="due"', "Due cards")
  html[#html + 1] = row('data-study="all"', "All shown cards")
  html[#html + 1] = '<label><input id="' .. id .. '-practice" class="deck-practice" type="checkbox"> Hide answers</label>'
  html[#html + 1] = [[
<button type="button" class="deck-forget" hidden>Reset progress</button>
</div>
</details>
</div>
<div class="deck-options">
<p class="deck-count" role="status" aria-live="polite"></p>
<button type="button" class="deck-reset" hidden>Clear filters</button>
</div>
</div>
<div class="deck-study" hidden>
<p class="deck-study-status" role="status" aria-live="polite"></p>
<progress class="deck-study-progress" value="0" max="1"></progress>
<button type="button" class="deck-study-exit">Back to all cards</button>
</div>]]
  return table.concat(html, "\n")
end

-- Flashcard buttons and the empty-search message, below the cards.
function M.footer()
  return [[
<div class="deck-study-actions" hidden>
<button type="button" class="deck-primary deck-study-reveal">Show answer</button>
<button type="button" class="deck-study-again">Again</button>
<button type="button" class="deck-primary deck-study-good">Got it</button>
<button type="button" class="deck-study-skip">Skip</button>
<p class="deck-hint">Keys: Space shows the next part · 1 again · 2 got it · → skip · Esc leaves.
<span class="deck-study-schedule"></span></p>
</div>
<p class="deck-empty" hidden>No matching cards. Try another search or clear the filters.</p>]]
end

function M.add_dependency()
  quarto.doc.add_html_dependency({name = "study-deck", version = "4.0.1",
    scripts = {{path = "deck.js", attribs = {defer = ""}}}, stylesheets = {"deck.css"}})
end

return M
