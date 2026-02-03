import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useBoards } from '../../hooks/useBoards'
import { Board } from '../../types'
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BoardModal from '../Modals/BoardModal'

interface SidebarProps {
  selectedBoardId: string | null
  onSelectBoard: (boardId: string) => void
  isOpen: boolean
  onToggle: () => void
}

function SortableBoardItem({ 
  board, 
  isSelected, 
  onSelect,
  onEdit,
  onDelete,
}: { 
  board: Board
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: board.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [showMenu, setShowMenu] = useState(false)

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={`flex items-center justify-between gap-1 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-accent/10 text-accent border border-accent/20'
            : 'text-text-secondary dark:hover:bg-white/5 hover:bg-black/5 dark:hover:text-white hover:text-gray-900'
        }`}
        onClick={(e) => {
          // Ignore if click started on drag handle or menu button
          const target = e.target as HTMLElement
          if (target.closest('[data-drag-handle]') || target.closest('button')) return
          onSelect()
        }}
      >
        <span
          {...listeners}
          data-drag-handle
          className="flex-shrink-0 p-0.5 cursor-grab active:cursor-grabbing text-text-muted hover:text-current touch-none"
          onClick={(e) => e.stopPropagation()}
          title="Kéo để sắp xếp"
        >
          <span className="material-symbols-outlined text-sm">drag_indicator</span>
        </span>
        <span className="flex-1 truncate min-w-0">{board.name}</span>
        <div className="relative flex-shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="text-text-muted dark:hover:text-white hover:text-gray-900 p-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
          >
            <span className="material-icons-round text-sm">more_vert</span>
          </button>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-28 dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-lg shadow-lg z-50 py-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                    setShowMenu(false)
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs text-red-400 hover:text-red-300 dark:hover:bg-white/5 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ selectedBoardId, onSelectBoard, isOpen, onToggle: _onToggle }: SidebarProps) {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const { boards, createBoard, updateBoard, deleteBoard, reorderBoards } = useBoards()
  const [showBoardModal, setShowBoardModal] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null)

  // Auto-select board: validate saved board exists, or select first board
  useEffect(() => {
    if (boards.length > 0) {
      // Check if selected board exists
      const boardExists = selectedBoardId && boards.some(b => b.id === selectedBoardId)
      if (!boardExists) {
        // Select first board if saved board doesn't exist
        onSelectBoard(boards[0].id)
      }
    }
  }, [boards, selectedBoardId, onSelectBoard])

  // Chỉ kích hoạt drag sau khi di chuyển 8px, tránh nhầm click thành kéo
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = boards.findIndex(b => b.id === active.id)
      const newIndex = boards.findIndex(b => b.id === over.id)
      
      const newBoards = [...boards]
      const [removed] = newBoards.splice(oldIndex, 1)
      newBoards.splice(newIndex, 0, removed)
      
      reorderBoards(newBoards)
    }
  }

  const handleCreateBoard = async (name: string) => {
    await createBoard(name)
    setShowBoardModal(false)
  }

  const handleUpdateBoard = async (name: string) => {
    if (editingBoard) {
      await updateBoard(editingBoard.id, { name })
      setEditingBoard(null)
    }
  }

  const handleDeleteBoard = async () => {
    if (deletingBoard) {
      await deleteBoard(deletingBoard.id)
      if (selectedBoardId === deletingBoard.id) {
        onSelectBoard(boards[0]?.id || '')
      }
      setDeletingBoard(null)
    }
  }

  return (
    <>
      <aside className={`w-64 flex-shrink-0 sidebar-gradient border-r border-border flex flex-col z-30 shadow-2xl transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full absolute h-full'
      }`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b dark:border-border/50 border-gray-200">
          <div className="flex items-center gap-2 text-accent dark:hover:text-white hover:text-gray-900 transition-colors duration-300 group cursor-pointer">
            <div className="p-1.5 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
              <span className="material-symbols-outlined text-xl">hub</span>
            </div>
            <span className="font-bold text-lg tracking-tight dark:text-white text-gray-900">EddyLinkHub</span>
          </div>
        </div>

        {/* Boards Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between group">
          <span className="text-[10px] font-bold uppercase text-text-muted tracking-widest">
            {t('dashboard.yourBoards')}
          </span>
          <button 
            onClick={() => setShowBoardModal(true)}
            className="text-text-muted hover:text-accent transition-colors"
          >
            <span className="material-icons-round text-base">add_circle_outline</span>
          </button>
        </div>

        {/* Boards List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5 custom-scrollbar pb-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={boards.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {boards.map(board => (
                <div key={board.id} className="group">
                  <SortableBoardItem
                    board={board}
                    isSelected={selectedBoardId === board.id}
                    onSelect={() => onSelectBoard(board.id)}
                    onEdit={() => setEditingBoard(board)}
                    onDelete={() => setDeletingBoard(board)}
                  />
                </div>
              ))}
            </SortableContext>
          </DndContext>

          {boards.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm">
              <p>{t('dashboard.noBoards')}</p>
              <button
                onClick={() => setShowBoardModal(true)}
                className="mt-2 text-accent hover:text-accent/80"
              >
                {t('dashboard.createFirstBoard')}
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="p-3 border-t dark:border-border border-gray-200 dark:bg-main/50 bg-gray-50/80 backdrop-blur-sm">
          <button 
            onClick={signOut}
            className="flex items-center gap-2 text-text-muted dark:hover:text-white hover:text-gray-900 transition w-full px-2 py-1.5 rounded-lg dark:hover:bg-white/5 hover:bg-gray-200"
          >
            <span className="material-icons-round text-base">logout</span>
            <span className="text-xs">{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Create Board Modal */}
      {showBoardModal && (
        <BoardModal
          onClose={() => setShowBoardModal(false)}
          onSave={handleCreateBoard}
        />
      )}

      {/* Edit Board Modal */}
      {editingBoard && (
        <BoardModal
          board={editingBoard}
          onClose={() => setEditingBoard(null)}
          onSave={handleUpdateBoard}
        />
      )}

      {/* Delete Confirmation */}
      {deletingBoard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 dark:bg-black/60 bg-black/30 backdrop-blur-[4px]"
            onClick={() => setDeletingBoard(null)}
          />
          <div className="modal-animate relative w-full max-w-sm dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-2">{t('board.delete')}</h3>
            <p className="text-text-secondary text-sm mb-6">{t('board.deleteConfirm')}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingBoard(null)}
                className="px-4 py-2 text-sm text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteBoard}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
