-- Explicit annotations keep definitions out of equations, code and ordinary links.
-- [display text]{.term key="glossary-key" definition="Optional local wording."}
local function escape(value)
  return value:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;")
    :gsub('"', "&quot;"):gsub("'", "&#39;")
end

local function value(field)
  return field and pandoc.utils.stringify(field) or nil
end

function Pandoc(doc)
  local glossary_path = quarto.project.directory .. "/notes/study-notes/_glossary.yml"
  local file = assert(io.open(glossary_path, "r"), "Cannot open study-note glossary")
  local source = file:read("*a")
  file:close()
  local glossary = pandoc.read("---\n" .. source .. "\n---\n", "markdown").meta
  local count = 0

  doc = doc:walk({Span = function(span)
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
  return doc
end
