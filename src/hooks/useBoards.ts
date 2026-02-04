import { useState, useEffect, useCallback } from 'react'
import { directFetch, isPgrst204BgOpacity } from '../lib/directFetch'
import { Board } from '../types'
import { useAuth } from '../contexts/AuthContext'

export function useBoards() {
  const { user, session } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBoards = useCallback(async () => {
    if (!user || !session) {
      setBoards([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('Fetching boards via direct fetch...')
      
      const { data, error } = await directFetch<Board[]>(
        `boards?user_id=eq.${user.id}&order=sort_order.asc`,
        { accessToken: session.access_token }
      )

      console.log('Boards response:', { data, error })
      if (error) throw error
      setBoards(data || [])
    } catch (err) {
      console.error('Error fetching boards:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user, session])

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  const createBoard = async (name: string) => {
    if (!user || !session) return { error: new Error('Not authenticated') }

    try {
      console.log('Creating board via direct fetch:', name)
      const maxOrder = boards.length > 0 
        ? Math.max(...boards.map(b => b.sort_order)) + 1 
        : 0

      const { data, error } = await directFetch<Board[]>(
        'boards',
        {
          method: 'POST',
          body: {
            user_id: user.id,
            name,
            sort_order: maxOrder,
          },
          accessToken: session.access_token,
        }
      )

      console.log('Create board response:', { data, error })
      if (error) throw error
      
      const newBoard = Array.isArray(data) ? data[0] : data
      if (newBoard) {
        setBoards([...boards, newBoard])
      }
      return { data: newBoard, error: null }
    } catch (err) {
      console.error('Error creating board:', err)
      alert(`Lỗi tạo board: ${(err as Error).message}`)
      return { data: null, error: err as Error }
    }
  }

  const updateBoard = async (id: string, updates: Partial<Board>) => {
    if (!session) return { error: new Error('Not authenticated') }
    
    try {
      const { error } = await directFetch(
        `boards?id=eq.${id}`,
        {
          method: 'PATCH',
          body: { ...updates, updated_at: new Date().toISOString() },
          accessToken: session.access_token,
        }
      )

      if (error) throw error
      setBoards(boards.map(b => b.id === id ? { ...b, ...updates } : b))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const deleteBoard = async (id: string) => {
    if (!session) return { error: new Error('Not authenticated') }
    
    try {
      const { error } = await directFetch(
        `boards?id=eq.${id}`,
        {
          method: 'DELETE',
          accessToken: session.access_token,
        }
      )

      if (error) throw error
      setBoards(boards.filter(b => b.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const reorderBoards = async (reorderedBoards: Board[]) => {
    if (!session) return { error: new Error('Not authenticated') }
    
    setBoards(reorderedBoards)
    
    try {
      for (let i = 0; i < reorderedBoards.length; i++) {
        await directFetch(
          `boards?id=eq.${reorderedBoards[i].id}`,
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

  const duplicateBoard = async (sourceBoard: Board) => {
    if (!user || !session) return { data: null, error: new Error('Not authenticated') }

    try {
      const maxOrder = boards.length > 0 ? Math.max(...boards.map(b => b.sort_order)) + 1 : 0
      const { data: boardResp, error: errBoard } = await directFetch<Board | Board[]>(
        'boards',
        {
          method: 'POST',
          body: {
            user_id: user.id,
            name: `${sourceBoard.name} (copy)`,
            sort_order: maxOrder,
          },
          accessToken: session.access_token,
        }
      )
      if (errBoard) throw errBoard
      const newBoard = Array.isArray(boardResp) ? boardResp[0] : boardResp
      if (!newBoard?.id) throw new Error('Tạo board mới thất bại')

      const { data: catResp, error: errCat } = await directFetch<{ id: string; name: string; color: string; icon: string; bg_opacity: number; sort_order: number }[] | { id: string; name: string; color: string; icon: string; bg_opacity: number; sort_order: number }>(
        `categories?board_id=eq.${sourceBoard.id}&order=sort_order.asc`,
        { accessToken: session.access_token }
      )
      if (errCat) throw errCat
      const categories = Array.isArray(catResp) ? catResp : catResp ? [catResp] : []
      const categoryIdMap: Record<string, string> = {}

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i]
        const bodyWith = {
          board_id: newBoard.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          bg_opacity: cat.bg_opacity ?? 15,
          sort_order: i,
        }
        let result = await directFetch<{ id: string } | { id: string }[]>(
          'categories',
          { method: 'POST', body: bodyWith, accessToken: session.access_token }
        )
        if (result.error && isPgrst204BgOpacity(result.error)) {
          const { bg_opacity: _, ...bodyWithout } = bodyWith
          result = await directFetch<{ id: string } | { id: string }[]>(
            'categories',
            { method: 'POST', body: bodyWithout, accessToken: session.access_token }
          )
        }
        if (result.error) throw result.error
        const created = Array.isArray(result.data) ? result.data[0] : result.data
        if (created?.id) categoryIdMap[cat.id] = created.id
      }

      for (const oldCatId of Object.keys(categoryIdMap)) {
        const newCatId = categoryIdMap[oldCatId]
        const { data: bookmarksResp, error: errBook } = await directFetch<{ url: string; title: string; description: string | null; tags: string[]; sort_order: number }[] | { url: string; title: string; description: string | null; tags: string[]; sort_order: number }>(
          `bookmarks?category_id=eq.${oldCatId}&order=sort_order.asc`,
          { accessToken: session.access_token }
        )
        if (errBook) throw errBook
        const list = Array.isArray(bookmarksResp) ? bookmarksResp : bookmarksResp ? [bookmarksResp] : []
        for (let j = 0; j < list.length; j++) {
          const b = list[j]
          const { error: errB } = await directFetch('bookmarks', {
            method: 'POST',
            body: {
              category_id: newCatId,
              url: b.url,
              title: b.title,
              description: b.description ?? null,
              tags: b.tags ?? [],
              sort_order: j,
            },
            accessToken: session.access_token,
          })
          if (errB) throw errB
        }
      }

      await fetchBoards()
      return { data: newBoard, error: null }
    } catch (err) {
      console.error('Error duplicating board:', err)
      return { data: null, error: err as Error }
    }
  }

  return {
    boards,
    loading,
    error,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    reorderBoards,
    duplicateBoard,
  }
}
