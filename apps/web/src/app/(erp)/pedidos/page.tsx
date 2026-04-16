"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, ArrowRight, Calendar, Eye, XCircle, CheckCircle2, MoreHorizontal } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";

const pedidosIniciais = [
  { id: "PED-0041", cliente: "Confecção Brasil Ltda",  itens: 2, valor: 3200, status: "em_producao",  criado: "2026-04-14", entrega: "2026-04-18", obs: "" },
  { id: "PED-0040", cliente: "Marca Ativa Indústria",  itens: 1, valor: 1800, status: "aguardando",   criado: "2026-04-13", entrega: "2026-04-20", obs: "" },
  { id: "PED-0039", cliente: "Magazine Têxtil S.A.",   itens: 3, valor: 5600, status: "entregue",     criado: "2026-04-10", entrega: "2026-04-12", obs: "" },
  { id: "PED-0038", cliente: "Fashion Store Moda",     itens: 1, valor:  920, status: "em_producao",  criado: "2026-04-11", entrega: "2026-04-15", obs: "" },
  { id: "PED-0037", cliente: "Roupas & Cia Comércio",  itens: 2, valor: 2400, status: "faturado",     criado: "2026-04-08", entrega: "2026-04-11", obs: "" },
  { id: "PED-0036", cliente: "Magazine Têxtil S.A.",   itens: 4, valor: 8100, status: "entregue",     criado: "2026-04-05", entrega: "2026-04-09", obs: "" },
];

const clientes = ["Confecção Brasil Ltda", "Marca Ativa Indústria", "Magazine Têxtil S.A.", "Fashion Store Moda", "Roupas & Cia Comércio"];

const statusConfig: Record<string, { label: string; variant: "secondary" | "info" | "success" | "destructive" | "warning" | "outline" }> = {
  aguardando:         { label: "Aguardando",     variant: "secondary" },
  confirmado:         { label: "Confirmado",     variant: "info"      },
  em_producao:        { label: "Em Produção",    variant: "info"      },
  producao_concluida: { label: "Prod. Concluída",variant: "success"   },
  faturado:           { label: "Faturado",       variant: "success"   },
  entregue:           { label: "Entregue",       variant: "success"   },
  cancelado:          { label: "Cancelado",      variant: "destructive"},
};

// Próximo status possível para avançar o fluxo
const proximoStatus: Record<string, string> = {
  aguardando:         "confirmado",
  confirmado:         "em_producao",
  em_producao:        "producao_concluida",
  producao_concluida: "faturado",
  faturado:           "entregue",
};

const acaoLabel: Record<string, string> = {
  aguardando:         "Confirmar Pedido",
  confirmado:         "Enviar p/ Produção",
  em_producao:        "Concluir Produção",
  producao_concluida: "Faturar",
  faturado:           "Marcar Entregue",
};

type Pedido = typeof pedidosIniciais[0];

const emptyForm = { cliente: "", entrega: "", descricao: "", quantidade: "", valorUnitario: "", obs: "" };

export default function PedidosPage() {
  const [pedidos, setPedidos]     = useState(pedidosIniciais);
  const [search, setSearch]       = useState("");
  const [filtro, setFiltro]       = useState("todos");
  const [openNovo, setOpenNovo]   = useState(false);
  const [openVer, setOpenVer]     = useState<Pedido | null>(null);
  const [form, setForm]           = useState(emptyForm);

  const filtered = pedidos.filter(p => {
    const matchSearch = p.cliente.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = filtro === "todos" || p.status === filtro;
    return matchSearch && matchFiltro;
  });

  const totalAberto = pedidos.filter(p => !["entregue","cancelado"].includes(p.status)).reduce((a, p) => a + p.valor, 0);

  const handleAvancarStatus = (id: string) => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next = proximoStatus[p.status];
      return next ? { ...p, status: next } : p;
    }));
  };

  const handleCancelar = (id: string) => {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: "cancelado" } : p));
  };

  const handleSalvar = () => {
    const num = String(pedidos.length + 36).padStart(4, "0");
    const novoPedido: Pedido = {
      id: `PED-0${num}`,
      cliente: form.cliente,
      itens: 1,
      valor: Number(form.quantidade) * Number(form.valorUnitario) || 0,
      status: "aguardando",
      criado: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
      entrega: form.entrega,
      obs: form.obs,
    };
    setPedidos(prev => [novoPedido, ...prev]);
    setForm(emptyForm);
    setOpenNovo(false);
  };

  return (
    <div>
      <Header title="Pedidos de Venda" subtitle={`${pedidos.filter(p => !["entregue","cancelado"].includes(p.status)).length} pedidos em aberto`} />

      <div className="p-6 space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Em Aberto</p><p className="text-2xl font-bold mt-1">{pedidos.filter(p => !["entregue","cancelado"].includes(p.status)).length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Em Produção</p><p className="text-2xl font-bold mt-1 text-primary">{pedidos.filter(p => p.status === "em_producao").length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Aguardando</p><p className="text-2xl font-bold mt-1 text-warning">{pedidos.filter(p => p.status === "aguardando").length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Valor em Aberto</p><p className="text-xl font-bold mt-1">{formatCurrency(totalAberto)}</p></CardContent></Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar pedido ou cliente..." className="pl-9 w-60" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex rounded-md border border-input overflow-hidden">
              {[{k:"todos",l:"Todos"},{k:"aguardando",l:"Aguardando"},{k:"em_producao",l:"Produção"},{k:"entregue",l:"Entregues"}].map(({k,l}) => (
                <button key={k} onClick={() => setFiltro(k)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${filtro === k ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/orcamentos">Orçamento <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setOpenNovo(true)}>
              <Plus className="h-4 w-4" /> Novo Pedido
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground">Itens</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Entrega</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const s = statusConfig[p.status];
                  const isAtrasado = new Date(p.entrega) < new Date() && !["entregue","cancelado"].includes(p.status);
                  const podeAvancar = !!proximoStatus[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-primary">{p.id}</td>
                      <td className="px-6 py-4 font-medium">{p.cliente}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{p.itens}</td>
                      <td className="px-6 py-4 text-right font-bold">{formatCurrency(p.valor)}</td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 text-xs ${isAtrasado ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(p.entrega)}
                          {isAtrasado && <span className="font-bold">ATRASADO</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4"><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 items-center">
                          {podeAvancar && (
                            <Button size="sm" variant="outline" className="text-xs h-7 whitespace-nowrap"
                              onClick={() => handleAvancarStatus(p.id)}>
                              {acaoLabel[p.status]}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setOpenVer(p)}>
                                <Eye className="h-4 w-4" /> Ver detalhes
                              </DropdownMenuItem>
                              {!["entregue","cancelado"].includes(p.status) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem destructive onClick={() => handleCancelar(p.id)}>
                                    <XCircle className="h-4 w-4" /> Cancelar pedido
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Modal Novo Pedido */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Pedido de Venda</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Cliente *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}>
                <option value="">Selecione o cliente</option>
                {clientes.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Data de Entrega Prevista *</Label>
              <Input type="date" value={form.entrega} onChange={e => setForm({...form, entrega: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Descrição do Serviço *</Label>
              <Input placeholder="Ex: Estamparia coleção Verão 2026 — 5.000 pcs" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Quantidade (pcs)</Label>
                <Input type="number" placeholder="0" value={form.quantidade} onChange={e => setForm({...form, quantidade: e.target.value})} />
              </div>
              <div className="grid gap-1.5">
                <Label>Valor unitário (R$)</Label>
                <Input type="number" placeholder="0,00" value={form.valorUnitario} onChange={e => setForm({...form, valorUnitario: e.target.value})} />
              </div>
            </div>
            {form.quantidade && form.valorUnitario && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">Valor total</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Number(form.quantidade) * Number(form.valorUnitario))}</p>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>Observações</Label>
              <textarea className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                placeholder="Informações adicionais..." value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={!form.cliente || !form.descricao || !form.entrega}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Criar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalhes */}
      <Dialog open={!!openVer} onOpenChange={() => setOpenVer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Pedido</DialogTitle></DialogHeader>
          {openVer && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-primary">{openVer.id}</p>
                <Badge variant={statusConfig[openVer.status].variant}>{statusConfig[openVer.status].label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{openVer.cliente}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-bold text-primary text-lg">{formatCurrency(openVer.valor)}</p></div>
                <div><p className="text-xs text-muted-foreground">Data do Pedido</p><p className="font-medium">{formatDate(openVer.criado)}</p></div>
                <div><p className="text-xs text-muted-foreground">Previsão de Entrega</p><p className="font-medium">{formatDate(openVer.entrega)}</p></div>
                <div><p className="text-xs text-muted-foreground">Itens</p><p className="font-medium">{openVer.itens} item(ns)</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setOpenVer(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
