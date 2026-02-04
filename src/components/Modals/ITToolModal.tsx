import { useState } from 'react'

interface ITToolModalProps {
  onClose: () => void
}

type TabId = 'url' | 'jwt' | 'json' | 'query' | 'xml'

export default function ITToolModal({ onClose }: ITToolModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('url')

  // URL tools
  const [urlInput, setUrlInput] = useState('')
  const [urlOutput, setUrlOutput] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  const handleUrlEncode = () => {
    try {
      setUrlError(null)
      setUrlOutput(encodeURIComponent(urlInput))
    } catch (err) {
      setUrlError((err as Error).message)
      setUrlOutput('')
    }
  }

  const handleUrlDecode = () => {
    try {
      setUrlError(null)
      setUrlOutput(decodeURIComponent(urlInput))
    } catch (err) {
      setUrlError((err as Error).message)
      setUrlOutput('')
    }
  }

  // JWT tools
  const [jwtInput, setJwtInput] = useState('')
  const [jwtOutput, setJwtOutput] = useState('')
  const [jwtError, setJwtError] = useState<string | null>(null)
  const [jwtSecret, setJwtSecret] = useState('')
  const [jwtEncodePayload, setJwtEncodePayload] = useState('')
  const [jwtEncodeOutput, setJwtEncodeOutput] = useState('')
  const [jwtEncodeError, setJwtEncodeError] = useState<string | null>(null)

  const base64UrlDecode = (str: string) => {
    try {
      const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=')
      const decoded = atob(padded)
      return decoded
    } catch (err) {
      throw new Error('Invalid Base64Url segment')
    }
  }

  const base64UrlEncode = (str: string) => {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    let binary = ''
    bytes.forEach(b => {
      binary += String.fromCharCode(b)
    })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  const hmacSha256 = async (key: string, data: string) => {
    const enc = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data))
    const bytes = new Uint8Array(signature)
    let binary = ''
    bytes.forEach(b => {
      binary += String.fromCharCode(b)
    })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  const handleJwtDecode = () => {
    try {
      setJwtError(null)
      const parts = jwtInput.trim().split('.')
      if (parts.length < 2) {
        throw new Error('JWT phải có ít nhất 2 phần (header.payload[.signature])')
      }
      const [headerPart, payloadPart, signaturePart] = parts
      const headerJson = base64UrlDecode(headerPart)
      const payloadJson = base64UrlDecode(payloadPart)

      let header: unknown
      let payload: unknown
      try {
        header = JSON.parse(headerJson)
      } catch {
        header = headerJson
      }
      try {
        payload = JSON.parse(payloadJson)
      } catch {
        payload = payloadJson
      }

      const result = {
        header,
        payload,
        signature: signaturePart || null,
      }
      setJwtOutput(JSON.stringify(result, null, 2))
    } catch (err) {
      setJwtError((err as Error).message)
      setJwtOutput('')
    }
  }

  const handleJwtEncode = async () => {
    try {
      setJwtEncodeError(null)
      setJwtEncodeOutput('')
      if (!jwtSecret.trim()) {
        throw new Error('Vui lòng nhập secret key để encode JWT.')
      }
      if (!jwtEncodePayload.trim()) {
        throw new Error('Vui lòng nhập JSON payload để encode.')
      }
      let payloadObj: unknown
      try {
        payloadObj = JSON.parse(jwtEncodePayload)
      } catch (err) {
        throw new Error('Payload không phải JSON hợp lệ.')
      }

      const header = { alg: 'HS256', typ: 'JWT' }
      const headerEnc = base64UrlEncode(JSON.stringify(header))
      const payloadEnc = base64UrlEncode(JSON.stringify(payloadObj))
      const signingInput = `${headerEnc}.${payloadEnc}`
      const signature = await hmacSha256(jwtSecret, signingInput)
      setJwtEncodeOutput(`${signingInput}.${signature}`)
    } catch (err) {
      setJwtEncodeError((err as Error).message)
      setJwtEncodeOutput('')
    }
  }

  // JSON formatter
  const [jsonInput, setJsonInput] = useState('')
  const [jsonOutput, setJsonOutput] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleFormatJson = () => {
    try {
      setJsonError(null)
      const parsed = JSON.parse(jsonInput)
      setJsonOutput(JSON.stringify(parsed, null, 2))
    } catch (err) {
      setJsonError((err as Error).message)
      setJsonOutput('')
    }
  }

  // Query → JSON
  const [queryInput, setQueryInput] = useState('')
  const [queryJsonOutput, setQueryJsonOutput] = useState('')
  const [queryError, setQueryError] = useState<string | null>(null)

  const handleQueryToJson = () => {
    try {
      setQueryError(null)
      const params = new URLSearchParams(queryInput.trim().replace(/^\?/, ''))
      const obj: Record<string, string | string[]> = {}
      params.forEach((value, key) => {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const existing = obj[key]
          if (Array.isArray(existing)) {
            existing.push(value)
          } else {
            obj[key] = [existing, value]
          }
        } else {
          obj[key] = value
        }
      })
      setQueryJsonOutput(JSON.stringify(obj, null, 2))
    } catch (err) {
      setQueryError((err as Error).message)
      setQueryJsonOutput('')
    }
  }

  // JSON → Query
  const [jsonToQueryInput, setJsonToQueryInput] = useState('')
  const [jsonToQueryOutput, setJsonToQueryOutput] = useState('')
  const [jsonToQueryError, setJsonToQueryError] = useState<string | null>(null)

  const handleJsonToQuery = () => {
    try {
      setJsonToQueryError(null)
      const parsed = JSON.parse(jsonToQueryInput) as Record<string, unknown>
      const params = new URLSearchParams()
      Object.entries(parsed).forEach(([key, value]) => {
        if (value == null) return
        if (Array.isArray(value)) {
          value.forEach(v => {
            params.append(key, String(v))
          })
        } else {
          params.append(key, String(value))
        }
      })
      setJsonToQueryOutput(params.toString())
    } catch (err) {
      setJsonToQueryError((err as Error).message)
      setJsonToQueryOutput('')
    }
  }

  const handleCopy = (text: string) => {
    if (!text) return
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        // ignore
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 dark:bg-black/60 bg-black/30 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="modal-animate relative w-full max-w-4xl dark:bg-sidebar bg-white dark:border-white/10 border-gray-200 border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-white/5 border-gray-200 flex items-center justify-between dark:bg-white/[0.02] bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <span className="material-symbols-outlined text-xl">terminal</span>
            </div>
            <div>
              <h2 className="text-lg font-bold dark:text-white text-gray-900 tracking-tight">
                IT Tool
              </h2>
              <p className="text-[11px] text-text-muted">
                Encode/Decode & chuyển đổi dữ liệu tiện ích cho developer.
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

        {/* Tabs */}
        <div className="px-6 pt-3 border-b dark:border-white/5 border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'url'
                ? 'bg-accent text-white shadow-[0_0_12px_rgba(129,140,248,0.5)]'
                : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200'
            }`}
            >
              <span className="material-symbols-outlined text-sm">sync_alt</span>
              URL
            </button>
            <button
              onClick={() => setActiveTab('jwt')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'jwt'
                ? 'bg-accent text-white shadow-[0_0_12px_rgba(129,140,248,0.5)]'
                : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200'
            }`}
            >
              <span className="material-symbols-outlined text-sm">dataset</span>
              JWT
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'json'
                ? 'bg-accent text-white shadow-[0_0_12px_rgba(129,140,248,0.5)]'
                : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200'
            }`}
            >
              <span className="material-symbols-outlined text-sm">data_object</span>
              JSON
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'query'
                ? 'bg-accent text-white shadow-[0_0_12px_rgba(129,140,248,0.5)]'
                : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200'
            }`}
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              Query
            </button>
            <button
              onClick={() => setActiveTab('xml')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'xml'
                ? 'bg-accent text-white shadow-[0_0_12px_rgba(129,140,248,0.5)]'
                : 'dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200'
            }`}
            >
              <span className="material-symbols-outlined text-sm">code</span>
              XML
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* URL tab */}
          {activeTab === 'url' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  URL Encode / Decode
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-text-muted">Input</label>
                  <textarea
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="w-full h-40 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/60 custom-scrollbar"
                    placeholder="Nhập chuỗi URL hoặc text..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUrlEncode}
                      className="flex-1 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-accent text-white hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs">lock</span>
                      URL Encode
                    </button>
                    <button
                      onClick={handleUrlDecode}
                      className="flex-1 px-3 py-1.5 rounded-md text-[11px] font-semibold dark:bg-white/5 bg-gray-100 text-text-secondary dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs">lock_open</span>
                      URL Decode
                    </button>
                  </div>
                  {urlError && (
                    <p className="text-[11px] text-red-400">{urlError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-text-muted">Output</label>
                    <button
                      type="button"
                      onClick={() => handleCopy(urlOutput)}
                      className="text-[11px] text-text-muted hover:text-accent flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      Copy
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={urlOutput}
                    className="w-full h-40 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary custom-scrollbar"
                    placeholder="Kết quả sẽ hiển thị tại đây..."
                  />
                </div>
              </div>
            </section>
          )}

          {/* JWT tab */}
          {activeTab === 'jwt' && (
            <section className="space-y-6">
              {/* Decode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    JWT Decode (no key)
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    Chỉ decode header & payload, không verify chữ ký.
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-text-muted">JWT Token</label>
                    <textarea
                      value={jwtInput}
                      onChange={e => setJwtInput(e.target.value)}
                      className="w-full h-40 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/60 custom-scrollbar"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                    <button
                      onClick={handleJwtDecode}
                      className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-accent text-white hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs">key</span>
                      Decode JWT
                    </button>
                    {jwtError && (
                      <p className="text-[11px] text-red-400">{jwtError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-text-muted">Header & Payload (JSON)</label>
                      <button
                        type="button"
                        onClick={() => handleCopy(jwtOutput)}
                        className="text-[11px] text-text-muted hover:text-accent flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">content_copy</span>
                        Copy
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={jwtOutput}
                      className="w-full h-40 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary custom-scrollbar"
                      placeholder="Kết quả decode JWT sẽ hiển thị tại đây..."
                    />
                  </div>
                </div>
              </div>

              {/* Encode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    JWT Encode (HS256 with key)
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    Payload JSON + secret key → JWT token.
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-text-muted">Payload JSON</label>
                    <textarea
                      value={jwtEncodePayload}
                      onChange={e => setJwtEncodePayload(e.target.value)}
                      className="w-full h-32 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/60 custom-scrollbar"
                      placeholder='{"sub":"1234567890","name":"John Doe"}'
                    />
                    <label className="text-[11px] font-medium text-text-muted">Secret key</label>
                    <input
                      type="text"
                      value={jwtSecret}
                      onChange={e => setJwtSecret(e.target.value)}
                      className="w-full text-[13px] rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-1.5 text-text-primary placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/60"
                      placeholder="Nhập secret (HS256)"
                    />
                    <button
                      onClick={handleJwtEncode}
                      className="mt-1 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-accent text-white hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs">key</span>
                      Encode JWT
                    </button>
                    {jwtEncodeError && (
                      <p className="text-[11px] text-red-400 break-all">{jwtEncodeError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-text-muted">JWT token</label>
                      <button
                        type="button"
                        onClick={() => handleCopy(jwtEncodeOutput)}
                        className="text-[11px] text-text-muted hover:text-accent flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">content_copy</span>
                        Copy
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={jwtEncodeOutput}
                      className="w-full h-32 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary custom-scrollbar"
                      placeholder="JWT sau khi encode sẽ hiển thị tại đây..."
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* JSON tab */}
          {activeTab === 'json' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  JSON Formatter / Validator
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-text-muted">JSON Input</label>
                  <textarea
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                    className="w-full h-44 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/60 custom-scrollbar"
                    placeholder='{"foo":"bar"}'
                  />
                  <button
                    onClick={handleFormatJson}
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-accent text-white hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-xs">check</span>
                    Format & Validate
                  </button>
                  {jsonError && (
                    <p className="text-[11px] text-red-400 break-all">{jsonError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-text-muted">Formatted JSON</label>
                    <button
                      type="button"
                      onClick={() => handleCopy(jsonOutput)}
                      className="text-[11px] text-text-muted hover:text-accent flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      Copy
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={jsonOutput}
                    className="w-full h-44 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary custom-scrollbar"
                    placeholder="JSON đẹp, dễ đọc sẽ hiển thị tại đây..."
                  />
                </div>
              </div>
            </section>
          )}

          {/* Query tab */}
          {activeTab === 'query' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Query String ↔ JSON
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Query → JSON */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-text-muted">Query → JSON</label>
                  <textarea
                    value={queryInput}
                    onChange={e => setQueryInput(e.target.value)}
                    className="w-full h-32 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/60 custom-scrollbar"
                    placeholder="a=1&b=2&tag=x&tag=y"
                  />
                  <button
                    onClick={handleQueryToJson}
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-accent text-white hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-xs">swap_horiz</span>
                    To JSON
                  </button>
                  {queryError && (
                    <p className="text-[11px] text-red-400 break-all">{queryError}</p>
                  )}
                  <textarea
                    readOnly
                    value={queryJsonOutput}
                    className="w-full h-32 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary custom-scrollbar"
                    placeholder="Kết quả JSON..."
                  />
                </div>

                {/* JSON → Query */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-text-muted">JSON → Query</label>
                  <textarea
                    value={jsonToQueryInput}
                    onChange={e => setJsonToQueryInput(e.target.value)}
                    className="w-full h-32 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/60 custom-scrollbar"
                    placeholder='{"a":1,"b":2,"tag":["x","y"]}'
                  />
                  <button
                    onClick={handleJsonToQuery}
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-accent text-white hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-xs">swap_horiz</span>
                    To Query
                  </button>
                  {jsonToQueryError && (
                    <p className="text-[11px] text-red-400 break-all">{jsonToQueryError}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <textarea
                      readOnly
                      value={jsonToQueryOutput}
                      className="w-full h-32 text-[13px] leading-snug rounded-lg border dark:border-white/10 border-gray-200 dark:bg-main bg-gray-950/60 px-3 py-2 text-text-primary custom-scrollbar"
                      placeholder="a=1&b=2&tag=x&tag=y"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(jsonToQueryOutput)}
                      className="ml-2 text-[11px] text-text-muted hover:text-accent flex-shrink-0 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* XML tab (placeholder) */}
          {activeTab === 'xml' && (
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  XML (Soon)
                </h3>
                <span className="text-[11px] text-text-muted">
                  Sẽ hỗ trợ pretty-print / validate XML trong bản cập nhật tiếp theo.
                </span>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t dark:border-white/5 border-gray-200 dark:bg-white/[0.02] bg-gray-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-accent text-white shadow-[0_0_15px_rgba(129,140,248,0.4)] hover:bg-accent/90 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

