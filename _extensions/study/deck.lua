-- The generic half of the card deck on the glossary page (cards.lua fills it).
-- A deck is `<div class="deck" data-deck="NAME">` holding controls(), a
-- `.deck-list` of `.deck-card` elements, and footer(). deck.js adds search,
-- filters and the flashcard popup; deck.css styles all of it.
local M = {}

function M.escape(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;")
    :gsub('"', "&quot;"):gsub("'", "&#39;"))
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

-- One facet = one dropdown menu. Its button names the filter and shows how
-- many values are chosen (the badge keeps its width when empty, so the button
-- never changes size); its list has one row per value with the number of cards.
-- `key` is both the URL parameter and the card attribute (`data-KEY`, values
-- separated by spaces).
-- facet = {key, label, all, total, values = {{value, text, count}}}
local function facet_html(facet)
  local html = {'<details class="deck-menu">',
    '<summary>' .. M.escape(facet.label) .. ' <span class="deck-badge" data-facet-count="' .. facet.key
      .. '" data-zero></span></summary>',
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
-- filter, and the Study button, which opens the flashcard popup. Under it,
-- while a filter is on: one removable chip per chosen value, on one line that
-- scrolls sideways. The controls start hidden: without JavaScript the page is
-- the plain list of cards with every answer open.
-- deck = {name, search_label, placeholder, facets}
function M.controls(deck)
  local html = {'<div class="deck-controls" hidden>',
    '<div class="deck-bar">',
    '<input id="' .. deck.name .. '-search" class="deck-search" type="search" aria-label="' .. M.escape(deck.search_label)
      .. '" placeholder="' .. M.escape(deck.placeholder) .. '" autocomplete="off">'}
  for _, facet in ipairs(deck.facets) do html[#html + 1] = facet_html(facet) end
  -- The Study button is an icon: two cards lying on each other, which fan
  -- out under the pointer (deck.css). deck.js gives it its label.
  html[#html + 1] = [[
<button type="button" class="deck-study-open" aria-label="Study" title="Study">
<span class="deck-stack" aria-hidden="true"><span></span><span></span></span>
</button>
</div>
<div class="deck-picked"></div>
</div>]]
  return table.concat(html, "\n")
end

-- Below the cards: the empty-search message, and the popup. The popup is a
-- <dialog> that deck.js opens over the page; while it is open the card being
-- read or studied is moved into `.deck-study-card` and back afterwards.
-- A study session has two answers per card: "Learning" brings the card back at
-- the end of the round, "Mastered" does not. The card's layers are revealed by
-- clicking the card or with Space.
function M.footer()
  return [[
<p class="deck-empty" hidden>No matching cards. Try another search, or choose All under Subject.</p>
<dialog class="deck-study" aria-label="Study">
<div class="deck-study-box">
<div class="deck-study-head">
<p class="deck-study-status" role="status" aria-live="polite"></p>
<progress class="deck-study-progress" value="0" max="1"></progress>
<button type="button" class="deck-study-exit" aria-label="Close">×</button>
</div>
<div class="deck-study-card"></div>
<div class="deck-study-actions">
<button type="button" class="deck-study-again">Learning</button>
<button type="button" class="deck-primary deck-study-good">Mastered</button>
<button type="button" class="deck-study-restart">Study again</button>
<button type="button" class="deck-primary deck-study-done">Back to the cards</button>
</div>
</div>
</dialog>]]
end

function M.add_dependency()
  quarto.doc.add_html_dependency({name = "study-deck", version = "4.3.0",
    scripts = {{path = "deck.js", attribs = {defer = ""}}}, stylesheets = {"deck.css"}})
end

return M
