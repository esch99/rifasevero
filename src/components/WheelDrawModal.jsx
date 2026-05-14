import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import styles from './WheelDrawModal.module.css'

const COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#e67e22', '#1abc9c', '#e91e63', '#00bcd4', '#cddc39',
  '#ff5722', '#26a69a', '#ab47bc', '#42a5f5', '#ef5350',
]

function drawWheel(canvas, segments, rotation) {
  const ctx = canvas.getContext('2d')
  const size = canvas.width
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 6
  const n = segments.length
  if (n === 0) return
  const arc = (2 * Math.PI) / n

  ctx.clearRect(0, 0, size, size)

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 20
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 2, 0, 2 * Math.PI)
  ctx.fillStyle = '#1a1a1a'
  ctx.fill()
  ctx.restore()

  for (let i = 0; i < n; i++) {
    const startAngle = rotation + i * arc
    const endAngle = startAngle + arc

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    const midAngle = startAngle + arc / 2
    const fontSize = Math.max(9, Math.min(15, Math.floor((arc * radius) / 2.8)))
    ctx.save()
    ctx.translate(
      cx + Math.cos(midAngle) * (radius * 0.68),
      cy + Math.sin(midAngle) * (radius * 0.68)
    )
    ctx.rotate(midAngle + Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 3
    ctx.fillText(String(segments[i].numero), 0, 0)
    ctx.restore()
  }

  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 3
  ctx.stroke()

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28)
  grad.addColorStop(0, '#2a2a2a')
  grad.addColorStop(1, '#111')
  ctx.beginPath()
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, 7, 0, 2 * Math.PI)
  ctx.fillStyle = '#22c55e'
  ctx.fill()
}

function useBRTClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function WheelDrawModal({ numeros, rifaTitulo, onClose }) {
  const pagos = useMemo(() => shuffle(numeros.filter((n) => n.status === 'pago')), [numeros])
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const rotationRef = useRef(0)
  const clock = useBRTClock()

  const [phase, setPhase] = useState('setup')
  const [currentWinners, setCurrentWinners] = useState([])
  const [quantidade, setQuantidade] = useState(1)
  const [pendingWinners, setPendingWinners] = useState([])
  const [remaining, setRemaining] = useState(pagos)
  const [isGlowing, setIsGlowing] = useState(false)

  const remainingRef = useRef(pagos)

  const redraw = useCallback((segs) => {
    if (canvasRef.current) drawWheel(canvasRef.current, segs ?? remainingRef.current, rotationRef.current)
  }, [])

  useEffect(() => { redraw(pagos) }, []) // eslint-disable-line

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const pickWinners = (qtd, pool) => {
    const copy = [...pool]
    const chosen = []
    while (chosen.length < qtd && copy.length > 0) {
      const idx = Math.floor(Math.random() * copy.length)
      chosen.push(copy.splice(idx, 1)[0])
    }
    return chosen
  }

  const spinTo = useCallback((winnerSeg, segs, onDone) => {
    const n = segs.length
    const arc = (2 * Math.PI) / n
    const winnerIdx = segs.findIndex((s) => s.id === winnerSeg.id)

    // Target rotation: pointer at angle 0 (right), segment middle = rotation + idx*arc + arc/2 = 0
    // So: rotation = -(idx*arc + arc/2)  →  normalize to [0, 2π]
    const target = ((-(winnerIdx * arc + arc / 2)) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)

    // Build a final angle that is:
    //   - at least 7 full rotations ahead of current
    //   - lands exactly on target (mod 2π)
    const minAhead = rotationRef.current + 7 * 2 * Math.PI
    const base = Math.ceil(minAhead / (2 * Math.PI)) * 2 * Math.PI
    let finalAngle = base + target
    // Ensure we overshoot the minimum (base already guarantees it, but add 2π buffer if needed)
    if (finalAngle < minAhead) finalAngle += 2 * Math.PI

    const totalRotation = finalAngle - rotationRef.current
    const startRotation = rotationRef.current
    // Longer duration + slower deceleration for suspense
    const duration = 7000 + Math.random() * 1500
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // Quintic ease-out: very aggressive slow-down at the end
      const eased = 1 - Math.pow(1 - t, 6)
      rotationRef.current = startRotation + totalRotation * eased
      drawWheel(canvasRef.current, segs, rotationRef.current)
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        onDone()
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }, [])

  const handleStart = () => {
    const qtd = Math.min(Math.max(1, Number(quantidade)), pagos.length)
    const chosen = pickWinners(qtd, pagos)
    setPendingWinners(chosen.slice(1))
    setCurrentWinners([])
    remainingRef.current = pagos
    setRemaining(pagos)
    setPhase('spinning')

    spinTo(chosen[0], pagos, () => {
      const newRemaining = pagos.filter((s) => s.id !== chosen[0].id)
      remainingRef.current = newRemaining
      setRemaining(newRemaining)
      setIsGlowing(true)
      setCurrentWinners([chosen[0]])
      setTimeout(() => setIsGlowing(false), 1000)

      if (chosen.length === 1) {
        setTimeout(() => setPhase('done'), 800)
      } else {
        setTimeout(() => setPhase('next'), 1000)
      }
    })
  }

  const handleSpinNext = () => {
    const [next, ...rest] = pendingWinners
    setPendingWinners(rest)
    setPhase('spinning')
    const segs = remainingRef.current

    spinTo(next, segs, () => {
      const newRemaining = segs.filter((s) => s.id !== next.id)
      remainingRef.current = newRemaining
      setRemaining(newRemaining)
      setIsGlowing(true)
      setCurrentWinners((prev) => [...prev, next])
      setTimeout(() => setIsGlowing(false), 1000)

      if (rest.length === 0) {
        setTimeout(() => setPhase('done'), 800)
      } else {
        setTimeout(() => setPhase('next'), 1000)
      }
    })
  }

  const handleReset = () => {
    cancelAnimationFrame(animRef.current)
    rotationRef.current = 0
    remainingRef.current = pagos
    setRemaining(pagos)
    setPhase('setup')
    setCurrentWinners([])
    setPendingWinners([])
    redraw(pagos)
  }

  if (pagos.length === 0) {
    return (
      <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className={styles.modal}>
          <div className={styles.empty}>
            <p>Nenhum número pago ainda.</p>
            <button className={styles.btnFechar} onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && phase === 'setup' && onClose()}>
      <div className={styles.modal}>

        <div className={styles.top}>
          <span className={styles.eyebrow}>Sorteio · Roleta</span>
          <h2 className={styles.title}>{rifaTitulo}</h2>
          <div className={styles.clock}>{clock} <span className={styles.tz}>BRT</span></div>
        </div>

        <div className={styles.wheelWrap}>
          <div className={`${styles.wheelGlow} ${isGlowing ? styles.glowing : ''}`} />
          <canvas ref={canvasRef} width={300} height={300} className={styles.canvas} />
          <div className={styles.pointer}>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <polygon points="4,14 26,3 26,25" fill="#22c55e" stroke="rgba(0,0,0,0.3)" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {currentWinners.length > 0 && (
          <div className={styles.winnersSoFar}>
            {currentWinners.map((w, i) => (
              <div key={w.id} className={styles.prevWinner}>
                <span className={styles.prevPos}>{i + 1}°</span>
                <span className={styles.prevNum}>#{w.numero}</span>
                <span className={styles.prevName}>{w.nome}</span>
              </div>
            ))}
          </div>
        )}

        {phase === 'setup' && (
          <div className={styles.actions}>
            <label className={styles.label}>
              Ganhadores
              <input
                type="number" min="1" max={pagos.length}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className={styles.qtyInput}
              />
            </label>
            <button className={styles.btnSortear} onClick={handleStart}>Girar roleta</button>
            <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          </div>
        )}

        {phase === 'spinning' && (
          <p className={styles.spinningLabel}>Girando…</p>
        )}

        {phase === 'next' && (
          <div className={styles.actions}>
            <p className={styles.nextLabel}>
              {pendingWinners.length} sorteio{pendingWinners.length !== 1 ? 's' : ''} restante{pendingWinners.length !== 1 ? 's' : ''}
            </p>
            <button className={styles.btnSortear} onClick={handleSpinNext}>Girar próximo</button>
          </div>
        )}

        {phase === 'done' && (
          <div className={styles.actions}>
            <div className={styles.resultActions}>
              <button className={styles.btnReset} onClick={handleReset}>↩ Novo</button>
              <button className={styles.btnFechar} onClick={onClose}>Fechar</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
