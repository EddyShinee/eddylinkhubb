import { useTranslation } from 'react-i18next'
import { SearchResult } from '../../types'

interface SearchResultsProps {
  results: SearchResult[]
  loading: boolean
  onResultClick: (boardId: string) => void
}

export default function SearchResults({ results, loading, onResultClick }: SearchResultsProps) {
  const { t } = useTranslation()

  const boardResults = results.filter(r => r.type === 'board')
  const categoryResults = results.filter(r => r.type === 'category')
  const bookmarkResults = results.filter(r => r.type === 'bookmark')

  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-xl shadow-lg z-50 p-4">
        <div className="flex items-center justify-center gap-2 text-text-secondary">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-xl shadow-lg z-50 p-4">
        <p className="text-center text-text-muted text-sm">{t('search.noResults')}</p>
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto custom-scrollbar">
      {/* Boards */}
      {boardResults.length > 0 && (
        <div className="p-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 py-2">
            {t('search.boards')}
          </p>
          {boardResults.map(result => (
            <button
              key={result.id}
              onClick={() => onResultClick(result.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg dark:hover:bg-white/5 hover:bg-gray-100 text-left transition-colors"
            >
              <span className="material-symbols-outlined text-accent text-lg">dashboard</span>
              <span className="text-sm dark:text-white text-gray-900">{result.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Categories */}
      {categoryResults.length > 0 && (
        <div className="p-2 border-t dark:border-white/5 border-gray-100">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 py-2">
            {t('search.categories')}
          </p>
          {categoryResults.map(result => (
            <button
              key={result.id}
              onClick={() => result.boardId && onResultClick(result.boardId)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg dark:hover:bg-white/5 hover:bg-gray-100 text-left transition-colors"
            >
              <span className="material-symbols-outlined text-emerald-400 text-lg">folder</span>
              <div className="flex flex-col">
                <span className="text-sm dark:text-white text-gray-900">{result.name}</span>
                <span className="text-xs text-text-muted">in {result.boardName}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Bookmarks */}
      {bookmarkResults.length > 0 && (
        <div className="p-2 border-t dark:border-white/5 border-gray-100">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 py-2">
            {t('search.bookmarks')}
          </p>
          {bookmarkResults.map(result => (
            <button
              key={result.id}
              onClick={() => result.boardId && onResultClick(result.boardId)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg dark:hover:bg-white/5 hover:bg-gray-100 text-left transition-colors"
            >
              <span className="material-symbols-outlined text-blue-400 text-lg">bookmark</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm dark:text-white text-gray-900 truncate">{result.name}</span>
                <span className="text-xs text-text-muted truncate">
                  {result.categoryName} · {result.boardName}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
