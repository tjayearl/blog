import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { BookText, Edit3, LogOut, Plus, Search, Shapes, Trash2 } from 'lucide-react'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { api } from './lib/api.js'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<ShellLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/admin"
              element={(
                <ProtectedRoute>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/dashboard"
              element={(
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/articles"
              element={(
                <ProtectedRoute>
                  <ArticleManagerPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/articles/new"
              element={(
                <ProtectedRoute>
                  <ArticleEditorPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/articles/edit/:id"
              element={(
                <ProtectedRoute>
                  <ArticleEditorPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/categories"
              element={(
                <ProtectedRoute>
                  <CategoryManagerPage />
                </ProtectedRoute>
              )}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function ShellLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/">
          <span className="brand-mark">B</span>
          <span>
            <strong>Blog CMS</strong>
            <small>Phase 1 MVP</small>
          </span>
        </NavLink>

        <nav className="topnav">
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/">
            Public blog
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/admin/dashboard">
            Admin
          </NavLink>
        </nav>

        <div className="topbar-actions">
          {user ? <span className="user-pill">{user.username}</span> : <NavLink className="login-pill" to="/login">Sign in</NavLink>}
          {user ? (
            <button className="ghost-button" type="button" onClick={logout}>
              <LogOut size={16} />
              Logout
            </button>
          ) : null}
        </div>
      </header>

      <main className="content-shell">
        <Outlet />
      </main>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-state">Loading session...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function HomePage() {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    let active = true

    const loadArticles = async () => {
      setLoading(true)
      const params = {}
      if (query) params.search = query
      if (selectedCategory) params.category = selectedCategory

      const response = await api.get('/articles', { params: Object.keys(params).length ? params : undefined })
      if (active) {
        setArticles(response.data)
        setLoading(false)
      }
    }

    loadArticles().catch(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [query, selectedCategory])

  useEffect(() => {
    let active = true

    api.get('/articles/categories').then((response) => {
      if (active) {
        setCategories(response.data)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="hero-grid">
      <div className="hero-copy card-panel">
        <p className="eyebrow">Public blog</p>
        <h1>Readable posts, real article data, and a proper admin workflow behind them.</h1>
        <p className="lede">
          The MVP now talks to a FastAPI backend. Public visitors can browse published posts, while admins can sign in and manage articles.
        </p>

        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search published articles" />
        </label>

        <div className="category-filter-bar">
          <button className={`category-chip${selectedCategory === '' ? ' active' : ''}`} type="button" onClick={() => setSelectedCategory('')}>
            All
          </button>
          {categories.map((category) => (
            <button
              className={`category-chip${selectedCategory === category.slug ? ' active' : ''}`}
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="hero-side card-panel">
        <h2>Phase 1 delivered</h2>
        <ul className="check-list">
          <li>JWT auth and protected admin routes</li>
          <li>PostgreSQL-ready SQLAlchemy models</li>
          <li>Public blog listings and article detail pages</li>
          <li>Article CRUD screens with API integration</li>
        </ul>
      </div>

      <div className="article-grid full-width">
        {loading ? <div className="loading-state">Loading articles...</div> : null}
        {!loading && articles.length === 0 ? <div className="empty-state">No published articles yet.</div> : null}
        {articles.map((article) => (
          <NavLink className="article-card" key={article.id} to={`/article/${article.slug}`}>
            <span className="article-meta">By {article.author.username}</span>
            <h3>{article.title}</h3>
            <p>{article.excerpt}</p>
            <div className="category-pills">
              {article.categories.map((category) => (
                <span className="category-pill" key={category.id}>
                  {category.name}
                </span>
              ))}
            </div>
            <span className="read-more">
              <BookText size={16} /> Read article
            </span>
          </NavLink>
        ))}
      </div>
    </section>
  )
}

function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadArticle = async () => {
      setLoading(true)

      try {
        const response = await api.get(`/articles/slug/${slug}`)
        if (active) {
          setArticle(response.data)
        }
      } catch {
        if (active) {
          setArticle(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadArticle()

    return () => {
      active = false
    }
  }, [slug])

  if (loading) return <div className="loading-state">Loading article...</div>
  if (!article) return <div className="empty-state">Article not found.</div>

  return (
    <article className="article-view card-panel">
      <p className="article-meta">By {article.author.username}</p>
      <h1>{article.title}</h1>
      <p className="lede">{article.excerpt}</p>
      <div className="category-pills">
        {article.categories.map((category) => (
          <span className="category-pill" key={category.id}>
            {category.name}
          </span>
        ))}
      </div>
      {article.cover_image ? <img alt={article.title} className="cover-image" src={article.cover_image} /> : null}
      <div className="article-body">
        {article.content.split('\n').filter(Boolean).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </article>
  )
}

function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/admin/dashboard" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(form.username, form.password)
      navigate('/admin/dashboard', { replace: true })
    } catch (submissionError) {
      setError(submissionError.response?.data?.detail || 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <form className="card-panel auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Admin access</p>
        <h1>Sign in</h1>
        <label>
          Username
          <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        {error ? <div className="error-box">{error}</div> : null}
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <NavLink className="login-pill" to="/register">
          Need an account? Register first
        </NavLink>
      </form>
    </div>
  )
}

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await api.post('/auth/register', form)
      navigate('/login', { replace: true })
    } catch (submissionError) {
      setError(submissionError.response?.data?.detail || 'Unable to create account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <form className="card-panel auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Bootstrap access</p>
        <h1>Create admin account</h1>
        <label>
          Username
          <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </label>
        <label>
          Email
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        {error ? <div className="error-box">{error}</div> : null}
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? 'Creating...' : 'Create account'}
        </button>
      </form>
    </div>
  )
}

function DashboardPage() {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 })

  useEffect(() => {
    api.get('/articles/admin').then((response) => setArticles(response.data))
    api.get('/articles/admin/stats').then((response) => setStats(response.data))
    api.get('/categories/admin').then((response) => setCategories(response.data))
  }, [])

  return (
    <section className="dashboard-grid">
      <div className="stat-card card-panel">
        <h2>Total articles</h2>
        <strong>{stats.total}</strong>
      </div>
      <div className="stat-card card-panel">
        <h2>Published</h2>
        <strong>{stats.published}</strong>
      </div>
      <div className="stat-card card-panel">
        <h2>Drafts</h2>
        <strong>{stats.drafts}</strong>
      </div>

      <div className="card-panel dashboard-panel full-width">
        <div className="panel-header">
          <h2>Seeded content</h2>
          <NavLink className="primary-button inline" to="/admin/categories">
            <Shapes size={16} /> Manage categories
          </NavLink>
        </div>
        <div className="seed-grid">
          <div>
            <h3>Categories</h3>
            <div className="category-pills">
              {categories.map((category) => (
                <span className="category-pill" key={category.id}>
                  {category.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3>Sample articles</h3>
            <ul className="dashboard-list">
              {articles.slice(0, 3).map((article) => (
                <li key={article.id}>
                  <strong>{article.title}</strong>
                  <span>{article.published ? 'Published' : 'Draft'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card-panel dashboard-panel full-width">
        <div className="panel-header">
          <h2>Content queue</h2>
          <NavLink className="primary-button inline" to="/admin/articles/new">
            <Plus size={16} /> New article
          </NavLink>
        </div>
        <div className="admin-table">
          {articles.map((article) => (
            <div className="admin-row" key={article.id}>
              <span>{article.title}</span>
              <span>{article.published ? 'Published' : 'Draft'}</span>
              <NavLink className="login-pill" to={`/admin/articles/edit/${article.id}`}>
                Edit
              </NavLink>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryManagerPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', slug: '' })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const loadCategories = async () => {
    const response = await api.get('/categories/admin')
    setCategories(response.data)
  }

  useEffect(() => {
    let active = true

    const bootstrapCategories = async () => {
      const response = await api.get('/categories/admin')
      if (active) {
        setCategories(response.data)
      }
    }

    bootstrapCategories()

    return () => {
      active = false
    }
  }, [])

  const saveCategory = async (event) => {
    event.preventDefault()
    setError('')

    try {
      if (editingId) {
        await api.patch(`/categories/admin/${editingId}`, form)
      } else {
        await api.post('/categories/admin', form)
      }

      setForm({ name: '', slug: '' })
      setEditingId(null)
      await loadCategories()
    } catch (submissionError) {
      setError(submissionError.response?.data?.detail || 'Unable to save category')
    }
  }

  const editCategory = (category) => {
    setEditingId(category.id)
    setForm({ name: category.name, slug: category.slug })
  }

  const removeCategory = async (categoryId) => {
    setError('')
    try {
      await api.delete(`/categories/admin/${categoryId}`)
      await loadCategories()
    } catch (submissionError) {
      setError(submissionError.response?.data?.detail || 'Unable to delete category')
    }
  }

  return (
    <section className="card-panel full-width category-admin">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Admin tools</p>
          <h1>Manage categories</h1>
        </div>
        <NavLink className="login-pill" to="/admin/dashboard">
          Back to dashboard
        </NavLink>
      </div>

      <form className="category-admin-form" onSubmit={saveCategory}>
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Product Updates" />
        </label>
        <label>
          Slug
          <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="product-updates" />
        </label>
        <button className="primary-button" type="submit">
          {editingId ? 'Update category' : 'Create category'}
        </button>
        {editingId ? (
          <button
            className="login-pill"
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm({ name: '', slug: '' })
            }}
          >
            Cancel
          </button>
        ) : null}
      </form>

      {error ? <div className="error-box full-width">{error}</div> : null}

      <div className="dashboard-list category-admin-list">
        {categories.map((category) => (
          <div className="dashboard-list-item" key={category.id}>
            <div>
              <strong>{category.name}</strong>
              <span>{category.slug}</span>
            </div>
            <div className="crud-actions">
              <button className="login-pill" onClick={() => editCategory(category)} type="button">
                Edit
              </button>
              <button className="login-pill" onClick={() => removeCategory(category.id)} type="button">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ArticleManagerPage() {
  const [articles, setArticles] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/articles/admin').then((response) => setArticles(response.data))
  }, [refreshKey])

  const removeArticle = async (articleId) => {
    await api.delete(`/articles/${articleId}`)
    setRefreshKey((value) => value + 1)
  }

  return (
    <section className="card-panel full-width">
      <div className="panel-header">
        <h1>Article CRUD</h1>
        <button className="primary-button inline" onClick={() => navigate('/admin/articles/new')} type="button">
          <Plus size={16} /> Create article
        </button>
      </div>
      <div className="crud-list">
        {articles.map((article) => (
          <div className="crud-row" key={article.id}>
            <div>
              <strong>{article.title}</strong>
              <p>{article.excerpt}</p>
            </div>
            <div className="crud-actions">
              <NavLink className="icon-button" to={`/admin/articles/edit/${article.id}`}>
                <Edit3 size={16} />
              </NavLink>
              <button className="icon-button" onClick={() => removeArticle(article.id)} type="button">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ArticleEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [categories, setCategories] = useState([])
  const [categoryDraft, setCategoryDraft] = useState('')
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', cover_image: '', published: false, categories: [] })

  useEffect(() => {
    let active = true

    api.get('/categories').then((response) => {
      if (active) {
        setCategories(response.data)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isEditing) return

    api.get('/articles/admin').then((response) => {
      const current = response.data.find((article) => String(article.id) === String(id))
      if (current) {
        setForm({
          title: current.title,
          slug: current.slug,
          excerpt: current.excerpt,
          content: current.content || '',
          cover_image: current.cover_image || '',
          published: current.published,
          categories: current.categories.map((category) => category.name),
        })
      }
    })
  }, [id, isEditing])

  const toggleCategory = (categoryName) => {
    setForm((currentForm) => {
      const hasCategory = currentForm.categories.includes(categoryName)
      return {
        ...currentForm,
        categories: hasCategory
          ? currentForm.categories.filter((existingCategory) => existingCategory !== categoryName)
          : [...currentForm.categories, categoryName],
      }
    })
  }

  const addDraftCategory = () => {
    const cleaned = categoryDraft.trim()
    if (!cleaned) return

    setForm((currentForm) =>
      currentForm.categories.includes(cleaned)
        ? currentForm
        : { ...currentForm, categories: [...currentForm.categories, cleaned] }
    )
    setCategoryDraft('')
  }

  const submitArticle = async (event) => {
    event.preventDefault()
    if (isEditing) {
      await api.patch(`/articles/${id}`, form)
    } else {
      await api.post('/articles', form)
    }
    navigate('/admin/articles')
  }

  return (
    <form className="card-panel editor-grid" onSubmit={submitArticle}>
      <div className="panel-header full-width">
        <h1>{isEditing ? 'Edit article' : 'New article'}</h1>
      </div>
      <label>
        Title
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      </label>
      <label>
        Slug
        <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
      </label>
      <label className="full-width">
        Excerpt
        <textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} />
      </label>
      <label className="full-width">
        Content
        <textarea className="editor-area" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
      </label>
      <label className="full-width">
        Cover image URL
        <input value={form.cover_image} onChange={(event) => setForm({ ...form, cover_image: event.target.value })} />
      </label>
      <div className="full-width category-editor">
        <div className="panel-header compact">
          <h2>Categories</h2>
          <div className="category-draft-row">
            <input value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="Add a category" />
            <button className="primary-button inline" onClick={addDraftCategory} type="button">
              Add
            </button>
          </div>
        </div>
        <div className="category-filter-bar wrap">
          {categories.map((category) => (
            <button
              className={`category-chip${form.categories.includes(category.name) ? ' active' : ''}`}
              key={category.id}
              onClick={() => toggleCategory(category.name)}
              type="button"
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="category-pills">
          {form.categories.map((categoryName) => (
            <button className="category-pill removable" key={categoryName} onClick={() => toggleCategory(categoryName)} type="button">
              {categoryName} ×
            </button>
          ))}
        </div>
      </div>
      <label className="toggle-row full-width">
        <input checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} type="checkbox" />
        Publish article
      </label>
      <button className="primary-button" type="submit">
        Save article
      </button>
    </form>
  )
}

export default App
