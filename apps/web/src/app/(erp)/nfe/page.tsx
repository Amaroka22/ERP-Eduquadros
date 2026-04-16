"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Download, FileText, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

type Nota = {
  id: number;
  numero: string;
  serie: string;
  pedido: string;
  cliente: string;
  valor: number;
  emissao: string;
  status: string;
  chave: string | null;
};

const notasIniciais: Nota[] = [
  { id: 1, numero: "000042", serie: "1", pedido: "PED-0039", cliente: "Magazine Têxtil S.A.",   valor: 5600, emissao: "2026-04-12", status: "autorizada",  chave: "35260412345678000195550010000000421000042413" },
  { id: 2, numero: "000041", serie: "1", pedido: "PED-0037", cliente: "Roupas & Cia Comércio",  valor: 2400, emissao: "2026-04-10", status: "autorizada",  chave: "35260412345678000195550010000000411000041409" },
  { id: 3, numero: "000043", serie: "1", pedido: "PED-0041", cliente: "Confecção Brasil Ltda",  valor: 3200, emissao: "2026-04-15", status: "processando", chave: null },
  { id: 4, numero: "000040", serie: "1", pedido: "PED-0036", cliente: "Magazine Têxtil S.A.",   valor: 8100, emissao: "2026-04-09", status: "cancelada",   chave: "35260412345678000195550010000000401000040408" },
];

const pedidosFaturar = [
  { id: "PED-0041", cliente: "Confecção Brasil Ltda",  valor: 3200 },
  { id: "PED-0040", cliente: "Marca Ativa Indústria",  valor: 1800 },
  { id: "PED-0038", cliente: "Fashion Store Moda",     valor:  920 },
];

const statusConfig = {
  rascunho:    { label: "Rascunho",     variant: "secondary"   as const, icon: FileText    },
  processando: { label: "Processando",  variant: "warning"     as const, icon: Clock       },
  autorizada:  { label: "Autorizada",   variant: "success"     as const, icon: CheckCircle2},
  cancelada:   { label: "Cancelada",    variant: "destructive" as const, icon: XCircle     },
  rejeitada:   { label: "Rejeitada",    variant: "destructive" as const, icon: AlertCircle },
};

const emptyForm = { pedido: "", cliente: "", valor: "", natureza: "Prestação de Serviços", serie: "1" };

export default function NFePage() {
  const [notas, setNotas]       = useState(notasIniciais);
  const [search, setSearch]     = useState("");
  const [openNova, setOpenNova] = useState(false);
  const [openChave, setOpenChave] = useState<Nota | null>(null);
  const [form, setForm]         = useState(emptyForm);

  const filtered = notas.filter(n =>
    n.cliente.toLowerCase().includes(search.toLowerCase()) ||
    n.numero.includes(search) ||
    n.pedido.toLowerCase().includes(search.toLowerCase())
  );

  const handleEmitir = () => {
    const ultimoNum = Math.max(...notas.map(n => parseInt(n.numero)));
    const novoNum   = String(ultimoNum + 1).padStart(6, "0");
    const nova: Nota = {
      id: Date.now(),
      numero: novoNum,
      serie: form.serie,
      pedido: form.pedido,
      cliente: form.cliente || pedidosFaturar.find(p => p.id === form.pedido)?.cliente || "",
      valor: Number(form.valor) || pedidosFaturar.find(p => p.id === form.pedido)?.valor || 0,
      emissao: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
      status: "processando",
      chave: null,
    };
    setNotas(prev => [nova, ...prev]);
    setForm(emptyForm);
    setOpenNova(false);
  };

  const handlePedidoChange = (pedidoId: string) => {
    const ped = pedidosFaturar.find(p => p.id === pedidoId);
    setForm(f => ({
      ...f,
      pedido: pedidoId,
      cliente: ped?.cliente || f.cliente,
      valor: ped ? String(ped.valor) : f.valor,
    }));
  };

  return (
    <div>
      <Header title="Notas Fiscais (NF-e)" subtitle="Emissão e controle de documentos fiscais" />

      <div className="p-6 space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /><p className="text-xs text-muted-foreground">Autorizadas</p></div>
              <p className="text-2xl font-bold mt-1 text-success">{notas.filter(n => n.status === "autorizada").length}</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-warning" /><p className="text-xs text-muted-foreground">Processando</p></div>
              <p className="text-2xl font-bold mt-1 text-warning">{notas.filter(n => n.status === "processando").length}</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /><p className="text-xs text-muted-foreground">Canceladas</p></div>
              <p className="text-2xl font-bold mt-1 text-destructive">{notas.filter(n => n.status === "cancelada").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Faturado</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(notas.filter(n => n.status === "autorizada").reduce((a, n) => a + n.valor, 0))}</p>
            </CardContent>
          </Card>
        </div>

        {/* Aviso de integração */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Integração com Focus NFe</p>
              <p className="text-xs text-muted-foreground">As NF-e são emitidas via API Focus NFe. Configure o token de acesso em Configurações → Fiscal/NF-e.</p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto shrink-0" asChild>
              <Link href="/configuracoes">Configurar</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Filtros */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar nota, pedido ou cliente..." className="pl-9 w-72" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button size="sm" className="gap-2" onClick={() => setOpenNova(true)}>
            <Plus className="h-4 w-4" /> Emitir NF-e
          </Button>
        </div>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Emissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((n) => {
                  const s = statusConfig[n.status as keyof typeof statusConfig];
                  return (
                    <tr key={n.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-primary">Nº {n.numero}</p>
                        <p className="text-xs text-muted-foreground">Série {n.serie}</p>
                      </td>
                      <td className="px-6 py-4 text-primary font-medium">{n.pedido}</td>
                      <td className="px-6 py-4">{n.cliente}</td>
                      <td className="px-6 py-4 text-right font-bold">{formatCurrency(n.valor)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(n.emissao)}</td>
                      <td className="px-6 py-4"><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td className="px-6 py-4">
                        {n.status === "autorizada" && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Download XML"
                              onClick={() => setOpenChave(n)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver Chave NF-e"
                              onClick={() => setOpenChave(n)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {n.status === "processando" && (
                          <span className="text-xs text-warning">Aguardando SEFAZ...</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Modal Emitir NF-e */}
      <Dialog open={openNova} onOpenChange={setOpenNova}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Emitir NF-e</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Pedido de Venda *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.pedido} onChange={e => handlePedidoChange(e.target.value)}>
                <option value="">Selecione o pedido</option>
                {pedidosFaturar.map(p => <option key={p.id} value={p.id}>{p.id} — {p.cliente}</option>)}
                <option value="manual">Lançamento manual</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Cliente *</Label>
              <Input placeholder="Nome do cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Valor Total (R$) *</Label>
                <Input type="number" placeholder="0,00" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
              </div>
              <div className="grid gap-1.5">
                <Label>Série</Label>
                <Input value={form.serie} onChange={e => setForm({...form, serie: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Natureza da Operação</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.natureza} onChange={e => setForm({...form, natureza: e.target.value})}>
                <option>Prestação de Serviços</option>
                <option>Venda de Mercadoria</option>
                <option>Remessa para industrialização</option>
              </select>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-xs text-muted-foreground">
              A NF-e será enviada para a SEFAZ via API Focus NFe e processada em instantes. O status será atualizado automaticamente.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNova(false)}>Cancelar</Button>
            <Button onClick={handleEmitir} disabled={!form.cliente || !form.valor}>
              <FileText className="h-4 w-4 mr-2" /> Emitir NF-e
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Chave / Detalhes */}
      <Dialog open={!!openChave} onOpenChange={() => setOpenChave(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>NF-e Nº {openChave?.numero}</DialogTitle></DialogHeader>
          {openChave && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{openChave.cliente}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-bold text-primary">{formatCurrency(openChave.valor)}</p></div>
                <div><p className="text-xs text-muted-foreground">Emissão</p><p className="font-medium">{formatDate(openChave.emissao)}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="success">Autorizada</Badge></div>
              </div>
              {openChave.chave && (
                <div className="grid gap-1.5">
                  <p className="text-xs text-muted-foreground">Chave de Acesso</p>
                  <div className="rounded-md bg-muted p-3 break-all text-xs font-mono">{openChave.chave}</div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" /> Download XML
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <FileText className="h-4 w-4" /> Download DANFE
                </Button>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setOpenChave(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
