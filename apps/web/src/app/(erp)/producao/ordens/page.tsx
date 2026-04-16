"use client";

import { useState } from "react";
import { Plus, Search, Clock, CheckCircle2, AlertCircle, PlayCircle, Frame, Calendar } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Ordem = {
  id: string;
  pedido: string;
  cliente: string;
  arte: string;
  quadro: string;
  qtdPrevista: number;
  qtdProduzida: number;
  status: string;
  prioridade: number;
  previsaoFim: string;
};

const ordensIniciais: Ordem[] = [
  { id: "OP-0023", pedido: "PED-0041", cliente: "Confecção Brasil",  arte: "Logo Verão 2026",   quadro: "QD-0014", qtdPrevista: 5000, qtdProduzida: 2100, status: "em_producao",       prioridade: 1, previsaoFim: "2026-04-16" },
  { id: "OP-0022", pedido: "PED-0040", cliente: "Marca Ativa",       arte: "Coleção Surf",      quadro: "QD-0009", qtdPrevista: 3000, qtdProduzida:    0, status: "aguardando_producao", prioridade: 2, previsaoFim: "2026-04-17" },
  { id: "OP-0021", pedido: "PED-0038", cliente: "Fashion Store",     arte: "Estampa Floral",    quadro: "QD-0022", qtdPrevista: 1200, qtdProduzida:    0, status: "em_gravacao",        prioridade: 1, previsaoFim: "2026-04-15" },
  { id: "OP-0020", pedido: "PED-0037", cliente: "Roupas & Cia",      arte: "Logo Básico",       quadro: "QD-0007", qtdPrevista: 4000, qtdProduzida: 4000, status: "concluida",          prioridade: 0, previsaoFim: "2026-04-14" },
  { id: "OP-0019", pedido: "PED-0036", cliente: "Magazine Têxtil",   arte: "Coleção Outono",    quadro: "QD-0003", qtdPrevista: 8000, qtdProduzida: 8000, status: "concluida",          prioridade: 0, previsaoFim: "2026-04-12" },
];

const pedidosDisponiveis = ["PED-0041","PED-0040","PED-0039","PED-0038","PED-0037"];
const clientes           = ["Confecção Brasil","Marca Ativa","Magazine Têxtil","Fashion Store","Roupas & Cia"];
const quadrosDisponiveis = ["QD-0014","QD-0022","QD-0009","QD-0007","QD-0003"];

const statusConfig: Record<string, { label: string; variant: "secondary" | "info" | "success" | "destructive" | "warning" | "outline"; icon: React.ElementType; color: string }> = {
  aguardando:          { label: "Aguardando",    variant: "secondary", icon: Clock,        color: "text-muted-foreground" },
  em_gravacao:         { label: "Em Gravação",   variant: "warning",   icon: Frame,        color: "text-warning"          },
  aguardando_producao: { label: "Ag. Produção",  variant: "info",      icon: Clock,        color: "text-primary"          },
  em_producao:         { label: "Em Produção",   variant: "info",      icon: PlayCircle,   color: "text-primary"          },
  concluida:           { label: "Concluída",     variant: "success",   icon: CheckCircle2, color: "text-success"          },
  cancelada:           { label: "Cancelada",     variant: "destructive",icon: AlertCircle, color: "text-destructive"      },
};

const emptyForm = { pedido: "", cliente: "", arte: "", quadro: "", qtdPrevista: "", previsaoFim: "", prioridade: "0" };
const emptyAtualizacao = { qtdProduzida: "" };

export default function OrdensProducaoPage() {
  const [ordens, setOrdens]         = useState(ordensIniciais);
  const [search, setSearch]         = useState("");
  const [filtro, setFiltro]         = useState("todos");
  const [openNova, setOpenNova]     = useState(false);
  const [openAtt, setOpenAtt]       = useState<Ordem | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [att, setAtt]               = useState(emptyAtualizacao);

  const resumo = {
    emProducao: ordens.filter(o => o.status === "em_producao").length,
    emGravacao: ordens.filter(o => o.status === "em_gravacao").length,
    aguardando: ordens.filter(o => o.status === "aguardando_producao").length,
    concluidas: ordens.filter(o => o.status === "concluida").length,
  };

  const filtered = ordens.filter((o) => {
    const matchSearch = o.cliente.toLowerCase().includes(search.toLowerCase()) ||
      o.arte.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = filtro === "todos" || o.status === filtro ||
      (filtro === "ativas" && !["concluida","cancelada"].includes(o.status));
    return matchSearch && matchFiltro;
  });

  // Avançar status
  const avancarStatus = (id: string) => {
    setOrdens(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next: Record<string, string> = {
        em_gravacao:         "aguardando_producao",
        aguardando_producao: "em_producao",
        em_producao:         "concluida",
      };
      const novoStatus = next[o.status];
      const novaQtd   = novoStatus === "concluida" ? o.qtdPrevista : o.qtdProduzida;
      return novoStatus ? { ...o, status: novoStatus, qtdProduzida: novaQtd } : o;
    }));
  };

  // Salvar nova ordem
  const handleSalvarNova = () => {
    const num = String(ordens.length + 19).padStart(4, "0");
    const nova: Ordem = {
      id: `OP-0${num}`,
      pedido: form.pedido,
      cliente: form.cliente,
      arte: form.arte,
      quadro: form.quadro,
      qtdPrevista: Number(form.qtdPrevista) || 0,
      qtdProduzida: 0,
      status: "em_gravacao",
      prioridade: Number(form.prioridade),
      previsaoFim: form.previsaoFim,
    };
    setOrdens(prev => [nova, ...prev]);
    setForm(emptyForm);
    setOpenNova(false);
  };

  // Atualizar qtd produzida
  const handleAtualizarQtd = () => {
    if (!openAtt) return;
    setOrdens(prev => prev.map(o => o.id === openAtt.id
      ? { ...o, qtdProduzida: Math.min(Number(att.qtdProduzida), o.qtdPrevista) }
      : o
    ));
    setOpenAtt(null);
    setAtt(emptyAtualizacao);
  };

  return (
    <div>
      <Header title="Ordens de Produção" subtitle="Controle do carrossel serigráfico" />

      <div className="p-6 space-y-4">
        {/* Resumo do carrossel */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><PlayCircle className="h-4 w-4 text-primary" /><p className="text-xs font-medium text-muted-foreground">Em Produção</p></div>
              <p className="text-2xl font-bold mt-1 text-primary">{resumo.emProducao}</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><Frame className="h-4 w-4 text-warning" /><p className="text-xs font-medium text-muted-foreground">Em Gravação</p></div>
              <p className="text-2xl font-bold mt-1 text-warning">{resumo.emGravacao}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><p className="text-xs font-medium text-muted-foreground">Aguardando</p></div>
              <p className="text-2xl font-bold mt-1">{resumo.aguardando}</p>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /><p className="text-xs font-medium text-muted-foreground">Concluídas</p></div>
              <p className="text-2xl font-bold mt-1 text-success">{resumo.concluidas}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e busca */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar ordem, cliente, arte..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex rounded-md border border-input overflow-hidden">
              {[{k:"todos",l:"Todas"},{k:"ativas",l:"Ativas"},{k:"concluida",l:"Concluídas"}].map(({k,l}) => (
                <button key={k} onClick={() => setFiltro(k)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${filtro === k ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setOpenNova(true)}>
            <Plus className="h-4 w-4" /> Nova Ordem
          </Button>
        </div>

        {/* Cards de ordens */}
        <div className="space-y-3">
          {filtered.map((op) => {
            const s = statusConfig[op.status];
            const progresso = op.qtdPrevista > 0 ? Math.round((op.qtdProduzida / op.qtdPrevista) * 100) : 0;
            const isConcluida = op.status === "concluida";

            return (
              <Card key={op.id} className={cn("hover:shadow-md transition-shadow", !isConcluida && "border-l-4 border-l-primary")}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-primary">{op.id}</span>
                        <span className="text-xs text-muted-foreground">→ {op.pedido}</span>
                        <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                        {op.prioridade > 0 && (
                          <Badge variant="destructive" className="text-xs">Prioridade {op.prioridade}</Badge>
                        )}
                      </div>
                      <p className="font-semibold mt-1">{op.cliente}</p>
                      <p className="text-sm text-muted-foreground">Arte: {op.arte}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Frame className="h-3.5 w-3.5" /><span>Quadro: {op.quadro}</span>
                        <span>•</span>
                        <Calendar className="h-3.5 w-3.5" /><span>Entrega: {formatDate(op.previsaoFim)}</span>
                      </div>
                    </div>

                    {/* Progresso */}
                    <div className="sm:w-52">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Produção</span>
                        <button className="font-medium hover:text-primary transition-colors"
                          onClick={() => { setAtt({ qtdProduzida: String(op.qtdProduzida) }); setOpenAtt(op); }}>
                          {op.qtdProduzida.toLocaleString("pt-BR")} / {op.qtdPrevista.toLocaleString("pt-BR")} pcs
                        </button>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={cn("h-2 rounded-full transition-all", isConcluida ? "bg-success" : "bg-primary")}
                          style={{ width: `${progresso}%` }} />
                      </div>
                      <p className="text-xs text-right mt-1 font-medium">{progresso}%</p>
                    </div>

                    {/* Ações */}
                    {!isConcluida && (
                      <div className="flex gap-2">
                        {op.status === "em_gravacao" && (
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => avancarStatus(op.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Gravação OK
                          </Button>
                        )}
                        {op.status === "aguardando_producao" && (
                          <Button size="sm" className="gap-1.5 text-xs" onClick={() => avancarStatus(op.id)}>
                            <PlayCircle className="h-3.5 w-3.5" /> Iniciar
                          </Button>
                        )}
                        {op.status === "em_producao" && (
                          <Button size="sm" variant="success" className="gap-1.5 text-xs" onClick={() => avancarStatus(op.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal Nova Ordem */}
      <Dialog open={openNova} onOpenChange={setOpenNova}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Ordem de Produção</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Pedido *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.pedido} onChange={e => setForm({...form, pedido: e.target.value})}>
                <option value="">Selecione</option>
                {pedidosDisponiveis.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Cliente *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}>
                <option value="">Selecione</option>
                {clientes.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label>Arte / Estampa *</Label>
              <Input placeholder="Ex: Logo Verão 2026" value={form.arte} onChange={e => setForm({...form, arte: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Quadro (tela)</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.quadro} onChange={e => setForm({...form, quadro: e.target.value})}>
                <option value="">Selecione</option>
                {quadrosDisponiveis.map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Prioridade</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.prioridade} onChange={e => setForm({...form, prioridade: e.target.value})}>
                <option value="0">Normal</option>
                <option value="1">Alta (1)</option>
                <option value="2">Urgente (2)</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Qtd. Prevista (pcs) *</Label>
              <Input type="number" placeholder="0" value={form.qtdPrevista} onChange={e => setForm({...form, qtdPrevista: e.target.value})} />
            </div>
            <div className="grid gap-1.5">
              <Label>Previsão de Término *</Label>
              <Input type="date" value={form.previsaoFim} onChange={e => setForm({...form, previsaoFim: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNova(false)}>Cancelar</Button>
            <Button onClick={handleSalvarNova} disabled={!form.pedido || !form.cliente || !form.arte || !form.qtdPrevista}>
              Criar Ordem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Atualizar Quantidade */}
      <Dialog open={!!openAtt} onOpenChange={() => setOpenAtt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Atualizar Produção</DialogTitle></DialogHeader>
          {openAtt && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-sm font-medium">{openAtt.id} — {openAtt.arte}</p>
                <p className="text-xs text-muted-foreground mt-1">Previsto: {openAtt.qtdPrevista.toLocaleString("pt-BR")} pcs</p>
              </div>
              <div className="grid gap-1.5">
                <Label>Quantidade Produzida até agora</Label>
                <Input type="number" min="0" max={openAtt.qtdPrevista}
                  value={att.qtdProduzida} onChange={e => setAtt({...att, qtdProduzida: e.target.value})} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAtt(null)}>Cancelar</Button>
            <Button onClick={handleAtualizarQtd} disabled={att.qtdProduzida === ""}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
