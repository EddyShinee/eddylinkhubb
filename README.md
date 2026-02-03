# EddyLinkHub - Bookmark Manager

A modern bookmark manager built with React, Tailwind CSS, and Supabase.

## Features

- **Multi-board Organization**: Create multiple boards to organize your bookmarks
- **Categories**: Group bookmarks into categories with custom colors and icons
- **Drag & Drop**: Reorder boards, categories, and bookmarks with drag and drop
- **Multi-language**: Support for Vietnamese (default) and English
- **Custom Themes**: Change background colors to personalize your dashboard
- **Import/Export**: Import bookmarks from Chrome, Safari, Firefox (HTML) or JSON
- **Real-time Search**: Search across boards, categories, and bookmarks
- **Authentication**: Secure user authentication with Supabase

## Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Drag & Drop**: @dnd-kit
- **i18n**: react-i18next
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Bookmark
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project and run the SQL schema:
   - Go to [Supabase](https://supabase.com) and create a new project
   - Open the SQL Editor and run the contents of `supabase/schema.sql`

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Deployment to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Dashboard/      # Dashboard-specific components
│   ├── Layout/         # Layout components (Sidebar, Header)
│   ├── Modals/         # Modal components
│   └── Search/         # Search-related components
├── contexts/           # React contexts (Auth, Theme)
├── hooks/              # Custom hooks
├── i18n/               # Internationalization
│   └── locales/        # Language files (vi.json, en.json)
├── lib/                # Library configurations
├── pages/              # Page components
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## License

MIT
