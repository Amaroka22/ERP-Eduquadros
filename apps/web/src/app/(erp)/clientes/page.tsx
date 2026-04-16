"use client";

import { useState } from "react";
import { Plus, Search, Download, Phone, Mail, MapPin, Building2, Eye, Pencil, PowerOff, MoreHorizontal } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { formatCPFCNPJ } from "@/lib/utils";

const clientesIniciais = [
  { id: 1, nome: "Confecção Brasil Ltda",  tipo: "pj", cnpj: "12345678000195", email: "contato@confeccaobrasil.com.br", telefone: "(11) 98765-4321", cidade: "São Paulo",      uf: "SP", status: "ativo",   totalPedidos: 48 },
  { id: 2, nome: "Marca Ativa Indústria",  tipo: "pj", cnpj: "98765432000101", email: "financeiro@marcaativa.com",      telefone: "(21) 91234-5678", cidade: "Rio de Janeiro", uf: "RJ", status: "ativo",   totalPedidos: 32 },
  { id: 3, nome: "Magazine Têxtil S.A.",   tipo: "pj", cnpj: "11223344000155", email: "compras@magazinetextil.com.br",  telefone: "(31) 3456-7890",  cidade: "Belo Horizonte", uf: "MG", status: "ativo",   totalPedidos: 65 },
  { id: 4, nome: "Fashion Store Moda",     tipo: "pj", cnpj: "55667788000133", email: "pedidos@fashionstore.com",       telefone: "(41) 97654-3210", cidade: "Curitiba",       uf: "PR", status: "inativo", totalPedidos: 12 },
  { id: 5, nome: "Roupas & Cia Comércio",  tipo: "pj", cnpj: "99887766000177", email: "gerencia@roupasecia.com.br",     telefone: "(51) 93333-4444", cidade: "Porto Alegre",   uf: "RS", status: "ativo",   totalPedidos: 28 },
];

const emptyForm = { nome: "", cnpj: "", email: "", telefone: "", cidade: "", uf: "", cep: "", logradouro: "", numero: "", bairro: "", condicaoPagamento: "" };

type Cliente = typeof clientesIniciais[0];

export default function ClientesPage() {
  const [clientes, setClientes]     = useState(clientesIniciais);
  const [search, setSearch]         = useState("");
  const [openNovo, setOpenNovo]     = useState(false);
  const [openVer, setOpenVer]       = useState<Cliente | null>(null);
  const [openEditar, setOpenEditar] = useState<Cliente | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [formEdit, setFormEdit]     = useState(emptyForm);

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj.includes(search.replace(/\D/g, ""))
  );

  const handleSalvar = () => {
    const novo = { ...form, id: Date.now(), tipo: "pj", status: "ativo", totalPedidos: 0 };
    setClientes(prev => [...prev, novo as Cliente]);
    setForm(emptyForm);
    setOpenNovo(false);
  };

  const handleSalvarEdicao = () => {
    if (!openEditar) return;
    setClientes(prev => prev.map(c => c.id === openEditar.id ? { ...c, ...formEdit } : c));
    setOpenEditar(null);
  };

  const handleToggleStatus = (id: number) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "ativo" ? "inativo" : "ativo" } : c));
  };

  const abrirEditar = (c: Cliente) => {
    setFormEdit({ nome: c.nome, cnpj: c.cnpj, email: c.email, telefone: c.telefone, cidade: c.cidade, uf: c.uf, cep: "", logradouro: "", numero: "", bairro: "", condicaoPagamento: "" });
    setOpenEditar(c);
  };

  return (
    <div>
      <Header title="Clientes" subtitle={`${clientes.length} clientes cadastrados`} />

      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold mt-1">{clientes.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ativos</p><p className="text-2xl font-bold mt-1 text-success">{clientes.filter(c => c.status === "ativo").length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Inativos</p><p className="text-2xl font-bold mt-1 text-muted-foreground">{clientes.filter(c => c.status === "inativo").length}</p></CardContent></Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CNPJ..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
            <Button size="sm" className="gap-2" onClick={() => setOpenNovo(true)}><Plus className="h-4 w-4" /> Novo Cliente</Button>
          </div>
        </div>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">CNPJ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Localização</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Pedidos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(cliente => (
                    <tr key={cliente.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{cliente.nome.slice(0,2).toUpperCase()}</div>
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            <div className="flex items-center gap-1 mt-0.5"><Building2 className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">PJ</span></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{formatCPFCNPJ(cliente.cnpj)}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{cliente.email}</div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{cliente.telefone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{cliente.cidade} / {cliente.uf}</div></td>
                      <td className="px-6 py-4 text-right"><p className="font-medium">{cliente.totalPedidos}</p><p className="text-xs text-muted-foreground">pedidos</p></td>
                      <td className="px-6 py-4"><Badge variant={cliente.status === "ativo" ? "success" : "secondary"}>{cliente.status === "ativo" ? "Ativo" : "Inativo"}</Badge></td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setOpenVer(cliente)}>
                              <Eye className="h-4 w-4" /> Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => abrirEditar(cliente)}>
                              <Pencil className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => handleToggleStatus(cliente.id)}>
                              <PowerOff className="h-4 w-4" />
                              {cliente.status === "ativo" ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Novo Cliente */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 grid gap-1.5"><Label>Razão Social / Nome *</Label><Input placeholder="Nome completo ou razão social" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>CNPJ / CPF *</Label><Input placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>E-mail</Label><Input type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>Telefone</Label><Input placeholder="(00) 00000-0000" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>Condição de Pagamento</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.condicaoPagamento} onChange={e => setForm({...form, condicaoPagamento: e.target.value})}>
                <option value="">Selecione</option>
                <option>À vista</option><option>7 dias</option><option>14 dias</option><option>21 dias</option><option>28 dias</option><option>30 dias</option><option>30/60 dias</option>
              </select>
            </div>
            <div className="col-span-2 border-t pt-3"><p className="text-sm font-medium mb-3">Endereço</p></div>
            <div className="grid gap-1.5"><Label>CEP</Label><Input placeholder="00000-000" value={form.cep} onChange={e => setForm({...form, cep: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>Logradouro</Label><Input placeholder="Rua, Av..." value={form.logradouro} onChange={e => setForm({...form, logradouro: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>Número</Label><Input value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>Bairro</Label><Input value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>UF</Label><Input maxLength={2} value={form.uf} onChange={e => setForm({...form, uf: e.target.value.toUpperCase()})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={!form.nome || !form.cnpj}>Salvar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver detalhes */}
      <Dialog open={!!openVer} onOpenChange={() => setOpenVer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Cliente</DialogTitle></DialogHeader>
          {openVer && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">{openVer.nome.slice(0,2).toUpperCase()}</div>
                <div><p className="font-semibold text-lg">{openVer.nome}</p><Badge variant={openVer.status === "ativo" ? "success" : "secondary"}>{openVer.status}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">CNPJ</p><p className="font-medium">{formatCPFCNPJ(openVer.cnpj)}</p></div>
                <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{openVer.telefone}</p></div>
                <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{openVer.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Cidade</p><p className="font-medium">{openVer.cidade} / {openVer.uf}</p></div>
                <div><p className="text-xs text-muted-foreground">Total de Pedidos</p><p className="font-bold text-primary text-lg">{openVer.totalPedidos}</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setOpenVer(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={!!openEditar} onOpenChange={() => setOpenEditar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 grid gap-1.5"><Label>Razão Social / Nome *</Label><Input value={formEdit.nome} onChange={e => setFormEdit({...formEdit, nome: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>CNPJ / CPF</Label><Input value={formEdit.cnpj} onChange={e => setFormEdit({...formEdit, cnpj: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>E-mail</Label><Input type="email" value={formEdit.email} onChange={e => setFormEdit({...formEdit, email: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>Telefone</Label><Input value={formEdit.telefone} onChange={e => setFormEdit({...formEdit, telefone: e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>Cidade</Label><Input value={formEdit.cidade} onChange={e => setFormEdit({...formEdit, cidade: e.target.value})} /></div>
            <div className="col-span-2 grid gap-1.5"><Label>UF</Label><Input maxLength={2} value={formEdit.uf} onChange={e => setFormEdit({...formEdit, uf: e.target.value.toUpperCase()})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEditar(null)}>Cancelar</Button>
            <Button onClick={handleSalvarEdicao} disabled={!formEdit.nome}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
