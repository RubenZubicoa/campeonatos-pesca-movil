import type { MangaAcceso } from './types'

export function fechaHoraLocal(fecha = new Date()) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  const hora = String(fecha.getHours()).padStart(2, '0')
  const minuto = String(fecha.getMinutes()).padStart(2, '0')
  return `${anio}-${mes}-${dia}T${hora}:${minuto}`
}

export function textoFechaHora(valor: string) {
  const [fecha, hora] = valor.split('T')
  if (!fecha || !hora) return valor
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio} ${hora.slice(0, 5)}`
}

export function horaActual() {
  const ahora = new Date()
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`
}

export function textoRango(inicio: string, fin: string) {
  return `${inicio} – ${fin}`
}

export function rangoDeTurno(manga: MangaAcceso) {
  return manga.rangos[manga.asignacion.turno - 1]
}

export function mangaEnCurso(manga: MangaAcceso) {
  const rango = rangoDeTurno(manga)
  if (!rango) return false
  const hora = horaActual()
  return hora >= rango.inicio && hora < rango.fin
}
