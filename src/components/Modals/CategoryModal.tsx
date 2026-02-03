import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Category } from '../../types'

interface CategoryModalProps {
  category?: Category
  onClose: () => void
  onSave: (data: { name: string; color: string; icon: string; bg_opacity: number }) => void
}

const COLORS = [
  // Row 1 - Vibrant
  '#818CF8', // Indigo (accent)
  '#6366F1', // Indigo darker
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#EF4444', // Red
  // Row 2 - Warm
  '#F97316', // Orange
  '#FB923C', // Orange light
  '#FBBF24', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  // Row 3 - Cool
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#2563EB', // Blue darker
  '#4F46E5', // Indigo dark
  '#7C3AED', // Violet dark
  '#9333EA', // Purple dark
  '#C026D3', // Fuchsia dark
]

const ICONS = [
  'folder',
  'code',
  'design_services',
  'dataset',
  'cloud',
  'terminal',
  'language',
  'work',
  'school',
  'favorite',
  'star',
  'bookmark',
]

export default function CategoryModal({ category, onClose, onSave }: CategoryModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(category?.name || '')
  const [color, setColor] = useState(category?.color || COLORS[0])
  const [icon, setIcon] = useState(category?.icon || ICONS[0])
  const [bgOpacity, setBgOpacity] = useState(category?.bg_opacity ?? 15)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave({ name: name.trim(), color, icon, bg_opacity: bgOpacity })
    }
  }

  // Convert hex to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 dark:bg-black/60 bg-black/30 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="modal-animate relative w-full max-w-md dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b dark:border-white/5 border-gray-200 flex items-center justify-between dark:bg-white/[0.02] bg-gray-50">
          <h2 className="text-lg font-bold dark:text-white text-gray-900 tracking-wide">
            {category ? t('category.edit') : t('category.create')}
          </h2>
          <button 
            onClick={onClose}
            className="text-text-muted dark:hover:text-white hover:text-gray-900 transition-colors rounded-full p-1 dark:hover:bg-white/10 hover:bg-gray-100"
          >
            <span className="material-icons-round text-xl">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                {t('category.name')}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted group-focus-within:text-accent transition-colors">
                  edit
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('category.namePlaceholder')}
                  className="w-full dark:bg-sidebar/50 bg-gray-100 dark:border-white/10 border-gray-200 border rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white text-gray-900 placeholder-text-muted focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all shadow-inner"
                  autoFocus
                />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                {t('category.color')}
              </label>
              <div className="grid grid-cols-8 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-lg hover:scale-110 transition-transform ${
                      color === c 
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-sidebar shadow-[0_0_10px_var(--color)]' 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ 
                      backgroundColor: c,
                      '--color': c,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {t('category.opacity')}
                </label>
                <span className="text-xs text-accent font-medium">{bgOpacity}%</span>
              </div>
              {/* Preview */}
              <div 
                className="h-12 rounded-xl dark:border-white/10 border-gray-200 border flex items-center justify-center"
                style={{ backgroundColor: hexToRgba(color, bgOpacity) }}
              >
                <span className="text-xs dark:text-white/80 text-gray-700">{t('category.preview')}</span>
              </div>
              {/* Slider */}
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                style={{
                  background: `linear-gradient(to right, ${color}00, ${color}80)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                {t('category.icon')}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                      icon === i
                        ? 'bg-accent/20 border border-accent/50 text-accent shadow-[0_0_10px_rgba(129,140,248,0.2)]'
                        : 'dark:bg-white/5 bg-gray-100 dark:border-white/5 border-gray-200 border dark:hover:bg-white/10 hover:bg-gray-200 dark:hover:border-white/20 hover:border-gray-300 text-text-secondary dark:hover:text-white hover:text-gray-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{i}</span>
                  </button>
                ))}
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
              className="px-6 py-2 rounded-lg text-sm font-semibold bg-accent text-white shadow-[0_0_15px_rgba(129,140,248,0.4)] hover:shadow-[0_0_20px_rgba(129,140,248,0.6)] hover:bg-accent/90 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {category ? t('common.save') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
