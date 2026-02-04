import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Category, Bookmark, Board } from '../../types'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTheme } from '../../contexts/ThemeContext'

interface SortableBookmarkItemProps {
  bookmark: Bookmark
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onMenuOpenChange?: (open: boolean) => void
}

function SortableBookmarkItem({ bookmark, onEdit, onDuplicate, onDelete, onMenuOpenChange }: SortableBookmarkItemProps) {
  const { openInNewTab } = useTheme()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: bookmark.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; right: number; maxHeight: number }>({ right: 0, maxHeight: 280 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuContainerRef = useRef<HTMLDivElement>(null)

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      const right = window.innerWidth - rect.right
      const gap = 8
      if (spaceAbove > spaceBelow) {
        setMenuPosition({ bottom: window.innerHeight - rect.top + 4, right, maxHeight: Math.max(100, spaceAbove - gap) })
      } else {
        setMenuPosition({ top: rect.bottom + 4, right, maxHeight: Math.max(100, spaceBelow - gap) })
      }
    }
    setShowMenu(true)
  }

  useEffect(() => {
    onMenuOpenChange?.(showMenu)
    return () => onMenuOpenChange?.(false)
  }, [showMenu, onMenuOpenChange])

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleClick = () => {
    if (!showMenu) {
      if (openInNewTab) {
        window.open(bookmark.url, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = bookmark.url
      }
    }
  }

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 mx-0.5 rounded-md hover:bg-white/10 transition-all duration-200 group/item cursor-pointer"
        onClick={handleClick}
      >
        <div {...listeners} className="cursor-grab">
          <span className="material-symbols-outlined text-sm text-text-muted opacity-0 group-hover/item:opacity-100 transition-opacity">
            drag_indicator
          </span>
        </div>
        <span className="material-symbols-outlined text-sm text-blue-400">bookmark</span>
        <span className="text-xs font-medium text-text-secondary dark:group-hover/item:text-white group-hover/item:text-gray-900 transition-colors flex-1 truncate">
          {bookmark.title}
        </span>
        <div className="relative">
          <button
            ref={triggerRef}
            onClick={(e) => {
              e.stopPropagation()
              if (showMenu) setShowMenu(false)
              else openMenu()
            }}
            className="text-text-muted dark:hover:text-white hover:text-gray-900 opacity-0 group-hover/item:opacity-100 p-0.5 transition-opacity"
          >
            <span className="material-icons-round text-xs">more_vert</span>
          </button>
          {showMenu && createPortal(
            <>
              <div 
                className="fixed inset-0 z-[9998]" 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }}
                aria-hidden
              />
              <div 
                ref={menuContainerRef}
                className="fixed w-28 dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-md shadow-lg z-[9999] py-0.5 overflow-y-auto custom-scrollbar"
                style={{
                  ...(menuPosition.top != null ? { top: menuPosition.top } : { bottom: menuPosition.bottom }),
                  right: menuPosition.right,
                  maxHeight: menuPosition.maxHeight,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                    setShowMenu(false)
                  }}
                  className="w-full px-2 py-1.5 text-left text-xs text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate()
                    setShowMenu(false)
                  }}
                  className="w-full px-2 py-1.5 text-left text-xs text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100"
                >
                  Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full px-2 py-1.5 text-left text-xs text-red-400 hover:text-red-300 dark:hover:bg-white/5 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </>,
            document.body
          )}
        </div>
      </div>
    </li>
  )
}

interface CategoryCardProps {
  category: Category
  bookmarks: Bookmark[]
  otherBoards?: Board[]
  onEditCategory: () => void
  onDuplicateCategory: () => void
  onDeleteCategory: () => void
  onMoveToBoard?: (targetBoardId: string) => void
  onAddBookmark: () => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDuplicateBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (bookmarkId: string) => void
  onReorderBookmarks: (bookmarks: Bookmark[]) => void
  onDropdownOpenChange?: (open: boolean) => void
}

export default function CategoryCard({
  category,
  bookmarks,
  otherBoards = [],
  onEditCategory,
  onDuplicateCategory,
  onDeleteCategory,
  onMoveToBoard,
  onAddBookmark,
  onEditBookmark,
  onDuplicateBookmark,
  onDeleteBookmark,
  onReorderBookmarks,
  onDropdownOpenChange,
}: CategoryCardProps) {
  useTranslation() // For future use
  const [showMenu, setShowMenu] = useState(false)
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; right: number; maxHeight: number }>({ right: 0, maxHeight: 320 })
  const [bookmarkMenuOpenCount, setBookmarkMenuOpenCount] = useState(0)
  const categoryMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const categoryMenuRef = useRef<HTMLDivElement>(null)
  const isAnyDropdownOpen = showMenu || bookmarkMenuOpenCount > 0

  const openCategoryMenu = () => {
    const rect = categoryMenuTriggerRef.current?.getBoundingClientRect()
    if (rect) {
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      const right = window.innerWidth - rect.right
      const gap = 8
      if (spaceAbove > spaceBelow) {
        setMenuPosition({
          bottom: window.innerHeight - rect.top + 4,
          right,
          maxHeight: Math.max(120, spaceAbove - gap),
        })
      } else {
        setMenuPosition({
          top: rect.bottom + 4,
          right,
          maxHeight: Math.max(120, spaceBelow - gap),
        })
      }
    }
    setShowMoveSubmenu(false)
    setShowMenu(true)
  }

  useEffect(() => {
    onDropdownOpenChange?.(isAnyDropdownOpen)
    return () => onDropdownOpenChange?.(false)
  }, [isAnyDropdownOpen, onDropdownOpenChange])

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node) && !categoryMenuTriggerRef.current?.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleBookmarkMenuOpenChange = useCallback((open: boolean) => {
    setBookmarkMenuOpenCount(prev => open ? prev + 1 : Math.max(0, prev - 1))
  }, [])

  // Make this category card sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = bookmarks.findIndex(b => b.id === active.id)
      const newIndex = bookmarks.findIndex(b => b.id === over.id)
      
      const newBookmarks = arrayMove(bookmarks, oldIndex, newIndex)
      onReorderBookmarks(newBookmarks)
    }
  }

  // Convert hex to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
  }

  const bgOpacity = category.bg_opacity ?? 15
  const bgColor = hexToRgba(category.color, bgOpacity)

  return (
    <div 
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: bgColor,
      }}
      {...attributes}
      className={`rounded-xl shadow-glass group dark:hover:border-white/10 hover:border-gray-300 transition-colors duration-300 flex flex-col min-h-0 h-full break-inside-avoid dark:border-white/5 border-gray-200 border backdrop-blur-sm ${
        isDragging ? 'opacity-50 z-50 shadow-2xl' : ''
      } ${isAnyDropdownOpen ? 'relative z-[100]' : ''}`}
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b dark:border-white/5 border-gray-200/50 flex justify-between items-center dark:bg-white/[0.02] bg-black/[0.02]">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Drag Handle */}
          <div 
            {...listeners}
            className="cursor-grab text-text-muted dark:hover:text-white hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">drag_indicator</span>
          </div>
          <div 
            className="h-1.5 w-1.5 rounded-full shadow-[0_0_6px_var(--color)] flex-shrink-0"
            style={{ backgroundColor: category.color, '--color': `${category.color}80` } as React.CSSProperties}
          />
          <h3 className="font-semibold text-xs dark:text-white text-gray-900 truncate">{category.name}</h3>
        </div>
        <div className="relative flex-shrink-0">
          <button 
            ref={categoryMenuTriggerRef}
            onClick={() => {
              if (showMenu) setShowMenu(false)
              else openCategoryMenu()
            }}
            className="text-text-muted dark:hover:text-white hover:text-gray-900 transition opacity-0 group-hover:opacity-100"
          >
            <span className="material-icons-round text-base">more_horiz</span>
          </button>
          {showMenu && createPortal(
            <>
              <div 
                className="fixed inset-0 z-[9998]" 
                onClick={() => { setShowMenu(false); setShowMoveSubmenu(false) }}
                aria-hidden
              />
              <div 
                ref={categoryMenuRef}
                className="fixed min-w-[8rem] max-w-[14rem] dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-md shadow-lg z-[9999] py-0.5 overflow-y-auto custom-scrollbar"
                style={{
                  ...(menuPosition.top != null ? { top: menuPosition.top } : { bottom: menuPosition.bottom }),
                  right: menuPosition.right,
                  maxHeight: menuPosition.maxHeight,
                }}
              >
                <button
                  onClick={() => {
                    onAddBookmark()
                    setShowMenu(false)
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Bookmark
                </button>
                <button
                  onClick={() => {
                    onEditCategory()
                    setShowMenu(false)
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDuplicateCategory()
                    setShowMenu(false)
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Duplicate
                </button>
                {otherBoards.length > 0 && onMoveToBoard && (
                  <>
                    <div className="border-t dark:border-white/10 border-gray-200 mt-0.5" />
                    <button
                      type="button"
                      onClick={() => setShowMoveSubmenu((v) => !v)}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">drive_file_move</span>
                        Move to
                      </span>
                      <span className={`material-symbols-outlined text-sm transition-transform ${showMoveSubmenu ? 'rotate-90' : ''}`}>chevron_right</span>
                    </button>
                    {showMoveSubmenu && (
                      <div className="pl-4 pb-0.5">
                        {otherBoards.map((board) => (
                          <button
                            key={board.id}
                            type="button"
                            onClick={() => {
                              onMoveToBoard(board.id)
                              setShowMenu(false)
                              setShowMoveSubmenu(false)
                            }}
                            className="w-full px-2 py-1 text-left text-xs text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 flex items-center gap-2 min-w-0 rounded"
                          >
                            <span className="truncate">{board.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    onDeleteCategory()
                    setShowMenu(false)
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs text-red-400 hover:text-red-300 dark:hover:bg-white/5 hover:bg-red-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete
                </button>
              </div>
            </>,
            document.body
          )}
        </div>
      </div>

      {/* Bookmarks */}
      {bookmarks.length > 0 ? (
        <ul className="py-1 px-0.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={bookmarks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {bookmarks.map(bookmark => (
                <SortableBookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={() => onEditBookmark(bookmark)}
                  onDuplicate={() => onDuplicateBookmark(bookmark)}
                  onDelete={() => onDeleteBookmark(bookmark.id)}
                  onMenuOpenChange={handleBookmarkMenuOpenChange}
                />
              ))}
            </SortableContext>
          </DndContext>
        </ul>
      ) : (
        <div className="p-4 flex-1 flex items-center justify-center text-text-muted/30">
          <span className="material-symbols-outlined text-2xl">folder_open</span>
        </div>
      )}
    </div>
  )
}
