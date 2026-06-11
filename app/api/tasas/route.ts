import { NextResponse } from 'next/server'

interface ElToqueTasas {
  USD: number
  ECU: number
  MLC: number
  [key: string]: number
}

interface ElToqueResponse {
  tasas: ElToqueTasas
  date: string
  hour: number
  minutes: number
  seconds: number
}

export async function GET() {
  const token = process.env.EL_TOQUE_API_TOKEN

  if (!token) {
    return NextResponse.json(
      { error: 'EL_TOQUE_API_TOKEN no configurado. Solicita un token en https://tasas.eltoque.com/' },
      { status: 500 }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch('https://tasas.eltoque.com/v1/trmi', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'FinanzasML/1.0',
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json(
        { error: `Error al obtener tasas: ${res.status} ${res.statusText}` },
        { status: res.status }
      )
    }

    const data: ElToqueResponse = await res.json()

    return NextResponse.json({
      usd: data.tasas.USD,
      eur: data.tasas.ECU,
      mlc: data.tasas.MLC,
      date: data.date,
      time: `${String(data.hour).padStart(2, '0')}:${String(data.minutes).padStart(2, '0')}:${String(data.seconds).padStart(2, '0')}`,
    })
  } catch (error) {
    clearTimeout(timeout)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { error: `Error de conexión con la API de El Toque: ${msg}` },
      { status: 502 }
    )
  }
}
