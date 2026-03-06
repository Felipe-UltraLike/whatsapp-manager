import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { connectUazapiInstance } from '@/lib/uazapi'

// GET - Obter QRCode para conexão
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar instância
    const instancia = await prisma.instanciaWhatsApp.findUnique({
      where: { id },
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    if (!instancia) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
    }

    // Verificar permissão
    if (session.user.role !== 'SUPER_ADMIN' && instancia.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: 'Acesso negado a esta instância.' }, { status: 403 })
    }

    // Verificar se já está conectada
    if (instancia.status === 'CONNECTED') {
      return NextResponse.json({ 
        error: 'Instância já está conectada',
        status: 'CONNECTED'
      }, { status: 400 })
    }

    // Atualizar status para CONNECTING
    await prisma.instanciaWhatsApp.update({
      where: { id },
      data: { status: 'CONNECTING' }
    })

    // Obter QRCode da uaZapi
    const uazapiResponse = await connectUazapiInstance(instancia.instanciaId)

    if (uazapiResponse.error) {
      // Reverter status para DISCONNECTED em caso de erro
      await prisma.instanciaWhatsApp.update({
        where: { id },
        data: { status: 'DISCONNECTED' }
      })
      
      return NextResponse.json({ 
        error: `Erro ao obter QRCode: ${uazapiResponse.error}` 
      }, { status: 500 })
    }

    // Atualizar QRCode no banco
    const qrCode = uazapiResponse.base64 || uazapiResponse.qrcode || null
    
    if (qrCode) {
      await prisma.instanciaWhatsApp.update({
        where: { id },
        data: { 
          qrCode: qrCode,
          status: 'CONNECTING'
        }
      })
    }

    return NextResponse.json({
      qrCode: qrCode,
      instanciaId: instancia.instanciaId,
      status: 'CONNECTING'
    })
  } catch (error) {
    console.error('Erro ao obter QRCode:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Atualizar status de conexão (callback da uaZapi ou polling)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, telefone } = body

    // Buscar instância
    const instancia = await prisma.instanciaWhatsApp.findUnique({
      where: { id }
    })

    if (!instancia) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
    }

    // Verificar permissão
    if (session.user.role !== 'SUPER_ADMIN' && instancia.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: 'Acesso negado a esta instância.' }, { status: 403 })
    }

    // Atualizar status
    const dadosAtualizacao: { status?: string; telefone?: string; qrCode?: null } = {}
    
    if (status) {
      dadosAtualizacao.status = status
    }
    
    if (telefone) {
      dadosAtualizacao.telefone = telefone
    }

    // Se conectou, limpar QRCode
    if (status === 'CONNECTED') {
      dadosAtualizacao.qrCode = null
    }

    const instanciaAtualizada = await prisma.instanciaWhatsApp.update({
      where: { id },
      data: dadosAtualizacao
    })

    return NextResponse.json(instanciaAtualizada)
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
