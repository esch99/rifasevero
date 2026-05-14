import { useState, useEffect } from 'react'
import styles from './ReservationModal.module.css'

export default function ReservationModal({ numero, step, rifa, error, saving, onConfirm, onClose }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nome.trim() || !telefone.trim()) return
    onConfirm({ nome: nome.trim(), telefone: telefone.trim() })
  }

  const copyPix = () => {
    if (!rifa.chavePix) return
    navigator.clipboard.writeText(rifa.chavePix)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.handle} />

        <div className={styles.numTag}>Número {numero.numero}</div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <h2>Seus dados</h2>
              <p className={styles.sub}>Preencha para reservar o número</p>
            </div>

            <label>
              Nome completo
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="João Silva"
                autoComplete="name"
                autoFocus
                required
              />
            </label>

            <label>
              WhatsApp
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(99) 99999-9999"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.btn} disabled={saving}>
              {saving ? 'Reservando…' : 'Confirmar reserva'}
            </button>
          </form>
        ) : (
          <div className={styles.pix}>
            <div className={styles.checkWrap}>✓</div>

            <div>
              <h2>Número garantido!</h2>
              <p className={styles.sub}>Agora pague via PIX para confirmar.</p>
            </div>

            <div className={styles.pixValor}>
              R$ {Number(rifa.valorBilhete).toFixed(2).replace('.', ',')}
            </div>

            {rifa.chavePix && (
              <button
                type="button"
                className={styles.pixCopyBtn}
                data-copied={copied}
                onClick={copyPix}
              >
                <span className={styles.pixKey}>{rifa.chavePix}</span>
                <span className={styles.pixCopyLabel}>
                  {copied ? '✓ Chave copiada!' : 'Toque para copiar a chave PIX'}
                </span>
              </button>
            )}

            {rifa.whatsapp && (
              <a
                href={`https://wa.me/${rifa.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%21+Paguei+o+n%C3%BAmero+${numero.numero}.+Segue+o+comprovante.`}
                target="_blank"
                rel="noreferrer"
                className={styles.wabtn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar comprovante
              </a>
            )}

            <button type="button" className={styles.btnClose} onClick={onClose}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
