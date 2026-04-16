"use client";
import { useState, useMemo } from "react";
import { Plus, Pencil, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import type { CentroCusto, TipoCentroCusto } from "@/contexts/AppContext";

const emptyForm: Omit<CentroCusto, "id"> = {
  codigo: "",
  nome: "",
  tipo: "despesa",
  descricao: "",
  ativo: true,
  orcamento: 0,
};

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 rounded-full bg-muted">
      <div
        className="h-1.5 rounded-full"
        style={{
          width: `${Math.min(pct, 100)}%`,
          backgroundColor: pct > 100 ? "#ef4444" : pct > 80 ? "#eab308" : "#22c55e",
        }}
      />
    </div>
  );
}

function CentroTable({
  centros,
  realizados,
  onEdit,
}: {
  centros: CentroCusto[];
  realizados: Record<number, number>;
  onEdit: (c: CentroCusto) => void;
}) {
  if (centros.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="pb-2 text-left font-medium w-28">Código</th>
            <th className="pb-2 text-left font-medium">Nome</th>
            <th className="pb-2 text-right font-medium w-32">Orçamento</th>
            <th className="pb-2 text-right font-medium w-32">Realizado</th>
            <th className="pb-2 text-left font-medium w-40 pl-4">Execução</th>
            <th className="pb-2 text-center font-medium w-24">Status</th>
            <th className="pb-2 text-right font-medium w-16">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {centros.map((c) => {
            const realizado = realizados[c.id] ?? 0;
            const pct = c.orcamento > 0 ? (realizado / c.orcamento) * 100 : 0;
            return (
              <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                <td className="py-3 pr-2">
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{c.codigo}</span>
                </td>
                <td className="py-3 pr-2">
                  <div className="font-medium text-foreground">{c.nome}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{c.descricao}</div>
                </td>
                <td className="py-3 text-right tabular-nums pr-2">{formatCurrency(c.orcamento)}</td>
                <td className="py-3 text-right tabular-nums pr-2">
                  <span className={cn("font-medium", pct > 100 ? "text-destructive" : pct > 80 ? "text-yellow-600" : "text-foreground")}>
                    {formatCurrency(realizado)}
                  </span>
                </td>
                <td className="py-3 pl-4 pr-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar pct={pct} />
                  </div>
                </td>
                <td className="py-3 text-center">
                  <Badge variant={c.ativo ? "default" : "secondary"} className="text-xs">
                    {c.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="py-3 text-right">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CentrosCustoPage() {
  const { centrosCusto, setCentrosCusto, lancamentosReceber, lancamentosPagar } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CentroCusto | null>(null);
  const [form, setForm] = useState<Omit<CentroCusto, "id">>(emptyForm);

  // Compute realized values from lançamentos by matching centro.nome === lancamento.categoria (case-insensitive)
  const realizados = useMemo(() => {
    const map: Record<number, number> = {};
    for (const centro of centrosCusto) {
      const nomeNorm = centro.nome.toLowerCase().trim();
      let total = 0;
      if (centro.tipo === "receita" || centro.tipo === "ambos") {
        for (const l of lancamentosReceber) {
          if (l.categoria.toLowerCase().trim() === nomeNorm) {
            total += l.parcelas.reduce((s, p) => s + p.valor, 0);
          }
        }
      }
      if (centro.tipo === "despesa" || centro.tipo === "ambos") {
        for (const l of lancamentosPagar) {
          if (l.categoria.toLowerCase().trim() === nomeNorm) {
            total += l.parcelas.reduce((s, p) => s + p.valor, 0);
          }
        }
      }
      map[centro.id] = total;
    }
    return map;
  }, [centrosCusto, lancamentosReceber, lancamentosPagar]);

  const receitas = useMemo(() => centrosCusto.filter((c) => c.tipo === "receita"), [centrosCusto]);
  const despesas = useMemo(() => centrosCusto.filter((c) => c.tipo === "despesa"), [centrosCusto]);
  const ambos = useMemo(() => centrosCusto.filter((c) => c.tipo === "ambos"), [centrosCusto]);

  const totalReceitas = useMemo(() => receitas.reduce((acc, c) => acc + (realizados[c.id] ?? 0), 0), [receitas, realizados]);
  const totalDespesas = useMemo(() => despesas.reduce((acc, c) => acc + (realizados[c.id] ?? 0), 0), [despesas, realizados]);
  const resultado = totalReceitas - totalDespesas;

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: suggestCodigo("despesa") });
    setModalOpen(true);
  }

  function openEdit(c: CentroCusto) {
    setEditing(c);
    const { id, ...rest } = c;
    setForm(rest);
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.codigo.trim() || !form.nome.trim()) return;
    if (editing) {
      setCentrosCusto((prev) => prev.map((c) => (c.id === editing.id ? { ...form, id: editing.id } : c)));
    } else {
      const newId = centrosCusto.length > 0 ? Math.max(...centrosCusto.map((c) => c.id)) + 1 : 1;
      setCentrosCusto((prev) => [...prev, { ...form, id: newId }]);
    }
    setModalOpen(false);
  }

  function suggestCodigo(tipo: TipoCentroCusto) {
    const prefix = tipo === "receita" ? "REC" : tipo === "despesa" ? "DES" : "ADM";
    const existing = centrosCusto
      .filter((c) => c.codigo.startsWith(prefix))
      .map((c) => parseInt(c.codigo.split("-")[1] || "0", 10))
      .filter((n) => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `${prefix}-${String(next).padStart(3, "0")}`;
  }

  function handleTipoChange(tipo: TipoCentroCusto) {
    setForm((prev) => ({ ...prev, tipo, codigo: suggestCodigo(tipo) }));
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header title="Centro de Custo" subtitle="Orçamento e controle por área" />

      <main className="flex-1 p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas Realizadas</p>
                  <p className="text-2xl font-bold text-green-600 tabular-nums">{formatCurrency(totalReceitas)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas Realizadas</p>
                  <p className="text-2xl font-bold text-destructive tabular-nums">{formatCurrency(totalDespesas)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resultado do Período</p>
                  <p className={cn("text-2xl font-bold tabular-nums", resultado >= 0 ? "text-primary" : "text-destructive")}>
                    {resultado >= 0 ? "+" : ""}{formatCurrency(resultado)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Centro
          </Button>
        </div>

        {centrosCusto.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum centro de custo cadastrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crie centros com o mesmo nome das categorias de lançamentos para visualizar os valores realizados automaticamente.
              </p>
            </CardContent>
          </Card>
        )}

        {receitas.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Centros de Receita
                <Badge variant="secondary" className="ml-auto">{receitas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CentroTable centros={receitas} realizados={realizados} onEdit={openEdit} />
            </CardContent>
          </Card>
        )}

        {despesas.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Centros de Despesa
                <Badge variant="secondary" className="ml-auto">{despesas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CentroTable centros={despesas} realizados={realizados} onEdit={openEdit} />
            </CardContent>
          </Card>
        )}

        {ambos.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                Centros Mistos
                <Badge variant="secondary" className="ml-auto">{ambos.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CentroTable centros={ambos} realizados={realizados} onEdit={openEdit} />
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Centro de Custo" : "Novo Centro de Custo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  value={form.tipo}
                  onChange={(e) => handleTipoChange(e.target.value as TipoCentroCusto)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="codigo">Código</Label>
                <Input id="codigo" value={form.codigo} onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))} placeholder="Ex: DES-001" className="font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))} placeholder="Use o mesmo nome da categoria para vincular automaticamente" />
              <p className="text-xs text-muted-foreground">Use o mesmo nome da categoria dos lançamentos para calcular o realizado automaticamente.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o propósito deste centro de custo"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orcamento">Orçamento Mensal (R$)</Label>
              <Input
                id="orcamento"
                type="number"
                min={0}
                step={100}
                value={form.orcamento}
                onChange={(e) => setForm((prev) => ({ ...prev, orcamento: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ativo"
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm((prev) => ({ ...prev, ativo: e.target.checked }))}
                className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
              />
              <Label htmlFor="ativo" className="cursor-pointer font-normal">Centro ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.codigo.trim() || !form.nome.trim()}>
              {editing ? "Salvar Alterações" : "Criar Centro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
