import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards'
import { useCategories } from '../hooks/useCategories'
import { useBoardBookmarks } from '../hooks/useBookmarks'
import { useAuth } from '../contexts/AuthContext'
import { supabase, testConnection } from '../lib/supabase'
import { Category, Bookmark } from '../types'
import Sidebar from '../components/Layout/Sidebar'
import Header from '../components/Layout/Header'
import CategoryCard from '../components/Dashboard/CategoryCard'
import CategoryModal from '../components/Modals/CategoryModal'
import BookmarkModal from '../components/Modals/BookmarkModal'
import ITToolModal from '../components/Modals/ITToolModal'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'

export default function Dashboard() {
  const { t } = useTranslation()
  useAuth()
  const { backgroundColor, columnCount, categoryHeight } = useTheme()
  
  // Load last selected board from localStorage
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(() => {
    return localStorage.getItem('lastSelectedBoardId')
  })

  // Sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen')
    return saved !== 'false' // default to true
  })

  // Mobile: luôn 1 cột; desktop: dùng columnCount từ Settings
  const [effectiveColumnCount, setEffectiveColumnCount] = useState(columnCount)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setEffectiveColumnCount(mq.matches ? 1 : columnCount)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [columnCount])

  // Save selected board to localStorage when it changes
  useEffect(() => {
    if (selectedBoardId) {
      localStorage.setItem('lastSelectedBoardId', selectedBoardId)
    }
  }, [selectedBoardId])

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(sidebarOpen))
  }, [sidebarOpen])

  // Test connection on mount
  useEffect(() => {
    testConnection().then(ok => {
      if (!ok) {
        console.error('Cannot connect to Supabase!')
        alert('Không thể kết nối đến Supabase. Vui lòng kiểm tra kết nối mạng.')
      }
    })
  }, [])
  
  const { boards } = useBoards()
  const { categories, createCategory, updateCategory, deleteCategory, reorderCategories, duplicateCategory } = useCategories(selectedBoardId)
  const { bookmarksByCategory, refetch: refetchBookmarks } = useBoardBookmarks(selectedBoardId)

  const otherBoards = boards.filter(b => b.id !== selectedBoardId)

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [deletingBookmark, setDeletingBookmark] = useState<string | null>(null)
  const [showITToolModal, setShowITToolModal] = useState(false)

  // Khi có dropdown mở (category/bookmark menu), nâng z-index vùng content để popup không bị chìm dưới header
  const [contentDropdownOpenCount, setContentDropdownOpenCount] = useState(0)
  const contentDropdownCountRef = useRef(0)
  const handleContentDropdownOpenChange = useCallback((open: boolean) => {
    if (open) contentDropdownCountRef.current++
    else contentDropdownCountRef.current = Math.max(0, contentDropdownCountRef.current - 1)
    setContentDropdownOpenCount(contentDropdownCountRef.current)
  }, [])

  // Ẩn thanh cuộn trang khi mở menu 3 chấm (category hoặc bookmark)
  useEffect(() => {
    if (contentDropdownOpenCount > 0) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [contentDropdownOpenCount])

  // Handlers
  const handleCreateCategory = async (data: { name: string; color: string; icon: string; bg_opacity: number }) => {
    console.log('Creating category with data:', data, 'for board:', selectedBoardId)
    const result = await createCategory(data)
    console.log('Create category result:', result)
    if (result.error) {
      console.error('Error creating category:', result.error)
      alert(`Lỗi tạo danh mục: ${result.error.message}`)
    } else {
      setShowCategoryModal(false)
    }
  }

  const handleUpdateCategory = async (data: { name: string; color: string; icon: string; bg_opacity: number }) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data)
      setEditingCategory(null)
    }
  }

  const handleDeleteCategory = async () => {
    if (deletingCategory) {
      await deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
    }
  }

  const handleDuplicateCategory = async (category: Category) => {
    const result = await duplicateCategory(category)
    if (result.error) {
      alert(`Lỗi nhân bản danh mục: ${result.error.message}`)
      return
    }
    refetchBookmarks()
  }

  const handleMoveCategoryToBoard = async (category: Category, targetBoardId: string) => {
    const { error } = await updateCategory(category.id, { board_id: targetBoardId })
    if (error) {
      alert(`Lỗi di chuyển danh mục: ${error.message}`)
      return
    }
    refetchBookmarks()
  }

  const handleCreateBookmark = async (data: { url: string; title: string; description?: string; tags?: string[]; category_id?: string }) => {
    const categoryId = data.category_id || selectedCategoryId
    if (!categoryId) return

    await supabase
      .from('bookmarks')
      .insert({
        category_id: categoryId,
        url: data.url,
        title: data.title,
        description: data.description || null,
        tags: data.tags || [],
        sort_order: 0,
      })

    refetchBookmarks()
    setShowBookmarkModal(false)
    setSelectedCategoryId(null)
  }

  const handleUpdateBookmark = async (data: { url: string; title: string; description?: string; tags?: string[]; category_id?: string }) => {
    if (editingBookmark) {
      await supabase
        .from('bookmarks')
        .update({
          url: data.url,
          title: data.title,
          description: data.description || null,
          tags: data.tags || [],
          category_id: data.category_id || editingBookmark.category_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBookmark.id)

      refetchBookmarks()
      setEditingBookmark(null)
    }
  }

  const handleDeleteBookmark = async () => {
    if (deletingBookmark) {
      await supabase.from('bookmarks').delete().eq('id', deletingBookmark)
      refetchBookmarks()
      setDeletingBookmark(null)
    }
  }

  const handleDuplicateBookmark = async (bookmark: Bookmark) => {
    const list = bookmarksByCategory[bookmark.category_id] || []
    const maxOrder = list.length > 0 ? Math.max(...list.map(b => b.sort_order)) + 1 : 0
    await supabase.from('bookmarks').insert({
      category_id: bookmark.category_id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description || null,
      tags: bookmark.tags || [],
      sort_order: maxOrder,
    })
    refetchBookmarks()
  }

  const handleReorderBookmarks = async (_categoryId: string, reordered: Bookmark[]) => {
    const updates = reordered.map((bookmark, index) => ({
      id: bookmark.id,
      sort_order: index,
    }))

    for (const update of updates) {
      await supabase
        .from('bookmarks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }
    refetchBookmarks()
  }

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id)
      const newIndex = categories.findIndex(c => c.id === over.id)
      
      const newCategories = [...categories]
      const [removed] = newCategories.splice(oldIndex, 1)
      newCategories.splice(newIndex, 0, removed)
      
      reorderCategories(newCategories)
    }
  }

  return (
    <div 
      className="font-display text-text-primary h-screen overflow-hidden flex selection:bg-accent selection:text-white"
      style={{ backgroundColor }}
    >
      {/* Sidebar */}
      <Sidebar 
        selectedBoardId={selectedBoardId} 
        onSelectBoard={setSelectedBoardId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenITTool={() => setShowITToolModal(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Background overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundColor,
            backgroundImage: `linear-gradient(to bottom, ${backgroundColor}ee, ${backgroundColor})`,
          }}
        />

        {/* Header */}
        <Header 
          onSelectBoard={setSelectedBoardId}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Actions Bar */}
        <div className="px-6 py-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              disabled={!selectedBoardId}
              className="glass-panel dark:text-white text-gray-900 hover:bg-accent hover:border-accent hover:text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg transition-all flex items-center gap-1.5 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t('dashboard.createCategory')}
            </button>
            <button
              onClick={() => {
                setSelectedCategoryId(categories[0]?.id || null)
                setShowBookmarkModal(true)
              }}
              disabled={!selectedBoardId || categories.length === 0}
              className="glass-panel text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-black/5 text-xs font-medium px-3 py-1.5 rounded-md shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">bookmark_add</span>
              {t('dashboard.addBookmark')}
            </button>
          </div>
        </div>

        {/* Categories Grid - z-[60] khi có dropdown mở để popup không bị chìm dưới header */}
        <div className={`flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar transition-z-index ${contentDropdownOpenCount > 0 ? 'z-[60] relative' : 'z-10'}`}>
          {selectedBoardId ? (
            categories.length > 0 ? (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={categories.map(c => c.id)} strategy={rectSortingStrategy}>
                  <div 
                    className={categoryHeight === 'equal' ? 'grid gap-4 items-stretch' : 'gap-4 [&>div]:mb-4'}
                    style={categoryHeight === 'equal' ? { 
                      gridTemplateColumns: `repeat(${effectiveColumnCount}, minmax(0, 1fr))`,
                      gridAutoRows: '1fr',
                    } : {
                      columnCount: effectiveColumnCount,
                      columnGap: '1rem',
                      columnFill: 'balance',
                    }}
                  >
                    {categories.map(category => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        bookmarks={bookmarksByCategory[category.id] || []}
                        otherBoards={otherBoards}
                        onEditCategory={() => setEditingCategory(category)}
                        onDuplicateCategory={() => handleDuplicateCategory(category)}
                        onDeleteCategory={() => setDeletingCategory(category)}
                        onMoveToBoard={(targetBoardId) => handleMoveCategoryToBoard(category, targetBoardId)}
                        onAddBookmark={() => {
                          setSelectedCategoryId(category.id)
                          setShowBookmarkModal(true)
                        }}
                        onEditBookmark={setEditingBookmark}
                        onDuplicateBookmark={handleDuplicateBookmark}
                        onDeleteBookmark={setDeletingBookmark}
                        onReorderBookmarks={(reordered) => handleReorderBookmarks(category.id, reordered)}
                        onDropdownOpenChange={handleContentDropdownOpenChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-30">folder_open</span>
                <p className="text-lg">{t('dashboard.noCategories')}</p>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="mt-4 text-accent hover:text-accent/80 transition-colors"
                >
                  {t('dashboard.createCategory')}
                </button>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-text-muted">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-30">dashboard</span>
              <p className="text-lg">{t('dashboard.noBoards')}</p>
              <p className="text-sm mt-2">Select a board from the sidebar to get started</p>
            </div>
          )}
        </div>

      </main>

      {/* Create Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onSave={handleCreateCategory}
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleUpdateCategory}
        />
      )}

      {/* Delete Category Confirmation */}
      {deletingCategory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 dark:bg-black/60 bg-black/30 backdrop-blur-[4px]"
            onClick={() => setDeletingCategory(null)}
          />
          <div className="modal-animate relative w-full max-w-sm dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-2">{t('category.delete')}</h3>
            <p className="text-text-secondary text-sm mb-6">{t('category.deleteConfirm')}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 text-sm text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Bookmark Modal */}
      {showBookmarkModal && (
        <BookmarkModal
          categories={categories}
          selectedCategoryId={selectedCategoryId || undefined}
          onClose={() => {
            setShowBookmarkModal(false)
            setSelectedCategoryId(null)
          }}
          onSave={handleCreateBookmark}
        />
      )}

      {/* Edit Bookmark Modal */}
      {editingBookmark && (
        <BookmarkModal
          bookmark={editingBookmark}
          categories={categories}
          onClose={() => setEditingBookmark(null)}
          onSave={handleUpdateBookmark}
        />
      )}

      {/* Delete Bookmark Confirmation */}
      {deletingBookmark && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 dark:bg-black/60 bg-black/30 backdrop-blur-[4px]"
            onClick={() => setDeletingBookmark(null)}
          />
          <div className="modal-animate relative w-full max-w-sm dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-2">{t('bookmark.delete')}</h3>
            <p className="text-text-secondary text-sm mb-6">{t('bookmark.deleteConfirm')}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingBookmark(null)}
                className="px-4 py-2 text-sm text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteBookmark}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IT Tool Modal */}
      {showITToolModal && (
        <ITToolModal
          onClose={() => setShowITToolModal(false)}
        />
      )}
    </div>
  )
}
