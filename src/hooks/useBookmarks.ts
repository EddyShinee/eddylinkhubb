import { useState, useEffect, useCallback } from 'react'
import { directFetch } from '../lib/directFetch'
import { Bookmark } from '../types'
import { useAuth } from '../contexts/AuthContext'

export function useBookmarks(categoryId: string | null) {
  const { session } = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBookmarks = useCallback(async () => {
    if (!categoryId || !session) {
      setBookmarks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await directFetch<Bookmark[]>(
        `bookmarks?category_id=eq.${categoryId}&order=sort_order.asc`,
        { accessToken: session.access_token }
      )

      if (error) throw error
      setBookmarks(data || [])
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [categoryId, session])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const createBookmark = async (data: {
    url: string
    title: string
    description?: string
    tags?: string[]
  }) => {
    if (!categoryId || !session) return { error: new Error('No category selected') }

    try {
      const maxOrder = bookmarks.length > 0 
        ? Math.max(...bookmarks.map(b => b.sort_order)) + 1 
        : 0

      const { data: newBookmarks, error } = await directFetch<Bookmark[]>(
        'bookmarks',
        {
          method: 'POST',
          body: {
            category_id: categoryId,
            url: data.url,
            title: data.title,
            description: data.description || null,
            tags: data.tags || [],
            sort_order: maxOrder,
          },
          accessToken: session.access_token,
        }
      )

      if (error) throw error
      const newBookmark = Array.isArray(newBookmarks) ? newBookmarks[0] : newBookmarks
      if (newBookmark) {
        setBookmarks([...bookmarks, newBookmark])
      }
      return { data: newBookmark, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  const updateBookmark = async (id: string, updates: Partial<Bookmark>) => {
    if (!session) return { error: new Error('Not authenticated') }
    
    try {
      const { error } = await directFetch(
        `bookmarks?id=eq.${id}`,
        {
          method: 'PATCH',
          body: { ...updates, updated_at: new Date().toISOString() },
          accessToken: session.access_token,
        }
      )

      if (error) throw error
      setBookmarks(bookmarks.map(b => b.id === id ? { ...b, ...updates } : b))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const deleteBookmark = async (id: string) => {
    if (!session) return { error: new Error('Not authenticated') }
    
    try {
      const { error } = await directFetch(
        `bookmarks?id=eq.${id}`,
        {
          method: 'DELETE',
          accessToken: session.access_token,
        }
      )

      if (error) throw error
      setBookmarks(bookmarks.filter(b => b.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const reorderBookmarks = async (reorderedBookmarks: Bookmark[]) => {
    if (!session) return { error: new Error('Not authenticated') }
    
    setBookmarks(reorderedBookmarks)
    
    try {
      for (let i = 0; i < reorderedBookmarks.length; i++) {
        await directFetch(
          `bookmarks?id=eq.${reorderedBookmarks[i].id}`,
          {
            method: 'PATCH',
            body: { sort_order: i },
            accessToken: session.access_token,
          }
        )
      }
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return {
    bookmarks,
    loading,
    error,
    fetchBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
  }
}

// Hook to get all bookmarks for a board (used in category cards)
export function useBoardBookmarks(boardId: string | null) {
  const { session } = useAuth()
  const [bookmarksByCategory, setBookmarksByCategory] = useState<Record<string, Bookmark[]>>({})
  const [loading, setLoading] = useState(true)

  const fetchAllBookmarks = useCallback(async () => {
    if (!boardId || !session) {
      setBookmarksByCategory({})
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // First get all categories for this board
      const { data: categories } = await directFetch<{ id: string }[]>(
        `categories?board_id=eq.${boardId}&select=id`,
        { accessToken: session.access_token }
      )

      if (!categories || categories.length === 0) {
        setBookmarksByCategory({})
        setLoading(false)
        return
      }

      const categoryIds = categories.map(c => c.id)
      
      const { data: bookmarks } = await directFetch<Bookmark[]>(
        `bookmarks?category_id=in.(${categoryIds.join(',')})&order=sort_order.asc`,
        { accessToken: session.access_token }
      )

      const grouped: Record<string, Bookmark[]> = {}
      bookmarks?.forEach(bookmark => {
        if (!grouped[bookmark.category_id]) {
          grouped[bookmark.category_id] = []
        }
        grouped[bookmark.category_id].push(bookmark)
      })

      setBookmarksByCategory(grouped)
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
    } finally {
      setLoading(false)
    }
  }, [boardId, session])

  useEffect(() => {
    fetchAllBookmarks()
  }, [fetchAllBookmarks])

  return { bookmarksByCategory, loading, refetch: fetchAllBookmarks }
}
