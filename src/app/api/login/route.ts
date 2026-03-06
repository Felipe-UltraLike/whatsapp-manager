import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sign } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp-manager-secret-key-2024'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário no banco
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { empresa: true }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar senha
    const senhaValida = await compare(password, usuario.senha)

    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Criar token JWT
    const token = sign(
      {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
        empresaId: usuario.empresaId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Retornar dados do usuário
    const userData = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role,
      empresaId: usuario.empresaId,
      empresaNome: usuario.empresa.nome,
      token
    }

    const response = NextResponse.json(userData)
    
    // Set cookie com o token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })

    return response
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
