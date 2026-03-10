import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { createUazapiInstance, connectUazapiInstance, getUazapiInstanceStatus } from '@/lib/uazapi'

// GET - Obter QRCode para conexão
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
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
    if (user.role !== 'SUPER_ADMIN' && instancia.empresaId !== user.empresaId) {
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

    let instanceToken = instancia.token

    // Se não tem token, criar instância na uaZapi primeiro
    if (!instanceToken) {
      console.log('[QRCode] Criando instância na uaZapi:', instancia.instanciaId)
      
      const createResponse = await createUazapiInstance(instancia.instanciaId)
      
      if (createResponse.error) {
        // Reverter status para DISCONNECTED em caso de erro
        await prisma.instanciaWhatsApp.update({
          where: { id },
          data: { status: 'DISCONNECTED' }
        })
        
        return NextResponse.json({ 
          error: `Erro ao criar instância na uaZapi: ${createResponse.error}` 
        }, { status: 500 })
      }

      // Salvar o token retornado
      instanceToken = createResponse.token || null
      
      if (instanceToken) {
        await prisma.instanciaWhatsApp.update({
          where: { id },
          data: { token: instanceToken }
        })
        console.log('[QRCode] Token salvo:', instanceToken?.substring(0, 8) + '...')
      }
    }

    // Obter QRCode da uaZapi
    console.log('[QRCode] Conectando instância...')
    const uazapiResponse = await connectUazapiInstance(instanceToken || instancia.instanciaId)

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

    // O QRCode vem em base64 ou instance.qrcode
    const qrCode = uazapiResponse.base64 || uazapiResponse.qrcode || null
    
    // Verificar se conectou (pode ter conectado automaticamente se já tinha sessão)
    if (uazapiResponse.connected) {
      await prisma.instanciaWhatsApp.update({
        where: { id },
        data: { 
          status: 'CONNECTED',
          qrCode: null
        }
      })
      
      return NextResponse.json({
        qrCode: null,
        status: 'CONNECTED',
        message: 'Instância conectada com sucesso!'
      })
    }
    
    // Atualizar QRCode no banco
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
    const user = getAuthUser(request)
    
    if (!user) {
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
    if (user.role !== 'SUPER_ADMIN' && instancia.empresaId !== user.empresaId) {
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
