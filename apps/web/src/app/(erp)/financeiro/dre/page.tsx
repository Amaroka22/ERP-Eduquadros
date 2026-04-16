"use client";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronRight, SlidersHorizontal, Download, X } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import type { LancamentoReceber, LancamentoPagar } from "@/contexts/AppContext";

const mesesNome = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type MesDRE = {
  mes: number;
  receitas: { vendas: number; servicos: number; outros: number };
  despesas: {
    materiasPrimas: number;
    pessoal: number;
    aluguel: number;
    utilidades: number;
    marketing: number;
    administrativo: number;
  };
};

function computeDRE(
  lancamentosReceber: LancamentoReceber[],
  lancamentosPagar: LancamentoPagar[],
  ano: number,
  clienteFiltro: string,
  fornecedorFiltro: string,
  categoriaReceitaFiltro: string,
  categoriaDespesaFiltro: string,
): MesDRE[] {
  const result: MesDRE[] = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    receitas: { vendas: 0, servicos: 0, outros: 0 },
    despesas: { materiasPrimas: 0, pessoal: 0, aluguel: 0, utilidades: 0, marketing: 0, administrativo: 0 },
  }));

  for (const l of lancamentosReceber) {
    if (clienteFiltro && l.cliente !== clienteFiltro) continue;
    if (categoriaReceitaFiltro && l.categoria !== categoriaReceitaFiltro) continue;
    for (const p of l.parcelas) {
      const d = new Date(p.vencimento + "T12:00:00");
      if (d.getFullYear() !== ano) continue;
      const m = result[d.getMonth()];
      const cat = l.categoria;
      if (cat === "Pedido de Venda") m.receitas.vendas += p.valor;
      else if (cat === "Serviço Prestado") m.receitas.servicos += p.valor;
      else m.receitas.outros += p.valor;
    }
  }

  for (const l of lancamentosPagar) {
    if (fornecedorFiltro && l.fornecedor !== fornecedorFiltro) continue;
    if (categoriaDespesaFiltro && l.categoria !== categoriaDespesaFiltro) continue;
    for (const p of l.parcelas) {
      const d = new Date(p.vencimento + "T12:00:00");
      if (d.getFullYear() !== ano) continue;
      const m = result[d.getMonth()];
      const cat = l.categoria;
      if (cat === "Insumos" || cat === "Matéria-Prima") m.despesas.materiasPrimas += p.valor;
      else if (cat === "Salários") m.despesas.pessoal += p.valor;
      else if (cat === "Aluguel") m.despesas.aluguel += p.valor;
      else if (cat === "Utilidades") m.despesas.utilidades += p.valor;
      else if (cat === "Marketing") m.despesas.marketing += p.valor;
      else m.despesas.administrativo += p.valor;
    }
  }

  return result;
}

function totalReceitas(m: MesDRE) {
  return m.receitas.vendas + m.receitas.servicos + m.receitas.outros;
}

function totalDespesas(m: MesDRE) {
  return (
    m.despesas.materiasPrimas +
    m.despesas.pessoal +
    m.despesas.aluguel +
    m.despesas.utilidades +
    m.despesas.marketing +
    m.despesas.administrativo
  );
}

function lucroMes(m: MesDRE) {
  return totalReceitas(m) - totalDespesas(m);
}

function isRealizado(m: MesDRE) {
  return totalReceitas(m) > 0 || totalDespesas(m) > 0;
}

function fmtVal(val: number, realizado: boolean) {
  if (!realizado) return <span className="text-muted-foreground/40">—</span>;
  if (val === 0) return <span className="text-muted-foreground">-</span>;
  return formatCurrency(val);
}

function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers.join(";"), ...rows.map(r => r.map(c => `"${c}"`).join(";"))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function DREPage() {
  const { lancamentosReceber, lancamentosPagar, nomesClientesAtivos, nomesFornecedoresAtivos } = useApp();
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [modoVisao, setModoVisao] = useState<"mensal" | "acumulado">("mensal");
  const [expandidos, setExpandidos] = useState<string[]>(["receitas", "despesas"]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Filters
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [fornecedorFiltro, setFornecedorFiltro] = useState("");
  const [categoriaReceitaFiltro, setCategoriaReceitaFiltro] = useState("");
  const [categoriaDespesaFiltro, setCategoriaDespesaFiltro] = useState("");

  // Available filter options derived from data
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

  const categoriasReceita = useMemo(() =>
    [...new Set(lancamentosReceber.map(l => l.categoria).filter(Boolean))].sort()
  , [lancamentosReceber]);

  const categoriasDespesa = useMemo(() =>
    [...new Set(lancamentosPagar.map(l => l.categoria).filter(Boolean))].sort()
  , [lancamentosPagar]);

  // Year range: 3 years before + current + 2 ahead
  const anos = useMemo(() => {
    const range: number[] = [];
    for (let y = anoAtual - 3; y <= anoAtual + 2; y++) range.push(y);
    return range;
  }, [anoAtual]);

  const filtrosAtivos = [clienteFiltro, fornecedorFiltro, categoriaReceitaFiltro, categoriaDespesaFiltro].filter(Boolean).length;

  function limparFiltros() {
    setClienteFiltro("");
    setFornecedorFiltro("");
    setCategoriaReceitaFiltro("");
    setCategoriaDespesaFiltro("");
  }

  const dadosMensais = useMemo(
    () => computeDRE(
      lancamentosReceber, lancamentosPagar, anoSelecionado,
      clienteFiltro, fornecedorFiltro, categoriaReceitaFiltro, categoriaDespesaFiltro
    ),
    [lancamentosReceber, lancamentosPagar, anoSelecionado, clienteFiltro, fornecedorFiltro, categoriaReceitaFiltro, categoriaDespesaFiltro]
  );

  const toggleExpandido = (secao: string) => {
    setExpandidos((prev) =>
      prev.includes(secao) ? prev.filter((s) => s !== secao) : [...prev, secao]
    );
  };

  const mesesRealizados = dadosMensais.filter(isRealizado);

  const ytdReceita = mesesRealizados.reduce((acc, m) => acc + totalReceitas(m), 0);
  const ytdDespesa = mesesRealizados.reduce((acc, m) => acc + totalDespesas(m), 0);
  const ytdLucro = ytdReceita - ytdDespesa;
  const ytdMargem = ytdReceita > 0 ? ((ytdLucro / ytdReceita) * 100).toFixed(1) : "0.0";

  const maxBarVal = Math.max(...dadosMensais.map((m) => Math.max(totalReceitas(m), totalDespesas(m))), 1);

  const lucrosPorMes = mesesRealizados.map((m) => ({ mes: m.mes, lucro: lucroMes(m) }));
  const melhorMes = lucrosPorMes.length > 0
    ? lucrosPorMes.reduce((best, cur) => (cur.lucro > best.lucro ? cur : best), lucrosPorMes[0])
    : null;
  const piorMes = lucrosPorMes.length > 0
    ? lucrosPorMes.reduce((worst, cur) => (cur.lucro < worst.lucro ? cur : worst), lucrosPorMes[0])
    : null;
  const mediaLucro = lucrosPorMes.length > 0
    ? lucrosPorMes.reduce((acc, m) => acc + m.lucro, 0) / lucrosPorMes.length
    : 0;

  const colTotais = dadosMensais.map((m) => ({
    mes: m.mes,
    realizado: isRealizado(m),
    vendas: m.receitas.vendas,
    servicos: m.receitas.servicos,
    outros: m.receitas.outros,
    totalReceitas: totalReceitas(m),
    materiasPrimas: m.despesas.materiasPrimas,
    pessoal: m.despesas.pessoal,
    aluguel: m.despesas.aluguel,
    utilidades: m.despesas.utilidades,
    marketing: m.despesas.marketing,
    administrativo: m.despesas.administrativo,
    totalDespesas: totalDespesas(m),
    resultado: lucroMes(m),
    margem: totalReceitas(m) > 0 ? ((lucroMes(m) / totalReceitas(m)) * 100).toFixed(1) : null,
  }));

  const sumField = (field: keyof typeof colTotais[0]) =>
    colTotais.filter((c) => c.realizado).reduce((acc, c) => acc + (Number(c[field]) || 0), 0);

  const receitasExpandido = expandidos.includes("receitas");
  const despesasExpandido = expandidos.includes("despesas");

  function handleExportCSV() {
    const headers = ["Categoria", ...mesesNome, "Total"];
    const rows: (string | number)[][] = [
      ["RECEITAS", ...colTotais.map(c => c.realizado ? c.totalReceitas : ""), sumField("totalReceitas")],
      ["  Pedidos de Venda", ...colTotais.map(c => c.vendas || ""), sumField("vendas")],
      ["  Serviços Prestados", ...colTotais.map(c => c.servicos || ""), sumField("servicos")],
      ["  Outras Receitas", ...colTotais.map(c => c.outros || ""), sumField("outros")],
      ["DESPESAS", ...colTotais.map(c => c.realizado ? c.totalDespesas : ""), sumField("totalDespesas")],
      ["  Matérias-Primas", ...colTotais.map(c => c.materiasPrimas || ""), sumField("materiasPrimas")],
      ["  Pessoal", ...colTotais.map(c => c.pessoal || ""), sumField("pessoal")],
      ["  Aluguel", ...colTotais.map(c => c.aluguel || ""), sumField("aluguel")],
      ["  Utilidades", ...colTotais.map(c => c.utilidades || ""), sumField("utilidades")],
      ["  Marketing", ...colTotais.map(c => c.marketing || ""), sumField("marketing")],
      ["  Administrativo", ...colTotais.map(c => c.administrativo || ""), sumField("administrativo")],
      ["RESULTADO OPERACIONAL", ...colTotais.map(c => c.realizado ? c.resultado : ""), ytdLucro],
      ["MARGEM OPERACIONAL %", ...colTotais.map(c => c.margem ? c.margem + "%" : ""), ytdMargem + "%"],
    ];
    exportCSV(`DRE-${anoSelecionado}.csv`, headers, rows);
  }

  const selectClass = "h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div>
      <Header title="DRE — Demonstrativo de Resultado" subtitle={`Resultado do Exercício ${anoSelecionado}`} />

      <div className="p-6 space-y-6">
        {/* Filter Bar */}
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            {/* Row 1: Year + View mode + Filters toggle + Export */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium shrink-0">Ano:</span>
                <select
                  className={selectClass + " w-24"}
                  value={anoSelecionado}
                  onChange={e => setAnoSelecionado(Number(e.target.value))}
                >
                  {anos.map(ano => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={modoVisao === "mensal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setModoVisao("mensal")}
                  className="h-7 px-3 text-xs"
                >
                  Mensal
                </Button>
                <Button
                  variant={modoVisao === "acumulado" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setModoVisao("acumulado")}
                  className="h-7 px-3 text-xs"
                >
                  Acumulado
                </Button>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-8 gap-1.5 text-xs", mostrarFiltros && "border-primary/60 bg-primary/5 text-primary")}
                  onClick={() => setMostrarFiltros(v => !v)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filtros
                  {filtrosAtivos > 0 && (
                    <Badge className="ml-0.5 h-4 min-w-4 px-1 text-[10px] leading-none">{filtrosAtivos}</Badge>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExportCSV}>
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
              </div>
            </div>

            {/* Row 2: Expandable filter panel */}
            {mostrarFiltros && (
              <div className="pt-2 border-t border-border/50">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Cliente</label>
                    <select
                      className={selectClass + " w-full"}
                      value={clienteFiltro}
                      onChange={e => setClienteFiltro(e.target.value)}
                    >
                      <option value="">Todos os clientes</option>
                      {clientesDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Fornecedor</label>
                    <select
                      className={selectClass + " w-full"}
                      value={fornecedorFiltro}
                      onChange={e => setFornecedorFiltro(e.target.value)}
                    >
                      <option value="">Todos os fornecedores</option>
                      {fornecedoresDisponiveis.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Categ. Receita</label>
                    <select
                      className={selectClass + " w-full"}
                      value={categoriaReceitaFiltro}
                      onChange={e => setCategoriaReceitaFiltro(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {categoriasReceita.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Categ. Despesa</label>
                    <select
                      className={selectClass + " w-full"}
                      value={categoriaDespesaFiltro}
                      onChange={e => setCategoriaDespesaFiltro(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {categoriasDespesa.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {filtrosAtivos > 0 && (
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/40">
                    <div className="flex flex-wrap gap-1.5">
                      {clienteFiltro && (
                        <Badge variant="secondary" className="text-xs gap-1 pr-1">
                          Cliente: {clienteFiltro}
                          <button onClick={() => setClienteFiltro("")} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                        </Badge>
                      )}
                      {fornecedorFiltro && (
                        <Badge variant="secondary" className="text-xs gap-1 pr-1">
                          Fornecedor: {fornecedorFiltro}
                          <button onClick={() => setFornecedorFiltro("")} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                        </Badge>
                      )}
                      {categoriaReceitaFiltro && (
                        <Badge variant="secondary" className="text-xs gap-1 pr-1">
                          Receita: {categoriaReceitaFiltro}
                          <button onClick={() => setCategoriaReceitaFiltro("")} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                        </Badge>
                      )}
                      {categoriaDespesaFiltro && (
                        <Badge variant="secondary" className="text-xs gap-1 pr-1">
                          Despesa: {categoriaDespesaFiltro}
                          <button onClick={() => setCategoriaDespesaFiltro("")} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground ml-auto" onClick={limparFiltros}>
                      Limpar tudo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receita Total</p>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(ytdReceita)}</p>
              <p className="text-xs text-muted-foreground mt-1">Acumulado {anoSelecionado}</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Despesa Total</p>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(ytdDespesa)}</p>
              <p className="text-xs text-muted-foreground mt-1">Acumulado {anoSelecionado}</p>
            </CardContent>
          </Card>

          <Card className={cn("border-2", ytdLucro >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className={cn("h-4 w-4", ytdLucro >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")} />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lucro Líquido</p>
              </div>
              <p className={cn("text-2xl font-bold", ytdLucro >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                {ytdLucro >= 0 ? "+" : ""}{formatCurrency(ytdLucro)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Acumulado {anoSelecionado}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">%</Badge>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Margem</p>
              </div>
              <p className={cn("text-2xl font-bold", Number(ytdMargem) >= 20 ? "text-emerald-600 dark:text-emerald-400" : Number(ytdMargem) >= 10 ? "text-amber-500" : "text-red-500")}>
                {ytdMargem}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Margem operacional</p>
            </CardContent>
          </Card>
        </div>

        {/* Mini bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Comparativo Mensal {anoSelecionado}
              {filtrosAtivos > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5">filtrado</Badge>
              )}
              <div className="flex items-center gap-3 ml-auto text-xs font-normal text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />Receita</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400" />Despesa</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-end gap-1.5 h-28">
              {dadosMensais.map((m, i) => {
                const rec = totalReceitas(m);
                const desp = totalDespesas(m);
                const recH = maxBarVal > 0 ? Math.max((rec / maxBarVal) * 88, rec > 0 ? 4 : 0) : 0;
                const despH = maxBarVal > 0 ? Math.max((desp / maxBarVal) * 88, desp > 0 ? 4 : 0) : 0;
                const realiz = isRealizado(m);
                return (
                  <div key={m.mes} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="flex items-end gap-0.5 h-24 w-full justify-center">
                      <div className={cn("flex-1 rounded-t-sm transition-all", realiz ? "bg-emerald-500" : "bg-muted/40")} style={{ height: `${recH}px` }} />
                      <div className={cn("flex-1 rounded-t-sm transition-all", realiz ? "bg-red-400" : "bg-muted/30")} style={{ height: `${despH}px` }} />
                    </div>
                    <span className={cn("text-[10px] leading-none", realiz ? "text-muted-foreground" : "text-muted-foreground/40")}>
                      {mesesNome[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Empty state */}
        {mesesRealizados.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {filtrosAtivos > 0 ? "Nenhum lançamento encontrado com esses filtros" : `Nenhum lançamento em ${anoSelecionado}`}
              </p>
              {filtrosAtivos > 0 ? (
                <Button variant="link" size="sm" className="mt-2 text-xs h-7" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Adicione lançamentos em Contas a Receber e a Pagar para gerar o DRE.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detailed DRE Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Demonstrativo Detalhado — {anoSelecionado}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="sticky left-0 bg-muted/40 z-10 px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-52">Categoria</th>
                    {mesesNome.map((nome, i) => (
                      <th key={i} className={cn("px-2 py-2.5 text-right text-xs font-semibold", colTotais[i].realizado ? "text-foreground" : "text-muted-foreground/60")}>
                        {nome}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-foreground bg-muted/60">Total</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border/50">
                  {/* RECEITAS */}
                  <tr className="cursor-pointer bg-emerald-500/8 hover:bg-emerald-500/12 transition-colors" onClick={() => toggleExpandido("receitas")}>
                    <td className="sticky left-0 bg-emerald-500/8 z-10 px-4 py-2.5 font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      {receitasExpandido ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      Receitas
                    </td>
                    {colTotais.map((c) => (
                      <td key={c.mes} className={cn("px-2 py-2.5 text-right font-medium", c.realizado ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/30")}>
                        {c.realizado ? formatCurrency(c.totalReceitas) : "—"}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-muted/30">{formatCurrency(sumField("totalReceitas"))}</td>
                  </tr>
                  {receitasExpandido && (
                    <>
                      {[
                        { key: "vendas" as const, label: "Pedidos de Venda" },
                        { key: "servicos" as const, label: "Serviços Prestados" },
                        { key: "outros" as const, label: "Outras Receitas" },
                      ].map(({ key, label }, idx) => (
                        <tr key={key} className={cn("hover:bg-muted/20 transition-colors", idx % 2 === 0 ? "bg-muted/10" : "bg-muted/5")}>
                          <td className={cn("sticky left-0 z-10 px-4 py-2 pl-9 text-muted-foreground", idx % 2 === 0 ? "bg-muted/10" : "bg-muted/5")}>{label}</td>
                          {colTotais.map((c) => (
                            <td key={c.mes} className="px-2 py-2 text-right text-muted-foreground">{fmtVal(c[key], c.realizado)}</td>
                          ))}
                          <td className="px-3 py-2 text-right text-muted-foreground bg-muted/30">{formatCurrency(sumField(key))}</td>
                        </tr>
                      ))}
                      <tr className="bg-emerald-500/5 border-t border-emerald-500/20">
                        <td className="sticky left-0 bg-emerald-500/5 z-10 px-4 py-2.5 pl-6 font-bold text-emerald-700 dark:text-emerald-400 uppercase text-[11px] tracking-wide">Total Receitas</td>
                        {colTotais.map((c) => (
                          <td key={c.mes} className={cn("px-2 py-2.5 text-right font-bold", c.realizado ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/30")}>
                            {c.realizado ? formatCurrency(c.totalReceitas) : "—"}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-muted/30">{formatCurrency(sumField("totalReceitas"))}</td>
                      </tr>
                    </>
                  )}

                  {/* DESPESAS */}
                  <tr className="cursor-pointer bg-red-500/8 hover:bg-red-500/12 transition-colors" onClick={() => toggleExpandido("despesas")}>
                    <td className="sticky left-0 bg-red-500/8 z-10 px-4 py-2.5 font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      {despesasExpandido ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      Despesas
                    </td>
                    {colTotais.map((c) => (
                      <td key={c.mes} className={cn("px-2 py-2.5 text-right font-medium", c.realizado ? "text-red-500 dark:text-red-400" : "text-muted-foreground/30")}>
                        {c.realizado ? formatCurrency(c.totalDespesas) : "—"}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right font-bold text-red-500 dark:text-red-400 bg-muted/30">{formatCurrency(sumField("totalDespesas"))}</td>
                  </tr>
                  {despesasExpandido && (
                    <>
                      {[
                        { key: "materiasPrimas" as const, label: "Matérias-Primas e Insumos" },
                        { key: "pessoal" as const, label: "Pessoal (Salários e Encargos)" },
                        { key: "aluguel" as const, label: "Aluguel" },
                        { key: "utilidades" as const, label: "Utilidades (Energia, Água)" },
                        { key: "marketing" as const, label: "Marketing" },
                        { key: "administrativo" as const, label: "Administrativo / Outros" },
                      ].map(({ key, label }, idx) => (
                        <tr key={key} className={cn("hover:bg-muted/20 transition-colors", idx % 2 === 0 ? "bg-muted/10" : "bg-muted/5")}>
                          <td className={cn("sticky left-0 z-10 px-4 py-2 pl-9 text-muted-foreground", idx % 2 === 0 ? "bg-muted/10" : "bg-muted/5")}>{label}</td>
                          {colTotais.map((c) => (
                            <td key={c.mes} className="px-2 py-2 text-right text-muted-foreground">{fmtVal(c[key], c.realizado)}</td>
                          ))}
                          <td className="px-3 py-2 text-right text-muted-foreground bg-muted/30">{formatCurrency(sumField(key))}</td>
                        </tr>
                      ))}
                      <tr className="bg-red-500/5 border-t border-red-500/20">
                        <td className="sticky left-0 bg-red-500/5 z-10 px-4 py-2.5 pl-6 font-bold text-red-700 dark:text-red-400 uppercase text-[11px] tracking-wide">Total Despesas</td>
                        {colTotais.map((c) => (
                          <td key={c.mes} className={cn("px-2 py-2.5 text-right font-bold", c.realizado ? "text-red-500 dark:text-red-400" : "text-muted-foreground/30")}>
                            {c.realizado ? formatCurrency(c.totalDespesas) : "—"}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-bold text-red-500 dark:text-red-400 bg-muted/30">{formatCurrency(sumField("totalDespesas"))}</td>
                      </tr>
                    </>
                  )}

                  {/* RESULTADO */}
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="sticky left-0 bg-muted/30 z-10 px-4 py-3 font-bold text-foreground uppercase text-[11px] tracking-wide">Resultado Operacional</td>
                    {colTotais.map((c) => (
                      <td key={c.mes} className={cn("px-2 py-3 text-right font-bold", !c.realizado ? "text-muted-foreground/30" : c.resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                        {c.realizado ? (c.resultado >= 0 ? "+" : "") + formatCurrency(c.resultado) : "—"}
                      </td>
                    ))}
                    <td className={cn("px-3 py-3 text-right font-bold bg-muted/40", ytdLucro >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                      {ytdLucro >= 0 ? "+" : ""}{formatCurrency(ytdLucro)}
                    </td>
                  </tr>

                  {/* MARGEM */}
                  <tr className="bg-muted/20">
                    <td className="sticky left-0 bg-muted/20 z-10 px-4 py-2.5 font-semibold text-muted-foreground uppercase text-[11px] tracking-wide">Margem Operacional</td>
                    {colTotais.map((c) => (
                      <td key={c.mes} className={cn("px-2 py-2.5 text-right font-semibold", !c.realizado ? "text-muted-foreground/30" : c.margem && Number(c.margem) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                        {c.realizado && c.margem ? `${c.margem}%` : "—"}
                      </td>
                    ))}
                    <td className={cn("px-3 py-2.5 text-right font-bold bg-muted/30", Number(ytdMargem) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                      {ytdMargem}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer Stats */}
        {lucrosPorMes.length > 0 && melhorMes && piorMes && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-emerald-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Melhor Mês</p>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/40 text-[10px]">{mesesNome[melhorMes.mes - 1]}</Badge>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(melhorMes.lucro)}</p>
                <p className="text-xs text-muted-foreground mt-1">Maior resultado do período</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pior Mês</p>
                  <Badge variant="outline" className="text-red-500 border-red-500/40 text-[10px]">{mesesNome[piorMes.mes - 1]}</Badge>
                </div>
                <p className={cn("text-xl font-bold", piorMes.lucro >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                  {piorMes.lucro >= 0 ? "+" : ""}{formatCurrency(piorMes.lucro)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Menor resultado do período</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Média Mensal</p>
                  <Badge variant="outline" className="text-[10px]">{lucrosPorMes.length} meses</Badge>
                </div>
                <p className={cn("text-xl font-bold", mediaLucro >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                  {mediaLucro >= 0 ? "+" : ""}{formatCurrency(mediaLucro)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Média dos meses realizados</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
