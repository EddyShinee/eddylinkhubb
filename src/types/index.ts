export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  locale: 'vi' | 'en'
  background_color: string
  created_at: string
  updated_at: string
}

export interface Board {
  id: string
  user_id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  board_id: string
  name: string
  color: string
  icon: string
  bg_opacity: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  category_id: string
  url: string
  title: string
  description: string | null
  tags: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SearchResult {
  type: 'board' | 'category' | 'bookmark'
  id: string
  name: string
  boardId?: string
  boardName?: string
  categoryId?: string
  categoryName?: string
  url?: string
}

// Import types
export interface ImportedBookmark {
  url: string
  title: string
  description?: string
  tags?: string[]
}

export interface ImportedCategory {
  name: string
  color?: string
  icon?: string
  bookmarks: ImportedBookmark[]
}

export interface ImportedBoard {
  name: string
  categories: ImportedCategory[]
}

export interface ImportData {
  boards: ImportedBoard[]
}
