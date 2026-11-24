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

-- One facet = one panel with its name and a group of filter buttons, always
-- visible. `key` is both the URL parameter and the card attribute (`data-KEY`,
-- values separated by spaces).
-- facet = {key, label, all, values = {{value, text, hint}}}
local function facet_html(facet)
  local html = {'<div class="deck-panel">',
    '<p class="deck-panel-title">' .. M.escape(facet.label) .. '</p>',
    '<div class="deck-facet" role="group" aria-label="' .. M.escape(facet.label)
      .. '" data-facet="' .. facet.key .. '">',
    '<button type="button" data-value="" aria-pressed="true">' .. M.escape(facet.all) .. '</button>'}
  for _, item in ipairs(facet.values) do
    html[#html + 1] = '<button type="button" data-value="' .. M.escape(item.value) .. '" aria-pressed="false"'
      .. (item.hint and (' aria-label="' .. M.escape(item.hint) .. '"') or "") .. '>'
      .. M.escape(item.text) .. '</button>'
  end
  html[#html + 1] = '</div>\n</div>'
  return table.concat(html, "\n")
end

-- The controls: a search panel above the cards, and `.deck-side` holding the
-- filters and the study buttons, which deck.js moves into the page sidebar on
-- wide screens. They start hidden: without JavaScript the page is the plain
-- list of cards with every answer open.
-- deck = {name, search_label, placeholder, facets}
function M.controls(deck)
  local id = deck.name
  local html = {'<div class="deck-controls" hidden>',
    '<div class="deck-side">',
    '<div class="deck-panel">',
    '<label class="deck-panel-title" for="' .. id .. '-search">' .. M.escape(deck.search_label) .. '</label>',
    '<input id="' .. id .. '-search" class="deck-search" type="search" placeholder="'
      .. M.escape(deck.placeholder) .. '" autocomplete="off">'}
  html[#html + 1] = [[
<div class="deck-options">
<p class="deck-count" role="status" aria-live="polite"></p>
<button type="button" class="deck-reset">Clear filters</button>
</div>
</div>]]
  for _, facet in ipairs(deck.facets) do html[#html + 1] = facet_html(facet) end
  html[#html + 1] = [[
<div class="deck-panel">
<p class="deck-panel-title">Study</p>
<div class="deck-study-start">
<button type="button" class="deck-primary" data-study="due">Review due cards</button>
<button type="button" data-study="all">Study all as flashcards</button>
<button type="button" class="deck-forget" hidden>Reset progress</button>
</div>
<div class="deck-options">]]
  html[#html + 1] = '<label><input id="' .. id .. '-practice" class="deck-practice" type="checkbox"> Hide answers for practice</label>'
  html[#html + 1] = [[
</div>
</div>
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
  quarto.doc.add_html_dependency({name = "study-deck", version = "3.6.0",
    scripts = {{path = "deck.js", attribs = {defer = ""}}}, stylesheets = {"deck.css"}})
end

return M
