--[==[
Wiki filter: [[wikilinks]] and a "Linked from" (backlinks) section.

Syntax (Pandoc's wikilinks_title_after_pipe, enabled in _quarto.yml):
  [[diffusion]]                   page by file name
  [[theory/flow-matching]]        path suffix, when a name is ambiguous
  [[Flow Matching]]               page title (case-insensitive)
  [[elbo#derivation|the ELBO]]    anchor and display text

The index comes from _wiki/build_index.py (a pre-render step).
Unknown targets render as plain text and log a warning; links to drafts
render as plain text so production pages never point to a missing page.
]==]

local index, current

local function normalise(s)
  s = pandoc.text.lower(s)
  s = s:gsub("^%s+", ""):gsub("%s+$", ""):gsub("[%s_]+", "-")
  return s
end

local function load_index()
  if index ~= nil then return index end
  local dir = quarto.project.directory
  local f = dir and io.open(pandoc.path.join({dir, "_wiki", "wiki-index.json"}), "r")
  if not f then
    quarto.log.warning("wiki: _wiki/wiki-index.json not found; wikilinks left as text")
    index = false
    return index
  end
  index = quarto.json.decode(f:read("a"))
  f:close()
  current = pandoc.path.make_relative(quarto.doc.input_file, dir)
  return index
end

local function common_prefix(a, b)
  local sa, sb, n = {}, {}, 0
  for p in a:gmatch("[^/]+") do sa[#sa + 1] = p end
  for p in b:gmatch("[^/]+") do sb[#sb + 1] = p end
  while sa[n + 1] and sa[n + 1] == sb[n + 1] do n = n + 1 end
  return n
end

local function resolve(target)
  local cands = index.keys[normalise(target)]
  if not cands or #cands == 0 then return nil, false end
  if #cands == 1 then return cands[1], false end
  local best, score = nil, -1
  for _, c in ipairs(cands) do
    local s = common_prefix(current, c)
    if s > score then best, score = c, s end
  end
  return best, true
end

local function missing(content, cls)
  return pandoc.Span(content, pandoc.Attr("", {cls}))
end

function Link(el)
  -- Pandoc 3 marks wikilinks with class "wikilink" (older versions used the title)
  local is_wiki = el.classes:includes("wikilink") or el.title == "wikilink"
  if not is_wiki then return nil end
  el.classes = el.classes:filter(function(c) return c ~= "wikilink" end)
  if not load_index() then return missing(el.content, "wikilink-missing") end
  local target, anchor = el.target, ""
  local hash = target:find("#", 1, true)
  if hash then target, anchor = target:sub(1, hash - 1), target:sub(hash) end
  local path, ambiguous = resolve(target)
  if not path then
    quarto.log.warning("wiki: unresolved wikilink [[" .. el.target .. "]] in " .. current)
    return missing(el.content, "wikilink-missing")
  end
  if ambiguous then
    quarto.log.warning("wiki: [[" .. target .. "]] is ambiguous in " .. current ..
      "; using " .. path .. " (write a longer path to choose)")
  end
  local page = index.pages[path]
  -- A published page must not link to a hidden draft; a draft page (seen only
  -- in preview) may.
  local here = index.pages[current]
  if page.draft and not (here and here.draft) then
    return missing(el.content, "wikilink-draft")
  end
  el.target = "/" .. path .. anchor
  el.title = page.title
  el.classes:insert("wikilink")
  -- [[name]] without display text: show the page title instead of the raw key
  if pandoc.utils.stringify(el.content) == el.target:sub(2) or
     pandoc.utils.stringify(el.content) == target then
    el.content = pandoc.Inlines(page.title .. (anchor ~= "" and (" § " .. anchor:sub(2)) or ""))
  end
  return el
end

function Pandoc(doc)
  if not quarto.doc.is_format("html") or not load_index() then return doc end
  if current:match("index%.qmd$") then return doc end
  local sources = index.backlinks[current]
  if not sources then return doc end
  local items = {}
  local here = index.pages[current]
  local show_drafts = here and here.draft
  for _, src in ipairs(sources) do
    local page = index.pages[src]
    if page and (show_drafts or not page.draft) then
      items[#items + 1] = {pandoc.Plain({pandoc.Link(page.title, "/" .. src)})}
    end
  end
  if #items == 0 then return doc end
  doc.blocks:insert(pandoc.Div({
    pandoc.Header(2, "Linked from", pandoc.Attr("linked-from", {"unnumbered"})),
    pandoc.BulletList(items),
  }, pandoc.Attr("", {"wiki-backlinks"})))
  return doc
end

return {
  {Link = Link},
  {Pandoc = Pandoc},
}
