import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { SearchResult } from '../types'
import { useAuth } from '../contexts/AuthContext'

export function useSearch() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (searchQuery: string) => {
    if (!user || !searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const searchTerm = `%${searchQuery.toLowerCase()}%`
      
      // Search boards
      const { data: boards } = await supabase
        .from('boards')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', searchTerm)

      // Search categories with board info
      const { data: categories } = await supabase
        .from('categories')
        .select(`
          id, 
          name,
          board_id,
          boards!inner(id, name, user_id)
        `)
        .eq('boards.user_id', user.id)
        .ilike('name', searchTerm)

      // Search bookmarks with category and board info
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select(`
          id,
          url,
          title,
          description,
          category_id,
          categories!inner(
            id,
            name,
            board_id,
            boards!inner(id, name, user_id)
          )
        `)
        .eq('categories.boards.user_id', user.id)
        .or(`title.ilike.${searchTerm},url.ilike.${searchTerm},description.ilike.${searchTerm}`)

      const searchResults: SearchResult[] = []

      // Add board results
      boards?.forEach(board => {
        searchResults.push({
          type: 'board',
          id: board.id,
          name: board.name,
        })
      })

      // Add category results
      categories?.forEach((category: any) => {
        searchResults.push({
          type: 'category',
          id: category.id,
          name: category.name,
          boardId: category.board_id,
          boardName: category.boards?.name,
        })
      })

      // Add bookmark results
      bookmarks?.forEach((bookmark: any) => {
        searchResults.push({
          type: 'bookmark',
          id: bookmark.id,
          name: bookmark.title,
          url: bookmark.url,
          categoryId: bookmark.category_id,
          categoryName: bookmark.categories?.name,
          boardId: bookmark.categories?.board_id,
          boardName: bookmark.categories?.boards?.name,
        })
      })

      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(() => {
      search(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, search])

  const clearSearch = () => {
    setQuery('')
    setResults([])
  }

  return {
    query,
    setQuery,
    results,
    loading,
    clearSearch,
  }
}
