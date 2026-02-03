import { ImportData, ImportedBoard, ImportedCategory, ImportedBookmark } from '../types'

/**
 * Parse bookmark file (JSON or HTML) into ImportData format
 */
export function parseBookmarkFile(content: string, isHtml: boolean): ImportData {
  if (isHtml) {
    return parseNetscapeBookmarks(content)
  }
  return parseJsonBookmarks(content)
}

/**
 * Parse JSON bookmark file
 * Expected format:
 * {
 *   "boards": [
 *     {
 *       "name": "Board Name",
 *       "categories": [
 *         {
 *           "name": "Category Name",
 *           "color": "#818CF8",
 *           "icon": "folder",
 *           "bookmarks": [
 *             { "url": "https://...", "title": "Title", "description": "...", "tags": ["tag1", "tag2"] }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
function parseJsonBookmarks(content: string): ImportData {
  try {
    const data = JSON.parse(content)
    
    // Validate structure
    if (!data.boards || !Array.isArray(data.boards)) {
      throw new Error('Invalid JSON format: expected "boards" array')
    }

    return {
      boards: data.boards.map((board: any) => ({
        name: board.name || 'Imported Board',
        categories: (board.categories || []).map((cat: any) => ({
          name: cat.name || 'Imported Category',
          color: cat.color || '#818CF8',
          icon: cat.icon || 'folder',
          bookmarks: (cat.bookmarks || []).map((bm: any) => ({
            url: bm.url || '',
            title: bm.title || bm.url || 'Untitled',
            description: bm.description || undefined,
            tags: bm.tags || undefined,
          })).filter((bm: ImportedBookmark) => bm.url),
        })),
      })),
    }
  } catch (error) {
    console.error('Error parsing JSON bookmarks:', error)
    throw new Error('Invalid JSON format')
  }
}

/**
 * Parse Netscape Bookmark HTML format (Chrome, Safari, Firefox export)
 * Structure:
 * - Top-level folders become BOARDS
 * - Second-level folders become CATEGORIES
 * - Links inside categories become BOOKMARKS
 */
function parseNetscapeBookmarks(content: string): ImportData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  
  const boards: ImportedBoard[] = []

  // Find the main DL element
  const mainDl = doc.querySelector('dl')
  if (!mainDl) {
    // No structured folders, create single board with all links
    const allLinks = doc.querySelectorAll('a')
    if (allLinks.length > 0) {
      const uncategorizedBoard: ImportedBoard = {
        name: 'Imported Bookmarks',
        categories: [{
          name: 'Uncategorized',
          bookmarks: [],
        }],
      }
      allLinks.forEach(link => {
        const url = link.getAttribute('href')
        if (url && url.startsWith('http')) {
          uncategorizedBoard.categories[0].bookmarks.push({
            url,
            title: link.textContent?.trim() || url,
          })
        }
      })
      if (uncategorizedBoard.categories[0].bookmarks.length > 0) {
        boards.push(uncategorizedBoard)
      }
    }
    return { boards }
  }

  // Parse top-level folders as boards
  const topLevelDts = mainDl.querySelectorAll(':scope > dt')
  
  topLevelDts.forEach(dt => {
    const h3 = dt.querySelector(':scope > h3')
    const link = dt.querySelector(':scope > a')
    
    if (h3) {
      // This is a top-level folder = BOARD
      const boardName = h3.textContent?.trim() || 'Unnamed Board'
      const board: ImportedBoard = {
        name: boardName,
        categories: [],
      }
      
      const nestedDl = dt.querySelector(':scope > dl')
      if (nestedDl) {
        // Parse second-level items
        parseSecondLevel(nestedDl, board)
      }
      
      // Only add board if it has categories with bookmarks
      if (board.categories.length > 0) {
        boards.push(board)
      }
    } else if (link) {
      // Top-level bookmark without folder - add to "Uncategorized" board
      const url = link.getAttribute('href')
      if (url && url.startsWith('http')) {
        let uncatBoard = boards.find(b => b.name === 'Uncategorized')
        if (!uncatBoard) {
          uncatBoard = { name: 'Uncategorized', categories: [] }
          boards.push(uncatBoard)
        }
        let uncatCategory = uncatBoard.categories.find(c => c.name === 'Uncategorized')
        if (!uncatCategory) {
          uncatCategory = { name: 'Uncategorized', bookmarks: [] }
          uncatBoard.categories.push(uncatCategory)
        }
        uncatCategory.bookmarks.push({
          url,
          title: link.textContent?.trim() || url,
        })
      }
    }
  })

  return { boards }
}

/**
 * Parse second-level items: folders become categories, links go to "General" category
 */
function parseSecondLevel(dl: Element, board: ImportedBoard): void {
  const items = dl.querySelectorAll(':scope > dt')
  const generalCategory: ImportedCategory = {
    name: 'General',
    bookmarks: [],
  }

  items.forEach(dt => {
    const h3 = dt.querySelector(':scope > h3')
    const link = dt.querySelector(':scope > a')
    
    if (h3) {
      // This is a second-level folder = CATEGORY
      const categoryName = h3.textContent?.trim() || 'Unnamed Category'
      const category: ImportedCategory = {
        name: categoryName,
        color: getRandomColor(),
        bookmarks: [],
      }
      
      const nestedDl = dt.querySelector(':scope > dl')
      if (nestedDl) {
        // Collect all bookmarks from this category and its subfolders
        collectAllBookmarks(nestedDl, category)
      }
      
      if (category.bookmarks.length > 0) {
        board.categories.push(category)
      }
    } else if (link) {
      // Direct link at second level - add to "General" category
      const url = link.getAttribute('href')
      if (url && url.startsWith('http')) {
        generalCategory.bookmarks.push({
          url,
          title: link.textContent?.trim() || url,
        })
      }
    }
  })

  // Add general category if it has bookmarks
  if (generalCategory.bookmarks.length > 0) {
    board.categories.unshift(generalCategory)
  }
}

/**
 * Recursively collect all bookmarks from a DL element and its nested folders
 */
function collectAllBookmarks(dl: Element, category: ImportedCategory): void {
  const items = dl.querySelectorAll(':scope > dt')
  
  items.forEach(dt => {
    const h3 = dt.querySelector(':scope > h3')
    const link = dt.querySelector(':scope > a')
    
    if (h3) {
      // Subfolder - recursively collect its bookmarks
      const nestedDl = dt.querySelector(':scope > dl')
      if (nestedDl) {
        collectAllBookmarks(nestedDl, category)
      }
    } else if (link) {
      // Bookmark
      const url = link.getAttribute('href')
      if (url && url.startsWith('http')) {
        category.bookmarks.push({
          url,
          title: link.textContent?.trim() || url,
        })
      }
    }
  })
}

/**
 * Get a random color for category
 */
function getRandomColor(): string {
  const colors = [
    '#818CF8', // Indigo
    '#F472B6', // Pink
    '#34D399', // Emerald
    '#FBBF24', // Amber
    '#60A5FA', // Blue
    '#A78BFA', // Violet
    '#F87171', // Red
    '#4ADE80', // Green
    '#FB923C', // Orange
    '#22D3EE', // Cyan
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
