"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Clock, ArrowRight, Landmark, CreditCard, BarChart3,
  Users, Target, Wallet, Activity,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, toDateStr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function DashboardPage() {
  const { lancamentosReceber, lancamentosPagar, contasBancarias } = useApp();

  const hoje = new Date();
  const hojeStr = toDateStr(hoje);
  const mesAtual = hojeStr.slice(0, 7);

  // ── KPIs ──────────────────────────────────────────────────────────────────────

  const saldoEmCaixa = useMemo(
    () => contasBancarias.filter((c) => c.ativa).reduce((s, c) => s + c.saldo, 0),
    [contasBancarias]
  );

  const em30d = useMemo(() => {
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 30);
    const limStr = toDateStr(limite);
    let aReceber = 0;
    for (const l of lancamentosReceber)
      for (const p of l.parcelas)
        if ((p.status === "pendente" || p.status === "vencido") && p.vencimento <= limStr)
          aReceber += p.valor;
    let aPagar = 0;
    for (const l of lancamentosPagar)
      for (const p of l.parcelas)
        if ((p.status === "pendente" || p.status === "vencido") && p.vencimento <= limStr)
          aPagar += p.valor;
    return { aReceber, aPagar };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosReceber, lancamentosPagar, hojeStr]);

  const resultadoMes = useMemo(() => {
    let recebido = 0;
    for (const l of lancamentosReceber)
      for (const p of l.parcelas) {
        const data = p.dataBaixa ?? p.vencimento;
        if (p.status === "recebido" && data.startsWith(mesAtual))
          recebido += p.valorRecebido ?? p.valor;
      }
    let pago = 0;
    for (const l of lancamentosPagar)
      for (const p of l.parcelas) {
        const data = p.dataPagamento ?? p.vencimento;
        if (p.status === "pago" && data.startsWith(mesAtual))
          pago += p.valorPago ?? p.valor;
      }
    return recebido - pago;
  }, [lancamentosReceber, lancamentosPagar, mesAtual]);

  // ── Inadimplência ─────────────────────────────────────────────────────────────

  const inadimplencia = useMemo(() => {
    let vencido = 0, total = 0;
    for (const l of lancamentosReceber)
      for (const p of l.parcelas) {
        if (p.status === "pendente" || p.status === "vencido") total += p.valor;
        if (p.status === "vencido") vencido += p.valor;
      }
    return { vencido, taxa: total > 0 ? (vencido / total) * 100 : 0 };
  }, [lancamentosReceber]);

  // ── Projeção de caixa 30d ─────────────────────────────────────────────────────

  const projecaoCaixa = saldoEmCaixa + em30d.aReceber - em30d.aPagar;

  // ── Vencendo hoje ─────────────────────────────────────────────────────────────

  const vencendoHoje = useMemo(() => {
    const items: { id: string; desc: string; tipo: "receber" | "pagar"; valor: number }[] = [];
    for (const l of lancamentosReceber)
      for (const p of l.parcelas)
        if (p.vencimento === hojeStr && p.status === "pendente")
          items.push({ id: `r-${l.id}-${p.num}`, desc: l.descricao, tipo: "receber", valor: p.valor });
    for (const l of lancamentosPagar)
      for (const p of l.parcelas)
        if (p.vencimento === hojeStr && p.status === "pendente")
          items.push({ id: `p-${l.id}-${p.num}`, desc: l.descricao, tipo: "pagar", valor: p.valor });
    return items;
  }, [lancamentosReceber, lancamentosPagar, hojeStr]);

  // ── Próximos vencimentos ──────────────────────────────────────────────────────

  const proximosVencimentos = useMemo(() => {
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = toDateStr(amanha);
    const limite = new Date(hoje); limite.setDate(limite.getDate() + 30);
    const limStr = toDateStr(limite);
    const items: { id: string; desc: string; tipo: "receber" | "pagar"; valor: number; vencimento: string }[] = [];
    for (const l of lancamentosReceber)
      for (const p of l.parcelas)
        if (p.status === "pendente" && p.vencimento >= amanhaStr && p.vencimento <= limStr)
          items.push({ id: `r-${l.id}-${p.num}`, desc: l.descricao, tipo: "receber", valor: p.valor, vencimento: p.vencimento });
    for (const l of lancamentosPagar)
      for (const p of l.parcelas)
        if (p.status === "pendente" && p.vencimento >= amanhaStr && p.vencimento <= limStr)
          items.push({ id: `p-${l.id}-${p.num}`, desc: l.descricao, tipo: "pagar", valor: p.valor, vencimento: p.vencimento });
    return items.sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, 8);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosReceber, lancamentosPagar, hojeStr]);

  // ── Evolução últimos 6 meses ──────────────────────────────────────────────────

  const evolucao6Meses = useMemo(() => {
    const meses: { label: string; mes: string; receitas: number; despesas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      meses.push({ label: MESES_CURTO[d.getMonth()], mes, receitas: 0, despesas: 0 });
    }
    for (const l of lancamentosReceber)
      for (const p of l.parcelas) {
        const data = p.dataBaixa ?? p.vencimento;
        const m = meses.find(m => data.startsWith(m.mes));
        if (m) m.receitas += p.valorRecebido ?? p.valor;
      }
    for (const l of lancamentosPagar)
      for (const p of l.parcelas) {
        const data = p.dataPagamento ?? p.vencimento;
        const m = meses.find(m => data.startsWith(m.mes));
        if (m) m.despesas += p.valorPago ?? p.valor;
      }
    return meses;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosReceber, lancamentosPagar, hojeStr]);

  const maxEvolucao = Math.max(...evolucao6Meses.flatMap(m => [m.receitas, m.despesas]), 1);

  // ── Top 5 clientes ────────────────────────────────────────────────────────────

  const topClientes = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const l of lancamentosReceber)
      for (const p of l.parcelas)
        if (p.status === "recebido") {
          const nome = l.cliente || "Sem nome";
          mapa[nome] = (mapa[nome] ?? 0) + (p.valorRecebido ?? p.valor);
        }
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, valor]) => ({ nome, valor }));
  }, [lancamentosReceber]);

  const maxCliente = topClientes[0]?.valor ?? 1;

  // ── Distribuição de despesas por categoria ────────────────────────────────────

  const distribuicaoDespesas = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const l of lancamentosPagar)
      for (const p of l.parcelas)
        if (p.status === "pago") {
          const cat = l.categoria || "Outros";
          mapa[cat] = (mapa[cat] ?? 0) + (p.valorPago ?? p.valor);
        }
    const total = Object.values(mapa).reduce((s, v) => s + v, 0);
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, valor]) => ({ cat, valor, pct: total > 0 ? (valor / total) * 100 : 0 }));
  }, [lancamentosPagar]);

  // ── Status geral dos lançamentos ──────────────────────────────────────────────

  const statusGeral = useMemo(() => {
    let recebido = 0, pendRec = 0, vencidoRec = 0;
    for (const l of lancamentosReceber)
      for (const p of l.parcelas) {
        if (p.status === "recebido") recebido += p.valorRecebido ?? p.valor;
        else if (p.status === "pendente") pendRec += p.valor;
        else if (p.status === "vencido") vencidoRec += p.valor;
      }
    let pago = 0, pendPag = 0, vencidoPag = 0;
    for (const l of lancamentosPagar)
      for (const p of l.parcelas) {
        if (p.status === "pago") pago += p.valorPago ?? p.valor;
        else if (p.status === "pendente") pendPag += p.valor;
        else if (p.status === "vencido") vencidoPag += p.valor;
      }
    return { recebido, pendRec, vencidoRec, pago, pendPag, vencidoPag };
  }, [lancamentosReceber, lancamentosPagar]);

  // ── Fluxo semanal ─────────────────────────────────────────────────────────────

  const fluxoSemanal = useMemo(() => {
    const inicioSemana = new Date(hoje);
    const diaSemana = inicioSemana.getDay();
    inicioSemana.setDate(inicioSemana.getDate() + (diaSemana === 0 ? -6 : 1 - diaSemana));
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicioSemana); d.setDate(d.getDate() + i);
      return { str: toDateStr(d), label: DIAS_SEMANA[d.getDay()], entradas: 0, saidas: 0 };
    });
    for (const l of lancamentosReceber)
      for (const p of l.parcelas) {
        const dia = dias.find(d => d.str === (p.dataBaixa ?? p.vencimento));
        if (dia) dia.entradas += p.valor;
      }
    for (const l of lancamentosPagar)
      for (const p of l.parcelas) {
        const dia = dias.find(d => d.str === (p.dataPagamento ?? p.vencimento));
        if (dia) dia.saidas += p.valor;
      }
    return dias;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosReceber, lancamentosPagar, hojeStr]);

  const maxFluxo = Math.max(...fluxoSemanal.flatMap((d) => [d.entradas, d.saidas]), 1);

  // ── Resumo do mês ─────────────────────────────────────────────────────────────

  const resumoMes = useMemo(() => {
    let totalRecebido = 0;
    for (const l of lancamentosReceber)
      for (const p of l.parcelas) {
        const data = p.dataBaixa ?? p.vencimento;
        if (p.status === "recebido" && data.startsWith(mesAtual))
          totalRecebido += p.valorRecebido ?? p.valor;
      }
    let totalPago = 0;
    for (const l of lancamentosPagar)
      for (const p of l.parcelas) {
        const data = p.dataPagamento ?? p.vencimento;
        if (p.status === "pago" && data.startsWith(mesAtual))
          totalPago += p.valorPago ?? p.valor;
      }
    return { totalRecebido, totalPago };
  }, [lancamentosReceber, lancamentosPagar, mesAtual]);

  const semDados = lancamentosReceber.length === 0 && lancamentosPagar.length === 0 && contasBancarias.length === 0;

  const DESP_COLORS = [
    "bg-violet-500", "bg-blue-500", "bg-cyan-500",
    "bg-teal-500", "bg-amber-500", "bg-rose-500",
  ];

  return (
    <div>
      <Header
        title="Dashboard Financeiro"
        subtitle={hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      />

      <div className="p-6 space-y-6">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Saldo em Caixa</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Landmark className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-xl font-bold mt-2">{formatCurrency(saldoEmCaixa)}</p>
              <p className="text-xs mt-1 text-muted-foreground">{contasBancarias.filter(c => c.ativa).length} conta(s) ativa(s)</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">A Receber (30d)</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-xl font-bold mt-2 text-emerald-600">{formatCurrency(em30d.aReceber)}</p>
              <p className="text-xs mt-1 text-muted-foreground">Pendente / próximos 30d</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">A Pagar (30d)</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
              </div>
              <p className="text-xl font-bold mt-2 text-destructive">{formatCurrency(em30d.aPagar)}</p>
              <p className="text-xs mt-1 text-muted-foreground">Pendente / próximos 30d</p>
            </CardContent>
          </Card>

          <Card className={cn(resultadoMes >= 0 ? "border-emerald-500/30" : "border-destructive/30")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Resultado do Mês</p>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", resultadoMes >= 0 ? "bg-emerald-500/10" : "bg-destructive/10")}>
                  <BarChart3 className={cn("h-4 w-4", resultadoMes >= 0 ? "text-emerald-600" : "text-destructive")} />
                </div>
              </div>
              <p className={cn("text-xl font-bold mt-2", resultadoMes >= 0 ? "text-emerald-600" : "text-destructive")}>
                {resultadoMes >= 0 ? "+" : ""}{formatCurrency(resultadoMes)}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">Recebido − Pago no mês</p>
            </CardContent>
          </Card>

          <Card className={cn(inadimplencia.taxa > 20 ? "border-destructive/40" : inadimplencia.taxa > 0 ? "border-amber-500/40" : "")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Inadimplência</p>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", inadimplencia.taxa > 20 ? "bg-destructive/10" : "bg-amber-500/10")}>
                  <AlertCircle className={cn("h-4 w-4", inadimplencia.taxa > 20 ? "text-destructive" : "text-amber-500")} />
                </div>
              </div>
              <p className={cn("text-xl font-bold mt-2", inadimplencia.taxa > 20 ? "text-destructive" : inadimplencia.taxa > 0 ? "text-amber-500" : "text-muted-foreground")}>
                {inadimplencia.taxa.toFixed(1)}%
              </p>
              <p className="text-xs mt-1 text-muted-foreground">{formatCurrency(inadimplencia.vencido)} vencido</p>
            </CardContent>
          </Card>

          <Card className={cn(projecaoCaixa >= 0 ? "border-emerald-500/30" : "border-destructive/40")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Projeção 30d</p>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", projecaoCaixa >= 0 ? "bg-emerald-500/10" : "bg-destructive/10")}>
                  <Target className={cn("h-4 w-4", projecaoCaixa >= 0 ? "text-emerald-600" : "text-destructive")} />
                </div>
              </div>
              <p className={cn("text-xl font-bold mt-2", projecaoCaixa >= 0 ? "text-emerald-600" : "text-destructive")}>
                {formatCurrency(projecaoCaixa)}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">Saldo + entradas − saídas</p>
            </CardContent>
          </Card>
        </div>

        {semDados ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum dado ainda</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Comece cadastrando suas contas bancárias e adicionando lançamentos para ver o dashboard em ação.
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" asChild><Link href="/financeiro/contas">Contas Bancárias</Link></Button>
                <Button size="sm" asChild><Link href="/financeiro/receber">Novo Lançamento</Link></Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Alerta vence hoje ── */}
            {vencendoHoje.length > 0 && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {vencendoHoje.length} lançamento(s) vencem HOJE
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4 space-y-2">
                  {vencendoHoje.map((v) => (
                    <div key={v.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", v.tipo === "receber" ? "bg-emerald-500" : "bg-destructive")} />
                        <span className="text-sm truncate">{v.desc}</span>
                        <Badge variant={v.tipo === "receber" ? "default" : "destructive"} className="text-xs shrink-0">
                          {v.tipo === "receber" ? "Receber" : "Pagar"}
                        </Badge>
                      </div>
                      <span className={cn("text-sm font-bold shrink-0 ml-2", v.tipo === "receber" ? "text-emerald-600" : "text-destructive")}>
                        {formatCurrency(v.valor)}
                      </span>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="text-xs" asChild>
                      <Link href="/financeiro/receber">Ver Recebimentos</Link>
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" asChild>
                      <Link href="/financeiro/pagar">Ver Pagamentos</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Evolução 6 meses ── */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Evolução dos Últimos 6 Meses
                  <div className="flex items-center gap-3 ml-auto text-xs font-normal text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />Receitas</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-destructive/70" />Despesas</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex items-end gap-3 h-36 mt-2">
                  {evolucao6Meses.map((m) => {
                    const recH = Math.max((m.receitas / maxEvolucao) * 112, m.receitas > 0 ? 4 : 0);
                    const despH = Math.max((m.despesas / maxEvolucao) * 112, m.despesas > 0 ? 4 : 0);
                    const lucro = m.receitas - m.despesas;
                    const isCurrentMonth = m.mes === mesAtual;
                    return (
                      <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex items-end gap-0.5 h-28 w-full justify-center">
                          <div
                            className={cn("flex-1 rounded-t-sm transition-all", isCurrentMonth ? "bg-emerald-500" : "bg-emerald-500/60")}
                            style={{ height: `${recH}px` }}
                            title={`Receitas: ${formatCurrency(m.receitas)}`}
                          />
                          <div
                            className={cn("flex-1 rounded-t-sm transition-all", isCurrentMonth ? "bg-destructive/80" : "bg-destructive/40")}
                            style={{ height: `${despH}px` }}
                            title={`Despesas: ${formatCurrency(m.despesas)}`}
                          />
                        </div>
                        <span className={cn("text-[11px] font-medium", isCurrentMonth ? "text-foreground" : "text-muted-foreground")}>
                          {m.label}
                        </span>
                        {(m.receitas > 0 || m.despesas > 0) && (
                          <span className={cn("text-[10px] leading-none", lucro >= 0 ? "text-emerald-600" : "text-destructive")}>
                            {lucro >= 0 ? "+" : "-"}R${Math.abs(lucro) >= 1000 ? `${(Math.abs(lucro)/1000).toFixed(1)}k` : Math.abs(lucro).toFixed(0)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ── Linha: próximos vencimentos + top clientes ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Próximos vencimentos */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Próximos Vencimentos
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" asChild>
                      <Link href="/financeiro/fluxo">Ver fluxo <ArrowRight className="h-3 w-3" /></Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    {proximosVencimentos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhum vencimento nos próximos 30 dias</p>
                    ) : (
                      <div className="space-y-1.5">
                        {proximosVencimentos.map((v) => (
                          <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={cn("h-2 w-2 rounded-full shrink-0", v.tipo === "receber" ? "bg-emerald-500" : "bg-destructive")} />
                              <span className="text-sm truncate">{v.desc}</span>
                              <Badge variant="outline" className={cn("text-[10px] shrink-0 h-4 px-1", v.tipo === "receber" ? "text-emerald-600 border-emerald-500/40" : "text-destructive border-destructive/40")}>
                                {v.tipo === "receber" ? "Receber" : "Pagar"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              <span className="text-xs text-muted-foreground">{formatDate(v.vencimento)}</span>
                              <span className={cn("text-sm font-semibold w-24 text-right", v.tipo === "receber" ? "text-emerald-600" : "text-destructive")}>
                                {v.tipo === "receber" ? "+" : "-"}{formatCurrency(v.valor)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top clientes */}
              <Card>
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Top Clientes
                    <span className="text-xs font-normal text-muted-foreground ml-auto">por receita</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  {topClientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum recebimento registrado</p>
                  ) : (
                    <div className="space-y-3">
                      {topClientes.map((c, i) => (
                        <div key={c.nome}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[11px] font-bold text-muted-foreground/60 w-4 shrink-0">{i + 1}</span>
                              <span className="text-xs font-medium truncate">{c.nome}</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 shrink-0 ml-2">{formatCurrency(c.valor)}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${(c.valor / maxCliente) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full text-xs mt-4" asChild>
                    <Link href="/relatorios">Ver relatório completo</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* ── Linha: despesas + status + saldos + fluxo ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* Distribuição de despesas */}
              <Card>
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Despesas por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  {distribuicaoDespesas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa paga</p>
                  ) : (
                    <div className="space-y-2.5">
                      {distribuicaoDespesas.map((d, i) => (
                        <div key={d.cat}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={cn("h-2 w-2 rounded-full shrink-0", DESP_COLORS[i % DESP_COLORS.length])} />
                              <span className="text-xs truncate">{d.cat}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-[11px] text-muted-foreground">{d.pct.toFixed(0)}%</span>
                              <span className="text-xs font-semibold w-20 text-right">{formatCurrency(d.valor)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", DESP_COLORS[i % DESP_COLORS.length])}
                              style={{ width: `${d.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full text-xs mt-4" asChild>
                    <Link href="/financeiro/dre">Ver DRE completo</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Status dos lançamentos */}
              <Card>
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    Status dos Lançamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4 space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contas a Receber</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs">Recebido</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">{formatCurrency(statusGeral.recebido)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-xs">Pendente</span>
                        </div>
                        <span className="text-xs font-semibold text-blue-500">{formatCurrency(statusGeral.pendRec)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-xs">Vencido</span>
                        </div>
                        <span className="text-xs font-semibold text-destructive">{formatCurrency(statusGeral.vencidoRec)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contas a Pagar</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs">Pago</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">{formatCurrency(statusGeral.pago)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-xs">Pendente</span>
                        </div>
                        <span className="text-xs font-semibold text-blue-500">{formatCurrency(statusGeral.pendPag)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-xs">Vencido</span>
                        </div>
                        <span className="text-xs font-semibold text-destructive">{formatCurrency(statusGeral.vencidoPag)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Saldos + Fluxo semanal */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Landmark className="h-4 w-4 text-primary" />
                      Saldos Bancários
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-4 space-y-2.5">
                    {contasBancarias.filter(c => c.ativa).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">Nenhuma conta cadastrada</p>
                    ) : (
                      contasBancarias.filter(c => c.ativa).map(c => (
                        <div key={c.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium leading-tight">{c.banco}</p>
                            <p className="text-xs text-muted-foreground">{c.tipo}</p>
                          </div>
                          <p className={cn("text-sm font-bold", c.saldo >= 0 ? "text-primary" : "text-destructive")}>
                            {formatCurrency(c.saldo)}
                          </p>
                        </div>
                      ))
                    )}
                    {contasBancarias.filter(c => c.ativa).length > 0 && (
                      <div className="border-t border-border pt-2.5 flex items-center justify-between">
                        <p className="text-sm font-semibold">Total</p>
                        <p className={cn("text-sm font-bold", saldoEmCaixa >= 0 ? "text-primary" : "text-destructive")}>
                          {formatCurrency(saldoEmCaixa)}
                        </p>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                      <Link href="/financeiro/contas">Gerenciar contas</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Fluxo Semanal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    <div className="flex items-end gap-1.5 h-20">
                      {fluxoSemanal.map((d) => (
                        <div key={d.str} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex gap-0.5 items-end h-14">
                            <div className="flex-1 bg-emerald-500/70 rounded-t" style={{ height: `${(d.entradas / maxFluxo) * 100}%`, minHeight: d.entradas > 0 ? 3 : 0 }} />
                            <div className="flex-1 bg-destructive/60 rounded-t" style={{ height: `${(d.saidas / maxFluxo) * 100}%`, minHeight: d.saidas > 0 ? 3 : 0 }} />
                          </div>
                          <span className={cn("text-[10px]", d.str === hojeStr ? "text-primary font-bold" : "text-muted-foreground")}>
                            {d.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500/70 inline-block" />Entradas</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/60 inline-block" />Saídas</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Resumo do mês ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Recebido no Mês</p>
                    <p className="text-xl font-bold mt-0.5 text-emerald-600">{formatCurrency(resumoMes.totalRecebido)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 bg-destructive/10">
                    <CreditCard className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Pago no Mês</p>
                    <p className="text-xl font-bold mt-0.5 text-destructive">{formatCurrency(resumoMes.totalPago)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 bg-amber-500/10">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Inadimplência (vencidos)</p>
                    <p className={cn("text-xl font-bold mt-0.5", inadimplencia.vencido > 0 ? "text-amber-500" : "text-muted-foreground")}>
                      {formatCurrency(inadimplencia.vencido)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
