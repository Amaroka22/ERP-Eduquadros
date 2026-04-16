"use client";

import { useState } from "react";
import { Plus, Search, ArrowRight, FileText, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

const orcamentos = [
  { id: "ORC-0015", cliente: "Magazine Têxtil S.A.", itens: 3, valor: 8400, validade: "2026-04-22", status: "enviado", criado: "2026-04-13" },
  { id: "ORC-0014", cliente: "Confecção Brasil Ltda", itens: 2, valor: 3200, validade: "2026-04-20", status: "aprovado", criado: "2026-04-12" },
  { id: "ORC-0013", cliente: "Marca Ativa Indústria", itens: 1, valor: 1800, validade: "2026-04-18", status: "rascunho", criado: "2026-04-11" },
  { id: "ORC-0012", cliente: "Fashion Store Moda", itens: 2, valor: 2600, validade: "2026-04-10", status: "expirado", criado: "2026-04-03" },
  { id: "ORC-0011", cliente: "Roupas & Cia", itens: 1, valor: 950, validade: "2026-04-08", status: "reprovado", criado: "2026-04-01" },
];

const statusConfig: Record<string, { label: string; variant: "secondary" | "info" | "success" | "destructive" | "warning" | "outline" }> = {
  rascunho:  { label: "Rascunho",  variant: "secondary" },
  enviado:   { label: "Enviado",   variant: "info"      },
  aprovado:  { label: "Aprovado",  variant: "success"   },
  reprovado: { label: "Reprovado", variant: "destructive"},
  expirado:  { label: "Expirado",  variant: "outline"   },
};

const clientes = ["Confecção Brasil Ltda", "Magazine Têxtil S.A.", "Marca Ativa Indústria", "Fashion Store Moda", "Roupas & Cia Comércio"];

export default function OrcamentosPage() {
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente: "", validade: "", descricao: "", quantidade: "", valor: "", obs: "" });

  const filtered = orcamentos.filter((o) => {
    const matchSearch = o.cliente.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = filtro === "todos" || o.status === filtro;
    return matchSearch && matchFiltro;
  });

  const handleSalvar = () => {
    alert(`Orçamento criado para ${form.cliente}!\n(Integração com backend em desenvolvimento)`);
    setOpen(false);
    setForm({ cliente: "", validade: "", descricao: "", quantidade: "", valor: "", obs: "" });
  };

  return (
    <div>
      <Header title="Orçamentos" subtitle={`${orcamentos.filter(o => o.status === "enviado").length} aguardando aprovação`} />

      <div className="p-6 space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: orcamentos.length, color: "" },
            { label: "Enviados", value: orcamentos.filter(o => o.status === "enviado").length, color: "text-primary" },
            { label: "Aprovados", value: orcamentos.filter(o => o.status === "aprovado").length, color: "text-success" },
            { label: "Expirados", value: orcamentos.filter(o => o.status === "expirado").length, color: "text-muted-foreground" },
          ].map(s => (
            <Card key={s.label}><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent></Card>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-9 w-56" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex rounded-md border border-input overflow-hidden">
              {[{k:"todos",l:"Todos"},{k:"rascunho",l:"Rascunho"},{k:"enviado",l:"Enviados"},{k:"aprovado",l:"Aprovados"}].map(({k,l}) => (
                <button key={k} onClick={() => setFiltro(k)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${filtro === k ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Orçamento
          </Button>
        </div>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Orçamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground">Itens</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Validade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => {
                  const s = statusConfig[o.status];
                  return (
                    <tr key={o.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                      <td className="px-6 py-4 font-bold text-primary">{o.id}</td>
                      <td className="px-6 py-4 font-medium">{o.cliente}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{o.itens}</td>
                      <td className="px-6 py-4 text-right font-bold">{formatCurrency(o.valor)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(o.validade)}</td>
                      <td className="px-6 py-4"><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {o.status === "aprovado" && (
                            <Button size="sm" variant="success" className="text-xs h-7 gap-1">
                              <ArrowRight className="h-3 w-3" /> Converter em Pedido
                            </Button>
                          )}
                          {o.status === "rascunho" && (
                            <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                              <FileText className="h-3 w-3" /> Enviar
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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

      {/* Modal Novo Orçamento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
          </DialogHeader>
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
              <Label>Validade *</Label>
              <Input type="date" value={form.validade} onChange={e => setForm({...form, validade: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Descrição do serviço *</Label>
              <Input placeholder="Ex: Estamparia coleção Verão 2026" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Quantidade (pcs)</Label>
                <Input type="number" placeholder="0" value={form.quantidade} onChange={e => setForm({...form, quantidade: e.target.value})} />
              </div>
              <div className="grid gap-1.5">
                <Label>Valor unitário (R$)</Label>
                <Input type="number" placeholder="0,00" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Observações</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                placeholder="Condições comerciais, prazo de entrega..." value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} />
            </div>
            {form.quantidade && form.valor && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">Valor total estimado</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Number(form.quantidade) * Number(form.valor))}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={!form.cliente || !form.descricao}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Salvar Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
