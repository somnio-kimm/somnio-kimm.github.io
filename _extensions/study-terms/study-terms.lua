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
    local href = span.attributes.href or value(entry.href)
    if href then
      if not href:match("^/notes/.*%.qmd") then
        error("Glossary links must point to a /notes/...qmd source: " .. href)
      end
      -- make_relative only strips a matching parent; it does not create ../
      -- paths between sibling subject folders. Build an offset to the site root.
      local input = pandoc.path.make_relative(quarto.doc.input_file, quarto.project.directory)
      local directory = pandoc.path.directory(input)
      local offset = ""
      if directory ~= "." then
        for _ in directory:gmatch("[^/\\]+") do offset = offset .. "../" end
      end
      href = offset .. href:sub(2)
    end
    count = count + 1

    if not quarto.doc.is_format("html:js") then
      local explanation = pandoc.Inlines({pandoc.Str(label .. ": " .. definition)})
      if href then
        explanation:insert(pandoc.Space())
        explanation:insert(pandoc.Link("Read more", href))
      end
      local content = span.content:clone()
      content:insert(pandoc.Note({pandoc.Para(explanation)}))
      return content
    end

    local id = "study-definition-" .. count
    local text = pandoc.write(pandoc.Pandoc({pandoc.Plain(span.content)}), "html")
      :gsub("\n$", "")
    local link = ""
    if href then
      href = href:gsub("%.qmd", ".html", 1)
      link = '<a class="study-term-more" href="' .. escape(href) .. '">Read more'
        .. '<span class="study-term-sr-only"> about ' .. escape(label) .. '</span></a>'
    end
    return pandoc.RawInline("html",
      '<span class="study-term" data-term="' .. escape(key) .. '">'
      .. '<span class="study-term-label">' .. text .. '</span>'
      .. '<span class="study-term-definition" id="' .. id .. '">'
      .. '<span class="study-term-heading">' .. escape(label) .. '</span>'
      .. '<span class="study-term-text" id="' .. id .. '-text">' .. escape(definition) .. '</span>'
      .. link .. '</span></span>')
  end})

  if count > 0 and quarto.doc.is_format("html:js") then
    quarto.doc.add_html_dependency({
      name = "study-terms",
      version = "1.0.0",
      scripts = {{path = "study-terms.js", attribs = {defer = ""}}},
      stylesheets = {"study-terms.css"}
    })
  end
  return doc
end
