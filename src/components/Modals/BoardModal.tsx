import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Board } from '../../types'

interface BoardModalProps {
  board?: Board
  onClose: () => void
  onSave: (name: string) => void
}

export default function BoardModal({ board, onClose, onSave }: BoardModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(board?.name || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 dark:bg-black/60 bg-black/30 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="modal-animate relative w-full max-w-md dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b dark:border-white/5 border-gray-200 flex items-center justify-between dark:bg-white/[0.02] bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <span className="material-symbols-outlined text-xl">dashboard</span>
            </div>
            <div>
              <h2 className="text-lg font-bold dark:text-white text-gray-900 tracking-tight">
                {board ? t('board.edit') : t('board.create')}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-text-muted dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 p-2 rounded-full transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">
                {t('board.name')}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted group-focus-within:text-accent transition-colors">
                  edit
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('board.namePlaceholder')}
                  className="w-full dark:bg-main/50 bg-gray-100 dark:border-white/10 border-gray-200 border rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white text-gray-900 placeholder-text-muted focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all shadow-inner"
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t dark:border-white/5 border-gray-200 dark:bg-white/[0.02] bg-gray-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 rounded-lg text-sm font-semibold bg-accent text-white shadow-[0_0_15px_rgba(129,140,248,0.4)] hover:shadow-[0_0_20px_rgba(129,140,248,0.6)] hover:bg-accent/90 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {board ? t('common.save') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
