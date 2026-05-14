import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { subscribeRifas, createRifa, finalizarRifa } from '../firebase/firestore'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const [rifas, setRifas] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    return subscribeRifas(setRifas)
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      const id = await createRifa(data)
      setShowForm(false)
      navigate(`/admin/rifa/${id}`)
    } finally {
      setSaving(false)
    }
  }

  const handleFinalizar = async (id) => {
    if (!confirm('Finalizar esta rifa?')) return
    await finalizarRifa(id)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Painel Admin</h1>
        <button onClick={handleLogout} className={styles.logout}>Sair</button>
      </header>

      <div className={styles.toolbar}>
        <button onClick={() => setShowForm(!showForm)} className={styles.btnPrimary}>
          {showForm ? 'Cancelar' : '+ Nova rifa'}
        </button>
      </div>

      {showForm && (
        <CreateRifaForm onSubmit={handleCreate} saving={saving} />
      )}

      <div className={styles.list}>
        {rifas.length === 0 && (
          <p className={styles.empty}>Nenhuma rifa criada ainda.</p>
        )}
        {rifas.map((rifa) => (
          <div key={rifa.id} className={styles.card}>
            <div>
              <div className={styles.cardTitle}>{rifa.titulo}</div>
              <div className={styles.cardMeta}>
                <span>R$ {Number(rifa.valorBilhete).toFixed(2).replace('.', ',')}</span>
                <span>·</span>
                <span>{rifa.numeroInicio}–{rifa.numeroFim}</span>
                <span className={styles.statusBadge} data-status={rifa.status}>
                  {rifa.status === 'ativa' ? 'Ativa' : 'Finalizada'}
                </span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <Link to={`/admin/rifa/${rifa.id}`} className={styles.btnSecondary}>
                Gerenciar
              </Link>
              {rifa.status === 'ativa' && (
                <button
                  onClick={() => handleFinalizar(rifa.id)}
                  className={styles.btnDanger}
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CreateRifaForm({ onSubmit, saving }) {
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    valorBilhete: '',
    numeroInicio: '',
    numeroFim: '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const [formError, setFormError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')
    const inicio = Number(form.numeroInicio)
    const fim = Number(form.numeroFim)
    if (inicio < 1) return setFormError('Número inicial deve ser maior que 0.')
    if (fim < inicio) return setFormError('Número final deve ser maior que o inicial.')
    if (fim - inicio + 1 > 1000) return setFormError('Máximo de 1000 números por rifa.')
    onSubmit(form)
  }

  const total = form.numeroInicio && form.numeroFim
    ? Math.max(0, Number(form.numeroFim) - Number(form.numeroInicio) + 1)
    : 0

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Nova rifa</h2>

      <div className={styles.row}>
        <label>
          Título *
          <input value={form.titulo} onChange={set('titulo')} placeholder="Ex: Rifa da TV" required />
        </label>
        <label>
          Valor do bilhete *
          <input
            value={form.valorBilhete}
            onChange={set('valorBilhete')}
            placeholder="25,00"
            type="number"
            step="0.01"
            min="0.01"
            required
          />
        </label>
      </div>

      <label>
        Descrição
        <input value={form.descricao} onChange={set('descricao')} placeholder="Opcional" />
      </label>

      <div className={styles.row}>
        <label>
          Número inicial *
          <input
            value={form.numeroInicio}
            onChange={set('numeroInicio')}
            placeholder="1"
            type="number"
            min="1"
            required
          />
        </label>
        <label>
          Número final *
          <input
            value={form.numeroFim}
            onChange={set('numeroFim')}
            placeholder="100"
            type="number"
            min="1"
            required
          />
        </label>
      </div>

      {total > 0 && !formError && (
        <p className={styles.hint}>{total} número{total !== 1 ? 's' : ''} serão criados</p>
      )}

      {formError && <p className={styles.formError}>{formError}</p>}

      <button type="submit" className={styles.btnPrimary} disabled={saving}>
        {saving ? 'Criando…' : 'Criar rifa'}
      </button>
    </form>
  )
}
