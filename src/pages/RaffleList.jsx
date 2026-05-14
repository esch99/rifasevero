import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeRifas } from '../firebase/firestore'
import styles from './RaffleList.module.css'

export default function RaffleList() {
  const [rifas, setRifas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return subscribeRifas((data) => {
      setRifas(data)
      setLoading(false)
    })
  }, [])

  const ativas = rifas.filter((r) => r.status === 'ativa')

  if (loading) {
    return (
      <div className={styles.center}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Sorteios ativos</p>
        <h1>Escolha sua rifa</h1>
      </header>

      {ativas.length === 0 ? (
        <p className={styles.empty}>Nenhuma rifa ativa no momento.</p>
      ) : (
        <div className={styles.grid}>
          {ativas.map((rifa) => (
            <Link key={rifa.id} to={`/rifa/${rifa.id}`} className={styles.card}>
              <div className={styles.cardBody}>
                <h2>{rifa.titulo}</h2>
                {rifa.descricao && <p>{rifa.descricao}</p>}
              </div>
              <div className={styles.cardRight}>
                <span className={styles.valor}>
                  R$ {Number(rifa.valorBilhete).toFixed(2).replace('.', ',')}
                </span>
                <span className={styles.arrow}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
