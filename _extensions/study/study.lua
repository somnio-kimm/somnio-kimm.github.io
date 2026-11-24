-- Filter for the study notes. Both features read the cards in notes/study-notes/_cards/
-- (cards.lua) and are inactive on pages without their markup:
--   [text]{.term key="card-key"}   a bubble with the card's definition
--   ::: {.glossary-cards}          the glossary page: every card, with search and flashcards
-- Explicit annotations keep definitions out of equations, code and ordinary links.
-- [display text]{.term key="card-key" definition="Optional local wording."}
local deck = require("./deck")
local cards = require("./cards")

function Pandoc(doc)
  local html = quarto.doc.is_format("html:js")
  local count = 0

  doc = doc:walk({Div = function(div)
    if div.classes:includes("glossary-cards") then return cards.page() end
  end, Span = function(span)
    if not span.classes:includes("term") then return nil end
    local key = span.attributes.key
    local card = key and cards.get(key)
    if not card then error("Unknown study-card key: " .. (key or "<missing>")) end
    local label = card.label
    local definition = span.attributes.definition or card.text
    if definition == "" then error("Card '" .. key .. "' has no definition to show in a bubble") end
    count = count + 1

    if not html then
      local explanation = pandoc.Inlines({pandoc.Str(label .. ": " .. definition)})
      local content = span.content:clone()
      content:insert(pandoc.Note({pandoc.Para(explanation)}))
      return content
    end

    local id = "study-definition-" .. count
    local text = pandoc.write(pandoc.Pandoc({pandoc.Plain(span.content)}), "html")
      :gsub("\n$", "")
    return pandoc.RawInline("html",
      '<span class="study-term" data-term="' .. deck.escape(key) .. '">'
      .. '<span class="study-term-label">' .. text .. '</span>'
      .. '<span class="study-term-definition" id="' .. id .. '">'
      .. '<span class="study-term-heading">' .. deck.escape(label) .. '</span>'
      .. '<span class="study-term-text" id="' .. id .. '-text">' .. deck.escape(definition) .. '</span>'
      .. '</span></span>')
  end})

  if count > 0 and html then
    quarto.doc.add_html_dependency({name = "study-terms", version = "1.1.0",
      scripts = {{path = "study-terms.js", attribs = {defer = ""}}}, stylesheets = {"study-terms.css"}})
  end
  return doc
end
