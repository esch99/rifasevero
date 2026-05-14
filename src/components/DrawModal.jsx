import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './DrawModal.module.css'

function useBRTClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function DrawModal({ numeros, rifaTitulo, onClose }) {
  const pagos = numeros.filter((n) => n.status === 'pago')
  const clock = useBRTClock()

  const [phase, setPhase] = useState('setup')
  const [quantidade, setQuantidade] = useState(1)
  const [spinning, setSpinning] = useState({ numero: '?', nome: '...' })
  const [winners, setWinners] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const pickWinners = (qtd) => {
    const pool = [...pagos]
    const chosen = []
    while (chosen.length < qtd && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length)
      chosen.push(pool.splice(idx, 1)[0])
    }
    return chosen
  }

  const spinFor = useCallback((winner, all, idx) => {
    setCurrentIndex(idx)
    let delay = 40
    let elapsed = 0
    const duration = 2600
    // Spin only among numbers not yet won
    const wonIds = new Set(all.slice(0, idx).map((w) => w.id))
    const pool = pagos.filter((p) => !wonIds.has(p.id))

    const tick = () => {
      elapsed += delay
      const rand = pool[Math.floor(Math.random() * pool.length)]
      setSpinning({ numero: rand.numero, nome: rand.nome })
      delay = Math.min(delay * 1.05, 300)

      if (elapsed >= duration) {
        setSpinning({ numero: winner.numero, nome: winner.nome })
        timerRef.current = setTimeout(() => {
          const next = idx + 1
          setWinners(all.slice(0, next))
          if (next < all.length) {
            timerRef.current = setTimeout(() => spinFor(all[next], all, next), 1000)
          } else {
            setPhase('results')
          }
        }, 700)
        return
      }
      timerRef.current = setTimeout(tick, delay)
    }

    timerRef.current = setTimeout(tick, delay)
  }, [pagos])

  const handleStart = () => {
    const qtd = Math.min(Math.max(1, Number(quantidade)), pagos.length)
    const chosen = pickWinners(qtd)
    setWinners([])
    setPhase('spinning')
    spinFor(chosen[0], chosen, 0)
  }

  const handleReset = () => {
    clearTimeout(timerRef.current)
    setPhase('setup')
    setWinners([])
    setSpinning({ numero: '?', nome: '...' })
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && phase === 'setup' && onClose()}
    >
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.eyebrow}>Sorteio</span>
          <h2 className={styles.title}>{rifaTitulo}</h2>
          <div className={styles.clock}>{clock} <span className={styles.tz}>BRT</span></div>
        </div>

        {/* Sem pagos */}
        {pagos.length === 0 && (
          <div className={styles.empty}>
            <p>Nenhum número pago ainda.</p>
            <p className={styles.emptySub}>O sorteio só funciona com números confirmados como pagos.</p>
            <button className={styles.btnFechar} onClick={onClose}>Fechar</button>
          </div>
        )}

        {/* SETUP */}
        {pagos.length > 0 && phase === 'setup' && (
          <div className={styles.setup}>
            <p className={styles.eligible}>{pagos.length} número{pagos.length !== 1 ? 's' : ''} elegíveis</p>
            <label className={styles.label}>
              Quantidade de ganhadores
              <input
                type="number"
                min="1"
                max={pagos.length}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className={styles.qtyInput}
              />
            </label>
            <button className={styles.btnSortear} onClick={handleStart}>
              Iniciar sorteio
            </button>
            <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          </div>
        )}

        {/* SPINNING */}
        {phase === 'spinning' && (
          <div className={styles.spinWrap}>
            {winners.length > 0 && (
              <div className={styles.prevWinners}>
                {winners.map((w, i) => (
                  <div key={w.id} className={styles.prevWinner}>
                    <span className={styles.prevPos}>{i + 1}°</span>
                    <span className={styles.prevNum}>#{w.numero}</span>
                    <span className={styles.prevName}>{w.nome}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.drum}>
              <div className={styles.drumLines} />
              <div className={styles.drumGlow} />
              <div className={styles.drumInner}>
                <div className={styles.drumNumber}>{spinning.numero}</div>
                <div className={styles.drumName}>{spinning.nome}</div>
              </div>
            </div>

            <p className={styles.spinLabel}>
              Sorteando {currentIndex + 1}° lugar…
            </p>
          </div>
        )}

        {/* RESULTS */}
        {phase === 'results' && (
          <div className={styles.results}>
            <div className={styles.trophy}>🏆</div>
            <div className={styles.winnersList}>
              {winners.map((w, i) => (
                <div
                  key={w.id}
                  className={styles.winnerCard}
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  <span className={styles.pos}>{i + 1}°</span>
                  <div className={styles.winnerInfo}>
                    <span className={styles.winnerName}>{w.nome}</span>
                    <span className={styles.winnerNum}>Número {w.numero}</span>
                  </div>
                  {i === 0 && <span className={styles.crown}>👑</span>}
                </div>
              ))}
            </div>
            <div className={styles.resultActions}>
              <button className={styles.btnReset} onClick={handleReset}>↩ Novo sorteio</button>
              <button className={styles.btnFechar} onClick={onClose}>Fechar</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
