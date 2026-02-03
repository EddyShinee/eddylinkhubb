import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, PRESET_COLORS_DARK, PRESET_COLORS_LIGHT, COLUMN_OPTIONS } from '../../contexts/ThemeContext'
import { parseBookmarkFile } from '../../utils/importParser'
import { useBoards } from '../../hooks/useBoards'
import { supabase } from '../../lib/supabase'

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation()
  const { profile, updateProfile } = useAuth()
  const { backgroundColor, setBackgroundColor, columnCount, setColumnCount, categoryHeight, setCategoryHeight, darkMode, setDarkMode, openInNewTab, setOpenInNewTab } = useTheme()
  const { createBoard } = useBoards()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLanguageChange = async (locale: 'vi' | 'en') => {
    i18n.changeLanguage(locale)
    localStorage.setItem('locale', locale)
    await updateProfile({ locale })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportMessage(null)

    try {
      const content = await file.text()
      const isHtml = file.name.endsWith('.html') || file.name.endsWith('.htm')
      const importData = parseBookmarkFile(content, isHtml)

      // Statistics
      let boardCount = 0
      let categoryCount = 0
      let bookmarkCount = 0

      // Import data to Supabase
      for (const boardData of importData.boards) {
        // Create board
        const { data: board, error: boardError } = await createBoard(boardData.name)
        if (boardError || !board) {
          console.error('Error creating board:', boardError)
          continue
        }
        boardCount++

        // Create categories and bookmarks
        for (let catIndex = 0; catIndex < boardData.categories.length; catIndex++) {
          const categoryData = boardData.categories[catIndex]
          const { data: category, error: catError } = await supabase
            .from('categories')
            .insert({
              board_id: board.id,
              name: categoryData.name,
              color: categoryData.color || '#818CF8',
              icon: categoryData.icon || 'folder',
              sort_order: catIndex,
            })
            .select()
            .single()

          if (catError || !category) {
            console.error('Error creating category:', catError)
            continue
          }
          categoryCount++

          // Create bookmarks in batches for better performance
          const bookmarksToInsert = categoryData.bookmarks.map((bookmarkData, i) => ({
            category_id: category.id,
            url: bookmarkData.url,
            title: bookmarkData.title,
            description: bookmarkData.description || null,
            tags: bookmarkData.tags || [],
            sort_order: i,
          }))

          if (bookmarksToInsert.length > 0) {
            const { error: bmError } = await supabase
              .from('bookmarks')
              .insert(bookmarksToInsert)
            
            if (!bmError) {
              bookmarkCount += bookmarksToInsert.length
            } else {
              console.error('Error creating bookmarks:', bmError)
            }
          }
        }
      }

      // Show success message with statistics
      const successText = `${t('settings.importSuccess')} (${boardCount} boards, ${categoryCount} ${t('search.categories').toLowerCase()}, ${bookmarkCount} bookmarks)`
      setImportMessage({ type: 'success', text: successText })
    } catch (error) {
      console.error('Import error:', error)
      setImportMessage({ type: 'error', text: t('settings.importError') })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      // Fetch all boards
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('*')
        .order('sort_order', { ascending: true })

      if (boardsError) throw boardsError

      // Fetch all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (categoriesError) throw categoriesError

      // Fetch all bookmarks
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*')
        .order('sort_order', { ascending: true })

      if (bookmarksError) throw bookmarksError

      // Generate Netscape HTML format
      const now = Math.floor(Date.now() / 1000)
      let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>EddyLinkHub Bookmarks Export</TITLE>
<H1>EddyLinkHub Bookmarks</H1>

<DL><p>
`

      // Group categories by board
      const categoriesByBoard: Record<string, typeof categories> = {}
      categories?.forEach(cat => {
        if (!categoriesByBoard[cat.board_id]) {
          categoriesByBoard[cat.board_id] = []
        }
        categoriesByBoard[cat.board_id].push(cat)
      })

      // Group bookmarks by category
      const bookmarksByCategory: Record<string, typeof bookmarks> = {}
      bookmarks?.forEach(bm => {
        if (!bookmarksByCategory[bm.category_id]) {
          bookmarksByCategory[bm.category_id] = []
        }
        bookmarksByCategory[bm.category_id].push(bm)
      })

      // Build HTML for each board
      boards?.forEach(board => {
        html += `    <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${escapeHtml(board.name)}</H3>\n`
        html += `    <DL><p>\n`

        // Add categories for this board
        const boardCategories = categoriesByBoard[board.id] || []
        boardCategories.forEach(category => {
          html += `        <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${escapeHtml(category.name)}</H3>\n`
          html += `        <DL><p>\n`

          // Add bookmarks for this category
          const catBookmarks = bookmarksByCategory[category.id] || []
          catBookmarks.forEach(bookmark => {
            const addDate = Math.floor(new Date(bookmark.created_at).getTime() / 1000)
            html += `            <DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${addDate}">${escapeHtml(bookmark.title)}</A>\n`
          })

          html += `        </DL><p>\n`
        })

        html += `    </DL><p>\n`
      })

      html += `</DL><p>\n`

      // Download the file
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `eddylinkhub-bookmarks-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setImportMessage({ type: 'success', text: t('settings.exportSuccess') })
    } catch (error) {
      console.error('Export error:', error)
      setImportMessage({ type: 'error', text: t('settings.exportError') })
    } finally {
      setExporting(false)
    }
  }

  // Helper function to escape HTML
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 dark:bg-black/60 bg-black/30 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="modal-animate relative w-full max-w-4xl dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-white/5 border-gray-200 flex items-center justify-between dark:bg-white/[0.02] bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <span className="material-symbols-outlined text-xl">settings</span>
            </div>
            <h2 className="text-lg font-bold dark:text-white text-gray-900 tracking-tight">
              {t('settings.title')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-text-muted dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 p-2 rounded-full transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Language & Background */}
            <div className="space-y-6">
              {/* Language */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  {t('settings.language')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLanguageChange('vi')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      (profile?.locale || i18n.language) === 'vi'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border'
                    }`}
                  >
                    {t('settings.vietnamese')}
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      profile?.locale === 'en' || (i18n.language === 'en' && !profile?.locale)
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border'
                    }`}
                  >
                    {t('settings.english')}
                  </button>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  {t('settings.darkMode')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDarkMode(true)
                      // Auto-switch to a dark background
                      if (!darkMode) {
                        setBackgroundColor(PRESET_COLORS_DARK[0].color)
                      }
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      darkMode
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">dark_mode</span>
                    {t('settings.dark')}
                  </button>
                  <button
                    onClick={() => {
                      setDarkMode(false)
                      // Auto-switch to a light background
                      if (darkMode) {
                        setBackgroundColor(PRESET_COLORS_LIGHT[0].color)
                      }
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      !darkMode
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">light_mode</span>
                    {t('settings.light')}
                  </button>
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  {t('settings.background')}
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {(darkMode ? PRESET_COLORS_DARK : PRESET_COLORS_LIGHT).map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => setBackgroundColor(preset.color)}
                      className={`w-7 h-7 rounded-md transition-all border ${
                        backgroundColor === preset.color
                          ? 'ring-2 ring-accent ring-offset-1 dark:ring-offset-sidebar ring-offset-white scale-110 border-accent'
                          : 'hover:scale-110 dark:border-white/20 border-gray-300'
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Display Settings */}
            <div className="space-y-6">
              {/* Column Count */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  {t('settings.columnCount')}
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {COLUMN_OPTIONS.map((count) => (
                    <button
                      key={count}
                      onClick={() => setColumnCount(count)}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        columnCount === count
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Height */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  {t('settings.categoryHeight')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCategoryHeight('auto')}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      categoryHeight === 'auto'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">height</span>
                    {t('settings.heightAuto')}
                  </button>
                  <button
                    onClick={() => setCategoryHeight('equal')}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      categoryHeight === 'equal'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">equal</span>
                    {t('settings.heightEqual')}
                  </button>
                </div>
              </div>

              {/* Open Links */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  {t('settings.openLinks')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpenInNewTab(true)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      openInNewTab
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    {t('settings.newTab')}
                  </button>
                  <button
                    onClick={() => setOpenInNewTab(false)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      !openInNewTab
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">tab</span>
                    {t('settings.sameTab')}
                  </button>
                </div>
              </div>
            </div>

            {/* Column 3: Import & Export */}
            <div className="space-y-6">
              {/* Import */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  {t('settings.import')}
                </label>
                <p className="text-[10px] text-text-muted leading-tight">
                  {t('settings.importDescription')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.html,.htm"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={handleImportClick}
                  disabled={importing}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      {t('settings.selectFile')}
                    </>
                  )}
                </button>
              </div>

              {/* Export */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  {t('settings.export')}
                </label>
                <p className="text-[10px] text-text-muted leading-tight">
                  {t('settings.exportDescription')}
                </p>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 dark:border-white/10 border-gray-200 border transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">download</span>
                      {t('settings.exportToHtml')}
                    </>
                  )}
                </button>
              </div>

              {/* Message */}
              {importMessage && (
                <p className={`text-xs ${importMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {importMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t dark:border-white/5 border-gray-200 dark:bg-white/[0.02] bg-gray-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-accent text-white shadow-[0_0_15px_rgba(129,140,248,0.4)] hover:bg-accent/90 transition-all"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
