import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  subscribeRifa,
  subscribeNumeros,
  updateRifaConfig,
  marcarPago,
  cancelarReserva,
} from '../firebase/firestore'
import DrawModal from '../components/DrawModal'
import WheelDrawModal from '../components/WheelDrawModal'
import styles from './AdminRaffle.module.css'

const STATUS_LABEL = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  aguardando_pagamento: 'Aguardando',
  pago: 'Pago',
}

export default function AdminRaffle() {
  const { id } = useParams()
  const [rifa, setRifa] = useState(null)
  const [numeros, setNumeros] = useState([])
  const [filter, setFilter] = useState('todos')
  const [chavePix, setChavePix] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)
  const [showDraw, setShowDraw] = useState(false) // 'drum' | 'wheel' | false

  useEffect(() => {
    const unsub1 = subscribeRifa(id, (data) => {
      setRifa(data)
      if (data) {
        setChavePix(data.chavePix || '')
        setWhatsapp(data.whatsapp || '')
      }
    })
    const unsub2 = subscribeNumeros(id, setNumeros)
    return () => { unsub1(); unsub2() }
  }, [id])

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    setSavingConfig(true)
    await updateRifaConfig(id, { chavePix, whatsapp })
    setSavingConfig(false)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  const filtered = numeros.filter((n) => {
    if (filter === 'todos') return true
    return n.status === filter
  })

  const counts = numeros.reduce((acc, n) => {
    acc[n.status] = (acc[n.status] || 0) + 1
    return acc
  }, {})

  if (!rifa) return null

  return (
    <div className={styles.page}>
      <div className={styles.nav}>
        <Link to="/admin" className={styles.back}>← Voltar</Link>
      </div>

      <header className={styles.header}>
        <div>
          <h1>{rifa.titulo}</h1>
          <p className={styles.sub}>R$ {Number(rifa.valorBilhete).toFixed(2).replace('.', ',')} · {rifa.numeroInicio}–{rifa.numeroFim}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnDraw} onClick={() => setShowDraw('drum')}>
            🎰 Tambor
          </button>
          <button className={styles.btnDraw} onClick={() => setShowDraw('wheel')}>
            🎡 Roleta
          </button>
          <a href={`/rifa/${id}`} target="_blank" rel="noreferrer" className={styles.viewBtn}>
            Ver ↗
          </a>
        </div>
      </header>

      {/* Stats */}
      <div className={styles.stats}>
        <StatCard label="Disponíveis" value={counts.disponivel || 0} color="green" />
        <StatCard label="Reservados" value={counts.reservado || 0} color="yellow" />
        <StatCard label="Aguardando" value={counts.aguardando_pagamento || 0} color="blue" />
        <StatCard label="Pagos" value={counts.pago || 0} color="text2" />
      </div>

      {/* Config PIX / WhatsApp */}
      <form onSubmit={handleSaveConfig} className={styles.configForm}>
        <h2>Configurações</h2>
        <div className={styles.configRow}>
          <label>
            Chave PIX
            <input
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
          </label>
          <label>
            WhatsApp (somente números)
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5511999999999"
            />
          </label>
        </div>
        <button type="submit" className={styles.btnSave} disabled={savingConfig}>
          {configSaved ? 'Salvo!' : savingConfig ? 'Salvando…' : 'Salvar'}
        </button>
      </form>

      {/* Participantes */}
      <div className={styles.section}>
        <h2>Participantes</h2>

        <div className={styles.filters}>
          {['todos', 'aguardando_pagamento', 'pago', 'reservado'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={styles.filterBtn}
              data-active={filter === f}
            >
              {f === 'todos' ? 'Todos' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty}>Nenhum número nesta categoria.</p>
        ) : (
          <div className={styles.table}>
            {filtered
              .filter((n) => n.status !== 'disponivel')
              .map((n) => (
                <ParticipantRow
                  key={n.id}
                  numero={n}
                  rifaId={id}
                  onPago={() => marcarPago(id, n.id)}
                  onCancelar={() => cancelarReserva(id, n.id)}
                />
              ))}
            {filtered.filter((n) => n.status !== 'disponivel').length === 0 && (
              <p className={styles.empty}>Nenhum participante ainda.</p>
            )}
          </div>
        )}
      </div>

      {showDraw === 'drum' && (
        <DrawModal
          numeros={numeros}
          rifaTitulo={rifa.titulo}
          onClose={() => setShowDraw(false)}
        />
      )}
      {showDraw === 'wheel' && (
        <WheelDrawModal
          numeros={numeros}
          rifaTitulo={rifa.titulo}
          onClose={() => setShowDraw(false)}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={styles.statCard} data-color={color}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function ParticipantRow({ numero, rifaId, onPago, onCancelar }) {
  const [loading, setLoading] = useState(false)

  const action = async (fn) => {
    setLoading(true)
    try { await fn() } finally { setLoading(false) }
  }

  return (
    <div className={styles.row} data-status={numero.status}>
      <div className={styles.rowNum}>#{numero.numero}</div>
      <div className={styles.rowInfo}>
        <span className={styles.rowName}>{numero.nome || '—'}</span>
        <span className={styles.rowPhone}>{numero.telefone || '—'}</span>
      </div>
      <div className={styles.rowStatus}>
        <span data-status={numero.status}>{STATUS_LABEL[numero.status]}</span>
      </div>
      <div className={styles.rowActions}>
        {numero.telefone && (
          <a
            href={`https://wa.me/${numero.telefone.replace(/\D/g, '')}?text=Olá ${encodeURIComponent(numero.nome)}! Seu número %23${numero.numero} está aguardando pagamento.`}
            target="_blank"
            rel="noreferrer"
            className={styles.btnWa}
            title="Chamar no WhatsApp"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}
        {numero.status === 'aguardando_pagamento' && (
          <button
            className={styles.btnGreen}
            disabled={loading}
            onClick={() => action(onPago)}
          >
            Pago
          </button>
        )}
        {(numero.status === 'reservado' || numero.status === 'aguardando_pagamento') && (
          <button
            className={styles.btnRed}
            disabled={loading}
            onClick={() => action(onCancelar)}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
