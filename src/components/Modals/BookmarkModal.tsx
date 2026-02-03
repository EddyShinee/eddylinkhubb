import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bookmark, Category } from '../../types'

interface BookmarkModalProps {
  bookmark?: Bookmark
  categories: Category[]
  selectedCategoryId?: string
  onClose: () => void
  onSave: (data: {
    url: string
    title: string
    description?: string
    tags?: string[]
    category_id?: string
  }) => void
}

export default function BookmarkModal({ 
  bookmark, 
  categories,
  selectedCategoryId,
  onClose, 
  onSave 
}: BookmarkModalProps) {
  const { t } = useTranslation()
  const [url, setUrl] = useState(bookmark?.url || '')
  const [title, setTitle] = useState(bookmark?.title || '')
  const [description, setDescription] = useState(bookmark?.description || '')
  const [tags, setTags] = useState(bookmark?.tags?.join(', ') || '')
  const [categoryId, setCategoryId] = useState(bookmark?.category_id || selectedCategoryId || '')
  const [fetching, setFetching] = useState(false)
  const [fetchSuccess, setFetchSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim() && title.trim()) {
      onSave({
        url: url.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        category_id: categoryId || undefined,
      })
    }
  }

  const fetchTitle = async () => {
    if (!url.trim()) return
    
    setFetching(true)
    setFetchSuccess(false)
    
    try {
      // In a real app, you'd call a backend API to fetch the title
      // For now, we'll just extract domain name as a placeholder
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace('www.', '')
      setTitle(domain.charAt(0).toUpperCase() + domain.slice(1))
      setFetchSuccess(true)
    } catch (error) {
      console.error('Error fetching title:', error)
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 dark:bg-black/60 bg-black/30 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="modal-animate relative w-full max-w-lg dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b dark:border-white/5 border-gray-200 flex items-center justify-between dark:bg-white/[0.02] bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <span className="material-symbols-outlined text-xl">bookmark_add</span>
            </div>
            <div>
              <h2 className="text-lg font-bold dark:text-white text-gray-900 tracking-tight">
                {bookmark ? t('bookmark.edit') : t('bookmark.create')}
              </h2>
              <p className="text-xs text-text-secondary">
                {bookmark ? t('bookmark.edit') : 'Save a link to your dashboard'}
              </p>
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
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
            {/* URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">
                {t('bookmark.url')}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted group-focus-within:text-accent transition-colors">
                  link
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('bookmark.urlPlaceholder')}
                  className="w-full dark:bg-main/50 bg-gray-100 dark:border-white/10 border-gray-200 border rounded-xl pl-10 pr-12 py-2.5 text-sm dark:text-white text-gray-900 placeholder-text-muted/50 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all shadow-inner"
                  autoFocus
                />
                <div className="absolute right-2 top-1.5">
                  <button
                    type="button"
                    onClick={fetchTitle}
                    disabled={fetching || !url.trim()}
                    className="p-1.5 text-accent hover:bg-accent/10 hover:text-white rounded-lg transition-all disabled:opacity-50"
                    title={t('bookmark.autoFetch')}
                  >
                    <span className={`material-symbols-outlined text-lg ${fetching ? 'animate-spin' : ''}`}>
                      {fetching ? 'progress_activity' : 'autorenew'}
                    </span>
                  </button>
                </div>
              </div>
              {fetchSuccess && (
                <p className="text-[10px] text-accent pl-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">check_circle</span>
                  {t('bookmark.fetchSuccess')}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">
                {t('bookmark.bookmarkTitle')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('bookmark.titlePlaceholder')}
                className="w-full dark:bg-main/50 bg-gray-100 dark:border-white/10 border-gray-200 border rounded-xl px-4 py-2.5 text-sm dark:text-white text-gray-900 placeholder-text-muted/50 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all shadow-inner font-medium"
              />
            </div>

            {/* Category and Tags row */}
            <div className="grid grid-cols-5 gap-4">
              {/* Category - 2 columns */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1 block">
                  {t('bookmark.category')}
                </label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full dark:bg-main/50 bg-gray-100 dark:border-white/10 border-gray-200 border rounded-xl pl-4 pr-10 py-2.5 text-sm dark:text-white text-gray-900 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-text-muted">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Tags - 3 columns */}
              <div className="col-span-3 space-y-1.5">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {t('bookmark.tags')}
                  </label>
                  <span className="text-text-muted/50 text-[10px]">
                    {t('bookmark.tagsHint')}
                  </span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined text-base absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    sell
                  </span>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={t('bookmark.tagsPlaceholder')}
                    className="w-full dark:bg-main/50 bg-gray-100 dark:border-white/10 border-gray-200 border rounded-xl pl-10 pr-4 py-2.5 text-sm dark:text-white text-gray-900 placeholder-text-muted/50 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">
                {t('bookmark.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('bookmark.descriptionPlaceholder')}
                rows={3}
                className="w-full dark:bg-main/50 bg-gray-100 dark:border-white/10 border-gray-200 border rounded-xl px-4 py-2.5 text-sm dark:text-white text-gray-900 placeholder-text-muted/50 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all shadow-inner resize-none custom-scrollbar"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 dark:bg-main/30 bg-gray-50 border-t dark:border-white/5 border-gray-200 flex justify-end gap-3 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!url.trim() || !title.trim()}
              className="px-6 py-2.5 text-sm font-semibold bg-accent text-white rounded-lg shadow-[0_0_15px_rgba(129,140,248,0.3)] hover:bg-accent/90 hover:shadow-[0_0_20px_rgba(129,140,248,0.5)] hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {bookmark ? t('common.save') : t('bookmark.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
