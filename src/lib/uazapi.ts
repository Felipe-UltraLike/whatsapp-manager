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
  }
  qrcode?: {
    code?: string
    base64?: string
  }
  status?: string
  message?: string
  error?: string
}

export interface UazapiConnectResponse {
  qrcode?: string
  base64?: string
  status?: string
  message?: string
  error?: string
}

/**
 * Formata número de telefone para o padrão uaZapi
 * Formato: DDI+DDD+Numero@s.whatsapp.net
 * Exemplo: 5511959299715@s.whatsapp.net
 */
export function formatPhoneNumber(phone: string): string {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Se já tiver o sufixo, retorna como está
  if (cleanPhone.includes('@')) {
    return cleanPhone
  }
  
  return `${cleanPhone}@s.whatsapp.net`
}

/**
 * Cria uma nova instância WhatsApp na uaZapi
 */
export async function createUazapiInstance(instanceName: string): Promise<UazapiInstanceResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'admintoken': UAZAPI_ADMIN_TOKEN
      },
      body: JSON.stringify({
        instanceName: instanceName
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao criar instância na uaZapi',
        status: 'error'
      }
    }

    return data
  } catch (error) {
    console.error('Erro ao criar instância uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi',
      status: 'error'
    }
  }
}

/**
 * Conecta uma instância e obtém o QRCode
 */
export async function connectUazapiInstance(instanceName: string): Promise<UazapiConnectResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'admintoken': UAZAPI_ADMIN_TOKEN
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao conectar instância',
        status: 'error'
      }
    }

    return data
  } catch (error) {
    console.error('Erro ao conectar instância uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi',
      status: 'error'
    }
  }
}

/**
 * Obtém status de uma instância
 */
export async function getUazapiInstanceStatus(instanceName: string): Promise<UazapiInstanceResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/status/${instanceName}`, {
      method: 'GET',
      headers: {
        'admintoken': UAZAPI_ADMIN_TOKEN
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao obter status',
        status: 'error'
      }
    }

    return data
  } catch (error) {
    console.error('Erro ao obter status uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi',
      status: 'error'
    }
  }
}

/**
 * Desconecta uma instância
 */
export async function disconnectUazapiInstance(instanceName: string): Promise<UazapiInstanceResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'admintoken': UAZAPI_ADMIN_TOKEN
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao desconectar instância',
        status: 'error'
      }
    }

    return data
  } catch (error) {
    console.error('Erro ao desconectar instância uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi',
      status: 'error'
    }
  }
}

/**
 * Deleta uma instância do servidor uaZapi
 */
export async function deleteUazapiInstance(instanceName: string): Promise<UazapiInstanceResponse> {
  try {
    const response = await fetch(`${UAZAPI_SERVER_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'admintoken': UAZAPI_ADMIN_TOKEN
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao deletar instância',
        status: 'error'
      }
    }

    return data
  } catch (error) {
    console.error('Erro ao deletar instância uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi',
      status: 'error'
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
        'admintoken': UAZAPI_ADMIN_TOKEN
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erro ao listar instâncias',
        status: 'error'
      }
    }

    return data
  } catch (error) {
    console.error('Erro ao listar instâncias uaZapi:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro de conexão com uaZapi',
      status: 'error'
    }
  }
}
