import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { z } from 'zod'

// Schema de validação para criação de empresa
const createEmpresaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  maxInstances: z.number().int().min(1, 'Máximo de instâncias deve ser pelo menos 1')
})

// GET - Listar todas as empresas (SUPER_ADMIN apenas)
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas Super-Admin pode listar empresas.' }, { status: 403 })
    }

    const empresas = await prisma.empresa.findMany({
      include: {
        _count: {
          select: { usuarios: true, instancias: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(empresas)
  } catch (error) {
    console.error('Erro ao listar empresas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar nova empresa (SUPER_ADMIN apenas)
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas Super-Admin pode criar empresas.' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createEmpresaSchema.parse(body)

    const empresa = await prisma.empresa.create({
      data: {
        nome: validatedData.nome,
        maxInstances: validatedData.maxInstances
      }
    })

    return NextResponse.json(empresa, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Erro ao criar empresa:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
