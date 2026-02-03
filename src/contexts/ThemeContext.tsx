import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface ThemeContextType {
  backgroundColor: string
  setBackgroundColor: (color: string) => void
  columnCount: number
  setColumnCount: (count: number) => void
  categoryHeight: 'equal' | 'auto'
  setCategoryHeight: (height: 'equal' | 'auto') => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  openInNewTab: boolean
  setOpenInNewTab: (newTab: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const DEFAULT_BG_COLOR = '#0F172A'
const DEFAULT_COLUMN_COUNT = 4
const DEFAULT_CATEGORY_HEIGHT: 'equal' | 'auto' = 'auto'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [backgroundColor, setBackgroundColorState] = useState(DEFAULT_BG_COLOR)
  const [columnCount, setColumnCountState] = useState(DEFAULT_COLUMN_COUNT)
  const [categoryHeight, setCategoryHeightState] = useState<'equal' | 'auto'>(DEFAULT_CATEGORY_HEIGHT)
  const [darkMode, setDarkModeState] = useState(true)
  const [openInNewTab, setOpenInNewTabState] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedColor = localStorage.getItem('backgroundColor')
    if (savedColor) {
      setBackgroundColorState(savedColor)
    }
    
    const savedColumns = localStorage.getItem('columnCount')
    if (savedColumns) {
      setColumnCountState(parseInt(savedColumns, 10))
    }

    const savedCategoryHeight = localStorage.getItem('categoryHeight')
    if (savedCategoryHeight === 'equal' || savedCategoryHeight === 'auto') {
      setCategoryHeightState(savedCategoryHeight)
    }

    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      setDarkModeState(savedDarkMode === 'true')
    }

    const savedOpenInNewTab = localStorage.getItem('openInNewTab')
    if (savedOpenInNewTab !== null) {
      setOpenInNewTabState(savedOpenInNewTab === 'true')
    }
  }, [])

  const setBackgroundColor = useCallback(async (color: string) => {
    setBackgroundColorState(color)
    localStorage.setItem('backgroundColor', color)
    
    // Try to update profile if user is logged in
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ background_color: color, updated_at: new Date().toISOString() })
          .eq('id', user.id)
      }
    } catch (error) {
      console.error('Error saving background color:', error)
    }
  }, [])

  const setColumnCount = useCallback((count: number) => {
    setColumnCountState(count)
    localStorage.setItem('columnCount', count.toString())
  }, [])

  const setCategoryHeight = useCallback((height: 'equal' | 'auto') => {
    setCategoryHeightState(height)
    localStorage.setItem('categoryHeight', height)
  }, [])

  const setDarkMode = useCallback((dark: boolean) => {
    setDarkModeState(dark)
    localStorage.setItem('darkMode', String(dark))
    
    // Apply to document
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Apply dark mode on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const setOpenInNewTab = useCallback((newTab: boolean) => {
    setOpenInNewTabState(newTab)
    localStorage.setItem('openInNewTab', String(newTab))
  }, [])

  return (
    <ThemeContext.Provider value={{ backgroundColor, setBackgroundColor, columnCount, setColumnCount, categoryHeight, setCategoryHeight, darkMode, setDarkMode, openInNewTab, setOpenInNewTab }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Preset background colors - Dark
export const PRESET_COLORS_DARK = [
  // Row 1 - Blues & Purples
  { name: 'Midnight', color: '#0F172A' },
  { name: 'Dark Blue', color: '#101622' },
  { name: 'Navy', color: '#0f0e17' },
  { name: 'Ocean', color: '#0a192f' },
  { name: 'Deep Purple', color: '#1a1423' },
  { name: 'Violet Dark', color: '#1e1b4b' },
  // Row 2 - Neutral & Warm
  { name: 'Charcoal', color: '#1a1a2e' },
  { name: 'Forest', color: '#0d1117' },
  { name: 'Slate', color: '#1e293b' },
  { name: 'Dark Gray', color: '#18181b' },
  { name: 'Neutral', color: '#171717' },
  { name: 'Stone', color: '#1c1917' },
  // Row 3 - Colorful Dark
  { name: 'Dark Emerald', color: '#022c22' },
  { name: 'Dark Teal', color: '#042f2e' },
  { name: 'Dark Cyan', color: '#083344' },
  { name: 'Dark Rose', color: '#1c1917' },
  { name: 'Dark Red', color: '#1f1315' },
  { name: 'Dark Amber', color: '#1c1a00' },
]

// Preset background colors - Light
export const PRESET_COLORS_LIGHT = [
  // Row 1 - Clean whites & grays
  { name: 'White', color: '#ffffff' },
  { name: 'Snow', color: '#fafafa' },
  { name: 'Light Gray', color: '#f4f4f5' },
  { name: 'Zinc', color: '#e4e4e7' },
  { name: 'Cool Gray', color: '#f1f5f9' },
  { name: 'Slate Light', color: '#e2e8f0' },
  // Row 2 - Warm & Soft
  { name: 'Warm White', color: '#fafaf9' },
  { name: 'Stone Light', color: '#f5f5f4' },
  { name: 'Cream', color: '#fffbeb' },
  { name: 'Rose White', color: '#fff1f2' },
  { name: 'Lavender', color: '#faf5ff' },
  { name: 'Sky Light', color: '#f0f9ff' },
  // Row 3 - Tinted
  { name: 'Mint', color: '#ecfdf5' },
  { name: 'Cyan Light', color: '#ecfeff' },
  { name: 'Blue Light', color: '#eff6ff' },
  { name: 'Violet Light', color: '#f5f3ff' },
  { name: 'Pink Light', color: '#fdf2f8' },
  { name: 'Amber Light', color: '#fffbeb' },
]

// Combined for backwards compatibility
export const PRESET_COLORS = PRESET_COLORS_DARK

// Column count options
export const COLUMN_OPTIONS = [2, 3, 4, 5, 6]
