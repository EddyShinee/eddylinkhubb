import { useState, useEffect, useCallback } from 'react'
import { directFetch, isPgrst204BgOpacity } from '../lib/directFetch'
import { Category } from '../types'
import { useAuth } from '../contexts/AuthContext'

export function useCategories(boardId: string | null) {
  const { session } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!boardId || !session) {
      setCategories([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await directFetch<Category[]>(
        `categories?board_id=eq.${boardId}&order=sort_order.asc`,
        { accessToken: session.access_token }
      )

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [boardId, session])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const createCategory = async (data: { name: string; color: string; icon: string; bg_opacity?: number }) => {
    if (!boardId || !session) {
      console.error('No board selected when creating category')
      return { data: null, error: new Error('No board selected') }
    }

    try {
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.sort_order)) + 1 
        : 0

      console.log('Creating category:', { board_id: boardId, ...data, sort_order: maxOrder })
      
      const bodyWith = {
        board_id: boardId,
        name: data.name,
        color: data.color,
        icon: data.icon,
        bg_opacity: data.bg_opacity ?? 15,
        sort_order: maxOrder,
      }
      let result = await directFetch<Category[]>(
        'categories',
        { method: 'POST', body: bodyWith, accessToken: session.access_token }
      )
      if (result.error && isPgrst204BgOpacity(result.error)) {
        const { bg_opacity: _o, ...bodyWithout } = bodyWith
        result = await directFetch<Category[]>(
          'categories',
          { method: 'POST', body: bodyWithout, accessToken: session.access_token }
        )
      }
      const { data: newCategories, error } = result
      if (error) throw error
      
      const newCategory = Array.isArray(newCategories) ? newCategories[0] : newCategories
      if (newCategory) {
        console.log('Category created:', newCategory)
        setCategories([...categories, newCategory])
      }
      return { data: newCategory, error: null }
    } catch (err) {
      console.error('Error creating category:', err)
      return { data: null, error: err as Error }
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!session) return { error: new Error('Not authenticated') }
    
    try {
      const bodyWith = { ...updates, updated_at: new Date().toISOString() }
      let result = await directFetch(
        `categories?id=eq.${id}`,
        { method: 'PATCH', body: bodyWith, accessToken: session.access_token }
      )
      if (result.error && isPgrst204BgOpacity(result.error)) {
        const { bg_opacity: _o, ...rest } = updates
        result = await directFetch(
          `categories?id=eq.${id}`,
          { method: 'PATCH', body: { ...rest, updated_at: new Date().toISOString() }, accessToken: session.access_token }
        )
      }
      const { error } = result
      if (error) throw error
      if (updates.board_id !== undefined && updates.board_id !== boardId) {
        setCategories(categories.filter(c => c.id !== id))
      } else {
        setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c))
      }
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const deleteCategory = async (id: string) => {
    if (!session) return { error: new Error('Not authenticated') }
    
    try {
      const { error } = await directFetch(
        `categories?id=eq.${id}`,
        {
          method: 'DELETE',
          accessToken: session.access_token,
        }
      )

      if (error) throw error
      setCategories(categories.filter(c => c.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const reorderCategories = async (reorderedCategories: Category[]) => {
    if (!session) return { error: new Error('Not authenticated') }
    
    setCategories(reorderedCategories)
    
    try {
      for (let i = 0; i < reorderedCategories.length; i++) {
        await directFetch(
          `categories?id=eq.${reorderedCategories[i].id}`,
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

  const duplicateCategory = async (sourceCategory: Category) => {
    if (!boardId || !session) return { data: null, error: new Error('Not authenticated') }

    try {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 0
      const bodyWith = {
        board_id: boardId,
        name: `${sourceCategory.name} (copy)`,
        color: sourceCategory.color,
        icon: sourceCategory.icon,
        bg_opacity: sourceCategory.bg_opacity ?? 15,
        sort_order: maxOrder,
      }
      let catResult = await directFetch<Category[]>(
        'categories',
        { method: 'POST', body: bodyWith, accessToken: session.access_token }
      )
      if (catResult.error && isPgrst204BgOpacity(catResult.error)) {
        const { bg_opacity: _o, ...bodyWithout } = bodyWith
        catResult = await directFetch<Category[]>(
          'categories',
          { method: 'POST', body: bodyWithout, accessToken: session.access_token }
        )
      }
      if (catResult.error || !catResult.data?.length) throw catResult.error || new Error('Failed to create category')
      const newCategory = Array.isArray(catResult.data) ? catResult.data[0] : catResult.data

      const { data: sourceBookmarks, error: errBook } = await directFetch<{ url: string; title: string; description: string | null; tags: string[]; sort_order: number }[]>(
        `bookmarks?category_id=eq.${sourceCategory.id}&order=sort_order.asc`,
        { accessToken: session.access_token }
      )
      if (errBook) throw errBook
      const list = sourceBookmarks || []

      for (let j = 0; j < list.length; j++) {
        const b = list[j]
        await directFetch('bookmarks', {
          method: 'POST',
          body: {
            category_id: newCategory.id,
            url: b.url,
            title: b.title,
            description: b.description,
            tags: b.tags || [],
            sort_order: j,
          },
          accessToken: session.access_token,
        })
      }

      setCategories([...categories, newCategory])
      return { data: newCategory, error: null }
    } catch (err) {
      console.error('Error duplicating category:', err)
      return { data: null, error: err as Error }
    }
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    duplicateCategory,
  }
}
