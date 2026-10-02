-- Explicit annotations keep definitions out of equations, code and ordinary links.
-- [display text]{.term key="glossary-key" definition="Optional local wording."}
local cards = require('./glossary-cards')
local function escape(value)
  return value:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;")
    :gsub('"', "&quot;"):gsub("'", "&#39;")
end

local function value(field)
  return field and pandoc.utils.stringify(field) or nil
end

-- quarto preview leaves quarto.project.directory nil, so fall back to this
-- filter's own location: _extensions/study-terms sits at the project root.
local function glossary_path()
  local relative = "notes/study-notes/_glossary.yml"
  if quarto.project.directory then
    return quarto.project.directory .. "/" .. relative
  end
  return quarto.utils.resolve_path("../../" .. relative)
end

local function read_entries(path)
  local file = assert(io.open(path, "r"), "Cannot open study-note glossary: " .. path)
  local source = file:read("*a")
  file:close()
  -- YAML parsers can silently keep only the last duplicate key.
  local seen = {}
  for key in ("\n" .. source):gmatch("\n([%w%-]+):") do
    if seen[key] then error("Duplicate glossary key '" .. key .. "' in " .. path) end
    seen[key] = true
  end
  return pandoc.read("---\n" .. source .. "\n---\n", "markdown").meta
end

local function load_glossary()
  local path = glossary_path()
  local index = read_entries(path)
  -- Existing standalone glossaries remain supported.
  if not index.files then return index end
  local glossary = {}
  for _, relative in ipairs(index.files) do
    local topic_path = pandoc.path.join({pandoc.path.directory(path), value(relative)})
    for key, entry in pairs(read_entries(topic_path)) do
      if glossary[key] then error("Duplicate glossary key across topic files: " .. key) end
      glossary[key] = entry
    end
  end
  return glossary
end

function Pandoc(doc)
  local glossary = load_glossary()
  local count = 0
  local has_cards = false

  doc = doc:walk({Div = function(div)
    if not div.classes:includes("glossary-cards") then return nil end
    has_cards = true
    return cards.render(glossary, doc.meta)
  end, Span = function(span)
    if not span.classes:includes("term") then return nil end
    local key = span.attributes.key
    local entry = key and glossary[key]
    if not entry then error("Unknown study-note glossary key: " .. (key or "<missing>")) end
    local label = value(entry.label) or key
    local definition = span.attributes.definition or value(entry.definition)
    if not definition or definition == "" then error("Missing definition for: " .. key) end
    count = count + 1

    if not quarto.doc.is_format("html:js") then
      local explanation = pandoc.Inlines({pandoc.Str(label .. ": " .. definition)})
      local content = span.content:clone()
      content:insert(pandoc.Note({pandoc.Para(explanation)}))
      return content
    end

    local id = "study-definition-" .. count
    local text = pandoc.write(pandoc.Pandoc({pandoc.Plain(span.content)}), "html")
      :gsub("\n$", "")
    return pandoc.RawInline("html",
      '<span class="study-term" data-term="' .. escape(key) .. '">'
      .. '<span class="study-term-label">' .. text .. '</span>'
      .. '<span class="study-term-definition" id="' .. id .. '">'
      .. '<span class="study-term-heading">' .. escape(label) .. '</span>'
      .. '<span class="study-term-text" id="' .. id .. '-text">' .. escape(definition) .. '</span>'
      .. '</span></span>')
  end})

  if count > 0 and quarto.doc.is_format("html:js") then
    quarto.doc.add_html_dependency({
      name = "study-terms",
      version = "1.0.1",
      scripts = {{path = "study-terms.js", attribs = {defer = ""}}},
      stylesheets = {"study-terms.css"}
    })
  end
  if has_cards and quarto.doc.is_format("html:js") then
    quarto.doc.add_html_dependency({
      name = "glossary-cards",
      version = "1.0.0",
      scripts = {{path = "glossary-cards.js", attribs = {defer = ""}}},
      stylesheets = {"glossary-cards.css"}
    })
  end
  return doc
end
