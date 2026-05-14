import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { subscribeRifa, subscribeNumeros, reservarNumero, confirmarReserva } from '../firebase/firestore'
import NumberGrid from '../components/NumberGrid'
import ReservationModal from '../components/ReservationModal'
import styles from './RafflePage.module.css'

export default function RafflePage() {
  const { id } = useParams()
  const [rifa, setRifa] = useState(null)
  const [numeros, setNumeros] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [step, setStep] = useState('form')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub1 = subscribeRifa(id, (data) => {
      setRifa(data)
      setLoading(false)
    })
    const unsub2 = subscribeNumeros(id, setNumeros)
    return () => { unsub1(); unsub2() }
  }, [id])

  const handleSelect = useCallback((numero) => {
    if (numero.status !== 'disponivel' && !isExpired(numero)) return
    setSelected(numero)
    setStep('form')
    setError('')
  }, [])

  const handleConfirm = async ({ nome, telefone }) => {
    setSaving(true)
    setError('')
    try {
      await reservarNumero(id, selected.id, { nome, telefone })
      await confirmarReserva(id, selected.id)
      setStep('pix')
    } catch (e) {
      setError(
        e.message === 'Número já reservado'
          ? 'Este número acabou de ser reservado. Escolha outro.'
          : 'Erro ao reservar. Tente novamente.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setSelected(null)
    setError('')
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <div className="spinner" />
      </div>
    )
  }

  if (!rifa) return <div className={styles.center}><p>Rifa não encontrada.</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.backBtn}>
          ← Rifas
        </Link>
        <div className={styles.headerTop}>
          <h1>{rifa.titulo}</h1>
          <span className={styles.valorBadge}>
            R$ {Number(rifa.valorBilhete).toFixed(2).replace('.', ',')}
          </span>
        </div>
        {rifa.descricao && <p className={styles.desc}>{rifa.descricao}</p>}
        <Legend />
      </header>

      <div className={styles.gridWrap}>
        <NumberGrid numeros={numeros} onSelect={handleSelect} />
      </div>

      {selected && (
        <ReservationModal
          numero={selected}
          step={step}
          rifa={rifa}
          error={error}
          saving={saving}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

function Legend() {
  return (
    <div className={styles.legend}>
      {[
        { status: 'disponivel', label: 'Disponível' },
        { status: 'reservado', label: 'Reservado' },
        { status: 'aguardando_pagamento', label: 'Aguardando' },
        { status: 'pago', label: 'Pago' },
      ].map(({ status, label }) => (
        <span key={status} className={styles.legendItem}>
          <i className={styles.dot} data-status={status} />
          {label}
        </span>
      ))}
    </div>
  )
}

function isExpired(numero) {
  if (!numero.expiresAt) return false
  return (numero.expiresAt?.toMillis?.() ?? 0) < Date.now()
}
