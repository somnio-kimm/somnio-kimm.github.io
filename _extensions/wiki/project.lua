-- Project files and the generated wiki index, shared by the wiki and study filters.
local M = {}
local index

-- Absolute path of a project file. A single-page `quarto preview` can leave
-- quarto.project.directory nil; local extensions sit two levels below the root.
function M.path(relative)
  if quarto.project.directory then
    return pandoc.path.join({quarto.project.directory, relative})
  end
  return quarto.utils.resolve_path("../../" .. relative)
end

-- _wiki/wiki-index.json, written by _wiki/build_index.py before every render.
-- Returns false, after one warning, when the file is missing.
function M.wiki_index()
  if index == nil then
    local file = io.open(M.path("_wiki/wiki-index.json"), "r")
    if file then
      index = quarto.json.decode(file:read("a"))
      file:close()
    else
      quarto.log.warning("wiki: _wiki/wiki-index.json not found; wikilinks and related notes are unavailable")
      index = false
    end
  end
  return index
end

return M
