import { useState, useEffect } from "react"
import { GrainOverlay } from "@/components/grain-overlay"
import { MagneticButton } from "@/components/magnetic-button"
import Icon from "@/components/ui/icon"
import { useNavigate } from "react-router-dom"

const API_URL = "https://functions.poehali.dev/1ca4b5a1-7736-4193-bd87-e3f1e14fe768"

interface LdspItem {
  id: number
  name: string
  article: string
  width: number
  height: number
  depth: number
  created_at: string
}

const emptyForm = { name: "", article: "", width: "", height: "", depth: "" }

export default function Catalog() {
  const navigate = useNavigate()
  const [items, setItems] = useState<LdspItem[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [search, setSearch] = useState("")

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_URL)
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      setError("Ошибка загрузки данных")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError("")
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          article: form.article,
          width: Number(form.width),
          height: Number(form.height),
          depth: Number(form.depth),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || "Ошибка при добавлении")
      } else {
        setForm(emptyForm)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        fetchItems()
      }
    } catch {
      setError("Ошибка соединения")
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_URL}?id=${id}`, { method: "DELETE" })
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      setError("Ошибка удаления")
    }
  }

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.article.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GrainOverlay />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
          >
            <Icon name="ArrowLeft" size={18} />
            <span className="font-sans text-sm">На главную</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
              <span className="font-bold text-foreground text-sm">М</span>
            </div>
            <span className="font-sans font-semibold text-foreground">Остатки ЛДСП Egger</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* Таблица */}
          <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-sans text-2xl font-light tracking-tight text-foreground md:text-3xl">
                  Каталог остатков
                </h1>
                <p className="font-mono text-xs text-foreground/50 mt-1">
                  {filtered.length} позиций
                </p>
              </div>
              <div className="relative">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по названию или артикулу..."
                  className="w-full rounded-lg border border-foreground/15 bg-foreground/5 py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/30 focus:outline-none sm:w-72"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/80" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-foreground/15 py-16 text-center">
                <Icon name="Package" size={32} className="mb-3 text-foreground/25" />
                <p className="font-sans text-foreground/50">
                  {search ? "Ничего не найдено" : "Остатки ещё не добавлены"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-foreground/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-foreground/10 bg-foreground/5">
                      <th className="px-4 py-3 text-left font-mono text-xs font-medium text-foreground/50">Наименование</th>
                      <th className="px-4 py-3 text-left font-mono text-xs font-medium text-foreground/50">Артикул</th>
                      <th className="px-4 py-3 text-center font-mono text-xs font-medium text-foreground/50">Ш × В × Г, мм</th>
                      <th className="px-4 py-3 text-center font-mono text-xs font-medium text-foreground/50"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, i) => (
                      <tr
                        key={item.id}
                        className={`border-b border-foreground/5 transition-colors hover:bg-foreground/5 ${
                          i % 2 === 0 ? "" : "bg-foreground/[0.02]"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-foreground/60">{item.article}</td>
                        <td className="px-4 py-3 text-center font-mono text-sm text-foreground/80">
                          {item.width} × {item.height} × {item.depth}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded p-1.5 text-foreground/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Форма добавления */}
          <div>
            <div className="sticky top-24 rounded-xl border border-foreground/10 bg-foreground/5 p-6">
              <h2 className="mb-1 font-sans text-lg font-light text-foreground">Добавить остаток</h2>
              <p className="mb-6 font-mono text-xs text-foreground/50">ЛДСП Egger</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-mono text-xs text-foreground/50">Наименование</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Например: Белый премиум W1000"
                    className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-xs text-foreground/50">Артикул</label>
                  <input
                    type="text"
                    required
                    value={form.article}
                    onChange={(e) => setForm({ ...form, article: e.target.value })}
                    placeholder="Например: W1000 ST9"
                    className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-xs text-foreground/50">Габариты, мм</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <input
                        type="number"
                        required
                        min={1}
                        value={form.width}
                        onChange={(e) => setForm({ ...form, width: e.target.value })}
                        placeholder="Ширина"
                        className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/40 focus:outline-none"
                      />
                      <p className="mt-1 text-center font-mono text-[10px] text-foreground/40">Ширина</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        required
                        min={1}
                        value={form.height}
                        onChange={(e) => setForm({ ...form, height: e.target.value })}
                        placeholder="Высота"
                        className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/40 focus:outline-none"
                      />
                      <p className="mt-1 text-center font-mono text-[10px] text-foreground/40">Высота</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        required
                        min={1}
                        value={form.depth}
                        onChange={(e) => setForm({ ...form, depth: e.target.value })}
                        placeholder="Глубина"
                        className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/40 focus:outline-none"
                      />
                      <p className="mt-1 text-center font-mono text-[10px] text-foreground/40">Глубина</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
                )}
                {success && (
                  <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">
                    Остаток успешно добавлен!
                  </p>
                )}

                <MagneticButton
                  size="lg"
                  variant="primary"
                  className="w-full"
                >
                  {adding ? "Добавление..." : "Добавить в каталог"}
                </MagneticButton>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
