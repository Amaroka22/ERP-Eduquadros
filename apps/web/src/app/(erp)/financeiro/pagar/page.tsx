"use client";
import { useState, useMemo } from "react";
import {
  Plus, Search, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronRight, Download, Eye, Pencil, Trash2,
  SlidersHorizontal, X, Paperclip,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate, todayStr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useApp, gerarParcelasPagar } from "@/contexts/AppContext";
import type { LancamentoPagar, ParcelaPagar, StatusParcelaPagar, Anexo } from "@/contexts/AppContext";
import { AnexosModal } from "@/components/ui/anexos-modal";

// ── Status config ──────────────────────────────────────────────────────────────

const statusCfg: Record<
  StatusParcelaPagar,
  { label: string; variant: "success" | "warning" | "destructive"; icon: React.ElementType }
> = {
  pago:     { label: "Pago",     variant: "success",     icon: CheckCircle2 },
  pendente: { label: "Pendente", variant: "warning",     icon: Clock        },
  vencido:  { label: "Vencido",  variant: "destructive", icon: AlertCircle  },
};

const hoje = todayStr();

function statusLancamento(parcelas: ParcelaPagar[]): StatusParcelaPagar {
  if (parcelas.every(p => p.status === "pago")) return "pago";
  if (parcelas.some(p => p.status === "vencido")) return "vencido";
  return "pendente";
}

const emptyBaixa = { valorPago: "", dataPagamento: hoje, formaPagamento: "PIX" };

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ContasAPagarPage() {
  const {
    lancamentosPagar: lancamentos,
    setLancamentosPagar: setLancamentos,
    contasBancarias,
    setContasBancarias,
    categoriasDespesa,
    nomesContasAtivas,
    formasPagamento,
    nomesFornecedoresAtivos,
  } = useApp();

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusParcelaPagar>("todos");
  const [busca, setBusca] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState({ dataInicio: "", dataFim: "", fornecedor: "", categoria: "", conta: "" });

  // Modal — novo lançamento
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [novoForm, setNovoForm] = useState({
    descricao: "", fornecedor: "",
    categoria: categoriasDespesa[0] ?? "",
    contaBancaria: nomesContasAtivas[0] ?? "",
    valorTotal: "", numParcelas: "1", primeiroVencimento: hoje,
  });

  // Modal — registrar pagamento
  const [modalPagamentoOpen, setModalPagamentoOpen] = useState(false);
  const [pagamentoAlvo, setPagamentoAlvo] = useState<{ lancamentoId: number; parcelaNum: number } | null>(null);
  const [pagamentoForm, setPagamentoForm] = useState(emptyBaixa);

  // Modal — excluir
  const [modalExcluirOpen, setModalExcluirOpen] = useState(false);
  const [excluirAlvo, setExcluirAlvo] = useState<LancamentoPagar | null>(null);

  // Modal — editar lançamento
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editAlvo, setEditAlvo] = useState<LancamentoPagar | null>(null);
  const [editForm, setEditForm] = useState({
    descricao: "", fornecedor: "",
    categoria: categoriasDespesa[0] ?? "",
    contaBancaria: nomesContasAtivas[0] ?? "",
    valorTotal: "", numParcelas: "1", primeiroVencimento: hoje,
  });

  // Modal — editar parcela
  const [modalEditParcelaOpen, setModalEditParcelaOpen] = useState(false);
  const [editParcelaAlvo, setEditParcelaAlvo] = useState<{ lancamentoId: number; parcelaNum: number } | null>(null);
  const [editParcelaForm, setEditParcelaForm] = useState({ vencimento: "", valor: "" });
  const [openAnexos, setOpenAnexos] = useState<LancamentoPagar | null>(null);

  // ── Totalizadores ────────────────────────────────────────────────────────────

  const mesAtual = hoje.slice(0, 7);

  const totais = useMemo(() => {
    let aPagar = 0, vencidos = 0, pagosMes = 0;
    for (const l of lancamentos) {
      for (const p of l.parcelas) {
        if (p.status !== "pago") aPagar += p.valor;
        if (p.status === "vencido") vencidos += p.valor;
        if (p.status === "pago" && p.dataPagamento?.startsWith(mesAtual))
          pagosMes += p.valorPago ?? p.valor;
      }
    }
    return { aPagar, vencidos, pagosMes };
  }, [lancamentos, mesAtual]);

  // ── Filtros ──────────────────────────────────────────────────────────────────

  const filtrosAtivos = Object.values(filtros).filter(Boolean).length;

  const lancamentosFiltrados = useMemo(() => lancamentos.filter(l => {
    const st = statusLancamento(l.parcelas);
    const matchStatus = filtroStatus === "todos" || st === filtroStatus;
    const q = busca.toLowerCase();
    const matchBusca = !q || l.descricao.toLowerCase().includes(q) || l.fornecedor.toLowerCase().includes(q) || l.categoria.toLowerCase().includes(q);
    const matchFornecedor = !filtros.fornecedor || l.fornecedor === filtros.fornecedor;
    const matchCategoria  = !filtros.categoria  || l.categoria  === filtros.categoria;
    const matchConta      = !filtros.conta      || l.contaBancaria === filtros.conta;
    const matchData = (!filtros.dataInicio && !filtros.dataFim) || l.parcelas.some(p =>
      (!filtros.dataInicio || p.vencimento >= filtros.dataInicio) &&
      (!filtros.dataFim   || p.vencimento <= filtros.dataFim)
    );
    return matchStatus && matchBusca && matchFornecedor && matchCategoria && matchConta && matchData;
  }), [lancamentos, filtroStatus, busca, filtros]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function abrirModalPagamento(lancamentoId: number, parcelaNum: number) {
    setPagamentoAlvo({ lancamentoId, parcelaNum });
    setPagamentoForm(emptyBaixa);
    setModalPagamentoOpen(true);
  }

  function handleRegistrarPagamento() {
    if (!pagamentoAlvo) return;
    const lancamento = lancamentos.find(l => l.id === pagamentoAlvo.lancamentoId);
    const parcela    = lancamento?.parcelas.find(p => p.num === pagamentoAlvo.parcelaNum);
    if (!lancamento || !parcela) return;
    const valorEfetivo = parseFloat(pagamentoForm.valorPago) || parcela.valor;

    setLancamentos(prev => prev.map(l => {
      if (l.id !== pagamentoAlvo.lancamentoId) return l;
      return {
        ...l,
        parcelas: l.parcelas.map(p => {
          if (p.num !== pagamentoAlvo.parcelaNum) return p;
          return { ...p, status: "pago" as StatusParcelaPagar, dataPagamento: pagamentoForm.dataPagamento, valorPago: valorEfetivo };
        }),
      };
    }));

    // Atualiza o saldo da conta bancária vinculada
    if (lancamento.contaBancaria) {
      setContasBancarias(prev => prev.map(c =>
        c.banco === lancamento.contaBancaria ? { ...c, saldo: c.saldo - valorEfetivo } : c
      ));
    }

    setModalPagamentoOpen(false);
    setPagamentoAlvo(null);
  }

  function abrirEditar(l: LancamentoPagar) {
    setEditAlvo(l);
    setEditForm({
      descricao: l.descricao, fornecedor: l.fornecedor,
      categoria: l.categoria, contaBancaria: l.contaBancaria,
      valorTotal: String(l.valorTotal), numParcelas: String(l.parcelas.length),
      primeiroVencimento: l.parcelas[0]?.vencimento || hoje,
    });
    setModalEditOpen(true);
  }

  function handleSalvarEdit() {
    if (!editAlvo) return;
    const temPago = editAlvo.parcelas.some(p => p.status === "pago");
    setLancamentos(prev => prev.map(l => {
      if (l.id !== editAlvo.id) return l;
      if (temPago) {
        return { ...l, descricao: editForm.descricao, fornecedor: editForm.fornecedor, categoria: editForm.categoria, contaBancaria: editForm.contaBancaria };
      } else {
        const n = parseInt(editForm.numParcelas, 10) || 1;
        const novoValor = parseFloat(editForm.valorTotal) || l.valorTotal;
        return { ...l, descricao: editForm.descricao, fornecedor: editForm.fornecedor, categoria: editForm.categoria, contaBancaria: editForm.contaBancaria, valorTotal: novoValor, parcelas: gerarParcelasPagar(novoValor, n, editForm.primeiroVencimento) };
      }
    }));
    setModalEditOpen(false);
    setEditAlvo(null);
  }

  function abrirEditarParcela(lancamentoId: number, p: ParcelaPagar) {
    setEditParcelaAlvo({ lancamentoId, parcelaNum: p.num });
    setEditParcelaForm({ vencimento: p.vencimento, valor: String(p.valor) });
    setModalEditParcelaOpen(true);
  }

  function handleSalvarEditParcela() {
    if (!editParcelaAlvo) return;
    setLancamentos(prev => prev.map(l => {
      if (l.id !== editParcelaAlvo.lancamentoId) return l;
      return { ...l, parcelas: l.parcelas.map(p => p.num !== editParcelaAlvo.parcelaNum ? p : { ...p, vencimento: editParcelaForm.vencimento || p.vencimento, valor: parseFloat(editParcelaForm.valor) || p.valor }) };
    }));
    setModalEditParcelaOpen(false);
    setEditParcelaAlvo(null);
  }

  function handleSalvarNovo() {
    const valorTotal = parseFloat(novoForm.valorTotal);
    const numParcelas = parseInt(novoForm.numParcelas, 10);
    if (!novoForm.descricao || !novoForm.fornecedor || isNaN(valorTotal) || valorTotal <= 0) return;
    const novoId = Math.max(0, ...lancamentos.map(l => l.id)) + 1;
    const novoLanc: LancamentoPagar = {
      id: novoId, descricao: novoForm.descricao, fornecedor: novoForm.fornecedor,
      categoria: novoForm.categoria, contaBancaria: novoForm.contaBancaria,
      valorTotal, criado: hoje,
      parcelas: gerarParcelasPagar(valorTotal, numParcelas, novoForm.primeiroVencimento),
    };
    setLancamentos(prev => [novoLanc, ...prev]);
    setModalNovoOpen(false);
    setNovoForm({ descricao: "", fornecedor: "", categoria: categoriasDespesa[0] ?? "", contaBancaria: nomesContasAtivas[0] ?? "", valorTotal: "", numParcelas: "1", primeiroVencimento: hoje });
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <Header title="Contas a Pagar" subtitle="Gestão de pagamentos e parcelas" />

      <div className="p-6 space-y-4">
        {/* Totalizadores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">A Pagar</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totais.aPagar)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Vencidos</p>
            <p className="text-2xl font-bold mt-1 text-destructive">{formatCurrency(totais.vencidos)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pagos (mês)</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totais.pagosMes)}</p>
          </CardContent></Card>
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar descrição, fornecedor..." className="pl-9 w-60" value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
              <div className="flex rounded-md border border-input overflow-hidden">
                {(["todos", "pendente", "vencido", "pago"] as const).map(f => (
                  <button key={f} onClick={() => setFiltroStatus(f)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${filtroStatus===f ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                    {f === "todos" ? "Todos" : f === "pendente" ? "Pendentes" : f === "vencido" ? "Vencidos" : "Pagos"}
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
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Exportar</Button>
              <Button size="sm" onClick={() => setModalNovoOpen(true)}><Plus className="h-4 w-4 mr-1" />Novo Lançamento</Button>
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
                    <Label className="text-xs text-muted-foreground">Fornecedor</Label>
                    <select className="h-8 rounded-md border border-input bg-background px-2 text-sm" value={filtros.fornecedor} onChange={e => setFiltros(f => ({ ...f, fornecedor: e.target.value }))}>
                      <option value="">Todos os fornecedores</option>
                      {[...new Set(lancamentos.map(l => l.fornecedor).filter(Boolean))].sort().map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1 min-w-[150px]">
                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                    <select className="h-8 rounded-md border border-input bg-background px-2 text-sm" value={filtros.categoria} onChange={e => setFiltros(f => ({ ...f, categoria: e.target.value }))}>
                      <option value="">Todas as categorias</option>
                      {categoriasDespesa.map(c => <option key={c} value={c}>{c}</option>)}
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
                      onClick={() => setFiltros({ dataInicio: "", dataFim: "", fornecedor: "", categoria: "", conta: "" })}>
                      <X className="h-3.5 w-3.5" /> Limpar filtros
                    </Button>
                  )}
                </div>
                {filtrosAtivos > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Exibindo <span className="font-semibold text-foreground">{lancamentosFiltrados.length}</span> de <span className="font-semibold text-foreground">{lancamentos.length}</span> lançamentos
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {lancamentosFiltrados.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Nenhum lançamento encontrado.</div>
          )}

          {lancamentosFiltrados.map(l => {
            const st = statusLancamento(l.parcelas);
            const cfg = statusCfg[st];
            const expanded = expandedIds.has(l.id);
            const Icon = cfg.icon;

            return (
              <Card key={l.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(l.id)}
                  >
                    {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{l.descricao}</p>
                      <p className="text-sm text-muted-foreground truncate">{l.fornecedor} · {l.categoria} · {l.contaBancaria}</p>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold">{formatCurrency(l.valorTotal)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Parcelas</p>
                        <p className="font-semibold">{l.parcelas.length}x</p>
                      </div>
                    </div>

                    <Badge variant={cfg.variant} className="flex items-center gap-1 shrink-0">
                      <Icon className="h-3 w-3" />{cfg.label}
                    </Badge>

                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 relative" title="Anexos"
                      onClick={e => { e.stopPropagation(); setOpenAnexos(l); }}>
                      <Paperclip className="h-4 w-4" />
                      {(l.anexos?.length ?? 0) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center leading-none">
                          {l.anexos!.length}
                        </span>
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" title="Excluir lançamento"
                      onClick={e => { e.stopPropagation(); setExcluirAlvo(l); setModalExcluirOpen(true); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Editar lançamento"
                      onClick={e => { e.stopPropagation(); abrirEditar(l); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  {expanded && (
                    <div className="border-t divide-y">
                      {l.parcelas.map(p => {
                        const pcfg = statusCfg[p.status];
                        const PIco = pcfg.icon;
                        return (
                          <div key={p.num} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <PIco className={cn("h-4 w-4 shrink-0", p.status === "pago" ? "text-green-600" : p.status === "vencido" ? "text-destructive" : "text-yellow-500")} />
                              <span className="text-sm font-medium">Parcela {p.num}/{p.total}</span>
                              <span className="text-sm text-muted-foreground">Venc. {formatDate(p.vencimento)}</span>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Valor</p>
                                <p className="text-sm font-semibold">{formatCurrency(p.valor)}</p>
                              </div>
                              {p.status === "pago" && p.dataPagamento && (
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Pago em</p>
                                  <p className="text-sm">{formatDate(p.dataPagamento)}</p>
                                </div>
                              )}
                              {p.status === "pago" && p.valorPago !== undefined && (
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Valor Pago</p>
                                  <p className="text-sm font-semibold text-green-600">{formatCurrency(p.valorPago)}</p>
                                </div>
                              )}
                              <Badge variant={pcfg.variant} className="text-xs shrink-0">{pcfg.label}</Badge>
                              {p.status !== "pago" && (
                                <Button size="sm" variant="ghost" className="h-7 w-7" title="Editar parcela" onClick={() => abrirEditarParcela(l.id, p)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {p.status !== "pago" && (
                                <Button size="sm" variant="destructive" onClick={() => abrirModalPagamento(l.id, p.num)}>Registrar Pagamento</Button>
                              )}
                              {p.status === "pago" && (
                                <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal: Confirmar Exclusão */}
      <Dialog open={modalExcluirOpen} onOpenChange={setModalExcluirOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Excluir Lançamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm">Tem certeza que deseja excluir este lançamento?</p>
            <div className="rounded-md bg-muted/40 px-3 py-2">
              <p className="text-sm font-medium">{excluirAlvo?.descricao}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{excluirAlvo?.fornecedor} · {excluirAlvo ? formatCurrency(excluirAlvo.valorTotal) : ""}</p>
            </div>
            <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalExcluirOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { setLancamentos(prev => prev.filter(l => l.id !== excluirAlvo!.id)); setModalExcluirOpen(false); setExcluirAlvo(null); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Lançamento */}
      <Dialog open={modalEditOpen} onOpenChange={setModalEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Editar Lançamento</DialogTitle></DialogHeader>
          {editAlvo && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Input value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Fornecedor</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={editForm.fornecedor} onChange={e => setEditForm(f => ({ ...f, fornecedor: e.target.value }))}>
                  <option value="">Selecione o fornecedor</option>
                  {nomesFornecedoresAtivos.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={editForm.categoria} onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}>
                    {categoriasDespesa.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Conta Bancária</Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={editForm.contaBancaria} onChange={e => setEditForm(f => ({ ...f, contaBancaria: e.target.value }))}>
                    {nomesContasAtivas.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {!editAlvo.parcelas.some(p => p.status === "pago") && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Valor Total (R$)</Label>
                    <Input type="number" min="0" step="0.01" value={editForm.valorTotal} onChange={e => setEditForm(f => ({ ...f, valorTotal: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Nº Parcelas</Label>
                    <Input type="number" min="1" max="24" value={editForm.numParcelas} onChange={e => setEditForm(f => ({ ...f, numParcelas: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>1º Vencimento</Label>
                    <Input type="date" value={editForm.primeiroVencimento} onChange={e => setEditForm(f => ({ ...f, primeiroVencimento: e.target.value }))} />
                  </div>
                </div>
              )}
              {editAlvo.parcelas.some(p => p.status === "pago") && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2">
                  Este lançamento possui parcelas já pagas. Apenas os dados cadastrais podem ser editados.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvarEdit} disabled={!editForm.descricao.trim()}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Parcela */}
      <Dialog open={modalEditParcelaOpen} onOpenChange={setModalEditParcelaOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader><DialogTitle>Editar Parcela</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Valor (R$)</Label>
              <Input type="number" min="0" step="0.01" value={editParcelaForm.valor} onChange={e => setEditParcelaForm(f => ({ ...f, valor: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Vencimento</Label>
              <Input type="date" value={editParcelaForm.vencimento} onChange={e => setEditParcelaForm(f => ({ ...f, vencimento: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditParcelaOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvarEditParcela}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Lançamento */}
      <Dialog open={modalNovoOpen} onOpenChange={setModalNovoOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Novo Lançamento — A Pagar</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input placeholder="Ex.: Tintas Industriais – Lote 05/2026" value={novoForm.descricao} onChange={e => setNovoForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Fornecedor</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={novoForm.fornecedor} onChange={e => setNovoForm(f => ({ ...f, fornecedor: e.target.value }))}>
                <option value="">Selecione o fornecedor</option>
                {nomesFornecedoresAtivos.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Categoria</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={novoForm.categoria} onChange={e => setNovoForm(f => ({ ...f, categoria: e.target.value }))}>
                  {categoriasDespesa.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Conta Bancária</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={novoForm.contaBancaria} onChange={e => setNovoForm(f => ({ ...f, contaBancaria: e.target.value }))}>
                  {nomesContasAtivas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Valor Total (R$)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0,00" value={novoForm.valorTotal} onChange={e => setNovoForm(f => ({ ...f, valorTotal: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Nº Parcelas</Label>
                <Input type="number" min="1" max="24" value={novoForm.numParcelas} onChange={e => setNovoForm(f => ({ ...f, numParcelas: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>1º Vencimento</Label>
                <Input type="date" value={novoForm.primeiroVencimento} onChange={e => setNovoForm(f => ({ ...f, primeiroVencimento: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovoOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvarNovo}>Salvar Lançamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar Pagamento */}
      <Dialog open={modalPagamentoOpen} onOpenChange={setModalPagamentoOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Valor Pago (R$)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0,00" value={pagamentoForm.valorPago} onChange={e => setPagamentoForm(f => ({ ...f, valorPago: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Data do Pagamento</Label>
              <Input type="date" value={pagamentoForm.dataPagamento} onChange={e => setPagamentoForm(f => ({ ...f, dataPagamento: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Forma de Pagamento</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={pagamentoForm.formaPagamento} onChange={e => setPagamentoForm(f => ({ ...f, formaPagamento: e.target.value }))}>
                {formasPagamento.map(fp => <option key={fp} value={fp}>{fp}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPagamentoOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRegistrarPagamento}>Confirmar Pagamento</Button>
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
