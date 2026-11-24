-- Study cards: the one source for definition bubbles and the glossary page.
-- Every card lives in notes/study-notes/_cards/*.qmd:
--
-- :::: {.concept-card key="convex-function" tags="mathematics"}
-- ## convex function
--
-- Definition: what the thing is, in plain text (shown in bubbles).
--
-- ::: {.concept-prompt} What to recall. :::
-- ::: {.concept-statement} The formal statement, with math: a mathematical definition or a claim. :::
-- ::: {.concept-proof} Proof of the statement. :::
-- ::::
--
-- Only the title and the definition are needed; the statement and the proof are optional layers.
local deck = require("./deck")
local project = require("../wiki/project")
local M = {}

local DIRECTORY = "notes/study-notes/_cards"
local PARTS = {"prompt", "statement", "proof"}
local cards, by_key

-- Plain text of blocks, paragraphs joined by a space.
local function plain(blocks)
  local texts = {}
  for _, block in ipairs(blocks) do texts[#texts + 1] = pandoc.utils.stringify(block) end
  return table.concat(texts, " ")
end

-- Turns one `.concept-card` Div into a checked card record.
local function read_card(div, file)
  local key = div.attributes.key or ""
  local where = "card '" .. key .. "' in " .. file
  if not key:match("^[a-z0-9][a-z0-9%-]*$") then error("Invalid or missing key on " .. where) end
  if div.attributes.kind then error("Card types are no longer used: remove the kind attribute from " .. where) end
  local title = div.content[1]
  if not title or title.t ~= "Header" or title.level ~= 2 then error("An H2 title must come first in " .. where) end
  local list = {}
  for tag in (div.attributes.tags or ""):gmatch("%S+") do list[#list + 1] = tag end
  local card = {key = key, title = title.content, label = pandoc.utils.stringify(title),
    tags = deck.tags(list, where), definition = pandoc.Blocks({})}
  if #card.tags == 0 then error("No subject tags on " .. where) end

  for i = 2, #div.content do
    local block, part = div.content[i], nil
    for _, name in ipairs(PARTS) do
      if block.t == "Div" and block.classes:includes("concept-" .. name) then part = name end
    end
    if not part then
      card.definition:insert(block)
    elseif card[part] then
      error("Two concept-" .. part .. " blocks in " .. where)
    elseif #block.content == 0 then
      error("Empty concept-" .. part .. " in " .. where)
    else
      card[part] = block.content
    end
  end

  -- The definition is what a bubble shows, so it has to read as plain text.
  card.definition:walk({
    Math = function() error("Put equations in concept-statement, not in the definition of " .. where) end,
    Link = function() error("The definition cannot contain links: " .. where) end,
  })
  card.text = plain(card.definition)
  if card.text == "" and not card.statement then error("No definition or concept-statement in " .. where) end
  if card.proof and not card.statement then error("A concept-proof needs a concept-statement to prove in " .. where) end
  -- Which formal layers the card has; the page can filter on these.
  card.layers = {}
  if card.statement then card.layers[#card.layers + 1] = "statement" end
  if card.proof then card.layers[#card.layers + 1] = "proof" end
  return card
end

-- All cards sorted by label. Read once, on the first page that needs them.
function M.all()
  if cards then return cards end
  cards, by_key = {}, {}
  local directory = project.path(DIRECTORY)
  local files = pandoc.system.list_directory(directory)
  table.sort(files)
  for _, name in ipairs(files) do
    if name:match("%.qmd$") then
      local file = assert(io.open(pandoc.path.join({directory, name}), "r"))
      local doc = pandoc.read(file:read("a"), "markdown")
      file:close()
      for _, block in ipairs(doc.blocks) do
        if block.t == "Div" and block.classes:includes("concept-card") then
          local card = read_card(block, name)
          if by_key[card.key] then error("Duplicate card key '" .. card.key .. "' in " .. name) end
          by_key[card.key] = card
          cards[#cards + 1] = card
        elseif block.t ~= "RawBlock" then
          -- Usually a fence that closed early or was never opened.
          error("Text outside a card in " .. name .. ": " .. pandoc.utils.stringify(block):sub(1, 60))
        end
      end
    end
  end
  table.sort(cards, function(a, b) return a.label:lower() < b.label:lower() end)
  return cards
end

-- The card for a glossary key, or nil.
function M.get(key)
  M.all()
  return by_key[key]
end

-- Notes that annotate each card with `.term`, from the wiki index. Drafts are
-- listed only when the site is rendered with `draft-mode: visible`.
local function related_notes(meta)
  local index = project.wiki_index()
  if not index then return {} end
  local visible = deck.text(meta["draft-mode"] or (meta.website and meta.website["draft-mode"])) == "visible"
  local notes = {}
  for rel, page in pairs(index.pages) do
    if not rel:match("/index%.qmd$") and not rel:match("/template%.qmd$") and (visible or not page.draft) then
      for _, key in ipairs(page.terms or {}) do
        notes[key] = notes[key] or {}
        table.insert(notes[key], {title = page.title, path = rel, draft = page.draft})
      end
    end
  end
  for _, list in pairs(notes) do
    table.sort(list, function(a, b) return a.title:lower() < b.title:lower() end)
  end
  return notes
end

local function raw(html) return pandoc.RawBlock("html", html) end

-- One layer of a card. In HTML it is a native disclosure; `collapsed` layers
-- (formal text and proofs) start closed in the list when JavaScript is on.
local function layer(blocks, content, class, label, collapsed)
  if not content or #content == 0 then return end
  local inner = pandoc.Blocks({raw('<details open' .. (collapsed and ' data-collapsed' or '') .. '><summary>'
    .. label .. '</summary>')})
  inner:extend(content)
  inner:insert(raw('</details>'))
  blocks:insert(pandoc.Div(inner, pandoc.Attr("", {class})))
end

local function card_html(card, notes)
  local title = pandoc.write(pandoc.Pandoc({pandoc.Plain(card.title)}), "html"):gsub("\n$", "")
  local blocks = pandoc.Blocks({
    raw('<h2 class="deck-card-title">' .. title .. '</h2>'),
    raw('<p class="deck-card-meta">' .. deck.tag_links(card.tags) .. '</p>'),
  })
  if card.prompt then blocks:insert(pandoc.Div(card.prompt, pandoc.Attr("", {"concept-prompt"}))) end
  layer(blocks, card.definition, "concept-definition", "Definition", false)
  layer(blocks, card.statement, "concept-statement", "Statement", true)
  layer(blocks, card.proof, "concept-proof", "Proof", true)
  if notes then
    local html = {'<div class="concept-related"><h3>Related notes</h3><ul>'}
    for _, note in ipairs(notes) do
      html[#html + 1] = '<li><a href="/' .. deck.escape(note.path:gsub("%.qmd$", ".html")) .. '">'
        .. deck.escape(note.title) .. '</a>' .. (note.draft and ' <span class="concept-draft">(draft)</span>' or '') .. '</li>'
    end
    html[#html + 1] = '</ul></div>'
    blocks:insert(raw(table.concat(html, "\n")))
  end
  return pandoc.Div(blocks, pandoc.Attr("term-" .. card.key, {"deck-card", "concept-card"}, {
    ["data-has"] = table.concat(card.layers, " "),
    ["data-tag"] = table.concat(card.tags, " "),
    ["data-letter"] = card.label:sub(1, 1):upper(),
  }))
end

-- Other formats get the same content as plain headings and paragraphs.
local function card_plain(card)
  local blocks = pandoc.Blocks({pandoc.Header(2, card.title), pandoc.Para(table.concat(card.tags, " · "))})
  blocks:extend(card.prompt or {})
  blocks:extend(card.definition)
  for _, part in ipairs({{card.statement, "Statement"}, {card.proof, "Proof"}}) do
    if part[1] then
      blocks:insert(pandoc.Header(3, part[2]))
      blocks:extend(part[1])
    end
  end
  return pandoc.Div(blocks)
end

-- Replaces `::: {.glossary-cards}` with every card, A–Z, and the deck controls.
function M.page(meta)
  local html = quarto.doc.is_format("html:js")
  local notes = html and related_notes(meta) or {}
  local list, used_layers, all_tags = pandoc.Blocks({}), {}, {}
  for _, card in ipairs(M.all()) do
    for _, name in ipairs(card.layers) do used_layers[name] = true end
    for _, tag in ipairs(card.tags) do all_tags[#all_tags + 1] = tag end
    list:insert(html and card_html(card, notes[card.key]) or card_plain(card))
  end
  if not html then return pandoc.Div(list) end

  local letters, layer_values, tag_values = {}, {}, {}
  for code = string.byte("A"), string.byte("Z") do
    local letter = string.char(code)
    letters[#letters + 1] = {value = letter, text = letter, hint = "Cards starting with " .. letter}
  end
  for _, name in ipairs({"statement", "proof"}) do
    if used_layers[name] then layer_values[#layer_values + 1] = {value = name, text = "With " .. name} end
  end
  for _, tag in ipairs(deck.tags(all_tags, "the cards")) do
    tag_values[#tag_values + 1] = {value = tag, text = "#" .. tag}
  end
  deck.add_dependency()
  return pandoc.Div({
    raw(deck.controls({
      name = "glossary",
      search_label = "Search cards",
      placeholder = "e.g. latent, convex, expectation, robotics",
      hint = "Search titles, definitions, statements, proofs, tags, and related notes. Results stay in A–Z order.",
      practice_label = "Hide answers for practice",
      facets = {
        {key = "letter", label = "Browse by first letter", all = "All", values = letters, compact = true},
        {key = "has", label = "Filter by content", all = "All cards", values = layer_values},
        {key = "tag", label = "Filter by tag", all = "All tags", values = tag_values, collapsible = true},
      },
    })),
    pandoc.Div(list, pandoc.Attr("", {"deck-list", "deck-grid"})),
    raw(deck.footer()),
  }, pandoc.Attr("", {"deck"}, {["data-deck"] = "glossary"}))
end

return M
