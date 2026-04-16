"use client";
import { useState, useMemo } from "react";
import {
  FileText, TrendingUp, TrendingDown, AlertCircle, Download,
  BarChart3, Calendar, CheckCircle2, Filter, X, Users, Wallet,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { formatCurrency, toDateStr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

const MESES_ABREV = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES_NOME  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function mesLabel(anoMes: string) {
  const [ano, mes] = anoMes.split("-");
  return `${MESES_ABREV[parseInt(mes) - 1]}/${ano.slice(2)}`;
}

/* ─── mini barra horizontal proporcional ─── */
function BarH({ pct, color = "bg-primary", height = "h-2" }: { pct: number; color?: string; height?: string }) {
  return (
    <div className={cn("w-full rounded-full bg-muted overflow-hidden", height)}>
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

/* ─── exportar CSV ─── */
function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers.join(";"), ...rows.map(r => r.map(c => `"${c}"`).join(";"))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function RelatoriosPage() {
  const { lancamentosReceber, lancamentosPagar, contasBancarias, nomesClientesAtivos, nomesFornecedoresAtivos } = useApp();

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");

  const anosDisponiveis = [anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1];
  const hojeStr = toDateStr(hoje);

  // Modo: "mes" = selects de mês/ano | "data" = campos de data exata
  const [modoData, setModoData] = useState<"mes" | "data">("mes");

  // Modo mês
  const [mesInicio, setMesInicio] = useState(1);
  const [anoInicio, setAnoInicio] = useState(anoAtual);
  const [mesFim, setMesFim]       = useState(hoje.getMonth() + 1);
  const [anoFim, setAnoFim]       = useState(anoAtual);
  const dataInicio = `${anoInicio}-${String(mesInicio).padStart(2,"0")}`;
  const dataFim    = `${anoFim}-${String(mesFim).padStart(2,"0")}`;

  // Modo data exata
  const [dataExataInicio, setDataExataInicio] = useState(`${anoAtual}-01-01`);
  const [dataExataFim,    setDataExataFim]    = useState(hojeStr);

  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroAplicado, setFiltroAplicado] = useState<{
    modo: "mes" | "data";
    inicio: string; fim: string;
    inicioExato: string; fimExato: string;
    cliente: string; fornecedor: string;
  }>({
    modo: "mes",
    inicio: `${anoAtual}-01`,
    fim:    `${anoAtual}-${mesAtual}`,
    inicioExato: `${anoAtual}-01-01`,
    fimExato:    hojeStr,
    cliente: "",
    fornecedor: "",
  });

  function setPeriodo(ini: string, fim: string) {
    const [aiStr, miStr] = ini.split("-");
    const [afStr, mfStr] = fim.split("-");
    setAnoInicio(parseInt(aiStr)); setMesInicio(parseInt(miStr));
    setAnoFim(parseInt(afStr));    setMesFim(parseInt(mfStr));
    setModoData("mes");
    setFiltroAplicado(f => ({ ...f, modo: "mes", inicio: ini, fim: fim }));
  }

  const [flashCard, setFlashCard] = useState<Record<string, boolean>>({});

  function flash(key: string) {
    setFlashCard(p => ({ ...p, [key]: true }));
    setTimeout(() => setFlashCard(p => ({ ...p, [key]: false })), 2000);
  }

  /* ─── filtros ─── */
  // Usa lista mestre de cadastros + clientes/fornecedores que já têm lançamentos (união)
  const clientesDisponiveis = useMemo(() =>
    [...new Set([
      ...nomesClientesAtivos,
      ...lancamentosReceber.map(l => l.cliente).filter(Boolean),
    ])].sort()
  , [nomesClientesAtivos, lancamentosReceber]);

  const fornecedoresDisponiveis = useMemo(() =>
    [...new Set([
      ...nomesFornecedoresAtivos,
      ...lancamentosPagar.map(l => l.fornecedor).filter(Boolean),
    ])].sort()
  , [nomesFornecedoresAtivos, lancamentosPagar]);

  function aplicarFiltro() {
    if (modoData === "data") {
      setFiltroAplicado(f => ({ ...f, modo: "data", inicioExato: dataExataInicio, fimExato: dataExataFim, cliente: filtroCliente, fornecedor: filtroFornecedor }));
    } else {
      setFiltroAplicado(f => ({ ...f, modo: "mes", inicio: dataInicio, fim: dataFim, cliente: filtroCliente, fornecedor: filtroFornecedor }));
    }
  }

  function aplicarPreset(preset: string) {
    const y = anoAtual;
    const m = parseInt(mesAtual, 10);
    let ini = "", fim = "";
    if (preset === "mes")               { ini = fim = `${y}-${mesAtual}`; }
    else if (preset === "trimestre")    { const q = Math.floor((m-1)/3); ini=`${y}-${String(q*3+1).padStart(2,"0")}`; fim=`${y}-${String(Math.min(q*3+3,12)).padStart(2,"0")}`; }
    else if (preset === "semestre")     { ini = m<=6?`${y}-01`:`${y}-07`; fim = m<=6?`${y}-06`:`${y}-12`; }
    else if (preset === "ano")          { ini=`${y}-01`; fim=`${y}-12`; }
    else if (preset === "ano-anterior") { ini=`${y-1}-01`; fim=`${y-1}-12`; }
    setPeriodo(ini, fim);
  }

  function limparTodos() {
    setFiltroCliente(""); setFiltroFornecedor("");
    setFiltroAplicado(f => ({ ...f, cliente: "", fornecedor: "" }));
  }

  function dentroDoFiltro(vencimento: string) {
    if (filtroAplicado.modo === "data") {
      return vencimento >= filtroAplicado.inicioExato && vencimento <= filtroAplicado.fimExato;
    }
    const am = vencimento.slice(0, 7);
    return am >= filtroAplicado.inicio && am <= filtroAplicado.fim;
  }

  /* ─── cálculos ─── */
  const receberPorMes = useMemo(() => {
    const map: Record<string, { previsto: number; recebido: number }> = {};
    for (const l of lancamentosReceber) {
      if (filtroAplicado.cliente && l.cliente !== filtroAplicado.cliente) continue;
      for (const p of l.parcelas) {
        if (!dentroDoFiltro(p.vencimento)) continue;
        const key = p.vencimento.slice(0, 7);
        if (!map[key]) map[key] = { previsto: 0, recebido: 0 };
        map[key].previsto += p.valor;
        if (p.status === "recebido") map[key].recebido += p.valorRecebido ?? p.valor;
      }
    }
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
      .map(([mes, v]) => ({ mes, previsto: v.previsto, recebido: v.recebido, pendente: v.previsto - v.recebido }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosReceber, filtroAplicado]);

  const pagarPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of lancamentosPagar) {
      if (filtroAplicado.fornecedor && l.fornecedor !== filtroAplicado.fornecedor) continue;
      for (const p of l.parcelas) {
        if (!dentroDoFiltro(p.vencimento)) continue;
        if (!map[l.categoria]) map[l.categoria] = 0;
        map[l.categoria] += p.valor;
      }
    }
    const total = Object.values(map).reduce((s,v) => s+v, 0);
    return Object.entries(map).sort(([,a],[,b]) => b-a)
      .map(([categoria, valor]) => ({ categoria, valor, pct: total > 0 ? Math.round((valor/total)*100) : 0 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosPagar, filtroAplicado]);

  const totalPago = useMemo(() => {
    let t = 0;
    for (const l of lancamentosPagar) {
      if (filtroAplicado.fornecedor && l.fornecedor !== filtroAplicado.fornecedor) continue;
      for (const p of l.parcelas)
        if (dentroDoFiltro(p.vencimento) && p.status === "pago") t += p.valorPago ?? p.valor;
    }
    return t;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosPagar, filtroAplicado]);

  const drePorMes = useMemo(() => {
    const map: Record<string, { receita: number; despesa: number }> = {};
    for (const l of lancamentosReceber) {
      if (filtroAplicado.cliente && l.cliente !== filtroAplicado.cliente) continue;
      for (const p of l.parcelas) {
        if (!dentroDoFiltro(p.vencimento)) continue;
        const key = p.vencimento.slice(0, 7);
        if (!map[key]) map[key] = { receita: 0, despesa: 0 };
        map[key].receita += p.valor;
      }
    }
    for (const l of lancamentosPagar) {
      if (filtroAplicado.fornecedor && l.fornecedor !== filtroAplicado.fornecedor) continue;
      for (const p of l.parcelas) {
        if (!dentroDoFiltro(p.vencimento)) continue;
        const key = p.vencimento.slice(0, 7);
        if (!map[key]) map[key] = { receita: 0, despesa: 0 };
        map[key].despesa += p.valor;
      }
    }
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
      .map(([mes, v]) => ({ mes, receita: v.receita, despesa: v.despesa, lucro: v.receita - v.despesa, margem: v.receita > 0 ? +((((v.receita-v.despesa)/v.receita)*100).toFixed(1)) : 0 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosReceber, lancamentosPagar, filtroAplicado]);

  const dreTotais = useMemo(() => {
    const receita = drePorMes.reduce((s,r) => s+r.receita, 0);
    const despesa = drePorMes.reduce((s,r) => s+r.despesa, 0);
    const lucro   = receita - despesa;
    return { receita, despesa, lucro, margem: receita > 0 ? +((lucro/receita)*100).toFixed(1) : 0 };
  }, [drePorMes]);

  const totalReceberPrevisto = receberPorMes.reduce((s,r) => s+r.previsto, 0);
  const totalReceberRecebido = receberPorMes.reduce((s,r) => s+r.recebido, 0);
  const totalPagar           = pagarPorCategoria.reduce((s,r) => s+r.valor, 0);
  const taxaRecebimento      = totalReceberPrevisto > 0 ? Math.round((totalReceberRecebido / totalReceberPrevisto) * 100) : 0;

  /* ─── inadimplência ─── */
  const inadimplencia = useMemo(() => {
    const h = toDateStr(new Date());
    const items: { cliente: string; descricao: string; vencimento: string; valor: number; dias: number }[] = [];
    for (const l of lancamentosReceber) {
      if (filtroAplicado.cliente && l.cliente !== filtroAplicado.cliente) continue;
      for (const p of l.parcelas) {
        if (p.status === "vencido") {
          const dias = Math.max(0, Math.floor((new Date(h).getTime() - new Date(p.vencimento+"T12:00:00").getTime()) / 86400000));
          items.push({ cliente: l.cliente, descricao: l.parcelas.length > 1 ? `${l.descricao} (${p.num}/${p.total})` : l.descricao, vencimento: p.vencimento, valor: p.valor, dias });
        }
      }
    }
    return items.sort((a,b) => b.dias - a.dias);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosReceber, filtroAplicado]);

  const totalInadimplencia = inadimplencia.reduce((s,r) => s+r.valor, 0);

  const agingBuckets = useMemo(() => ({
    ate30:  inadimplencia.filter(r => r.dias <= 30).reduce((s,r) => s+r.valor, 0),
    de31a60: inadimplencia.filter(r => r.dias > 30 && r.dias <= 60).reduce((s,r) => s+r.valor, 0),
    de61a90: inadimplencia.filter(r => r.dias > 60 && r.dias <= 90).reduce((s,r) => s+r.valor, 0),
    acima90: inadimplencia.filter(r => r.dias > 90).reduce((s,r) => s+r.valor, 0),
  }), [inadimplencia]);

  /* ─── top clientes ─── */
  const topClientes = useMemo(() => {
    const map: Record<string, { previsto: number; recebido: number }> = {};
    for (const l of lancamentosReceber) {
      if (!l.cliente) continue;
      for (const p of l.parcelas) {
        if (!dentroDoFiltro(p.vencimento)) continue;
        if (!map[l.cliente]) map[l.cliente] = { previsto: 0, recebido: 0 };
        map[l.cliente].previsto += p.valor;
        if (p.status === "recebido") map[l.cliente].recebido += p.valorRecebido ?? p.valor;
      }
    }
    const total = Object.values(map).reduce((s,v) => s+v.previsto, 0);
    return Object.entries(map)
      .map(([cliente, v]) => ({ cliente, previsto: v.previsto, recebido: v.recebido, pct: total > 0 ? Math.round((v.previsto/total)*100) : 0 }))
      .sort((a,b) => b.previsto - a.previsto)
      .slice(0, 7);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentosReceber, filtroAplicado]);

  /* ─── saldo bancário atual ─── */
  const saldoBancario = contasBancarias.filter(c => c.ativa).reduce((s,c) => s+c.saldo, 0);

  /* ─── export CSV ─── */
  function exportDRE() {
    exportCSV(
      `DRE_${filtroAplicado.inicio}_${filtroAplicado.fim}.csv`,
      ["Mês", "Receita", "Despesa", "Lucro", "Margem (%)"],
      [
        ...drePorMes.map(r => [mesLabel(r.mes), r.receita.toFixed(2), r.despesa.toFixed(2), r.lucro.toFixed(2), r.margem]),
        ["TOTAL", dreTotais.receita.toFixed(2), dreTotais.despesa.toFixed(2), dreTotais.lucro.toFixed(2), dreTotais.margem],
      ]
    );
    flash("dre");
  }

  function exportReceber() {
    exportCSV(
      `Receber_${filtroAplicado.inicio}_${filtroAplicado.fim}.csv`,
      ["Mês", "Previsto", "Recebido", "Pendente"],
      receberPorMes.map(r => [mesLabel(r.mes), r.previsto.toFixed(2), r.recebido.toFixed(2), r.pendente.toFixed(2)])
    );
    flash("receber");
  }

  function exportPagar() {
    exportCSV(
      `Pagar_${filtroAplicado.inicio}_${filtroAplicado.fim}.csv`,
      ["Categoria", "Valor", "% Total"],
      pagarPorCategoria.map(r => [r.categoria, r.valor.toFixed(2), r.pct])
    );
    flash("pagar");
  }

  function exportInadimplencia() {
    exportCSV(
      `Inadimplencia_${toDateStr(new Date())}.csv`,
      ["Cliente", "Descrição", "Vencimento", "Valor", "Dias de Atraso"],
      inadimplencia.map(r => [r.cliente, r.descricao, r.vencimento, r.valor.toFixed(2), r.dias])
    );
    flash("inadimplencia");
  }

  function exportCompleto() {
    exportDRE();
    flash("completo");
  }

  const semDados = lancamentosReceber.length === 0 && lancamentosPagar.length === 0;
  const periodoLabel = filtroAplicado.modo === "data"
    ? `${new Intl.DateTimeFormat("pt-BR").format(new Date(filtroAplicado.inicioExato+"T12:00:00"))} — ${new Intl.DateTimeFormat("pt-BR").format(new Date(filtroAplicado.fimExato+"T12:00:00"))}`
    : `${MESES_ABREV[parseInt(filtroAplicado.inicio.split("-")[1])-1]}/${filtroAplicado.inicio.slice(0,4)} — ${MESES_ABREV[parseInt(filtroAplicado.fim.split("-")[1])-1]}/${filtroAplicado.fim.slice(0,4)}`;

  /* ─── render ─── */
  return (
    <div>
      <Header title="Relatórios Financeiros" subtitle="Análises e exportações do período" />

      <div className="p-6 space-y-6">

        {/* ── Filtros ── */}
        <Card>
          <CardContent className="py-5 space-y-5">

            {/* Linha 1: presets rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground mr-1">Período rápido:</span>
              {[
                { k:"mes",          l:"Mês atual"    },
                { k:"trimestre",    l:"Trimestre"    },
                { k:"semestre",     l:"Semestre"     },
                { k:"ano",          l:"Ano atual"    },
                { k:"ano-anterior", l:"Ano anterior" },
              ].map(({ k, l }) => {
                const ativo = (() => {
                  const y = anoAtual; const m = parseInt(mesAtual,10);
                  if (k==="mes")          return dataInicio===`${y}-${mesAtual}` && dataFim===`${y}-${mesAtual}`;
                  if (k==="trimestre")    { const q=Math.floor((m-1)/3); return dataInicio===`${y}-${String(q*3+1).padStart(2,"0")}` && dataFim===`${y}-${String(Math.min(q*3+3,12)).padStart(2,"0")}`; }
                  if (k==="semestre")     return dataInicio===(m<=6?`${y}-01`:`${y}-07`) && dataFim===(m<=6?`${y}-06`:`${y}-12`);
                  if (k==="ano")          return dataInicio===`${y}-01` && dataFim===`${y}-12`;
                  if (k==="ano-anterior") return dataInicio===`${y-1}-01` && dataFim===`${y-1}-12`;
                  return false;
                })();
                return (
                  <button key={k} onClick={() => aplicarPreset(k)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors",
                      ativo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                    {l}
                  </button>
                );
              })}
            </div>

            {/* Linha 2: toggle modo + seleção de período */}
            <div className="space-y-3">
              {/* Toggle Por mês / Data específica */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
                {(["mes", "data"] as const).map(modo => (
                  <button
                    key={modo}
                    onClick={() => setModoData(modo)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      modoData === modo
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {modo === "mes" ? "Por mês" : "Data específica"}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">Período</span>
                </div>

                {modoData === "mes" ? (
                  <>
                    {/* Selects de mês */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">De</Label>
                      <div className="flex gap-1.5">
                        <select
                          value={mesInicio}
                          onChange={e => { const v=parseInt(e.target.value); setMesInicio(v); setFiltroAplicado(f=>({...f, modo:"mes", inicio:`${anoInicio}-${String(v).padStart(2,"0")}`})); }}
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {MESES_NOME.map((n,i) => <option key={i+1} value={i+1}>{n}</option>)}
                        </select>
                        <select
                          value={anoInicio}
                          onChange={e => { const v=parseInt(e.target.value); setAnoInicio(v); setFiltroAplicado(f=>({...f, modo:"mes", inicio:`${v}-${String(mesInicio).padStart(2,"0")}`})); }}
                          className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>

                    <span className="text-muted-foreground pb-1">→</span>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Até</Label>
                      <div className="flex gap-1.5">
                        <select
                          value={mesFim}
                          onChange={e => { const v=parseInt(e.target.value); setMesFim(v); setFiltroAplicado(f=>({...f, modo:"mes", fim:`${anoFim}-${String(v).padStart(2,"0")}`})); }}
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {MESES_NOME.map((n,i) => <option key={i+1} value={i+1}>{n}</option>)}
                        </select>
                        <select
                          value={anoFim}
                          onChange={e => { const v=parseInt(e.target.value); setAnoFim(v); setFiltroAplicado(f=>({...f, modo:"mes", fim:`${v}-${String(mesFim).padStart(2,"0")}`})); }}
                          className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Badge período ativo */}
                    <div className="pb-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {MESES_ABREV[mesInicio-1]} {anoInicio} — {MESES_ABREV[mesFim-1]} {anoFim}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Inputs de data exata */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">De</Label>
                      <input
                        type="date"
                        value={dataExataInicio}
                        onChange={e => { setDataExataInicio(e.target.value); setFiltroAplicado(f=>({...f, modo:"data", inicioExato: e.target.value})); }}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>

                    <span className="text-muted-foreground pb-1">→</span>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Até</Label>
                      <input
                        type="date"
                        value={dataExataFim}
                        onChange={e => { setDataExataFim(e.target.value); setFiltroAplicado(f=>({...f, modo:"data", fimExato: e.target.value})); }}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>

                    {/* Badge período ativo */}
                    {dataExataInicio && dataExataFim && (
                      <div className="pb-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Intl.DateTimeFormat("pt-BR").format(new Date(dataExataInicio+"T12:00:00"))}
                          {" — "}
                          {new Intl.DateTimeFormat("pt-BR").format(new Date(dataExataFim+"T12:00:00"))}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Linha 3: cliente / fornecedor */}
            <div className="flex flex-wrap items-end gap-3 pt-1 border-t">
              <div className="grid gap-1 min-w-[180px]">
                <Label className="text-xs text-muted-foreground">Cliente (receitas)</Label>
                <select className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
                  <option value="">Todos os clientes</option>
                  {clientesDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid gap-1 min-w-[180px]">
                <Label className="text-xs text-muted-foreground">Fornecedor (despesas)</Label>
                <select className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={filtroFornecedor} onChange={e => setFiltroFornecedor(e.target.value)}>
                  <option value="">Todos os fornecedores</option>
                  {fornecedoresDisponiveis.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <Button size="sm" className="h-9 gap-1.5" onClick={aplicarFiltro}>
                Aplicar filtros
              </Button>
              {(filtroAplicado.cliente || filtroAplicado.fornecedor) && (
                <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground hover:text-destructive" onClick={limparTodos}>
                  <X className="h-3.5 w-3.5" /> Limpar
                </Button>
              )}
              {(filtroAplicado.cliente || filtroAplicado.fornecedor) && (
                <div className="flex gap-2 flex-wrap">
                  {filtroAplicado.cliente && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                      {filtroAplicado.cliente}
                    </span>
                  )}
                  {filtroAplicado.fornecedor && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                      {filtroAplicado.fornecedor}
                    </span>
                  )}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {semDados ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum dado disponível</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione lançamentos em Contas a Receber e a Pagar para gerar os relatórios.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── KPIs do período ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Receita Prevista</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(totalReceberPrevisto)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{taxaRecebimento}% recebido · {periodoLabel}</p>
                  <BarH pct={taxaRecebimento} color="bg-green-500" height="h-1.5" />
                </CardContent>
              </Card>

              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Despesas Previstas</p>
                  </div>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(totalPagar)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalPago)} pago · {Math.round(totalPagar > 0 ? (totalPago/totalPagar)*100 : 0)}% quitado</p>
                  <BarH pct={totalPagar > 0 ? (totalPago/totalPagar)*100 : 0} color="bg-destructive/60" height="h-1.5" />
                </CardContent>
              </Card>

              <Card className={cn("border-2", dreTotais.lucro >= 0 ? "border-green-500/40 bg-green-500/5" : "border-destructive/40 bg-destructive/5")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className={cn("h-4 w-4", dreTotais.lucro >= 0 ? "text-green-600" : "text-destructive")} />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</p>
                  </div>
                  <p className={cn("text-2xl font-bold", dreTotais.lucro >= 0 ? "text-green-700" : "text-destructive")}>
                    {dreTotais.lucro >= 0 ? "+" : ""}{formatCurrency(dreTotais.lucro)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Margem {dreTotais.margem}%</p>
                </CardContent>
              </Card>

              <Card className={cn(totalInadimplencia > 0 ? "border-destructive/30 bg-destructive/5" : "")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className={cn("h-4 w-4", totalInadimplencia > 0 ? "text-destructive" : "text-muted-foreground")} />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inadimplência</p>
                  </div>
                  <p className={cn("text-2xl font-bold", totalInadimplencia > 0 ? "text-destructive" : "text-muted-foreground")}>
                    {formatCurrency(totalInadimplencia)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{inadimplencia.length} parcela{inadimplencia.length !== 1 ? "s" : ""} em atraso</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Linha 1: Recebimentos por Mês + Despesas por Categoria ── */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* Contas a Receber por Mês */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-green-600" /> Recebimentos por Mês
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {flashCard["receber"] && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Exportado</span>}
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={exportReceber}>
                        <Download className="h-3 w-3" /> CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {/* Mini KPIs */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l:"Previsto",  v:totalReceberPrevisto, c:"text-foreground"  },
                      { l:"Recebido",  v:totalReceberRecebido, c:"text-green-600"   },
                      { l:"Pendente",  v:totalReceberPrevisto - totalReceberRecebido, c:"text-amber-600" },
                    ].map(s => (
                      <div key={s.l} className="rounded-md bg-muted/40 px-3 py-2 text-center">
                        <p className="text-[10px] text-muted-foreground">{s.l}</p>
                        <p className={cn("text-xs font-bold mt-0.5", s.c)}>{formatCurrency(s.v)}</p>
                      </div>
                    ))}
                  </div>

                  {receberPorMes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Sem lançamentos no período</p>
                  ) : (
                    <div className="space-y-2.5">
                      {receberPorMes.map(row => {
                        const maxVal = Math.max(...receberPorMes.map(r => r.previsto));
                        const pctPrev = maxVal > 0 ? (row.previsto / maxVal) * 100 : 0;
                        const pctRec  = row.previsto > 0 ? (row.recebido / row.previsto) * 100 : 0;
                        return (
                          <div key={row.mes} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium w-14">{mesLabel(row.mes)}</span>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span className="text-green-600 font-medium">{formatCurrency(row.recebido)}</span>
                                <span className="text-muted-foreground">/</span>
                                <span>{formatCurrency(row.previsto)}</span>
                              </div>
                            </div>
                            <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                              <div className="absolute h-full rounded-full bg-green-200 dark:bg-green-900/50" style={{ width: `${pctPrev}%` }} />
                              <div className="absolute h-full rounded-full bg-green-500" style={{ width: `${(pctRec * pctPrev) / 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Despesas por Categoria */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingDown className="h-4 w-4 text-destructive" /> Despesas por Categoria
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {flashCard["pagar"] && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Exportado</span>}
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={exportPagar}>
                        <Download className="h-3 w-3" /> CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l:"Total",       v:totalPagar,            c:"text-foreground"  },
                      { l:"Pago",        v:totalPago,             c:"text-green-600"   },
                      { l:"A Pagar",     v:totalPagar - totalPago, c:"text-destructive" },
                    ].map(s => (
                      <div key={s.l} className="rounded-md bg-muted/40 px-3 py-2 text-center">
                        <p className="text-[10px] text-muted-foreground">{s.l}</p>
                        <p className={cn("text-xs font-bold mt-0.5", s.c)}>{formatCurrency(s.v)}</p>
                      </div>
                    ))}
                  </div>

                  {pagarPorCategoria.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Sem lançamentos no período</p>
                  ) : (
                    <div className="space-y-2.5">
                      {pagarPorCategoria.map(row => (
                        <div key={row.categoria} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium truncate max-w-[140px]">{row.categoria}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-medium text-destructive">{formatCurrency(row.valor)}</span>
                              <span className="text-muted-foreground w-8 text-right">{row.pct}%</span>
                            </div>
                          </div>
                          <BarH pct={row.pct} color="bg-destructive/60" height="h-3" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Linha 2: Top Clientes + Inadimplência ── */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* Top Clientes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-primary" /> Top Clientes por Receita
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {topClientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Sem dados no período</p>
                  ) : (
                    <div className="space-y-3">
                      {topClientes.map((row, i) => (
                        <div key={row.cliente} className="flex items-center gap-3">
                          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                            i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-muted text-muted-foreground"
                          )}>
                            {i < 3 ? ["🥇","🥈","🥉"][i] : i+1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium truncate">{row.cliente}</span>
                              <span className="text-xs font-bold text-green-600 shrink-0 ml-2">{formatCurrency(row.previsto)}</span>
                            </div>
                            <BarH pct={row.pct} color={i === 0 ? "bg-primary" : "bg-primary/50"} height="h-2" />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{row.pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inadimplência */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className="h-4 w-4 text-destructive" /> Inadimplência
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {totalInadimplencia > 0 && (
                        <Badge variant="destructive" className="text-xs">{formatCurrency(totalInadimplencia)}</Badge>
                      )}
                      {flashCard["inadimplencia"] && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Exportado</span>}
                      {inadimplencia.length > 0 && (
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={exportInadimplencia}>
                          <Download className="h-3 w-3" /> CSV
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {inadimplencia.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-sm font-medium text-green-600">Sem parcelas vencidas</p>
                    </div>
                  ) : (
                    <>
                      {/* Aging buckets */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { l:"Até 30d",  v:agingBuckets.ate30,   c:"bg-amber-500/10 text-amber-700 border-amber-500/30"   },
                          { l:"31–60d",   v:agingBuckets.de31a60, c:"bg-orange-500/10 text-orange-700 border-orange-500/30" },
                          { l:"61–90d",   v:agingBuckets.de61a90, c:"bg-red-500/10 text-red-700 border-red-500/30"          },
                          { l:"+90d",     v:agingBuckets.acima90, c:"bg-red-900/10 text-red-900 border-red-800/30"          },
                        ].map(b => (
                          <div key={b.l} className={cn("rounded-lg border px-2 py-2 text-center", b.c)}>
                            <p className="text-[10px] font-medium opacity-80">{b.l}</p>
                            <p className="text-xs font-bold mt-0.5">{b.v > 0 ? formatCurrency(b.v) : "—"}</p>
                          </div>
                        ))}
                      </div>

                      {/* Tabela */}
                      <div className="overflow-x-auto rounded-md border max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-muted/80 text-muted-foreground">
                              <th className="px-3 py-2 text-left font-medium">Cliente</th>
                              <th className="px-3 py-2 text-right font-medium">Valor</th>
                              <th className="px-3 py-2 text-right font-medium">Atraso</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inadimplencia.map((row, i) => (
                              <tr key={i} className={cn("border-t hover:bg-muted/20", i % 2 === 1 && "bg-muted/20")}>
                                <td className="px-3 py-2">
                                  <p className="font-medium">{row.cliente}</p>
                                  <p className="text-muted-foreground truncate max-w-[120px]">{row.descricao}</p>
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-destructive">{formatCurrency(row.valor)}</td>
                                <td className="px-3 py-2 text-right">
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{row.dias}d</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── DRE Completo (largura total) ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-primary" /> DRE — Resultado por Mês
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />Receita</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-destructive/70" />Despesa</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />Lucro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {flashCard["dre"] && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Exportado</span>}
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={exportDRE}>
                        <Download className="h-3 w-3" /> CSV
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {drePorMes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem lançamentos no período</p>
                ) : (
                  <>
                    {/* Gráfico de barras visual */}
                    {drePorMes.length > 0 && (() => {
                      const maxVal = Math.max(...drePorMes.flatMap(r => [r.receita, r.despesa]));
                      return (
                        <div className="mb-6 mt-2">
                          <div className="flex items-end gap-2 h-32">
                            {drePorMes.map(row => {
                              const hRec = maxVal > 0 ? (row.receita / maxVal) * 100 : 0;
                              const hDes = maxVal > 0 ? (row.despesa / maxVal) * 100 : 0;
                              return (
                                <div key={row.mes} className="flex-1 flex flex-col items-center gap-0.5 group">
                                  <div className="w-full flex items-end gap-0.5 h-24">
                                    <div className="flex-1 rounded-t-sm bg-green-500/80 transition-all hover:bg-green-500" style={{ height: `${hRec}%` }} title={`Receita: ${formatCurrency(row.receita)}`} />
                                    <div className="flex-1 rounded-t-sm bg-destructive/60 transition-all hover:bg-destructive/80" style={{ height: `${hDes}%` }} title={`Despesa: ${formatCurrency(row.despesa)}`} />
                                  </div>
                                  <span className="text-[9px] text-muted-foreground">{mesLabel(row.mes)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Tabela DRE */}
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 text-muted-foreground">
                            <th className="px-4 py-2.5 text-left font-medium">Mês</th>
                            <th className="px-4 py-2.5 text-right font-medium">Receita</th>
                            <th className="px-4 py-2.5 text-right font-medium">Despesa</th>
                            <th className="px-4 py-2.5 text-right font-medium">Resultado</th>
                            <th className="px-4 py-2.5 text-right font-medium">Margem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drePorMes.map((row, i) => (
                            <tr key={row.mes} className={cn("border-t hover:bg-muted/20 transition-colors", i % 2 === 1 && "bg-muted/20")}>
                              <td className="px-4 py-2.5 font-medium">{mesLabel(row.mes)}</td>
                              <td className="px-4 py-2.5 text-right text-green-600 font-medium">{formatCurrency(row.receita)}</td>
                              <td className="px-4 py-2.5 text-right text-destructive">{formatCurrency(row.despesa)}</td>
                              <td className={cn("px-4 py-2.5 text-right font-semibold", row.lucro >= 0 ? "text-green-600" : "text-destructive")}>
                                {row.lucro >= 0 ? "+" : ""}{formatCurrency(row.lucro)}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                                    <div className={cn("h-full rounded-full", row.margem >= 0 ? "bg-green-500" : "bg-destructive/70")} style={{ width: `${Math.min(100, Math.max(0, Math.abs(row.margem)))}%` }} />
                                  </div>
                                  <span className={cn("w-10 text-right font-medium", row.margem >= 0 ? "text-green-600" : "text-destructive")}>{row.margem}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-border bg-muted/50 font-bold">
                            <td className="px-4 py-2.5">Total</td>
                            <td className="px-4 py-2.5 text-right text-green-600">{formatCurrency(dreTotais.receita)}</td>
                            <td className="px-4 py-2.5 text-right text-destructive">{formatCurrency(dreTotais.despesa)}</td>
                            <td className={cn("px-4 py-2.5 text-right", dreTotais.lucro >= 0 ? "text-green-600" : "text-destructive")}>
                              {dreTotais.lucro >= 0 ? "+" : ""}{formatCurrency(dreTotais.lucro)}
                            </td>
                            <td className={cn("px-4 py-2.5 text-right", dreTotais.margem >= 0 ? "text-green-600" : "text-destructive")}>{dreTotais.margem}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── Saldo Bancário ── */}
            {contasBancarias.filter(c => c.ativa).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wallet className="h-4 w-4 text-primary" /> Saldo por Conta Bancária
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {contasBancarias.filter(c => c.ativa).map(conta => (
                      <div key={conta.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{conta.banco}</p>
                          <p className="text-xs text-muted-foreground">{conta.tipo}</p>
                        </div>
                        <p className={cn("text-sm font-bold", conta.saldo > 0 ? "text-green-600" : conta.saldo < 0 ? "text-destructive" : "text-muted-foreground")}>
                          {formatCurrency(conta.saldo)}
                        </p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold">Total Disponível</p>
                        <p className="text-xs text-muted-foreground">{contasBancarias.filter(c => c.ativa).length} conta{contasBancarias.filter(c => c.ativa).length !== 1 ? "s" : ""} ativa{contasBancarias.filter(c => c.ativa).length !== 1 ? "s" : ""}</p>
                      </div>
                      <p className={cn("text-lg font-bold", saldoBancario >= 0 ? "text-green-600" : "text-destructive")}>
                        {formatCurrency(saldoBancario)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Export completo ── */}
            <Button variant="outline" size="lg" className="w-full gap-2 border-dashed" onClick={exportCompleto}>
              <Download className="h-4 w-4" />
              Exportar DRE Completo (CSV)
              {flashCard["completo"] && <span className="ml-2 flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Exportado</span>}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
