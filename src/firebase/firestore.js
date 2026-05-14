import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'

// ── Rifas ──────────────────────────────────────────────

export function subscribeRifas(callback) {
  const q = query(collection(db, 'rifas'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeRifa(rifaId, callback) {
  return onSnapshot(doc(db, 'rifas', rifaId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
    else callback(null)
  })
}

export async function createRifa({ titulo, descricao, valorBilhete, numeroInicio, numeroFim }) {
  const rifaRef = await addDoc(collection(db, 'rifas'), {
    titulo,
    descricao: descricao || '',
    valorBilhete: Number(valorBilhete),
    numeroInicio: Number(numeroInicio),
    numeroFim: Number(numeroFim),
    status: 'ativa',
    chavePix: '',
    whatsapp: '',
    createdAt: serverTimestamp(),
  })

  const batch = []
  for (let n = Number(numeroInicio); n <= Number(numeroFim); n++) {
    batch.push(
      addDoc(collection(db, 'rifas', rifaRef.id, 'numeros'), {
        numero: n,
        status: 'disponivel',
        nome: '',
        telefone: '',
        reservadoAt: null,
        expiresAt: null,
        paidAt: null,
      })
    )
  }
  await Promise.all(batch)
  return rifaRef.id
}

export async function updateRifaConfig(rifaId, { chavePix, whatsapp }) {
  await updateDoc(doc(db, 'rifas', rifaId), { chavePix, whatsapp })
}

export async function finalizarRifa(rifaId) {
  await updateDoc(doc(db, 'rifas', rifaId), { status: 'finalizada' })
}

// ── Números ────────────────────────────────────────────

export function subscribeNumeros(rifaId, callback) {
  const q = query(collection(db, 'rifas', rifaId, 'numeros'), orderBy('numero'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// Reserva temporária: bloqueia o número por 3 min via transaction
export async function reservarNumero(rifaId, numeroId, { nome, telefone }) {
  const numeroRef = doc(db, 'rifas', rifaId, 'numeros', numeroId)
  const expiresAt = Timestamp.fromMillis(Date.now() + 3 * 60 * 1000)

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(numeroRef)
    if (!snap.exists()) throw new Error('Número não encontrado')

    const data = snap.data()

    // Libera reservas expiradas automaticamente
    if (
      data.status === 'reservado' &&
      data.expiresAt &&
      data.expiresAt.toMillis() < Date.now()
    ) {
      // expirado, pode pegar
    } else if (data.status !== 'disponivel') {
      throw new Error('Número já reservado')
    }

    tx.update(numeroRef, {
      status: 'reservado',
      nome,
      telefone,
      reservadoAt: serverTimestamp(),
      expiresAt,
    })
  })
}

// Confirmar dados → aguardando pagamento
export async function confirmarReserva(rifaId, numeroId) {
  await updateDoc(doc(db, 'rifas', rifaId, 'numeros', numeroId), {
    status: 'aguardando_pagamento',
    expiresAt: null,
  })
}

// Admin: marcar como pago
export async function marcarPago(rifaId, numeroId) {
  await updateDoc(doc(db, 'rifas', rifaId, 'numeros', numeroId), {
    status: 'pago',
    paidAt: serverTimestamp(),
  })
}

// Admin: cancelar reserva
export async function cancelarReserva(rifaId, numeroId) {
  await updateDoc(doc(db, 'rifas', rifaId, 'numeros', numeroId), {
    status: 'disponivel',
    nome: '',
    telefone: '',
    reservadoAt: null,
    expiresAt: null,
    paidAt: null,
  })
}
