import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useSearch } from '../../hooks/useSearch'
import SearchResults from '../Search/SearchResults'
import SettingsModal from '../Modals/SettingsModal'

interface HeaderProps {
  onSelectBoard: (boardId: string) => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function Header({ onSelectBoard, sidebarOpen, onToggleSidebar }: HeaderProps) {
  const { t } = useTranslation()
  const { profile, signOut } = useAuth()
  const { query, setQuery, results, loading, clearSearch } = useSearch()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleSearchFocus = () => {
    if (query.trim()) {
      setShowSearchResults(true)
    }
  }

  const handleSearchChange = (value: string) => {
    setQuery(value)
    setShowSearchResults(true)
  }

  const handleResultClick = (boardId: string) => {
    onSelectBoard(boardId)
    clearSearch()
    setShowSearchResults(false)
  }

  return (
    <>
      <header className="h-14 z-50 flex items-center justify-between px-4 border-b dark:border-border/50 border-gray-200 dark:bg-main/60 bg-white/80 backdrop-blur-md gap-4">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-all"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <span className="material-symbols-outlined text-xl">
            {sidebarOpen ? 'menu_open' : 'menu'}
          </span>
        </button>

        {/* Search */}
        <div ref={searchRef} className="relative flex items-center flex-1 max-w-md">
          <div className="relative w-full group">
            <span className="material-symbols-outlined text-text-muted text-lg absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-accent">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder={t('dashboard.searchPlaceholder')}
              className="dark:bg-white/5 bg-gray-100 dark:border-white/10 border-gray-200 border text-sm dark:text-white text-gray-900 placeholder-text-muted focus:ring-2 focus:ring-accent/50 focus:border-accent/50 block w-full pl-9 pr-3 py-1.5 rounded-full transition-all shadow-sm"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted dark:hover:text-white hover:text-gray-900"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (query.trim() || loading) && (
            <SearchResults
              results={results}
              loading={loading}
              onResultClick={handleResultClick}
            />
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 cursor-pointer dark:hover:bg-white/5 hover:bg-gray-100 pl-1.5 pr-2 py-1 rounded-full transition border border-transparent dark:hover:border-white/10 hover:border-gray-200"
            >
              <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center dark:ring-1 dark:ring-white/10 ring-1 ring-accent/20">
                <span className="text-accent text-xs font-semibold">
                  {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold dark:text-white text-gray-900 leading-none">
                  {profile?.full_name || 'User'}
                </span>
                <span className="text-[10px] text-text-muted leading-none mt-0.5">Admin</span>
              </div>
              <span className="material-icons-round text-sm text-text-muted">expand_more</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-lg shadow-2xl z-[101] overflow-hidden py-1">
                <button
                  onClick={() => {
                    setShowSettings(true)
                    setShowUserMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                >
                  <span className="material-icons-round text-sm">settings</span>
                  {t('settings.title')}
                </button>
                <button
                  onClick={signOut}
                  className="w-full px-3 py-2 text-left text-xs text-red-400 hover:text-red-300 dark:hover:bg-white/5 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <span className="material-icons-round text-sm">logout</span>
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
