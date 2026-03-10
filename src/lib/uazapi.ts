// uaZapi Integration Library
// Server URL: https://nexus-ultra.uazapi.com
// Admin Token: bZC3KpqjQULdV6Y0jADxs9OuaapBtKuNX84WGWEH2YSNimsjFK

const UAZAPI_SERVER_URL = process.env.UAZAPI_SERVER_URL || 'https://nexus-ultra.uazapi.com'
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN || ''

export interface UazapiInstanceResponse {
  instance?: {
    id?: string
    instanceName?: string
    status?: string
    token?: string
    name?: string
    qrcode?: string
  }
  qrcode?: string
  token?: string
  status?: string
  message?: string
  error?: string
  base64?: string
  code?: string
  state?: string
  phone?: string
  connected?: boolean
  response?: string
}

export interface UazapiConnectResponse {
  qrcode?: string
  base64?: string
  code?: string
  status?: string
  message?: string
  error?: string
  state?: string
  connected?: boolean
  instance?: {
    qrcode?: string
    status?: string
  }
}

/**
 * Formata número de telefone para o padrão uaZapi
 * Format: DDI+DDD+Number@s.whatsapp.net
 * Example: 5511959299715@s.whatsapp.net
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.includes('@')) {
    return cleanPhone
  }
  
  return `${cleanPhone}@s.whatsapp.net`
}

/**
 * Cria uma nova instância WhatsApp na uaZapi
 * Documentação: https://docs.uazapi.com/endpoint/post/instance~init
 * IMPORTANTE: Usa o Admin Token no header 'admintoken' para criar instâncias
 */
export async function createUazapiInstance(instanceName: string): Promise<UazapiInstanceResponse> {
  try {
    console.log('[uaZapi] Criando instância:', instanceName)
    console.log('[uaZapi] Server URL:', UAZAPI_SERVER_URL)
    console.log('[uaZapi] Admin Token configurado:', UAZAPI_ADMIN_TOKEN ? 'Sim' : 'Não')
    
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/init`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'admintoken': UAZAPI_ADMIN_TOKEN  // Admin Token para criar instâncias
      },
      body: JSON.stringify({
        name: instanceName
      })
    })

    const data = await response.json()
    console.log('[uaZapi] Resposta criação:', JSON.stringify(data, null, 2))
    
    if (!response.ok || data.error) {
      return {
        error: data.message || data.error || 'Erro ao criar instância na uaZapi'
      }
    }

    // A resposta da uaZapi retorna o token em data.token ou data.instance.token
    const instanceToken = data.token || data.instance?.token
    const instanceId = data.instance?.id

    console.log('[uaZapi] Token da instância:', instanceToken)
    console.log('[uaZapi] ID da instância:', instanceId)

    return {
      instance: {
        id: instanceId,
        instanceName: data.name || data.instance?.name || instanceName,
        status: data.instance?.status || 'disconnected',
        token: instanceToken
      },
      token: instanceToken,
      status: 'created'
    }
  } catch (error) {
    console.error('[uaZapi] Erro ao criar instância:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi'
    }
  }
}

/**
 * Conecta uma instância e obtem o QRCode
 * Documentação: https://docs.uazapi.com/endpoint/post/instance~connect
 * IMPORTANTE: Usa o token da instância no header 'token'
 */
export async function connectUazapiInstance(instanceToken: string): Promise<UazapiConnectResponse> {
  try {
    console.log('[uaZapi] Conectando instância com token:', instanceToken?.substring(0, 8) + '...')
    
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/connect`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': instanceToken  // Token da instância para conectar
      }
    })

    const data = await response.json()
    console.log('[uaZapi] Resposta conexão:', JSON.stringify(data, null, 2)?.substring(0, 500) + '...')
    
    if (!response.ok || data.error) {
      return {
        error: data.message || data.error || 'Erro ao conectar instância',
      }
    }

    // O QRCode vem em instance.qrcode no formato data:image/png;base64,...
    const qrCode = data.instance?.qrcode || data.qrcode || data.base64

    return {
      base64: qrCode,
      qrcode: qrCode,
      code: data.code,
      status: data.instance?.status || data.status || 'connecting',
      connected: data.connected
    }
  } catch (error) {
    console.error('[uaZapi] Erro ao conectar instância:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi'
    }
  }
}

/**
 * Verificar status da instância
 * Documentação: https://docs.uazapi.com/endpoint/get/instance~status
 */
export async function getUazapiInstanceStatus(instanceToken: string): Promise<UazapiInstanceResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'token': instanceToken
      }
    })

    const data = await response.json()
    console.log('[uaZapi] Status instância:', JSON.stringify(data, null, 2))
    
    if (!response.ok || data.error) {
      return {
        error: data.message || data.error || 'Erro ao obter status'
      }
    }

    return {
      status: data.instance?.status || data.status,
      state: data.instance?.status,
      phone: data.instance?.jid,
      connected: data.connected,
      instance: data.instance
    }
  } catch (error) {
    console.error('[uaZapi] Erro ao obter status:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi'
    }
  }
}

/**
 * Desconectar uma instância
 * Documentação: https://docs.uazapi.com/endpoint/post/instance~disconnect
 */
export async function disconnectUazapiInstance(instanceToken: string): Promise<UazapiInstanceResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/disconnect`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': instanceToken
      }
    })

    const data = await response.json()
    console.log('[uaZapi] Desconectar:', JSON.stringify(data, null, 2))
    
    if (!response.ok || data.error) {
      return {
        error: data.message || data.error || 'Erro ao desconectar instância'
      }
    }

    return {
      status: 'disconnected',
      message: data.message || data.response || 'Instância desconectada'
    }
  } catch (error) {
    console.error('[uaZapi] Erro ao desconectar:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi'
    }
  }
}

/**
 * Deleta uma instância do servidor uaZapi
 */
export async function deleteUazapiInstance(instanceToken: string): Promise<UazapiInstanceResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/delete`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'token': instanceToken
      }
    })

    const data = await response.json()
    console.log('[uaZapi] Deletar:', JSON.stringify(data, null, 2))
    
    if (!response.ok || data.error) {
      return {
        error: data.message || data.error || 'Erro ao deletar instância'
      }
    }

    return {
      status: 'deleted',
      message: data.message || data.response || 'Instância deletada'
    }
  } catch (error) {
    console.error('[uaZapi] Erro ao deletar:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi'
    }
  }
}

/**
 * Lista todas as instâncias no servidor uaZapi
 */
export async function listUazapiInstances(): Promise<UazapiInstanceResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'admintoken': UAZAPI_ADMIN_TOKEN
      }
    })

    const data = await response.json()
    console.log('[uaZapi] Listar instâncias:', JSON.stringify(data, null, 2))
    
    if (!response.ok || data.error) {
      return {
        error: data.message || data.error || 'Erro ao listar instâncias'
      }
    }

    return data
  } catch (error) {
    console.error('[uaZapi] Erro ao listar instâncias:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi'
    }
  }
}
