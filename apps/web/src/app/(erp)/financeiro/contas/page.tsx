"use client";
import { useState, useMemo } from "react";
import {
  Plus, Landmark, CreditCard, Pencil, Trash2, TrendingUp, Eye, EyeOff,
  Wallet, PiggyBank, ToggleLeft, ToggleRight, SlidersHorizontal, ArrowUpDown,
  ArrowDownLeft, ArrowUpRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useApp, TipoConta, ContaBancaria } from "@/contexts/AppContext";

/* ─── cores disponíveis ─────────────────────────────────────────────────── */
const CORES = [
  { label: "Azul",     value: "bg-blue-500",    hex: "#3b82f6" },
  { label: "Céu",      value: "bg-sky-500",     hex: "#0ea5e9" },
  { label: "Índigo",   value: "bg-indigo-500",  hex: "#6366f1" },
  { label: "Violeta",  value: "bg-violet-500",  hex: "#8b5cf6" },
  { label: "Roxo",     value: "bg-purple-500",  hex: "#a855f7" },
  { label: "Rosa",     value: "bg-pink-500",    hex: "#ec4899" },
  { label: "Vermelho", value: "bg-red-500",     hex: "#ef4444" },
  { label: "Laranja",  value: "bg-orange-500",  hex: "#f97316" },
  { label: "Âmbar",   value: "bg-amber-500",   hex: "#f59e0b" },
  { label: "Verde",    value: "bg-green-500",   hex: "#22c55e" },
  { label: "Teal",     value: "bg-teal-500",    hex: "#14b8a6" },
  { label: "Ciano",    value: "bg-cyan-500",    hex: "#06b6d4" },
  { label: "Ardósia",  value: "bg-slate-500",   hex: "#64748b" },
  { label: "Cinza",    value: "bg-gray-400",    hex: "#9ca3af" },
];

function getHex(cor: string): string {
  return CORES.find(c => c.value === cor)?.hex ?? "#6b7280";
}

/* ─── ícone por tipo ─────────────────────────────────────────────────────── */
function IconeTipo({ tipo, className }: { tipo: TipoConta; className?: string }) {
  if (tipo === "Caixa")               return <Wallet className={className} />;
  if (tipo === "Conta Poupança")      return <PiggyBank className={className} />;
  if (tipo === "Conta Investimento")  return <TrendingUp className={className} />;
  return <Landmark className={className} />;
}

const tiposDisponiveis: TipoConta[] = ["Conta Corrente", "Conta Poupança", "Conta Investimento", "Caixa"];

type FormState = {
  banco: string; agencia: string; conta: string;
  tipo: TipoConta; saldoInicial: string; cor: string;
};

const emptyForm: FormState = {
  banco: "", agencia: "", conta: "", tipo: "Conta Corrente", saldoInicial: "", cor: "bg-blue-500",
};

/* ─── componente principal ───────────────────────────────────────────────── */
export default function ContasBancariasPage() {
  const { contasBancarias, setContasBancarias, lancamentosReceber, lancamentosPagar } = useApp();

  const [ocultarSaldos, setOcultarSaldos] = useState(false);
  const [mostrarInativas, setMostrarInativas] = useState(false);

  // modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // modal ajustar saldo
  const [ajusteContaId, setAjusteContaId] = useState<number | null>(null);
  const [ajusteTipo, setAjusteTipo] = useState<"absoluto" | "adicionar" | "subtrair">("absoluto");
  const [ajusteValor, setAjusteValor] = useState("");

  /* ─── KPIs ─── */
  const contasAtivas = contasBancarias.filter(c => c.ativa);
  const contasVisiveis = mostrarInativas ? contasBancarias : contasBancarias.filter(c => c.ativa);
  const totalAtivo = contasAtivas.reduce((acc, c) => acc + c.saldo, 0);
  const maiorSaldo = contasAtivas.length > 0
    ? contasAtivas.reduce((prev, curr) => curr.saldo > prev.saldo ? curr : prev, contasAtivas[0])
    : null;

  /* ─── movimentos por conta ─── */
  const movimentosPorConta = useMemo(() => {
    const map: Record<string, { entradas: number; saidas: number }> = {};
    for (const c of contasBancarias) {
      const entradas = lancamentosReceber.filter(l => l.contaBancaria === c.banco && l.status === "recebido").reduce((a, l) => a + l.valor, 0);
      const saidas   = lancamentosPagar  .filter(l => l.contaBancaria === c.banco && l.status === "pago")    .reduce((a, l) => a + l.valor, 0);
      map[c.id] = { entradas, saidas };
    }
    return map;
  }, [contasBancarias, lancamentosReceber, lancamentosPagar]);

  /* ─── handlers ─── */
  function abrirNova() {
    setEditandoId(null);
    setForm(emptyForm);
    setModalAberto(true);
  }

  function abrirEdicao(conta: ContaBancaria) {
    setEditandoId(conta.id);
    setForm({ banco: conta.banco, agencia: conta.agencia, conta: conta.conta, tipo: conta.tipo, saldoInicial: String(conta.saldo), cor: conta.cor });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setForm(emptyForm);
    setEditandoId(null);
  }

  function salvar() {
    if (!form.banco.trim()) return;
    if (editandoId !== null) {
      setContasBancarias(prev => prev.map(c =>
        c.id === editandoId
          ? { ...c, banco: form.banco, agencia: form.agencia, conta: form.conta, tipo: form.tipo, cor: form.cor }
          : c
      ));
    } else {
      const novoId = Math.max(0, ...contasBancarias.map(c => c.id)) + 1;
      setContasBancarias(prev => [...prev, {
        id: novoId, banco: form.banco, agencia: form.agencia, conta: form.conta,
        tipo: form.tipo, saldo: parseFloat(form.saldoInicial) || 0, ativa: true, cor: form.cor,
      }]);
    }
    fecharModal();
  }

  function toggleAtiva(id: number) {
    setContasBancarias(prev => prev.map(c => c.id === id ? { ...c, ativa: !c.ativa } : c));
  }

  function excluir(id: number) {
    setContasBancarias(prev => prev.filter(c => c.id !== id));
  }

  function abrirAjuste(id: number) {
    setAjusteContaId(id);
    setAjusteTipo("absoluto");
    setAjusteValor("");
  }

  function fecharAjuste() {
    setAjusteContaId(null);
    setAjusteValor("");
  }

  function confirmarAjuste() {
    const val = parseFloat(ajusteValor);
    if (isNaN(val) || ajusteContaId === null) return;
    setContasBancarias(prev => prev.map(c => {
      if (c.id !== ajusteContaId) return c;
      if (ajusteTipo === "absoluto")  return { ...c, saldo: val };
      if (ajusteTipo === "adicionar") return { ...c, saldo: c.saldo + val };
      return { ...c, saldo: c.saldo - val };
    }));
    fecharAjuste();
  }

  const contaAjustando = contasBancarias.find(c => c.id === ajusteContaId) ?? null;

  /* ─── render ─── */
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header title="Contas Bancárias" subtitle="Gestão de contas e saldos" />

      <main className="flex-1 p-6 space-y-6">

        {/* Barra de ações */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOcultarSaldos(v => !v)} className="gap-2">
              {ocultarSaldos ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {ocultarSaldos ? "Mostrar saldos" : "Ocultar saldos"}
            </Button>
            <Button
              variant={mostrarInativas ? "secondary" : "outline"}
              size="sm"
              onClick={() => setMostrarInativas(v => !v)}
              className="gap-2"
            >
              <ToggleLeft className="h-4 w-4" />
              {mostrarInativas ? "Ocultar inativas" : "Mostrar inativas"}
              {contasBancarias.filter(c => !c.ativa).length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {contasBancarias.filter(c => !c.ativa).length}
                </Badge>
              )}
            </Button>
          </div>
          <Button onClick={abrirNova} className="gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total em Contas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {ocultarSaldos ? "••••••" : formatCurrency(totalAtivo)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Soma das contas ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{contasAtivas.length}</span>
                <span className="text-sm text-muted-foreground">de {contasBancarias.length}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Contas em operação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maior Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <span className="text-xl font-bold truncate">{maiorSaldo ? maiorSaldo.banco : "—"}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {maiorSaldo && !ocultarSaldos ? formatCurrency(maiorSaldo.saldo) : maiorSaldo ? "••••••" : "Nenhuma conta ativa"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de contas */}
        {contasVisiveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
            <Landmark className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma conta cadastrada</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Clique em "Nova Conta" para adicionar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contasVisiveis.map(conta => {
              const hex = getHex(conta.cor);
              const mov = movimentosPorConta[conta.id] ?? { entradas: 0, saidas: 0 };
              return (
                <Card
                  key={conta.id}
                  className={cn("relative border-l-4 transition-shadow hover:shadow-md", !conta.ativa && "opacity-55")}
                  style={{ borderLeftColor: hex }}
                >
                  <CardContent className="p-4 space-y-3">

                    {/* Cabeçalho */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: hex }}>
                          <IconeTipo tipo={conta.tipo} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold leading-tight truncate">{conta.banco}</p>
                          <Badge variant="secondary" className="mt-0.5 text-xs">{conta.tipo}</Badge>
                        </div>
                      </div>
                      {/* Toggle ativa/inativa */}
                      <button
                        onClick={() => toggleAtiva(conta.id)}
                        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title={conta.ativa ? "Desativar conta" : "Ativar conta"}
                      >
                        {conta.ativa
                          ? <ToggleRight className="h-5 w-5 text-green-500" />
                          : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                        <span className="hidden sm:inline">{conta.ativa ? "Ativa" : "Inativa"}</span>
                      </button>
                    </div>

                    {/* Agência / Conta */}
                    {conta.tipo !== "Caixa" && (
                      <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                        <div>
                          <span className="block font-medium text-foreground">Agência</span>
                          <span>{conta.agencia || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">Conta</span>
                          <span>{conta.conta || "—"}</span>
                        </div>
                      </div>
                    )}

                    {/* Saldo */}
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Saldo atual</span>
                      <span className={cn(
                        "text-lg font-bold",
                        conta.saldo > 0 ? "text-green-600" : conta.saldo < 0 ? "text-red-600" : "text-muted-foreground"
                      )}>
                        {ocultarSaldos ? "••••••" : formatCurrency(conta.saldo)}
                      </span>
                    </div>

                    {/* Movimentações resumidas */}
                    {(mov.entradas > 0 || mov.saidas > 0) && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 rounded-md bg-green-500/8 px-2 py-1.5">
                          <ArrowDownLeft className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          <div>
                            <p className="text-muted-foreground leading-none">Entradas</p>
                            <p className="font-semibold text-green-700 mt-0.5">{ocultarSaldos ? "•••" : formatCurrency(mov.entradas)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-md bg-red-500/8 px-2 py-1.5">
                          <ArrowUpRight className="h-3.5 w-3.5 text-red-600 shrink-0" />
                          <div>
                            <p className="text-muted-foreground leading-none">Saídas</p>
                            <p className="font-semibold text-red-700 mt-0.5">{ocultarSaldos ? "•••" : formatCurrency(mov.saidas)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center justify-end gap-1 pt-1 border-t">
                      <Button
                        variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                        onClick={() => abrirAjuste(conta.id)}
                        title="Ajustar saldo manualmente"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Ajustar
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                        onClick={() => abrirEdicao(conta)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Button>
                      {conta.saldo === 0 && (
                        <Button
                          variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => excluir(conta.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Excluir
                        </Button>
                      )}
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Modal Criar / Editar ─── */}
      <Dialog open={modalAberto} onOpenChange={open => { if (!open) fecharModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoId !== null ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Banco / Instituição *</Label>
              <Input
                placeholder="Ex: Itaú Unibanco"
                value={form.banco}
                onChange={e => setForm(f => ({ ...f, banco: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Agência</Label>
                <Input placeholder="0001-5" value={form.agencia} onChange={e => setForm(f => ({ ...f, agencia: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Conta</Label>
                <Input placeholder="12345-6" value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Conta</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoConta }))}
              >
                {tiposDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {editandoId === null && (
              <div className="space-y-1.5">
                <Label>Saldo Inicial (R$)</Label>
                <Input
                  type="number" min="0" step="0.01" placeholder="0,00"
                  value={form.saldoInicial}
                  onChange={e => setForm(f => ({ ...f, saldoInicial: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Cor de Identificação</Label>
              <div className="flex flex-wrap gap-2">
                {CORES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setForm(f => ({ ...f, cor: c.value }))}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                      form.cor === c.value ? "border-foreground scale-110 shadow-md" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              {form.cor && (
                <p className="text-xs text-muted-foreground">
                  Selecionado: {CORES.find(c => c.value === form.cor)?.label ?? "—"}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={fecharModal}>Cancelar</Button>
            <Button onClick={salvar} disabled={!form.banco.trim()}>
              {editandoId !== null ? "Salvar alterações" : "Criar conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal Ajustar Saldo ─── */}
      <Dialog open={ajusteContaId !== null} onOpenChange={open => { if (!open) fecharAjuste(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar Saldo — {contaAjustando?.banco}</DialogTitle>
          </DialogHeader>
          {contaAjustando && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saldo atual</span>
                <span className="font-bold text-lg">{formatCurrency(contaAjustando.saldo)}</span>
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de ajuste</Label>
                <div className="flex gap-2">
                  {([
                    { key: "absoluto",  label: "Definir valor" },
                    { key: "adicionar", label: "Adicionar"      },
                    { key: "subtrair",  label: "Subtrair"       },
                  ] as const).map(op => (
                    <button
                      key={op.key}
                      type="button"
                      onClick={() => setAjusteTipo(op.key)}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                        ajusteTipo === op.key
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-muted"
                      )}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>
                  {ajusteTipo === "absoluto"  ? "Novo saldo (R$)"   :
                   ajusteTipo === "adicionar" ? "Valor a adicionar" : "Valor a subtrair"}
                </Label>
                <Input
                  type="number" min="0" step="0.01" placeholder="0,00"
                  value={ajusteValor}
                  onChange={e => setAjusteValor(e.target.value)}
                  autoFocus
                />
              </div>

              {ajusteValor && !isNaN(parseFloat(ajusteValor)) && (
                <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Saldo resultante: </span>
                  <span className="font-bold text-primary">
                    {formatCurrency(
                      ajusteTipo === "absoluto"  ? parseFloat(ajusteValor) :
                      ajusteTipo === "adicionar" ? contaAjustando.saldo + parseFloat(ajusteValor) :
                                                   contaAjustando.saldo - parseFloat(ajusteValor)
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={fecharAjuste}>Cancelar</Button>
            <Button onClick={confirmarAjuste} disabled={!ajusteValor || isNaN(parseFloat(ajusteValor))}>
              <ArrowUpDown className="h-4 w-4 mr-2" /> Confirmar ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
