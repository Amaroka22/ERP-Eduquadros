"use client";

import { useState, useMemo } from "react";
import { Plus, Search, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight, Download, Eye, Pencil, Trash2, SlidersHorizontal, X, Paperclip } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate, todayStr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useApp, gerarParcelasReceber } from "@/contexts/AppContext";
import type { LancamentoReceber, StatusParcelaReceber, Anexo } from "@/contexts/AppContext";
import { AnexosModal } from "@/components/ui/anexos-modal";

/* ─── status config ──────────────────────────────────── */
const statusCfg = {
  pendente: { label: "Pendente", variant: "warning"     as const, icon: Clock        },
  recebido: { label: "Recebido", variant: "success"     as const, icon: CheckCircle2 },
  vencido:  { label: "Vencido",  variant: "destructive" as const, icon: AlertCircle  },
};

const hoje = todayStr();

const emptyForm = { descricao: "", cliente: "", categoria: "", contaBancaria: "", valor: "", numParcelas: "1", primeiroVenc: "" };
const emptyBaixa = { valorRecebido: "", dataBaixa: hoje, formaPagamento: "PIX" };

function statusLancamento(l: LancamentoReceber): StatusParcelaReceber {
  if (l.parcelas.every(p => p.status === "recebido")) return "recebido";
  if (l.parcelas.some(p => p.status === "vencido"))   return "vencido";
  return "pendente";
}

export default function ContasReceberPage() {
  const {
    lancamentosReceber: lancamentos,
    setLancamentosReceber: setLancamentos,
    contasBancarias,
    setContasBancarias,
    categoriasReceita,
    nomesContasAtivas,
    formasPagamento,
    nomesClientesAtivos,
  } = useApp();

  const [search, setSearch]           = useState("");
  const [filtro, setFiltro]           = useState("todos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros]         = useState({ dataInicio: "", dataFim: "", cliente: "", categoria: "", conta: "" });
  const [openNovo, setOpenNovo]       = useState(false);
  const [openBaixa, setOpenBaixa]     = useState<{ lancId: number; parcelaNum: number } | null>(null);
  const [openDetalhe, setOpenDetalhe] = useState<LancamentoReceber | null>(null);
  const [expandidos, setExpandidos]   = useState<number[]>([]);
  const [form, setForm]               = useState({ ...emptyForm, categoria: categoriasReceita[0] ?? "", contaBancaria: nomesContasAtivas[0] ?? "" });
  const [baixa, setBaixa]             = useState(emptyBaixa);
  const [openEdit, setOpenEdit]       = useState<LancamentoReceber | null>(null);
  const [openExcluir, setOpenExcluir] = useState<LancamentoReceber | null>(null);
  const [editForm, setEditForm]       = useState({ descricao: "", cliente: "", categoria: "", contaBancaria: "", valor: "", numParcelas: "1", primeiroVenc: "" });
  const [openEditParcela, setOpenEditParcela] = useState<{ lancId: number; parcelaNum: number } | null>(null);
  const [editParcelaForm, setEditParcelaForm] = useState({ vencimento: "", valor: "" });
  const [openAnexos, setOpenAnexos] = useState<LancamentoReceber | null>(null);

  const toggleExpand = (id: number) =>
    setExpandidos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtrosAtivos = Object.values(filtros).filter(Boolean).length;

  const filtered = useMemo(() => lancamentos.filter(l => {
    const s = statusLancamento(l);
    const q = search.toLowerCase();
    const matchSearch = !q || l.descricao.toLowerCase().includes(q) || l.cliente.toLowerCase().includes(q);
    const matchFiltro = filtro === "todos" || s === filtro;
    const matchCliente = !filtros.cliente || l.cliente === filtros.cliente;
    const matchCategoria = !filtros.categoria || l.categoria === filtros.categoria;
    const matchConta = !filtros.conta || l.contaBancaria === filtros.conta;
    const matchData = (!filtros.dataInicio && !filtros.dataFim) || l.parcelas.some(p =>
      (!filtros.dataInicio || p.vencimento >= filtros.dataInicio) &&
      (!filtros.dataFim   || p.vencimento <= filtros.dataFim)
    );
    return matchSearch && matchFiltro && matchCliente && matchCategoria && matchConta && matchData;
  }), [lancamentos, search, filtro, filtros]);

  const totais = useMemo(() => ({
    aReceber: lancamentos.flatMap(l => l.parcelas).filter(p => p.status === "pendente").reduce((a, p) => a + p.valor, 0),
    vencidos: lancamentos.flatMap(l => l.parcelas).filter(p => p.status === "vencido").reduce((a, p) => a + p.valor, 0),
    recebidos: lancamentos.flatMap(l => l.parcelas).filter(p => p.status === "recebido").reduce((a, p) => a + p.valor, 0),
  }), [lancamentos]);

  const handleDarBaixa = () => {
    if (!openBaixa) return;
    const lancamento = lancamentos.find(l => l.id === openBaixa.lancId);
    const parcela    = lancamento?.parcelas.find(p => p.num === openBaixa.parcelaNum);
    if (!lancamento || !parcela) return;
    const valorEfetivo = Number(baixa.valorRecebido) || parcela.valor;

    setLancamentos(prev => prev.map(l => {
      if (l.id !== openBaixa.lancId) return l;
      return {
        ...l,
        parcelas: l.parcelas.map(p =>
          p.num === openBaixa.parcelaNum
            ? { ...p, status: "recebido" as StatusParcelaReceber, dataBaixa: baixa.dataBaixa, valorRecebido: valorEfetivo, formaPagamento: baixa.formaPagamento }
            : p
        ),
      };
    }));

    // Atualiza o saldo da conta bancária vinculada
    if (lancamento.contaBancaria) {
      setContasBancarias(prev => prev.map(c =>
        c.banco === lancamento.contaBancaria ? { ...c, saldo: c.saldo + valorEfetivo } : c
      ));
    }

    setBaixa(emptyBaixa);
    setOpenBaixa(null);
  };

  const handleSalvarEdit = () => {
    if (!openEdit) return;
    const temRecebido = openEdit.parcelas.some(p => p.status === "recebido");
    setLancamentos(prev => prev.map(l => {
      if (l.id !== openEdit.id) return l;
      if (temRecebido) {
        return {
          ...l,
          descricao: editForm.descricao,
          cliente: editForm.cliente,
          categoria: editForm.categoria,
          contaBancaria: editForm.contaBancaria,
        };
      } else {
        const n = Number(editForm.numParcelas) || 1;
        const novoValor = Number(editForm.valor) || l.valorTotal;
        return {
          ...l,
          descricao: editForm.descricao,
          cliente: editForm.cliente,
          categoria: editForm.categoria,
          contaBancaria: editForm.contaBancaria,
          valorTotal: novoValor,
          parcelas: gerarParcelasReceber(novoValor, n, editForm.primeiroVenc || hoje),
        };
      }
    }));
    setOpenEdit(null);
  };

  const handleSalvarEditParcela = () => {
    if (!openEditParcela) return;
    setLancamentos(prev => prev.map(l => {
      if (l.id !== openEditParcela.lancId) return l;
      return {
        ...l,
        parcelas: l.parcelas.map(p =>
          p.num === openEditParcela.parcelaNum
            ? { ...p, vencimento: editParcelaForm.vencimento || p.vencimento, valor: Number(editParcelaForm.valor) || p.valor }
            : p
        ),
      };
    }));
    setOpenEditParcela(null);
  };

  const handleNovoLancamento = () => {
    const n = Number(form.numParcelas) || 1;
    const novo: LancamentoReceber = {
      id: Date.now(),
      descricao: form.descricao,
      cliente: form.cliente,
      categoria: form.categoria,
      contaBancaria: form.contaBancaria,
      valorTotal: Number(form.valor) || 0,
      criado: hoje,
      parcelas: gerarParcelasReceber(Number(form.valor) || 0, n, form.primeiroVenc || hoje),
    };
    setLancamentos(prev => [novo, ...prev]);
    setForm({ ...emptyForm, categoria: categoriasReceita[0] ?? "", contaBancaria: nomesContasAtivas[0] ?? "" });
    setOpenNovo(false);
  };

  const parcelaBaixa = openBaixa
    ? lancamentos.find(l => l.id === openBaixa.lancId)?.parcelas.find(p => p.num === openBaixa.parcelaNum)
    : null;

  return (
    <div>
      <Header title="Contas a Receber" subtitle="Gestão de recebimentos e parcelas" />

      <div className="p-6 space-y-4">
        {/* Totalizadores */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-warning" /><p className="text-xs font-medium text-muted-foreground">A Receber</p></div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(totais.aReceber)}</p>
              <p className="text-xs text-muted-foreground mt-1">{lancamentos.flatMap(l=>l.parcelas).filter(p=>p.status==="pendente").length} parcelas em aberto</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" /><p className="text-xs font-medium text-muted-foreground">Vencidos</p></div>
              <p className="text-2xl font-bold mt-2 text-destructive">{formatCurrency(totais.vencidos)}</p>
              <p className="text-xs text-muted-foreground mt-1">{lancamentos.flatMap(l=>l.parcelas).filter(p=>p.status==="vencido").length} parcelas vencidas</p>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /><p className="text-xs font-medium text-muted-foreground">Recebidos (mês)</p></div>
              <p className="text-2xl font-bold mt-2 text-success">{formatCurrency(totais.recebidos)}</p>
              <p className="text-xs text-muted-foreground mt-1">{lancamentos.flatMap(l=>l.parcelas).filter(p=>p.status==="recebido").length} parcelas recebidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar cliente ou descrição..." className="pl-9 w-60" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex rounded-md border border-input overflow-hidden">
                {[{k:"todos",l:"Todos"},{k:"pendente",l:"Pendentes"},{k:"vencido",l:"Vencidos"},{k:"recebido",l:"Recebidos"}].map(({k,l}) => (
                  <button key={k} onClick={() => setFiltro(k)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${filtro===k ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                    {l}
                  </button>
                ))}
              </div>
              <Button
                variant={mostrarFiltros || filtrosAtivos > 0 ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setMostrarFiltros(v => !v)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtros
                {filtrosAtivos > 0 && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    {filtrosAtivos}
                  </span>
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />Exportar</Button>
              <Button size="sm" className="gap-2" onClick={() => setOpenNovo(true)}><Plus className="h-4 w-4" />Novo Lançamento</Button>
            </div>
          </div>

          {mostrarFiltros && (
            <Card className="border-dashed border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="grid gap-1 min-w-[130px]">
                    <Label className="text-xs text-muted-foreground">Vencimento de</Label>
                    <Input type="date" className="h-8 text-sm" value={filtros.dataInicio} onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))} />
                  </div>
                  <div className="grid gap-1 min-w-[130px]">
                    <Label className="text-xs text-muted-foreground">Até</Label>
                    <Input type="date" className="h-8 text-sm" value={filtros.dataFim} onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))} />
                  </div>
                  <div className="grid gap-1 min-w-[160px]">
                    <Label className="text-xs text-muted-foreground">Cliente</Label>
                    <select className="h-8 rounded-md border border-input bg-background px-2 text-sm" value={filtros.cliente} onChange={e => setFiltros(f => ({ ...f, cliente: e.target.value }))}>
                      <option value="">Todos os clientes</option>
                      {[...new Set(lancamentos.map(l => l.cliente).filter(Boolean))].sort().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1 min-w-[150px]">
                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                    <select className="h-8 rounded-md border border-input bg-background px-2 text-sm" value={filtros.categoria} onChange={e => setFiltros(f => ({ ...f, categoria: e.target.value }))}>
                      <option value="">Todas as categorias</option>
                      {categoriasReceita.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1 min-w-[150px]">
                    <Label className="text-xs text-muted-foreground">Conta Bancária</Label>
                    <select className="h-8 rounded-md border border-input bg-background px-2 text-sm" value={filtros.conta} onChange={e => setFiltros(f => ({ ...f, conta: e.target.value }))}>
                      <option value="">Todas as contas</option>
                      {nomesContasAtivas.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {filtrosAtivos > 0 && (
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() => setFiltros({ dataInicio: "", dataFim: "", cliente: "", categoria: "", conta: "" })}>
                      <X className="h-3.5 w-3.5" /> Limpar filtros
                    </Button>
                  )}
                </div>
                {filtrosAtivos > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Exibindo <span className="font-semibold text-foreground">{filtered.length}</span> de <span className="font-semibold text-foreground">{lancamentos.length}</span> lançamentos
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lista de lançamentos */}
        <div className="space-y-2">
          {filtered.map(l => {
            const st = statusLancamento(l);
            const cfg = statusCfg[st];
            const isExpanded = expandidos.includes(l.id);
            const parcelasPendentes = l.parcelas.filter(p => p.status !== "recebido").length;

            return (
              <Card key={l.id} className={cn("overflow-hidden", st === "vencido" && "border-destructive/30")}>
                {/* Cabeçalho do lançamento */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => toggleExpand(l.id)}
                >
                  <div className="shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{l.descricao}</p>
                    <p className="text-xs text-muted-foreground">{l.cliente} · {l.categoria}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">
                        {l.parcelas.length > 1 ? `${l.parcelas.length} parcelas` : "À vista"}
                      </p>
                      <p className="text-sm font-bold">{formatCurrency(l.valorTotal)}</p>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    {parcelasPendentes > 0 && (
                      <Badge variant="outline" className="text-xs">{parcelasPendentes} em aberto</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 relative" title="Anexos" onClick={e => { e.stopPropagation(); setOpenAnexos(l); }}>
                      <Paperclip className="h-4 w-4" />
                      {(l.anexos?.length ?? 0) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center leading-none">
                          {l.anexos!.length}
                        </span>
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Excluir lançamento" onClick={e => {
                      e.stopPropagation();
                      setOpenExcluir(l);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => {
                      e.stopPropagation();
                      setEditForm({
                        descricao: l.descricao,
                        cliente: l.cliente,
                        categoria: l.categoria,
                        contaBancaria: l.contaBancaria,
                        valor: String(l.valorTotal),
                        numParcelas: String(l.parcelas.length),
                        primeiroVenc: l.parcelas[0]?.vencimento || "",
                      });
                      setOpenEdit(l);
                    }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setOpenDetalhe(l); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Parcelas expandidas */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10">
                    <div className="px-4 py-2 grid grid-cols-5 text-xs text-muted-foreground font-medium border-b border-border">
                      <span>Parcela</span><span>Vencimento</span><span>Valor</span><span>Status</span><span></span>
                    </div>
                    {l.parcelas.map(p => {
                      const pc = statusCfg[p.status];
                      return (
                        <div key={p.num} className="px-4 py-3 grid grid-cols-5 items-center text-sm border-b border-border last:border-0 hover:bg-muted/20">
                          <span className="font-medium text-primary">{p.num}/{p.total}</span>
                          <span className={cn(p.status === "vencido" ? "text-destructive font-medium" : "text-muted-foreground")}>
                            {formatDate(p.vencimento)}
                          </span>
                          <span className="font-semibold">{formatCurrency(p.valor)}</span>
                          <div>
                            <Badge variant={pc.variant} className="text-xs">{pc.label}</Badge>
                            {p.status === "recebido" && p.dataBaixa && (
                              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(p.dataBaixa)} · {p.formaPagamento}</p>
                            )}
                          </div>
                          <div className="flex justify-end gap-1">
                            {p.status !== "recebido" && (
                              <Button size="sm" variant="ghost" className="h-7 w-7"
                                title="Editar parcela"
                                onClick={() => {
                                  setEditParcelaForm({ vencimento: p.vencimento, valor: String(p.valor) });
                                  setOpenEditParcela({ lancId: l.id, parcelaNum: p.num });
                                }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {p.status !== "recebido" && (
                              <Button size="sm" variant="success" className="text-xs h-7"
                                onClick={() => { setBaixa({ ...emptyBaixa, valorRecebido: String(p.valor) }); setOpenBaixa({ lancId: l.id, parcelaNum: p.num }); }}>
                                Dar Baixa
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhum lançamento encontrado.</div>
          )}
        </div>
      </div>

      {/* Modal Dar Baixa */}
      <Dialog open={!!openBaixa} onOpenChange={() => setOpenBaixa(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Dar Baixa — Parcela {parcelaBaixa?.num}/{parcelaBaixa?.total}</DialogTitle></DialogHeader>
          {parcelaBaixa && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="text-sm font-medium">{lancamentos.find(l=>l.id===openBaixa?.lancId)?.descricao}</p>
                <p className="text-xs text-muted-foreground mt-1">Vencimento: {formatDate(parcelaBaixa.vencimento)}</p>
                <p className="text-lg font-bold text-primary mt-2">{formatCurrency(parcelaBaixa.valor)}</p>
              </div>
              <div className="grid gap-1.5">
                <Label>Valor Recebido (R$) *</Label>
                <Input type="number" value={baixa.valorRecebido} onChange={e => setBaixa({...baixa, valorRecebido: e.target.value})} />
              </div>
              <div className="grid gap-1.5">
                <Label>Data do Recebimento *</Label>
                <Input type="date" value={baixa.dataBaixa} onChange={e => setBaixa({...baixa, dataBaixa: e.target.value})} />
              </div>
              <div className="grid gap-1.5">
                <Label>Forma de Pagamento</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={baixa.formaPagamento} onChange={e => setBaixa({...baixa, formaPagamento: e.target.value})}>
                  {formasPagamento.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenBaixa(null)}>Cancelar</Button>
            <Button variant="success" onClick={handleDarBaixa} disabled={!baixa.valorRecebido}>
              <CheckCircle2 className="h-4 w-4 mr-2" />Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhe */}
      <Dialog open={!!openDetalhe} onOpenChange={() => setOpenDetalhe(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Lançamento</DialogTitle></DialogHeader>
          {openDetalhe && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Descrição</p><p className="font-medium">{openDetalhe.descricao}</p></div>
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{openDetalhe.cliente}</p></div>
                <div><p className="text-xs text-muted-foreground">Categoria</p><p className="font-medium">{openDetalhe.categoria}</p></div>
                <div><p className="text-xs text-muted-foreground">Conta Bancária</p><p className="font-medium">{openDetalhe.contaBancaria}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor Total</p><p className="font-bold text-primary text-lg">{formatCurrency(openDetalhe.valorTotal)}</p></div>
                <div><p className="text-xs text-muted-foreground">Parcelas</p><p className="font-medium">{openDetalhe.parcelas.length}x de {formatCurrency(openDetalhe.parcelas[0]?.valor)}</p></div>
              </div>
              <div className="border-t pt-3 space-y-1">
                {openDetalhe.parcelas.map(p => (
                  <div key={p.num} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{p.num}/{p.total} — {formatDate(p.vencimento)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(p.valor)}</span>
                      <Badge variant={statusCfg[p.status].variant} className="text-xs">{statusCfg[p.status].label}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setOpenDetalhe(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={!!openExcluir} onOpenChange={() => setOpenExcluir(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Excluir Lançamento
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm">Tem certeza que deseja excluir este lançamento?</p>
            <div className="rounded-md bg-muted/40 px-3 py-2">
              <p className="text-sm font-medium">{openExcluir?.descricao}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{openExcluir?.cliente} · {formatCurrency(openExcluir?.valorTotal ?? 0)}</p>
            </div>
            <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenExcluir(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              setLancamentos(prev => prev.filter(l => l.id !== openExcluir!.id));
              setOpenExcluir(null);
            }}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Lançamento */}
      <Dialog open={!!openEdit} onOpenChange={() => setOpenEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Lançamento</DialogTitle></DialogHeader>
          {openEdit && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>Descrição *</Label>
                <Input value={editForm.descricao} onChange={e => setEditForm({...editForm, descricao: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Cliente</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={editForm.cliente} onChange={e => setEditForm({...editForm, cliente: e.target.value})}>
                    <option value="">Selecione o cliente</option>
                    {nomesClientesAtivos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Categoria</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={editForm.categoria} onChange={e => setEditForm({...editForm, categoria: e.target.value})}>
                    {categoriasReceita.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Conta Bancária</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={editForm.contaBancaria} onChange={e => setEditForm({...editForm, contaBancaria: e.target.value})}>
                  {nomesContasAtivas.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {!openEdit.parcelas.some(p => p.status === "recebido") && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Valor Total (R$)</Label>
                    <Input type="number" value={editForm.valor} onChange={e => setEditForm({...editForm, valor: e.target.value})} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Nº Parcelas</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={editForm.numParcelas} onChange={e => setEditForm({...editForm, numParcelas: e.target.value})}>
                      {[1,2,3,4,5,6,9,10,12].map(n => <option key={n} value={n}>{n === 1 ? "À vista" : `${n}x`}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>1º Vencimento</Label>
                    <Input type="date" value={editForm.primeiroVenc} onChange={e => setEditForm({...editForm, primeiroVenc: e.target.value})} />
                  </div>
                </div>
              )}
              {openEdit.parcelas.some(p => p.status === "recebido") && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2">
                  Este lançamento possui parcelas já recebidas. Apenas os dados cadastrais podem ser editados.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(null)}>Cancelar</Button>
            <Button onClick={handleSalvarEdit} disabled={!editForm.descricao.trim()}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Parcela */}
      <Dialog open={!!openEditParcela} onOpenChange={() => setOpenEditParcela(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar Parcela</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" value={editParcelaForm.valor} onChange={e => setEditParcelaForm({...editParcelaForm, valor: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Vencimento</Label>
              <Input type="date" value={editParcelaForm.vencimento} onChange={e => setEditParcelaForm({...editParcelaForm, vencimento: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEditParcela(null)}>Cancelar</Button>
            <Button onClick={handleSalvarEditParcela}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Lançamento */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Lançamento — A Receber</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Descrição *</Label>
              <Input placeholder="Ex: PED-0042 – Cliente XYZ" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Cliente</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}>
                  <option value="">Selecione o cliente</option>
                  {nomesClientesAtivos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Categoria</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                  {categoriasReceita.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Valor Total (R$) *</Label>
                <Input type="number" placeholder="0,00" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
              </div>
              <div className="grid gap-1.5">
                <Label>Número de Parcelas</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.numParcelas} onChange={e => setForm({...form, numParcelas: e.target.value})}>
                  {[1,2,3,4,5,6,9,10,12].map(n => <option key={n} value={n}>{n === 1 ? "À vista" : `${n}x`}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>1º Vencimento *</Label>
                <Input type="date" value={form.primeiroVenc} onChange={e => setForm({...form, primeiroVenc: e.target.value})} />
              </div>
              <div className="grid gap-1.5">
                <Label>Conta Bancária</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.contaBancaria} onChange={e => setForm({...form, contaBancaria: e.target.value})}>
                  {nomesContasAtivas.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {form.valor && Number(form.numParcelas) > 1 && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">{form.numParcelas}x de</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Number(form.valor) / Number(form.numParcelas))}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={handleNovoLancamento} disabled={!form.descricao || !form.valor || !form.primeiroVenc}>
              Salvar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anexos */}
      {openAnexos && (
        <AnexosModal
          open
          onClose={() => setOpenAnexos(null)}
          lancamentoId={openAnexos.id}
          descricao={openAnexos.descricao}
          anexos={openAnexos.anexos ?? []}
          onUpdate={(novosAnexos: Anexo[]) => {
            setLancamentos(prev => prev.map(l => l.id === openAnexos.id ? { ...l, anexos: novosAnexos } : l));
            setOpenAnexos(prev => prev ? { ...prev, anexos: novosAnexos } : null);
          }}
        />
      )}
    </div>
  );
}
