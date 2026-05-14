import styles from './NumberGrid.module.css'

export default function NumberGrid({ numeros, onSelect }) {
  return (
    <div className={styles.grid}>
      {numeros.map((n) => (
        <NumberCell key={n.id} numero={n} onSelect={onSelect} />
      ))}
    </div>
  )
}

function getStatus(n) {
  if (n.status === 'reservado' && n.expiresAt) {
    const ms = n.expiresAt?.toMillis?.() ?? 0
    if (ms < Date.now()) return 'disponivel'
  }
  return n.status
}

function NumberCell({ numero, onSelect }) {
  const status = getStatus(numero)
  const clickable = status === 'disponivel'

  return (
    <button
      className={styles.cell}
      data-status={status}
      disabled={!clickable}
      onClick={() => clickable && onSelect(numero)}
      aria-label={`Número ${numero.numero} — ${status}`}
    >
      {numero.numero}
    </button>
  )
}
