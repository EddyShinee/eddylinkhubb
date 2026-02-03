import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Category, Bookmark } from '../../types'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTheme } from '../../contexts/ThemeContext'

interface SortableBookmarkItemProps {
  bookmark: Bookmark
  onEdit: () => void
  onDelete: () => void
}

function SortableBookmarkItem({ bookmark, onEdit, onDelete }: SortableBookmarkItemProps) {
  const { openInNewTab } = useTheme()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: bookmark.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [showMenu, setShowMenu] = useState(false)

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
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="text-text-muted dark:hover:text-white hover:text-gray-900 opacity-0 group-hover/item:opacity-100 p-0.5 transition-opacity"
          >
            <span className="material-icons-round text-xs">more_vert</span>
          </button>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-[200]" 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-24 dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-md shadow-lg z-[201] py-0.5">
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
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full px-2 py-1.5 text-left text-xs text-red-400 hover:text-red-300 dark:hover:bg-white/5 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  )
}

interface CategoryCardProps {
  category: Category
  bookmarks: Bookmark[]
  onEditCategory: () => void
  onDeleteCategory: () => void
  onAddBookmark: () => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (bookmarkId: string) => void
  onReorderBookmarks: (bookmarks: Bookmark[]) => void
}

export default function CategoryCard({
  category,
  bookmarks,
  onEditCategory,
  onDeleteCategory,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onReorderBookmarks,
}: CategoryCardProps) {
  useTranslation() // For future use
  const [showMenu, setShowMenu] = useState(false)

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
      className={`rounded-xl shadow-glass group dark:hover:border-white/10 hover:border-gray-300 transition-colors duration-300 flex flex-col h-full break-inside-avoid dark:border-white/5 border-gray-200 border backdrop-blur-sm ${
        isDragging ? 'opacity-50 z-50 shadow-2xl' : ''
      }`}
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
            onClick={() => setShowMenu(!showMenu)}
            className="text-text-muted dark:hover:text-white hover:text-gray-900 transition opacity-0 group-hover:opacity-100"
          >
            <span className="material-icons-round text-base">more_horiz</span>
          </button>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-32 dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-md shadow-lg z-50 py-0.5">
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
                    onDeleteCategory()
                    setShowMenu(false)
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs text-red-400 hover:text-red-300 dark:hover:bg-white/5 hover:bg-red-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bookmarks */}
      {bookmarks.length > 0 ? (
        <ul className="py-1 px-0.5 flex-1">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={bookmarks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {bookmarks.map(bookmark => (
                <SortableBookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={() => onEditBookmark(bookmark)}
                  onDelete={() => onDeleteBookmark(bookmark.id)}
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
