"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Phone, Mail, MapPin, Package, Eye, Pencil, PowerOff } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { formatCPFCNPJ, formatCurrency } from "@/lib/utils";

const fornecedoresIniciais = [
  { id: 1, nome: "Tintas & Cores Ltda",      categoria: "Insumos",       cnpj: "11223344000100", email: "vendas@tintascores.com.br",           telefone: "(11) 3456-7890", cidade: "São Paulo",    uf: "SP", status: "ativo", totalCompras: 28400 },
  { id: 2, nome: "Químicos Brasil Ind.",      categoria: "Insumos",       cnpj: "55443322000188", email: "comercial@quimicosbrasil.com",         telefone: "(11) 91234-5678", cidade: "Guarulhos",   uf: "SP", status: "ativo", totalCompras: 14200 },
  { id: 3, nome: "Têxtil Norte Comércio",     categoria: "Matéria-Prima", cnpj: "99887766000144", email: "pedidos@textilnorte.com.br",           telefone: "(85) 3456-7890", cidade: "Fortaleza",   uf: "CE", status: "ativo", totalCompras: 52600 },
  { id: 4, nome: "Imóveis Industriais SA",    categoria: "Serviços",      cnpj: "22334455000122", email: "contratos@imoveisindustriais.com.br",  telefone: "(11) 3333-4444", cidade: "São Paulo",    uf: "SP", status: "ativo", totalCompras: 42000 },
  { id: 5, nome: "Mec. Industrial Ltda",      categoria: "Manutenção",    cnpj: "66778899000111", email: "manutencao@mecindustrial.com",         telefone: "(11) 97890-1234", cidade: "Santo André", uf: "SP", status: "ativo", totalCompras: 8900  },
  { id: 6, nome: "Escritório Contábil XY",    categoria: "Serviços",      cnpj: "33445566000133", email: "contato@contabilxy.com.br",            telefone: "(11) 3210-9876", cidade: "São Paulo",    uf: "SP", status: "ativo", totalCompras: 7800  },
];

const todasCategorias = ["Insumos", "Matéria-Prima", "Serviços", "Manutenção", "Equipamentos", "Outros"];

const emptyForm = { nome: "", cnpj: "", email: "", telefone: "", categoria: "", cidade: "", uf: "", cep: "", logradouro: "", numero: "", bairro: "" };

type Fornecedor = typeof fornecedoresIniciais[0];

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState(fornecedoresIniciais);
  const [search, setSearch]             = useState("");
  const [categoria, setCategoria]       = useState("todas");
  const [openNovo, setOpenNovo]         = useState(false);
  const [openVer, setOpenVer]           = useState<Fornecedor | null>(null);
  const [openEditar, setOpenEditar]     = useState<Fornecedor | null>(null);
  const [form, setForm]                 = useState(emptyForm);
  const [formEdit, setFormEdit]         = useState(emptyForm);

  const categorias = [...new Set(fornecedores.map(f => f.categoria))];

  const filtered = fornecedores.filter((f) => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.cnpj.includes(search.replace(/\D/g, ""));
    const matchCat = categoria === "todas" || f.categoria === categoria;
    return matchSearch && matchCat;
  });

  const handleSalvar = () => {
    const novo: Fornecedor = {
      ...form,
      id: Date.now(),
      status: "ativo",
      totalCompras: 0,
    };
    setFornecedores(prev => [...prev, novo]);
    setForm(emptyForm);
    setOpenNovo(false);
  };

  const handleSalvarEdicao = () => {
    if (!openEditar) return;
    setFornecedores(prev => prev.map(f => f.id === openEditar.id ? { ...f, ...formEdit } : f));
    setOpenEditar(null);
  };

  const handleToggleStatus = (id: number) => {
    setFornecedores(prev => prev.map(f => f.id === id ? { ...f, status: f.status === "ativo" ? "inativo" : "ativo" } : f));
  };

  const abrirEditar = (f: Fornecedor) => {
    setFormEdit({ nome: f.nome, cnpj: f.cnpj, email: f.email, telefone: f.telefone, categoria: f.categoria, cidade: f.cidade, uf: f.uf, cep: "", logradouro: "", numero: "", bairro: "" });
    setOpenEditar(f);
  };

  return (
    <div>
      <Header title="Fornecedores" subtitle={`${fornecedores.length} fornecedores cadastrados`} />

      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold mt-1">{fornecedores.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ativos</p><p className="text-2xl font-bold mt-1 text-success">{fornecedores.filter(f => f.status === "ativo").length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Insumos</p><p className="text-2xl font-bold mt-1">{fornecedores.filter(f => f.categoria === "Insumos").length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Matéria-Prima</p><p className="text-2xl font-bold mt-1">{fornecedores.filter(f => f.categoria === "Matéria-Prima").length}</p></CardContent></Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar fornecedor..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setOpenNovo(true)}>
            <Plus className="h-4 w-4" /> Novo Fornecedor
          </Button>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {f.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground leading-tight">{f.nome}</p>
                      <Badge variant="outline" className="text-xs mt-1">{f.categoria}</Badge>
                    </div>
                  </div>
                  {/* Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setOpenVer(f); }}>
                        <Eye className="h-4 w-4" /> Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => abrirEditar(f)}>
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => handleToggleStatus(f.id)}>
                        <PowerOff className="h-4 w-4" /> {f.status === "ativo" ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{f.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {f.telefone}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {f.cidade} / {f.uf}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    {formatCPFCNPJ(f.cnpj)}
                  </div>
                  <Badge variant={f.status === "ativo" ? "success" : "secondary"}>
                    {f.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  Total em compras: <span className="font-semibold text-foreground">{formatCurrency(f.totalCompras)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Novo Fornecedor */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 grid gap-1.5">
              <Label>Razão Social / Nome *</Label>
              <Input placeholder="Nome completo ou razão social" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>CNPJ / CPF *</Label>
              <Input placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Categoria *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                <option value="">Selecione</option>
                {todasCategorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>E-mail</Label>
              <Input type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
            </div>
            <div className="col-span-2 border-t pt-3"><p className="text-sm font-medium mb-3">Endereço</p></div>
            <div className="grid gap-1.5">
              <Label>CEP</Label>
              <Input placeholder="00000-000" value={form.cep} onChange={e => setForm({...form, cep: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Logradouro</Label>
              <Input placeholder="Rua, Av..." value={form.logradouro} onChange={e => setForm({...form, logradouro: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Número</Label>
              <Input value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>UF</Label>
              <Input maxLength={2} value={form.uf} onChange={e => setForm({...form, uf: e.target.value.toUpperCase()})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={!form.nome || !form.cnpj || !form.categoria}>Salvar Fornecedor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalhes */}
      <Dialog open={!!openVer} onOpenChange={() => setOpenVer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Fornecedor</DialogTitle></DialogHeader>
          {openVer && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                  {openVer.nome.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{openVer.nome}</p>
                  <Badge variant="outline">{openVer.categoria}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">CNPJ</p><p className="font-medium">{formatCPFCNPJ(openVer.cnpj)}</p></div>
                <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{openVer.telefone}</p></div>
                <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{openVer.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Cidade</p><p className="font-medium">{openVer.cidade} / {openVer.uf}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={openVer.status === "ativo" ? "success" : "secondary"}>{openVer.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Total em Compras</p><p className="font-bold text-primary text-lg">{formatCurrency(openVer.totalCompras)}</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setOpenVer(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={!!openEditar} onOpenChange={() => setOpenEditar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Fornecedor</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 grid gap-1.5">
              <Label>Razão Social / Nome *</Label>
              <Input value={formEdit.nome} onChange={e => setFormEdit({...formEdit, nome: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>CNPJ / CPF</Label>
              <Input value={formEdit.cnpj} onChange={e => setFormEdit({...formEdit, cnpj: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={formEdit.categoria} onChange={e => setFormEdit({...formEdit, categoria: e.target.value})}>
                {todasCategorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={formEdit.email} onChange={e => setFormEdit({...formEdit, email: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Telefone</Label>
              <Input value={formEdit.telefone} onChange={e => setFormEdit({...formEdit, telefone: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Cidade</Label>
              <Input value={formEdit.cidade} onChange={e => setFormEdit({...formEdit, cidade: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>UF</Label>
              <Input maxLength={2} value={formEdit.uf} onChange={e => setFormEdit({...formEdit, uf: e.target.value.toUpperCase()})} />
            </div>
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
