'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Building2, 
  Users, 
  MessageCircle, 
  LogOut, 
  Plus, 
  Trash2, 
  QrCode, 
  Smartphone,
  Loader2,
  Menu
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  nome: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  empresaId: string
  empresaNome: string
}

interface Empresa {
  id: string
  nome: string
  maxInstances: number
  createdAt: string
  _count?: {
    usuarios: number
    instancias: number
  }
}

interface Usuario {
  id: string
  email: string
  nome: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  empresa: {
    id: string
    nome: string
  }
  createdAt: string
}

interface Instancia {
  id: string
  nome: string
  instanciaId: string
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'
  qrCode: string | null
  telefone: string | null
  empresa: {
    id: string
    nome: string
  }
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('instancias')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [qrCodeModal, setQrCodeModal] = useState<{ open: boolean; instancia: Instancia | null; qrCode: string | null; loading: boolean }>({ 
    open: false, 
    instancia: null, 
    qrCode: null,
    loading: false
  })

  // Verificar autenticação
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }
    const parsedUser = JSON.parse(userData)
    // Usar flushSync ou setState de forma assíncrona
    const timer = setTimeout(() => {
      setUser(parsedUser)
      setLoading(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [router])

  // Queries
  const { data: empresas, isLoading: loadingEmpresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: async (): Promise<Empresa[]> => {
      const res = await fetch('/api/empresas')
      if (!res.ok) throw new Error('Erro ao carregar empresas')
      return res.json()
    },
    enabled: user?.role === 'SUPER_ADMIN'
  })

  const { data: usuarios, isLoading: loadingUsuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async (): Promise<Usuario[]> => {
      const res = await fetch('/api/usuarios')
      if (!res.ok) throw new Error('Erro ao carregar usuários')
      return res.json()
    },
    enabled: user?.role === 'SUPER_ADMIN'
  })

  const { data: instancias, isLoading: loadingInstancias, refetch: refetchInstancias } = useQuery({
    queryKey: ['instancias'],
    queryFn: async (): Promise<Instancia[]> => {
      const res = await fetch('/api/instancias')
      if (!res.ok) throw new Error('Erro ao carregar instâncias')
      return res.json()
    },
    enabled: !!user
  })

  // Mutations
  const createEmpresaMutation = useMutation({
    mutationFn: async (data: { nome: string; maxInstances: number }) => {
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao criar empresa')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      toast.success('Empresa criada com sucesso!')
    },
    onError: (error: Error) => toast.error(error.message)
  })

  const deleteEmpresaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/empresas/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao deletar empresa')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      toast.success('Empresa deletada com sucesso!')
    },
    onError: (error: Error) => toast.error(error.message)
  })

  const createUsuarioMutation = useMutation({
    mutationFn: async (data: { email: string; nome: string; senha: string; role: string; empresaId: string }) => {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao criar usuário')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário criado com sucesso!')
    },
    onError: (error: Error) => toast.error(error.message)
  })

  const deleteUsuarioMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao deletar usuário')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário deletado com sucesso!')
    },
    onError: (error: Error) => toast.error(error.message)
  })

  const createInstanciaMutation = useMutation({
    mutationFn: async (data: { nome: string; empresaId?: string }) => {
      const res = await fetch('/api/instancias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao criar instância')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instancias'] })
      toast.success('Instância criada com sucesso!')
    },
    onError: (error: Error) => toast.error(error.message)
  })

  const deleteInstanciaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/instancias/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao deletar instância')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instancias'] })
      toast.success('Instância deletada com sucesso!')
    },
    onError: (error: Error) => toast.error(error.message)
  })

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleGetQrCode = async (instancia: Instancia) => {
    setQrCodeModal({ open: true, instancia, qrCode: null, loading: true })
    try {
      const res = await fetch(`/api/instancias/${instancia.id}/qrcode`)
      const data = await res.json()
      if (res.ok) {
        setQrCodeModal({ open: true, instancia, qrCode: data.qrCode, loading: false })
        refetchInstancias()
      } else {
        toast.error(data.error || 'Erro ao obter QRCode')
        setQrCodeModal({ open: false, instancia: null, qrCode: null, loading: false })
      }
    } catch {
      toast.error('Erro ao obter QRCode')
      setQrCodeModal({ open: false, instancia: null, qrCode: null, loading: false })
    }
  }

  const getRoleBadge = (role: string) => {
    const config: Record<string, { color: string; label: string }> = {
      SUPER_ADMIN: { color: 'bg-red-500', label: 'Super Admin' },
      ADMIN: { color: 'bg-blue-500', label: 'Admin' },
      USER: { color: 'bg-gray-500', label: 'Usuário' }
    }
    const { color, label } = config[role] || config.USER
    return <Badge className={color}>{label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      CONNECTED: { color: 'bg-green-500', label: 'Conectado' },
      CONNECTING: { color: 'bg-yellow-500', label: 'Conectando' },
      DISCONNECTED: { color: 'bg-gray-500', label: 'Desconectado' }
    }
    const { color, label } = config[status] || config.DISCONNECTED
    return <Badge className={color}>{label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const isSuperAdmin = user.role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r transform transition-transform duration-200
        lg:translate-x-0 lg:static lg:z-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold">WhatsApp Manager</h1>
                <p className="text-xs text-muted-foreground">{user.empresaNome}</p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              <Button
                variant={activeTab === 'instancias' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => { setActiveTab('instancias'); setSidebarOpen(false) }}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Instâncias
              </Button>
              
              {isSuperAdmin && (
                <>
                  <Button
                    variant={activeTab === 'empresas' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => { setActiveTab('empresas'); setSidebarOpen(false) }}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Empresas
                  </Button>
                  <Button
                    variant={activeTab === 'usuarios' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => { setActiveTab('usuarios'); setSidebarOpen(false) }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Usuários
                  </Button>
                </>
              )}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback>{user.nome?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">
            {activeTab === 'instancias' && 'Instâncias WhatsApp'}
            {activeTab === 'empresas' && 'Empresas'}
            {activeTab === 'usuarios' && 'Usuários'}
          </h2>
          <div className="ml-auto">{getRoleBadge(user.role)}</div>
        </header>

        <div className="flex-1 p-4 overflow-auto">
          {activeTab === 'instancias' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Gerencie suas instâncias WhatsApp</p>
                <CreateInstanciaDialog 
                  isSuperAdmin={isSuperAdmin} 
                  empresas={empresas || []}
                  onCreate={(data) => createInstanciaMutation.mutate(data)}
                  loading={createInstanciaMutation.isPending}
                />
              </div>

              {loadingInstancias ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : instancias?.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma instância cadastrada</p>
                    <p className="text-sm">Clique em "Nova Instância" para começar</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {instancias?.map((instancia) => (
                    <Card key={instancia.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{instancia.nome}</CardTitle>
                            <CardDescription className="text-xs">{instancia.instanciaId}</CardDescription>
                          </div>
                          {getStatusBadge(instancia.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Empresa:</span>
                            <span>{instancia.empresa.nome}</span>
                          </div>
                        </div>
                        <Separator className="mb-3" />
                        <div className="flex gap-2">
                          {instancia.status !== 'CONNECTED' && (
                            <Button size="sm" variant="outline" onClick={() => handleGetQrCode(instancia)}>
                              <QrCode className="w-4 h-4 mr-1" /> QRCode
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deletar instância?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteInstanciaMutation.mutate(instancia.id)} className="bg-red-500 hover:bg-red-600">Deletar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'empresas' && isSuperAdmin && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Gerencie as empresas do sistema</p>
                <CreateEmpresaDialog onCreate={(data) => createEmpresaMutation.mutate(data)} loading={createEmpresaMutation.isPending} />
              </div>
              {loadingEmpresas ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 gap-4 p-4 bg-muted font-medium text-sm">
                    <div>Nome</div><div>Limite</div><div>Instâncias</div><div>Usuários</div><div className="text-right">Ações</div>
                  </div>
                  {empresas?.map((empresa) => (
                    <div key={empresa.id} className="grid grid-cols-5 gap-4 p-4 border-t items-center">
                      <div className="font-medium">{empresa.nome}</div>
                      <div>{empresa.maxInstances}</div>
                      <div>{empresa._count?.instancias || 0}</div>
                      <div>{empresa._count?.usuarios || 0}</div>
                      <div className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Deletar empresa?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteEmpresaMutation.mutate(empresa.id)} className="bg-red-500 hover:bg-red-600">Deletar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'usuarios' && isSuperAdmin && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Gerencie os usuários do sistema</p>
                <CreateUsuarioDialog empresas={empresas || []} onCreate={(data) => createUsuarioMutation.mutate(data)} loading={createUsuarioMutation.isPending} />
              </div>
              {loadingUsuarios ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 gap-4 p-4 bg-muted font-medium text-sm">
                    <div>Nome</div><div>Email</div><div>Função</div><div>Empresa</div><div className="text-right">Ações</div>
                  </div>
                  {usuarios?.map((usuario) => (
                    <div key={usuario.id} className="grid grid-cols-5 gap-4 p-4 border-t items-center">
                      <div className="font-medium">{usuario.nome}</div>
                      <div className="text-sm text-muted-foreground">{usuario.email}</div>
                      <div>{getRoleBadge(usuario.role)}</div>
                      <div className="text-sm">{usuario.empresa.nome}</div>
                      <div className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="destructive" disabled={usuario.id === user.id}><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Deletar usuário?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUsuarioMutation.mutate(usuario.id)} className="bg-red-500 hover:bg-red-600">Deletar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={qrCodeModal.open} onOpenChange={(open) => setQrCodeModal({ ...qrCodeModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar Instância</DialogTitle>
            <DialogDescription>Escaneie o QRCode para conectar "{qrCodeModal.instancia?.nome}"</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCodeModal.loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-16 h-16 animate-spin text-green-500" />
                <p className="text-sm text-muted-foreground">Gerando QRCode...</p>
              </div>
            ) : qrCodeModal.qrCode ? (
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCodeModal.qrCode.startsWith('data:') ? qrCodeModal.qrCode : `data:image/png;base64,${qrCodeModal.qrCode}`} alt="QRCode" className="w-64 h-64" />
              </div>
            ) : (
              <p className="text-muted-foreground">Não foi possível gerar o QRCode</p>
            )}
          </div>
          <DialogFooter><Button onClick={() => setQrCodeModal({ open: false, instancia: null, qrCode: null, loading: false })}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateEmpresaDialog({ onCreate, loading }: { onCreate: (data: { nome: string; maxInstances: number }) => void; loading: boolean }) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [maxInstances, setMaxInstances] = useState('5')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ nome, maxInstances: parseInt(maxInstances) })
    setNome('')
    setMaxInstances('5')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-green-500 hover:bg-green-600"><Plus className="w-4 h-4 mr-2" />Nova Empresa</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Empresa</DialogTitle><DialogDescription>Cadastre uma nova empresa</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da empresa" required /></div>
            <div className="space-y-2"><Label>Limite de Instâncias</Label><Input type="number" min="1" value={maxInstances} onChange={(e) => setMaxInstances(e.target.value)} required /></div>
          </div>
          <DialogFooter><Button type="submit" disabled={loading}>{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Criar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateUsuarioDialog({ empresas, onCreate, loading }: { empresas: Empresa[]; onCreate: (data: { email: string; nome: string; senha: string; role: string; empresaId: string }) => void; loading: boolean }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState('USER')
  const [empresaId, setEmpresaId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ email, nome, senha, role, empresaId })
    setEmail(''); setNome(''); setSenha(''); setRole('USER'); setEmpresaId('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-green-500 hover:bg-green-600"><Plus className="w-4 h-4 mr-2" />Novo Usuário</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Usuário</DialogTitle><DialogDescription>Cadastre um novo usuário</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Senha</Label><Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Função</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId} required>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button type="submit" disabled={loading || !empresaId}>{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Criar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateInstanciaDialog({ isSuperAdmin, empresas, onCreate, loading }: { isSuperAdmin: boolean; empresas: Empresa[]; onCreate: (data: { nome: string; empresaId?: string }) => void; loading: boolean }) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [empresaId, setEmpresaId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: { nome: string; empresaId?: string } = { nome }
    if (isSuperAdmin) data.empresaId = empresaId
    onCreate(data)
    setNome(''); setEmpresaId('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-green-500 hover:bg-green-600"><Plus className="w-4 h-4 mr-2" />Nova Instância</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Instância WhatsApp</DialogTitle><DialogDescription>Crie uma nova instância</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome da Instância</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Atendimento" required /></div>
            {isSuperAdmin && (
              <div className="space-y-2"><Label>Empresa</Label>
                <Select value={empresaId} onValueChange={setEmpresaId} required>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome} ({e._count?.instancias || 0}/{e.maxInstances})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter><Button type="submit" disabled={loading || (isSuperAdmin && !empresaId)}>{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Criar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
