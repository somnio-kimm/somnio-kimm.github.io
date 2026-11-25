-- Study cards: the one source for definition bubbles and the glossary page.
-- Every card is its own file, notes/study-notes/_cards/KEY.qmd. The file name
-- is the card's key, which a note's `.term` annotation names:
--
--   ---
--   title: convex function
--   tags: [mathematics]
--   ---
--
--   The definition: what the thing is, in plain text (shown in bubbles).
--
--   ## Prompt
--   What to recall.
--
--   ## Statement
--   The formal statement, with math: a mathematical definition or a claim.
--
--   ## Proof
--   Proof of the statement.
--
-- Only the title, the tags and the definition are needed; the three headed
-- sections are optional layers, in any order.
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

-- The subject tags of a card file: a YAML list, or one line of names.
local function tag_names(value)
  local names = {}
  if pandoc.utils.type(value) == "List" then
    for _, item in ipairs(value) do names[#names + 1] = pandoc.utils.stringify(item) end
  elseif value then
    for name in pandoc.utils.stringify(value):gmatch("[^%s,]+") do names[#names + 1] = name end
  end
  return names
end

-- Turns one card file (already parsed by pandoc) into a checked card record.
local function read_card(doc, file)
  local key = file:gsub("%.qmd$", "")
  local where = "card " .. file
  if not key:match("^[a-z0-9][a-z0-9%-]*$") then
    error("A card's file name is its key: lowercase letters, digits and hyphens only (" .. file .. ")")
  end
  local title = doc.meta.title
  if not title or pandoc.utils.stringify(title) == "" then error("No title in the header of " .. where) end
  if pandoc.utils.type(title) ~= "Inlines" then title = pandoc.Inlines(pandoc.utils.stringify(title)) end
  local card = {key = key, title = title, label = pandoc.utils.stringify(title),
    tags = deck.tags(tag_names(doc.meta.tags), where), definition = pandoc.Blocks({})}
  if #card.tags == 0 then error("No subject tags in the header of " .. where) end

  -- Text before the first H2 is the definition; each H2 opens one of the layers.
  local part = "definition"
  for _, block in ipairs(doc.blocks) do
    if block.t == "Header" and block.level == 2 then
      part = nil
      local heading = pandoc.utils.stringify(block)
      for _, name in ipairs(PARTS) do
        if heading:lower() == name then part = name end
      end
      if not part then error("Unknown section '" .. heading .. "' in " .. where .. ": use Prompt, Statement or Proof") end
      if card[part] then error("Two " .. heading .. " sections in " .. where) end
      card[part] = pandoc.Blocks({})
    else
      card[part]:insert(block)
    end
  end
  for _, name in ipairs(PARTS) do
    if card[name] and #card[name] == 0 then error("Empty " .. name .. " section in " .. where) end
  end

  -- The definition is what a bubble shows, so it has to read as plain text.
  card.definition:walk({
    Math = function() error("Put equations in the Statement section, not in the definition of " .. where) end,
    Link = function() error("The definition cannot contain links: " .. where) end,
  })
  card.text = plain(card.definition)
  if card.text == "" and not card.statement then error("No definition or Statement section in " .. where) end
  if card.proof and not card.statement then error("A Proof section needs a Statement section to prove in " .. where) end
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
      local card = read_card(pandoc.read(file:read("a"), "markdown"), name)
      file:close()
      by_key[card.key] = card
      cards[#cards + 1] = card
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

-- A card shows its own layers only. Which notes annotate it stays in the wiki
-- index (`terms` of each page, from _wiki/build_index.py); the glossary does not list them.
local function card_html(card)
  local title = pandoc.write(pandoc.Pandoc({pandoc.Plain(card.title)}), "html"):gsub("\n$", "")
  local blocks = pandoc.Blocks({
    raw('<h2 class="deck-card-title">' .. title .. '</h2>'),
    raw('<p class="deck-card-meta">' .. deck.tag_links(card.tags) .. '</p>'),
  })
  if card.prompt then blocks:insert(pandoc.Div(card.prompt, pandoc.Attr("", {"concept-prompt"}))) end
  layer(blocks, card.definition, "concept-definition", "Definition", false)
  layer(blocks, card.statement, "concept-statement", "Statement", true)
  layer(blocks, card.proof, "concept-proof", "Proof", true)
  return pandoc.Div(blocks, pandoc.Attr("term-" .. card.key, {"deck-card", "concept-card"}, {
    ["data-tag"] = table.concat(card.tags, " "),
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
function M.page()
  local html = quarto.doc.is_format("html:js")
  local list, all_tags, per_tag = pandoc.Blocks({}), {}, {}
  for _, card in ipairs(M.all()) do
    for _, tag in ipairs(card.tags) do
      all_tags[#all_tags + 1] = tag
      per_tag[tag] = (per_tag[tag] or 0) + 1
    end
    list:insert(html and card_html(card) or card_plain(card))
  end
  if not html then return pandoc.Div(list) end

  local tag_values = {}
  for _, tag in ipairs(deck.tags(all_tags, "the cards")) do
    tag_values[#tag_values + 1] = {value = tag, text = deck.tag_label(tag), count = per_tag[tag]}
  end
  deck.add_dependency()
  return pandoc.Div({
    raw(deck.controls({
      name = "glossary",
      search_label = "Search cards",
      placeholder = "Search " .. #list .. " cards",
      facets = {
        {key = "tag", label = "Subject", all = "All", total = #list, values = tag_values},
      },
    })),
    pandoc.Div(list, pandoc.Attr("", {"deck-list", "deck-grid"})),
    raw(deck.footer()),
  }, pandoc.Attr("", {"deck"}, {["data-deck"] = "glossary"}))
end

return M
