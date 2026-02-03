import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUp } = useAuth()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'))
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, fullName)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased selection:bg-primary/30 selection:text-white">
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden p-4">
        {/* Background Mesh Gradients */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px] opacity-30" />
          <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[80px] opacity-20" />
        </div>

        {/* Glassmorphism Card */}
        <div className="relative z-10 w-full max-w-[520px] rounded-xl border border-white/10 bg-[#101622]/60 backdrop-blur-xl shadow-2xl transition-all duration-300">
          <div className="flex flex-col p-8 md:p-10">
            {/* Logo & Heading */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '28px' }}>hub</span>
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
                {t('auth.startOrganizing')}
              </h1>
              <p className="text-sm font-normal text-[#92a4c9]">
                {t('auth.createDashboard')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white" htmlFor="fullname">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.namePlaceholder')}
                    className="w-full rounded-lg border border-[#324467] bg-[#192233]/80 p-3.5 pl-11 text-sm text-white placeholder-[#92a4c9] transition-colors focus:border-primary focus:bg-[#192233] focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92a4c9]">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white" htmlFor="email">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-[#324467] bg-[#192233]/80 p-3.5 pl-11 text-sm text-white placeholder-[#92a4c9] transition-colors focus:border-primary focus:bg-[#192233] focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92a4c9]">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                </div>
              </div>

              {/* Password Group */}
              <div className="flex flex-col gap-5 sm:flex-row">
                {/* Password */}
                <div className="flex flex-1 flex-col gap-2">
                  <label className="text-sm font-medium text-white" htmlFor="password">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[#324467] bg-[#192233]/80 p-3.5 pl-11 pr-10 text-sm text-white placeholder-[#92a4c9] transition-colors focus:border-primary focus:bg-[#192233] focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92a4c9]">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#92a4c9] hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-1 flex-col gap-2">
                  <label className="text-sm font-medium text-white" htmlFor="confirm_password">
                    {t('auth.confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="confirm_password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[#324467] bg-[#192233]/80 p-3.5 pl-11 text-sm text-white placeholder-[#92a4c9] transition-colors focus:border-primary focus:bg-[#192233] focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92a4c9]">
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  t('auth.createAccount')
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#324467]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#151c2a] px-3 text-[#92a4c9]">{t('auth.orContinueWith')}</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 rounded-lg border border-[#324467] bg-[#192233]/50 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#192233] hover:border-[#4b618f]">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M12.0003 20.45c-4.667 0-8.45-3.784-8.45-8.45 0-4.667 3.783-8.45 8.45-8.45 2.283 0 4.35.834 5.95 2.217l-1.783 1.783c-.934-.883-2.317-1.5-4.167-1.5-3.566 0-6.45 2.884-6.45 6.45 0 3.567 2.884 6.45 6.45 6.45 3.3 0 5.567-2.366 5.767-5.55h-5.767v-2.4h8.217c.083.433.133.883.133 1.366 0 4.884-3.533 8.084-8.35 8.084z" fill="currentColor"/>
                </svg>
                <span>Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg border border-[#324467] bg-[#192233]/50 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#192233] hover:border-[#4b618f]">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-[#92a4c9]">
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="font-medium text-primary hover:text-blue-400 hover:underline transition-colors">
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="relative z-10 mt-8 flex gap-6 text-xs text-[#92a4c9]/60">
          <a className="hover:text-[#92a4c9] transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-[#92a4c9] transition-colors" href="#">Terms of Service</a>
        </div>
      </div>
    </div>
  )
}
