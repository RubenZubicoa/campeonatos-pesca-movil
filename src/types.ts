export type Participante = {
  id: string
  nombre: string
  fechaNacimiento: string
  dni: string
}

export type Campeonato = {
  id: string
  nombre: string
  fecha: string
  lugar: string
}

export type RangoHorario = {
  inicio: string
  fin: string
}

export type AsignacionAcceso = {
  turno: 1 | 2
  sectorId: string
  tramoId: string
  sector: string | null
  tramo: string | null
}

export type MangaAcceso = {
  id: string
  nombre: string
  rangos: [RangoHorario, RangoHorario]
  asignacion: AsignacionAcceso
}

export type Acceso = {
  participante: Participante
  campeonato: Campeonato
  mangas: MangaAcceso[]
}

export type Sector = {
  id: string
  nombre: string
}

export type Tramo = {
  id: string
  nombre: string
  sectorId: string | null
  latitud: number
  longitud: number
}

export type Escenario = {
  sectores: Sector[]
  tramos: Tramo[]
}

export type Captura = {
  id: string
  participanteId: string
  mangaId: string
  longitud: number
  fechaHora: string
}

export type Clasificacion = {
  mangas: {
    id: string
    nombre: string
    filas: { participanteId: string; nombre: string | null; puntos: number | null; puesto: number | null }[]
  }[]
  final: {
    participanteId: string
    nombre: string | null
    puestos: (number | null)[]
    suma: number | null
    puntosTotales: number | null
    puesto: number | null
  }[]
}
