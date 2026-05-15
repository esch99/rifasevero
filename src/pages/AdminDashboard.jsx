import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { subscribeRifas, createRifa, finalizarRifa, deletarRifa } from '../firebase/firestore'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const [rifas, setRifas] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newRifaId, setNewRifaId] = useState(null)
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
      setNewRifaId(id)
    } finally {
      setSaving(false)
    }
  }

  const handleFinalizar = async (id) => {
    if (!confirm('Finalizar esta rifa?')) return
    await finalizarRifa(id)
  }

  const handleDeletar = async (id, titulo) => {
    if (!confirm(`Apagar a rifa "${titulo}" permanentemente? Isso não pode ser desfeito.`)) return
    await deletarRifa(id)
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

      {newRifaId && (
        <ShareModal
          rifaId={newRifaId}
          onClose={() => setNewRifaId(null)}
          onManage={() => navigate(`/admin/rifa/${newRifaId}`)}
        />
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
                <button onClick={() => handleFinalizar(rifa.id)} className={styles.btnDanger}>
                  Finalizar
                </button>
              )}
              <button onClick={() => handleDeletar(rifa.id, rifa.titulo)} className={styles.btnDelete}>
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ShareModal({ rifaId, onClose, onManage }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/rifa/${rifaId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const el = document.createElement('textarea')
      el.value = link
      el.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
      document.body.appendChild(el)
      el.focus(); el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waText = encodeURIComponent(`🎟️ Acesse a rifa e escolha seu número:\n${link}`)

  return (
    <div className={styles.shareOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.shareModal}>
        <div className={styles.shareIcon}>🎉</div>
        <h2 className={styles.shareTitle}>Rifa criada!</h2>
        <p className={styles.shareSub}>Compartilhe o link com seus participantes</p>

        <div className={styles.linkBox}>
          <span className={styles.linkText}>{link}</span>
        </div>

        <button className={styles.btnCopy} onClick={handleCopy}>
          {copied ? '✓ Link copiado!' : 'Copiar link'}
        </button>

        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noreferrer"
          className={styles.btnWaShare}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Enviar no WhatsApp
        </a>

        <div className={styles.shareActions}>
          <button className={styles.btnManage} onClick={onManage}>Gerenciar rifa</button>
          <button className={styles.btnSkip} onClick={onClose}>Fechar</button>
        </div>
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
