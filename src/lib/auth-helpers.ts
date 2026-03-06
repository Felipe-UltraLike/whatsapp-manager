import { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp-manager-secret-key-2024'

export interface AuthUser {
  id: string
  email: string
  role: string
  empresaId: string
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  try {
    // Tentar pegar o token do cookie
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return null
    }

    const decoded = verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}
