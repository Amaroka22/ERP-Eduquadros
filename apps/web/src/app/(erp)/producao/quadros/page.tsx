"use client";

import { useState } from "react";
import { Plus, Search, Frame, MapPin, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type Quadro = {
  id: string;
  cliente: string;
  arte: string;
  tamanho: string;
  malha: string;
  status: string;
  localizacao: string;
};

const quadrosIniciais: Quadro[] = [
  { id: "QD-0014", cliente: "Confecção Brasil", arte: "Logo Verão 2026",      tamanho: "40x60cm", malha: "120 fios", status: "em_uso",      localizacao: "Prateleira A3" },
  { id: "QD-0022", cliente: "Fashion Store",    arte: "Estampa Floral",        tamanho: "30x40cm", malha: "90 fios",  status: "em_gravacao", localizacao: "Gravação"      },
  { id: "QD-0009", cliente: "Marca Ativa",      arte: "Coleção Surf",          tamanho: "45x65cm", malha: "140 fios", status: "ativo",       localizacao: "Prateleira B1" },
  { id: "QD-0007", cliente: "Roupas & Cia",     arte: "Logo Básico",           tamanho: "20x30cm", malha: "80 fios",  status: "ativo",       localizacao: "Prateleira A7" },
  { id: "QD-0003", cliente: "Magazine Têxtil",  arte: "Coleção Outono",        tamanho: "50x70cm", malha: "160 fios", status: "ativo",       localizacao: "Prateleira C2" },
  { id: "QD-0018", cliente: "Confecção Brasil", arte: "Coleção Inverno 2025",  tamanho: "40x60cm", malha: "120 fios", status: "danificado",  localizacao: "Descarte"      },
];

const clientes = ["Confecção Brasil","Marca Ativa","Magazine Têxtil","Fashion Store","Roupas & Cia"];
const malhas   = ["80 fios","90 fios","110 fios","120 fios","140 fios","160 fios","180 fios"];
const tamanhos = ["20x30cm","30x40cm","40x60cm","45x65cm","50x70cm","60x80cm"];
const localizacoes = ["Prateleira A1","Prateleira A3","Prateleira A7","Prateleira B1","Prateleira C2","Gravação","Em uso no carrossel","Descarte"];

const statusConfig = {
  ativo:       { label: "Disponível",  variant: "success"     as const },
  em_uso:      { label: "Em Uso",      variant: "info"        as const },
  em_gravacao: { label: "Em Gravação", variant: "warning"     as const },
  danificado:  { label: "Danificado",  variant: "destructive" as const },
  descartado:  { label: "Descartado",  variant: "secondary"   as const },
};

const emptyForm = { cliente: "", arte: "", tamanho: "40x60cm", malha: "120 fios", localizacao: "Prateleira A1" };

export default function QuadrosPage() {
  const [quadros, setQuadros]       = useState(quadrosIniciais);
  const [search, setSearch]         = useState("");
  const [filtro, setFiltro]         = useState("todos");
  const [openNovo, setOpenNovo]     = useState(false);
  const [openVer, setOpenVer]       = useState<Quadro | null>(null);
  const [openEditar, setOpenEditar] = useState<Quadro | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [formEdit, setFormEdit]     = useState<Quadro | null>(null);

  const resumo = {
    total:       quadros.length,
    disponiveis: quadros.filter(q => q.status === "ativo").length,
    emUso:       quadros.filter(q => q.status === "em_uso").length,
    danificados: quadros.filter(q => q.status === "danificado").length,
  };

  const filtered = quadros.filter(q => {
    const matchSearch = q.cliente.toLowerCase().includes(search.toLowerCase()) ||
      q.arte.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = filtro === "todos" || q.status === filtro;
    return matchSearch && matchFiltro;
  });

  const handleSalvarNovo = () => {
    const num = String(quadros.length + 18).padStart(4, "0");
    const novo: Quadro = {
      id: `QD-0${num}`,
      ...form,
      status: "ativo",
    };
    setQuadros(prev => [novo, ...prev]);
    setForm(emptyForm);
    setOpenNovo(false);
  };

  const handleSalvarEdicao = () => {
    if (!formEdit) return;
    setQuadros(prev => prev.map(q => q.id === formEdit.id ? { ...formEdit } : q));
    setOpenEditar(null);
    setFormEdit(null);
  };

  const handleMarcarDanificado = (id: string) => {
    setQuadros(prev => prev.map(q => q.id === id ? { ...q, status: "danificado", localizacao: "Descarte" } : q));
  };

  const abrirEditar = (q: Quadro) => {
    setFormEdit({ ...q });
    setOpenEditar(q);
  };

  return (
    <div>
      <Header title="Quadros / Telas" subtitle="Controle de telas serigráficas por cliente" />

      <div className="p-6 space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold mt-1">{resumo.total}</p></CardContent></Card>
          <Card className="border-success/30 bg-success/5"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Disponíveis</p><p className="text-2xl font-bold mt-1 text-success">{resumo.disponiveis}</p></CardContent></Card>
          <Card className="border-primary/30 bg-primary/5"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Em Uso</p><p className="text-2xl font-bold mt-1 text-primary">{resumo.emUso}</p></CardContent></Card>
          <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Danificados</p><p className="text-2xl font-bold mt-1 text-destructive">{resumo.danificados}</p></CardContent></Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por código, cliente ou arte..." className="pl-9 w-72" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex rounded-md border border-input overflow-hidden">
              {[{k:"todos",l:"Todos"},{k:"ativo",l:"Disponível"},{k:"em_uso",l:"Em Uso"},{k:"danificado",l:"Danificado"}].map(({k,l}) => (
                <button key={k} onClick={() => setFiltro(k)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${filtro === k ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setOpenNovo(true)}>
            <Plus className="h-4 w-4" /> Novo Quadro
          </Button>
        </div>

        {/* Grid de quadros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((q) => {
            const s = statusConfig[q.status as keyof typeof statusConfig];
            return (
              <Card key={q.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Frame className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-primary text-sm">{q.id}</p>
                        <Badge variant={s.variant} className="text-xs mt-0.5">{s.label}</Badge>
                      </div>
                    </div>
                    {/* Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setOpenVer(q)}>
                          <Eye className="h-4 w-4" /> Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => abrirEditar(q)}>
                          <Pencil className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        {q.status !== "danificado" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => handleMarcarDanificado(q.id)}>
                              <Trash2 className="h-4 w-4" /> Marcar danificado
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="text-sm font-medium">{q.cliente}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Arte</p>
                      <p className="text-sm">{q.arte}</p>
                    </div>
                    <div className="flex gap-4">
                      <div><p className="text-xs text-muted-foreground">Tamanho</p><p className="text-sm font-medium">{q.tamanho}</p></div>
                      <div><p className="text-xs text-muted-foreground">Malha</p><p className="text-sm font-medium">{q.malha}</p></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {q.localizacao}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal Novo Quadro */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Quadro / Tela</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Cliente *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}>
                <option value="">Selecione</option>
                {clientes.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Arte / Estampa *</Label>
              <Input placeholder="Ex: Logo Verão 2026" value={form.arte} onChange={e => setForm({...form, arte: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Tamanho</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.tamanho} onChange={e => setForm({...form, tamanho: e.target.value})}>
                  {tamanhos.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Malha</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.malha} onChange={e => setForm({...form, malha: e.target.value})}>
                  {malhas.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Localização</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.localizacao} onChange={e => setForm({...form, localizacao: e.target.value})}>
                {localizacoes.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={handleSalvarNovo} disabled={!form.cliente || !form.arte}>Cadastrar Quadro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalhes */}
      <Dialog open={!!openVer} onOpenChange={() => setOpenVer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Quadro</DialogTitle></DialogHeader>
          {openVer && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Frame className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-primary text-lg">{openVer.id}</p>
                  <Badge variant={statusConfig[openVer.status as keyof typeof statusConfig].variant}>
                    {statusConfig[openVer.status as keyof typeof statusConfig].label}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{openVer.cliente}</p></div>
                <div><p className="text-xs text-muted-foreground">Arte</p><p className="font-medium">{openVer.arte}</p></div>
                <div><p className="text-xs text-muted-foreground">Tamanho</p><p className="font-medium">{openVer.tamanho}</p></div>
                <div><p className="text-xs text-muted-foreground">Malha</p><p className="font-medium">{openVer.malha}</p></div>
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Localização</p><p className="font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{openVer.localizacao}</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setOpenVer(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={!!openEditar} onOpenChange={() => setOpenEditar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Quadro — {openEditar?.id}</DialogTitle></DialogHeader>
          {formEdit && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>Cliente</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formEdit.cliente} onChange={e => setFormEdit({...formEdit, cliente: e.target.value})}>
                  {clientes.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Arte</Label>
                <Input value={formEdit.arte} onChange={e => setFormEdit({...formEdit, arte: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Tamanho</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formEdit.tamanho} onChange={e => setFormEdit({...formEdit, tamanho: e.target.value})}>
                    {tamanhos.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Malha</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formEdit.malha} onChange={e => setFormEdit({...formEdit, malha: e.target.value})}>
                    {malhas.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formEdit.status} onChange={e => setFormEdit({...formEdit, status: e.target.value})}>
                  {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Localização</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formEdit.localizacao} onChange={e => setFormEdit({...formEdit, localizacao: e.target.value})}>
                  {localizacoes.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEditar(null)}>Cancelar</Button>
            <Button onClick={handleSalvarEdicao}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
