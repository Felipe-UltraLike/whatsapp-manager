import { getServerSession, type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './db'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      nome: string
      role: string
      empresaId: string
      empresaNome: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    nome: string
    role: string
    empresaId: string
    empresaNome: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { empresa: true }
        })

        if (!usuario) {
          return null
        }

        const senhaValida = await compare(credentials.password, usuario.senha)

        if (!senhaValida) {
          return null
        }

        return {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          role: usuario.role,
          empresaId: usuario.empresaId,
          empresaNome: usuario.empresa.nome
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.nome = user.nome
        token.role = user.role
        token.empresaId = user.empresaId
        token.empresaNome = user.empresaNome
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        nome: token.nome,
        role: token.role,
        empresaId: token.empresaId,
        empresaNome: token.empresaNome
      }
      return session
    }
  },
  pages: {
    signIn: '/'
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET || 'whatsapp-manager-secret-key-2024'
}

export const getAuthSession = () => getServerSession(authOptions)
