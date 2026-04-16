"use client";
import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownLeft,
  Download, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

const MESES_NOME = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

type Tipo = "entrada" | "saida";
type Status = "realizado" | "previsto";
type Lancamento = {
  id: number; data: string; descricao: string;
  tipo: Tipo; valor: number; categoria: string;
  status: Status; contaBancaria: string;
};

function formatDataHeader(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return `${String(d.getDate()).padStart(2,"0")} de ${MESES_NOME[d.getMonth()]}, ${DIAS_SEMANA[d.getDay()]}`;
}

function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers.join(";"), ...rows.map(r => r.map(c => `"${c}"`).join(";"))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function FluxoCaixaPage() {
  const { lancamentosReceber, lancamentosPagar, contasBancarias, nomesContasAtivas } = useApp();

  const hoje = new Date();
  const [mes, setMes]   = useState(hoje.getMonth());
  const [ano, setAno]   = useState(hoje.getFullYear());

  // Filtros
  const [contaFiltro,     setContaFiltro]     = useState("Todas");
  const [tipoFiltro,      setTipoFiltro]      = useState<"todos" | "entrada" | "saida">("todos");
  const [statusFiltro,    setStatusFiltro]    = useState<"todos" | "realizado" | "previsto">("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [busca,           setBusca]           = useState("");
  const [mostrarFiltros,  setMostrarFiltros]  = useState(false);

  function navMes(delta: number) {
    setMes(m => {
      const n = m + delta;
      if (n < 0)  { setAno(a => a - 1); return 11; }
      if (n > 11) { setAno(a => a + 1); return 0; }
      return n;
    });
  }

  function irParaHoje() {
    setMes(hoje.getMonth());
    setAno(hoje.getFullYear());
  }

  const eHoje = mes === hoje.getMonth() && ano === hoje.getFullYear();

  // Todos os lançamentos (todas as contas, todos os meses)
  const todosLancamentos = useMemo<Lancamento[]>(() => {
    const items: Lancamento[] = [];
    for (const l of lancamentosReceber) {
      for (const p of l.parcelas) {
        const data = p.status === "recebido" && p.dataBaixa ? p.dataBaixa : p.vencimento;
        items.push({
          id: l.id * 10000 + p.num, data,
          descricao: l.parcelas.length > 1 ? `${l.descricao} (${p.num}/${p.total})` : l.descricao,
          tipo: "entrada",
          valor: p.status === "recebido" && p.valorRecebido ? p.valorRecebido : p.valor,
          categoria: l.categoria,
          status: p.status === "recebido" ? "realizado" : "previsto",
          contaBancaria: l.contaBancaria,
        });
      }
    }
    for (const l of lancamentosPagar) {
      for (const p of l.parcelas) {
        const data = p.status === "pago" && p.dataPagamento ? p.dataPagamento : p.vencimento;
        items.push({
          id: (l.id + 100000) * 10000 + p.num, data,
          descricao: l.parcelas.length > 1 ? `${l.descricao} (${p.num}/${p.total})` : l.descricao,
          tipo: "saida",
          valor: p.status === "pago" && p.valorPago ? p.valorPago : p.valor,
          categoria: l.categoria,
          status: p.status === "pago" ? "realizado" : "previsto",
          contaBancaria: l.contaBancaria,
        });
      }
    }
    return items;
  }, [lancamentosReceber, lancamentosPagar]);

  // Categorias únicas disponíveis no mês/conta selecionados (para o dropdown)
  const categoriasDoMes = useMemo(() => {
    const set = new Set<string>();
    for (const l of todosLancamentos) {
      const d = new Date(l.data + "T12:00:00");
      if (d.getMonth() !== mes || d.getFullYear() !== ano) continue;
      if (contaFiltro !== "Todas" && l.contaBancaria !== contaFiltro) continue;
      if (l.categoria) set.add(l.categoria);
    }
    return [...set].sort();
  }, [todosLancamentos, mes, ano, contaFiltro]);

  const saldoAtual = useMemo(
    () => contasBancarias.filter(c => c.ativa).reduce((s, c) => s + c.saldo, 0),
    [contasBancarias]
  );

  // Lançamentos filtrados (com todos os filtros aplicados)
  const lancamentosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    return todosLancamentos
      .filter(l => {
        const d = new Date(l.data + "T12:00:00");
        if (d.getMonth() !== mes || d.getFullYear() !== ano) return false;
        if (contaFiltro !== "Todas" && l.contaBancaria !== contaFiltro) return false;
        if (tipoFiltro !== "todos" && l.tipo !== tipoFiltro) return false;
        if (statusFiltro !== "todos" && l.status !== statusFiltro) return false;
        if (categoriaFiltro && l.categoria !== categoriaFiltro) return false;
        if (q && !l.descricao.toLowerCase().includes(q) && !l.categoria.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [todosLancamentos, mes, ano, contaFiltro, tipoFiltro, statusFiltro, categoriaFiltro, busca]);

  const totalEntradas = useMemo(() => lancamentosFiltrados.filter(l => l.tipo === "entrada").reduce((s,l) => s+l.valor, 0), [lancamentosFiltrados]);
  const totalSaidas   = useMemo(() => lancamentosFiltrados.filter(l => l.tipo === "saida").reduce((s,l)   => s+l.valor, 0), [lancamentosFiltrados]);

  const saldoInicial = useMemo(() => {
    const realizadosNoMes = todosLancamentos.filter(l => {
      const d = new Date(l.data + "T12:00:00");
      return l.status === "realizado" && d.getMonth() === mes && d.getFullYear() === ano;
    });
    const entRe = realizadosNoMes.filter(l => l.tipo === "entrada").reduce((s,l) => s+l.valor, 0);
    const saiRe = realizadosNoMes.filter(l => l.tipo === "saida").reduce((s,l)   => s+l.valor, 0);
    return saldoAtual - entRe + saiRe;
  }, [todosLancamentos, mes, ano, saldoAtual]);

  const saldoProjetado = saldoInicial + totalEntradas - totalSaidas;

  const porData = useMemo(() => {
    const map: Record<string, Lancamento[]> = {};
    for (const l of lancamentosFiltrados) {
      if (!map[l.data]) map[l.data] = [];
      map[l.data].push(l);
    }
    return map;
  }, [lancamentosFiltrados]);

  const datas = Object.keys(porData).sort();

  const runningBalances = useMemo(() => {
    const result: Record<number, number> = {};
    let acum = saldoInicial;
    for (const data of datas) {
      for (const l of porData[data]) {
        acum += l.tipo === "entrada" ? l.valor : -l.valor;
        result[l.id] = acum;
      }
    }
    return result;
  }, [datas, porData, saldoInicial]);

  const filtrosAtivos = [
    tipoFiltro !== "todos",
    statusFiltro !== "todos",
    !!categoriaFiltro,
    !!busca,
  ].filter(Boolean).length;

  function limparFiltros() {
    setTipoFiltro("todos"); setStatusFiltro("todos");
    setCategoriaFiltro(""); setBusca("");
  }

  function handleExportar() {
    exportCSV(
      `FluxoCaixa_${MESES_NOME[mes]}_${ano}.csv`,
      ["Data","Descrição","Tipo","Categoria","Conta","Status","Valor"],
      lancamentosFiltrados.map(l => [
        l.data, l.descricao,
        l.tipo === "entrada" ? "Entrada" : "Saída",
        l.categoria, l.contaBancaria,
        l.status === "realizado" ? "Realizado" : "Previsto",
        l.valor.toFixed(2),
      ])
    );
  }

  return (
    <div>
      <Header title="Fluxo de Caixa" subtitle="Projeção e movimentação financeira" />

      <div className="p-6 space-y-5">

        {/* ── Barra principal: mês + contas ── */}
        <Card>
          <CardContent className="py-4 space-y-4">
            {/* Linha 1: navegação de mês + botão hoje + exportar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navMes(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[150px] text-center text-sm font-semibold">
                  {MESES_NOME[mes]} {ano}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navMes(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {!eHoje && (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={irParaHoje}>
                  <Calendar className="h-3.5 w-3.5" /> Hoje
                </Button>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant={mostrarFiltros ? "secondary" : "outline"}
                  size="sm" className="h-8 gap-1.5"
                  onClick={() => setMostrarFiltros(v => !v)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filtros
                  {filtrosAtivos > 0 && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                      {filtrosAtivos}
                    </span>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleExportar}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </div>
            </div>

            {/* Linha 2: filtro por conta */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground font-medium mr-1">Conta:</span>
              {["Todas", ...nomesContasAtivas].map(conta => (
                <button key={conta} onClick={() => setContaFiltro(conta)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md border font-medium transition-colors",
                    contaFiltro === conta
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                  {conta}
                </button>
              ))}
            </div>

            {/* Linha 3: filtros expandíveis */}
            {mostrarFiltros && (
              <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-dashed border-border">

                {/* Busca */}
                <div className="space-y-1 min-w-[200px]">
                  <Label className="text-xs text-muted-foreground">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Descrição ou categoria..."
                      className="h-8 pl-8 text-sm"
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tipo */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <div className="flex gap-1 p-0.5 rounded-lg bg-muted">
                    {([["todos","Todos"],["entrada","Entradas"],["saida","Saídas"]] as const).map(([v,l]) => (
                      <button key={v} onClick={() => setTipoFiltro(v as typeof tipoFiltro)}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
                          tipoFiltro === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="flex gap-1 p-0.5 rounded-lg bg-muted">
                    {([["todos","Todos"],["realizado","Realizado"],["previsto","Previsto"]] as const).map(([v,l]) => (
                      <button key={v} onClick={() => setStatusFiltro(v as typeof statusFiltro)}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
                          statusFiltro === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categoria */}
                <div className="space-y-1 min-w-[180px]">
                  <Label className="text-xs text-muted-foreground">Categoria</Label>
                  <select
                    value={categoriaFiltro}
                    onChange={e => setCategoriaFiltro(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Todas as categorias</option>
                    {categoriasDoMes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {filtrosAtivos > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-destructive" onClick={limparFiltros}>
                    <X className="h-3.5 w-3.5" /> Limpar
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo Inicial</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(saldoInicial)}</p>
              <p className="text-xs text-muted-foreground mt-1">Início de {MESES_NOME[mes]}</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entradas</p>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalEntradas)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lancamentosFiltrados.filter(l => l.tipo === "entrada").length} lançamentos
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saídas</p>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalSaidas)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lancamentosFiltrados.filter(l => l.tipo === "saida").length} lançamentos
              </p>
            </CardContent>
          </Card>

          <Card className={cn("border-2", saldoProjetado >= 0 ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                {saldoProjetado >= 0
                  ? <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo Projetado</p>
              </div>
              <p className={cn("text-2xl font-extrabold", saldoProjetado >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                {saldoProjetado >= 0 ? "+" : ""}{formatCurrency(saldoProjetado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Final de {MESES_NOME[mes]}</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabela ── */}
        {lancamentosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {filtrosAtivos > 0
                  ? "Nenhum lançamento com os filtros aplicados"
                  : `Nenhum lançamento para ${MESES_NOME[mes]} ${ano}`}
              </p>
              {filtrosAtivos > 0 && (
                <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={limparFiltros}>
                  <X className="h-3.5 w-3.5" /> Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Lançamentos — {MESES_NOME[mes]} {ano}</h3>
              <span className="text-xs text-muted-foreground">
                ({lancamentosFiltrados.length} {lancamentosFiltrados.length === 1 ? "lançamento" : "lançamentos"})
              </span>
              {filtrosAtivos > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  {filtrosAtivos} filtro{filtrosAtivos > 1 ? "s" : ""} ativo{filtrosAtivos > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-8" />
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Categoria</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Conta</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datas.map(data => {
                      const itens = porData[data];
                      const entDia = itens.filter(l => l.tipo === "entrada").reduce((s,l) => s+l.valor, 0);
                      const saiDia = itens.filter(l => l.tipo === "saida").reduce((s,l)   => s+l.valor, 0);
                      const netDia = entDia - saiDia;
                      return [
                        <tr key={`h-${data}`} className="bg-muted/60 border-t border-b border-border">
                          <td colSpan={3} className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-bold">{formatDataHeader(data)}</span>
                            </div>
                          </td>
                          <td className="hidden md:table-cell" /><td className="hidden sm:table-cell" />
                          <td className="px-4 py-2 text-right">
                            <span className={cn("text-xs font-bold", netDia >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                              {netDia >= 0 ? "+" : ""}{formatCurrency(netDia)}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell" />
                        </tr>,
                        ...itens.map(l => {
                          const isEntrada = l.tipo === "entrada";
                          const saldoAcum = runningBalances[l.id];
                          return (
                            <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 text-center">
                                {isEntrada
                                  ? <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400 inline-block" />
                                  : <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400 inline-block" />}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-medium">{l.descricao}</span>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <Badge variant="outline" className="text-xs">{l.categoria}</Badge>
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className="text-xs text-muted-foreground">{l.contaBancaria}</span>
                              </td>
                              <td className="px-4 py-3 text-center hidden sm:table-cell">
                                {l.status === "realizado"
                                  ? <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600 text-white">Realizado</Badge>
                                  : <Badge variant="outline" className="text-xs text-muted-foreground">Previsto</Badge>}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={cn("font-semibold tabular-nums", isEntrada ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                  {isEntrada ? "+" : "-"}{formatCurrency(l.valor)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right hidden lg:table-cell">
                                <span className={cn("text-xs font-semibold tabular-nums", saldoAcum >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                                  {formatCurrency(saldoAcum)}
                                </span>
                              </td>
                            </tr>
                          );
                        }),
                      ];
                    })}
                    <tr className="bg-muted/60 border-t-2 border-border">
                      <td colSpan={5} className="px-4 py-3">
                        <span className="text-sm font-bold">Saldo Projetado — Final de {MESES_NOME[mes]}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("text-sm font-extrabold tabular-nums", saldoProjetado >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                          {saldoProjetado >= 0 ? "+" : ""}{formatCurrency(saldoProjetado)}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
