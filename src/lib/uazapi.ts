// uaZapi Integration Library
// Server URL: https://nexus-ultra.uazapi.com
// Admin Token: bZC3KpqjQULdV6Y0jADxs9OuaapBtKuNX84WGWEH2YSNimsjFK

const UAZAPI_SERVER_URL = 'https://nexus-ultra.uazapi.com'
const UAZAPI_ADMIN_TOKEN = 'bZC3KpqjQULdV6Y0jADxs9OuaapBtKuNX84WGWEH2YSNimsjFK'

export interface UazapiInstanceResponse {
  instance?: {
    instanceName: string
    status: string
    token?: string
    name?: string
  }
  qrcode?: {
    code?: string
    base64?: string
  }
  token?: string
  status?: string
  message?: string
  error?: string
  base64?: string
  code?: string
  state?: string
  phone?: string
}

export interface UazapiConnectResponse {
  qrcode?: string
  base64?: string
  code?: string
  status?: string
  message?: string
  error?: string
  state?: string
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
 */
export async function createUazapiInstance(instanceName: string): Promise<UazapiInstanceResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/init`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: instanceName
      })
    })

    const data = await response.json()
    console.log('[uaZapi] Criar instância:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao criar instância na uaZapi'
      }
    }

    return {
      instance: {
        instanceName: data.name || data.instance?.instanceName || instanceName,
        status: data.status || 'created',
        token: data.token || data.instance?.token
      },
      token: data.token || data.instance?.token,
      status: 'created'
    }
  } catch (error) {
    console.error('Erro ao criar instância uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi'
    }
  }
}

/**
 * Conecta uma instância e obtem o QRCode
 * Documentação: https://docs.uazapi.com/endpoint/post/instance~connect
 * O token retornado pela createUazapiInstance deve ser usado para conectar
 */
export async function connectUazapiInstance(instanceToken: string): Promise<UazapiConnectResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/connect`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': instanceToken
      }
    })

    const data = await response.json()
    console.log('[uaZapi] Conectar instância:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao conectar instância',
      }
    }

    return {
      base64: data.base64 || data.qrcode?.base64 || data.code,
      qrcode: data.qrcode,
      code: data.code,
      status: data.status || data.state || 'connecting'
    }
  } catch (error) {
    console.error('Erro ao conectar instância uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conex? com uaZapi'
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
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao obter status'
      }
    }

    return {
      status: data.status || data.state,
      state: data.state,
      phone: data.phone,
      instance: data.instance
    }
  } catch (error) {
    console.error('Erro ao obter status uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conex? com uaZapi'
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
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao desconectar instância'
      }
    }

    return {
      status: 'disconnected',
      message: data.message || 'Instância desconectada'
    }
  } catch (error) {
    console.error('Erro ao desconectar instância uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conex? com uaZapi'
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
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao deletar instância'
      }
    }

    return {
      status: 'deleted',
      message: data.message || 'Instância deletada'
    }
  } catch (error) {
    console.error('Erro ao deletar instância uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conex? com uaZapi'
    }
  }
}

/**
 * Lista todas as inst?ncias no servidor uaZapi
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
    console.log('[uaZapi] Listar inst?ncias:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao listar inst?ncias'
      }
    }

    return data
  } catch (error) {
    console.error('Erro ao listar inst?ncias uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conex? com uaZapi'
    }
  }
}
