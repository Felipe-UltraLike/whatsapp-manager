import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { z } from 'zod'
import { createUazapiInstance, connectUazapiInstance, deleteUazapiInstance } from '@/lib/uazapi'

// Schema de validação para criação de instância
const createInstanciaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  empresaId: z.string().optional() // Opcional para SUPER_ADMIN
})

// GET - Listar instâncias
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let instancias

    if (user.role === 'SUPER_ADMIN') {
      // Super-Admin vê todas as instâncias
      instancias = await prisma.instanciaWhatsApp.findMany({
        include: {
          empresa: {
            select: { id: true, nome: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Outros usuários veem apenas instâncias da sua empresa
      instancias = await prisma.instanciaWhatsApp.findMany({
        where: { empresaId: user.empresaId },
        include: {
          empresa: {
            select: { id: true, nome: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json(instancias)
  } catch (error) {
    console.error('Erro ao listar instâncias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar nova instância
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createInstanciaSchema.parse(body)

    // Determinar empresaId
    let empresaId: string
    
    if (user.role === 'SUPER_ADMIN') {
      if (!validatedData.empresaId) {
        return NextResponse.json({ error: 'Empresa é obrigatória para criar instância.' }, { status: 400 })
      }
      empresaId = validatedData.empresaId
    } else {
      empresaId = user.empresaId
    }

    // Verificar se a empresa existe e obter limite
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        _count: {
          select: { instancias: true }
        }
      }
    })

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 })
    }

    // REGRA DE NEGÓCIO: Verificar limite de instâncias
    if (empresa._count.instancias >= empresa.maxInstances) {
      return NextResponse.json({ 
        error: `Limite de instâncias atingido. A empresa "${empresa.nome}" já possui ${empresa._count.instancias} instância(s) de um máximo de ${empresa.maxInstances}.` 
      }, { status: 400 })
    }

    // Gerar ID único para a instância
    const instanciaId = `wa-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

    // Criar instância na uaZapi
    const uazapiResponse = await createUazapiInstance(instanciaId)

    if (uazapiResponse.error) {
      return NextResponse.json({ 
        error: `Erro ao criar instância na uaZapi: ${uazapiResponse.error}` 
      }, { status: 500 })
    }

    // Criar instância no banco de dados
    const instancia = await prisma.instanciaWhatsApp.create({
      data: {
        nome: validatedData.nome,
        instanciaId: instanciaId,
        token: uazapiResponse.token || null,
        empresaId: empresaId,
        status: 'DISCONNECTED'
      },
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    return NextResponse.json(instancia, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Erro ao criar instância:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar todas as instâncias (apenas para administração)
export async function DELETE(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Operação não permitida. Delete instâncias individualmente.' }, { status: 400 })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
