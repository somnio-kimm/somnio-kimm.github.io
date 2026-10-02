local M = {}

local function escape(s)
  return s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;")
    :gsub('"', "&quot;"):gsub("'", "&#39;")
end

local function value(v)
  return v and pandoc.utils.stringify(v) or ""
end

local function related_notes(meta)
  local path = quarto.project.directory
    and (quarto.project.directory .. "/_wiki/wiki-index.json")
    or quarto.utils.resolve_path("../../_wiki/wiki-index.json")
  local file = io.open(path, "r")
  if not file then
    quarto.log.warning("glossary: wiki index missing; related notes unavailable")
    return {}
  end
  local index = quarto.json.decode(file:read("*a"))
  file:close()
  local mode = value(meta["draft-mode"] or (meta.website and meta.website["draft-mode"]))
  local notes = {}
  for rel, page in pairs(index.pages) do
    if not rel:match("/index%.qmd$") and not rel:match("/template%.qmd$")
      and (not page.draft or mode == "visible") then
      for _, key in ipairs(page.terms or {}) do
        notes[key] = notes[key] or {}
        notes[key][#notes[key] + 1] = {title = page.title, path = rel, draft = page.draft}
      end
    end
  end
  for _, list in pairs(notes) do
    table.sort(list, function(a, b) return a.title:lower() < b.title:lower() end)
  end
  return notes
end

function M.render(glossary, meta)
  local entries, all_tags = {}, {}
  for key, entry in pairs(glossary) do
    if not key:match("^[a-z0-9][a-z0-9%-]*$") then error("Invalid glossary key: " .. key) end
    local label, definition = value(entry.label), value(entry.definition)
    if label == "" or definition == "" then error("Missing glossary label/definition: " .. key) end
    local tags, seen = {}, {}
    if entry.tags then
      if pandoc.utils.type(entry.tags) ~= "List" then error("Glossary tags must be a list: " .. key) end
      for _, tag in ipairs(entry.tags) do
        local name = value(tag)
        if not name:match("^[a-z0-9][a-z0-9%-]*$") then error("Invalid glossary tag: " .. name) end
        if not seen[name] then tags[#tags + 1] = name; seen[name] = true end
        all_tags[name] = true
      end
    end
    table.sort(tags)
    entries[#entries + 1] = {key = key, label = label, definition = definition, tags = tags}
  end
  table.sort(entries, function(a, b) return a.label:lower() < b.label:lower() end)

  if not quarto.doc.is_format("html:js") then
    local blocks = pandoc.Blocks({})
    for _, entry in ipairs(entries) do
      blocks:insert(pandoc.Header(2, entry.label))
      blocks:insert(pandoc.Para(entry.definition))
      if #entry.tags > 0 then blocks:insert(pandoc.Para("Tags: " .. table.concat(entry.tags, ", "))) end
    end
    return pandoc.Div(blocks)
  end

  local notes = related_notes(meta)
  local html = {'<div class="glossary-browser">',
    '<div class="glossary-controls" hidden>',
    '<label for="glossary-search">Search terms, definitions, tags, or related notes</label>',
    '<input id="glossary-search" type="search" placeholder="e.g. latent, mathematics, robotics" autocomplete="off">',
    '<div class="glossary-options"><label><input id="glossary-practice" type="checkbox"> Hide definitions for practice</label>',
    '<button type="button" class="glossary-reset">Clear filters</button></div>',
    '<details class="glossary-tag-picker" open><summary>Filter by tag</summary>',
    '<div class="glossary-filters" role="group" aria-label="Filter by tag">',
    '<button type="button" data-filter="" aria-pressed="true">All tags</button>'}
  local sorted_tags = {}
  for tag in pairs(all_tags) do sorted_tags[#sorted_tags + 1] = tag end
  table.sort(sorted_tags)
  for _, tag in ipairs(sorted_tags) do
    html[#html + 1] = '<button type="button" data-filter="' .. tag .. '" aria-pressed="false">#' .. tag .. '</button>'
  end
  html[#html + 1] = '</div></details><p class="glossary-count" role="status" aria-live="polite"></p></div>'
  html[#html + 1] = '<div class="glossary-grid">'
  for _, entry in ipairs(entries) do
    html[#html + 1] = '<article class="glossary-card" id="term-' .. entry.key
      .. '" data-key="' .. entry.key .. '" data-tags="' .. escape(quarto.json.encode(entry.tags)) .. '">'
      .. '<h2 class="glossary-card-title">' .. escape(entry.label) .. '</h2><div class="glossary-card-tags">'
    for _, tag in ipairs(entry.tags) do
      html[#html + 1] = '<a class="glossary-tag" href="?tag=' .. tag .. '" data-tag="' .. tag .. '">#' .. tag .. '</a>'
    end
    html[#html + 1] = '</div><details class="glossary-definition" open><summary>Definition</summary><p>'
      .. escape(entry.definition) .. '</p></details>'
    if notes[entry.key] then
      html[#html + 1] = '<div class="glossary-related"><h3>Related notes</h3><ul>'
      for _, note in ipairs(notes[entry.key]) do
        html[#html + 1] = '<li><a href="/' .. escape(note.path:gsub("%.qmd$", ".html")) .. '">'
          .. escape(note.title) .. '</a>' .. (note.draft and ' <span class="glossary-draft">(draft)</span>' or '') .. '</li>'
      end
      html[#html + 1] = '</ul></div>'
    end
    html[#html + 1] = '</article>'
  end
  html[#html + 1] = '</div><p class="glossary-empty" hidden>No matching cards. Try another word or clear the filters.</p></div>'
  return pandoc.RawBlock("html", table.concat(html, "\n"))
end

return M
