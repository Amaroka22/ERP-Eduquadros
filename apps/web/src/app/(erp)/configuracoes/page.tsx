"use client";

import { useState } from "react";
import {
  Building2, Users, Tag, CreditCard, Landmark,
  Plus, Pencil, Trash2, Check, X, Phone, MapPin, ChevronRight,
  ShieldCheck, KeyRound, UserCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useApp, Cliente, Fornecedor } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

type Aba = "clientes" | "fornecedores" | "categorias" | "formas-pagamento" | "empresa" | "usuarios";

// ── Constants ──────────────────────────────────────────────────────────────────

const PALETTE = [
  "bg-green-500", "bg-blue-500", "bg-purple-500", "bg-gray-400",
  "bg-orange-500", "bg-red-500", "bg-yellow-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

const CATEGORIAS_FORNECEDOR = ["Insumos", "Aluguel", "Matéria-Prima", "Utilidades", "Serviços", "Outros"];

const ABAS: { key: Aba; label: string; icon: React.ElementType }[] = [
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "fornecedores", label: "Fornecedores", icon: Building2 },
  { key: "categorias", label: "Categorias", icon: Tag },
  { key: "formas-pagamento", label: "Formas de Pagamento", icon: CreditCard },
  { key: "empresa", label: "Empresa", icon: Landmark },
  { key: "usuarios", label: "Usuários", icon: ShieldCheck },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function emptyCliente(): Omit<Cliente, "id"> {
  return { nome: "", cnpjCpf: "", email: "", telefone: "", cidade: "", ativo: true };
}

function emptyFornecedor(): Omit<Fornecedor, "id"> {
  return { nome: "", cnpjCpf: "", email: "", telefone: "", cidade: "", categoria: "Insumos", ativo: true };
}

// ── Aba Clientes ───────────────────────────────────────────────────────────────

function AbaClientes() {
  const { clientes, setClientes } = useApp();
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<Omit<Cliente, "id">>(emptyCliente());

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cnpjCpf.toLowerCase().includes(busca.toLowerCase())
  );

  function abrirNovo() {
    setEditando(null);
    setForm(emptyCliente());
    setModalAberto(true);
  }

  function abrirEditar(c: Cliente) {
    setEditando(c);
    setForm({ nome: c.nome, cnpjCpf: c.cnpjCpf, email: c.email, telefone: c.telefone, cidade: c.cidade, ativo: c.ativo });
    setModalAberto(true);
  }

  function salvar() {
    if (!form.nome.trim()) return;
    if (editando) {
      setClientes(prev => prev.map(c => c.id === editando.id ? { ...editando, ...form } : c));
    } else {
      const novoId = Math.max(0, ...clientes.map(c => c.id)) + 1;
      setClientes(prev => [...prev, { id: novoId, ...form }]);
    }
    setModalAberto(false);
  }

  function toggleAtivo(id: number) {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ativo: !c.ativo } : c));
  }

  function excluir(id: number) {
    setClientes(prev => prev.filter(c => c.id !== id));
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <Input placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-sm" />
        <Button onClick={abrirNovo} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Novo Cliente</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Nome</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">CNPJ/CPF</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Telefone</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Cidade</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</td></tr>
              ) : filtrados.map(c => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3.5 font-medium">{c.nome}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.cnpjCpf}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.email}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.telefone}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.cidade}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={c.ativo ? "success" : "secondary"}>{c.ativo ? "Ativo" : "Inativo"}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className={cn("h-8 w-8", c.ativo ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600")} onClick={() => toggleAtivo(c.id)} title={c.ativo ? "Desativar" : "Ativar"}>
                        {c.ativo ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      {!c.ativo && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => excluir(c.id)} title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editando ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Razão social ou nome" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>CNPJ/CPF</Label>
                <Input value={form.cnpjCpf} onChange={e => setForm(f => ({ ...f, cnpjCpf: e.target.value }))} placeholder="00.000.000/0001-00" />
              </div>
              <div className="grid gap-1.5">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(11) 0000-0000" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com.br" />
            </div>
            <div className="grid gap-1.5">
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="São Paulo" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="h-4 w-4 rounded border-input" />
              <span className="text-sm">Cliente ativo</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={!form.nome.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Aba Fornecedores ───────────────────────────────────────────────────────────

function AbaFornecedores() {
  const { fornecedores, setFornecedores } = useApp();
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState<Omit<Fornecedor, "id">>(emptyFornecedor());

  const filtrados = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    f.cnpjCpf.toLowerCase().includes(busca.toLowerCase())
  );

  function abrirNovo() {
    setEditando(null);
    setForm(emptyFornecedor());
    setModalAberto(true);
  }

  function abrirEditar(f: Fornecedor) {
    setEditando(f);
    setForm({ nome: f.nome, cnpjCpf: f.cnpjCpf, email: f.email, telefone: f.telefone, cidade: f.cidade, categoria: f.categoria, ativo: f.ativo });
    setModalAberto(true);
  }

  function salvar() {
    if (!form.nome.trim()) return;
    if (editando) {
      setFornecedores(prev => prev.map(f => f.id === editando.id ? { ...editando, ...form } : f));
    } else {
      const novoId = Math.max(0, ...fornecedores.map(f => f.id)) + 1;
      setFornecedores(prev => [...prev, { id: novoId, ...form }]);
    }
    setModalAberto(false);
  }

  function toggleAtivo(id: number) {
    setFornecedores(prev => prev.map(f => f.id === id ? { ...f, ativo: !f.ativo } : f));
  }

  function excluir(id: number) {
    setFornecedores(prev => prev.filter(f => f.id !== id));
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <Input placeholder="Buscar fornecedor..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-sm" />
        <Button onClick={abrirNovo} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Novo Fornecedor</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Nome</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">CNPJ/CPF</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Telefone</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Cidade</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Categoria</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</td></tr>
              ) : filtrados.map(f => (
                <tr key={f.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3.5 font-medium">{f.nome}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{f.cnpjCpf}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{f.email}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{f.telefone}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{f.cidade}</td>
                  <td className="px-5 py-3.5"><Badge variant="secondary">{f.categoria}</Badge></td>
                  <td className="px-5 py-3.5">
                    <Badge variant={f.ativo ? "success" : "secondary"}>{f.ativo ? "Ativo" : "Inativo"}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(f)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className={cn("h-8 w-8", f.ativo ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600")} onClick={() => toggleAtivo(f.id)} title={f.ativo ? "Desativar" : "Ativar"}>
                        {f.ativo ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      {!f.ativo && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => excluir(f.id)} title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editando ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Razão social ou nome" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>CNPJ/CPF</Label>
                <Input value={form.cnpjCpf} onChange={e => setForm(f => ({ ...f, cnpjCpf: e.target.value }))} placeholder="00.000.000/0001-00" />
              </div>
              <div className="grid gap-1.5">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(11) 0000-0000" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com.br" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="São Paulo" />
              </div>
              <div className="grid gap-1.5">
                <Label>Categoria</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS_FORNECEDOR.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="h-4 w-4 rounded border-input" />
              <span className="text-sm">Fornecedor ativo</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={!form.nome.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Aba Categorias ─────────────────────────────────────────────────────────────

function SecaoCategorias({ titulo, categorias, onAdicionar, onEditar, onExcluir }: {
  titulo: string;
  categorias: string[];
  onAdicionar: (nome: string) => void;
  onEditar: (idx: number, novoNome: string) => void;
  onExcluir: (idx: number) => void;
}) {
  const [novo, setNovo] = useState("");
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [editandoValor, setEditandoValor] = useState("");

  function adicionar() {
    const trimmed = novo.trim();
    if (!trimmed || categorias.includes(trimmed)) return;
    onAdicionar(trimmed);
    setNovo("");
  }

  function iniciarEdicao(idx: number) {
    setEditandoIdx(idx);
    setEditandoValor(categorias[idx]);
  }

  function salvarEdicao() {
    if (editandoIdx === null) return;
    const trimmed = editandoValor.trim();
    if (!trimmed) return;
    onEditar(editandoIdx, trimmed);
    setEditandoIdx(null);
  }

  function cancelarEdicao() {
    setEditandoIdx(null);
    setEditandoValor("");
  }

  function excluir(idx: number) {
    onExcluir(idx);
    if (editandoIdx === idx) cancelarEdicao();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          {titulo}
          <Badge variant="secondary" className="text-xs font-normal">{categorias.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {categorias.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada</p>
        )}
        {categorias.map((cat, idx) => (
          <div key={idx} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
            {editandoIdx === idx ? (
              <>
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", PALETTE[idx % PALETTE.length])} />
                <Input
                  value={editandoValor}
                  onChange={e => setEditandoValor(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") salvarEdicao(); if (e.key === "Escape") cancelarEdicao(); }}
                  className="h-7 text-sm flex-1"
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-600 shrink-0" onClick={salvarEdicao} title="Salvar">
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground shrink-0" onClick={cancelarEdicao} title="Cancelar">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", PALETTE[idx % PALETTE.length])} />
                <span className="text-sm flex-1">{cat}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0" onClick={() => iniciarEdicao(idx)} title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => excluir(idx)} title="Excluir">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-3 border-t border-border mt-1">
          <Input
            placeholder="Nova categoria..."
            value={novo}
            onChange={e => setNovo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && adicionar()}
            className="h-9 text-sm"
          />
          <Button variant="outline" onClick={adicionar} disabled={!novo.trim()} className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AbaCategorias() {
  const { categoriasReceita, setCategoriasReceita, categoriasDespesa, setCategoriasDespesa } = useApp();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SecaoCategorias
          titulo="Categorias de Receita"
          categorias={categoriasReceita}
          onAdicionar={nome => setCategoriasReceita(prev => [...prev, nome])}
          onEditar={(idx, novoNome) => setCategoriasReceita(prev => prev.map((c, i) => i === idx ? novoNome : c))}
          onExcluir={idx => setCategoriasReceita(prev => prev.filter((_, i) => i !== idx))}
        />
        <SecaoCategorias
          titulo="Categorias de Despesa"
          categorias={categoriasDespesa}
          onAdicionar={nome => setCategoriasDespesa(prev => [...prev, nome])}
          onEditar={(idx, novoNome) => setCategoriasDespesa(prev => prev.map((c, i) => i === idx ? novoNome : c))}
          onExcluir={idx => setCategoriasDespesa(prev => prev.filter((_, i) => i !== idx))}
        />
      </div>
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="font-semibold text-sm">Centros de Custo</p>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie os centros de custo no módulo dedicado</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/financeiro/centros" className="gap-1.5 flex items-center">Acessar <ChevronRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Aba Formas de Pagamento ────────────────────────────────────────────────────

function AbaFormasPagamento() {
  const { formasPagamento, setFormasPagamento } = useApp();
  const [novaForma, setNovaForma] = useState("");
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [editandoValor, setEditandoValor] = useState("");

  function adicionar() {
    const trimmed = novaForma.trim();
    if (!trimmed) return;
    setFormasPagamento(prev => [...prev, trimmed]);
    setNovaForma("");
  }

  function iniciarEdicao(idx: number) {
    setEditandoIdx(idx);
    setEditandoValor(formasPagamento[idx]);
  }

  function salvarEdicao() {
    if (editandoIdx === null) return;
    const trimmed = editandoValor.trim();
    if (!trimmed) return;
    setFormasPagamento(prev => prev.map((f, i) => i === editandoIdx ? trimmed : f));
    setEditandoIdx(null);
  }

  function cancelarEdicao() {
    setEditandoIdx(null);
    setEditandoValor("");
  }

  function excluir(idx: number) {
    setFormasPagamento(prev => prev.filter((_, i) => i !== idx));
    if (editandoIdx === idx) cancelarEdicao();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Formas de Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {formasPagamento.map((forma, idx) => (
          <div key={idx} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
            {editandoIdx === idx ? (
              <>
                <Input value={editandoValor} onChange={e => setEditandoValor(e.target.value)} onKeyDown={e => { if (e.key === "Enter") salvarEdicao(); if (e.key === "Escape") cancelarEdicao(); }} className="h-7 text-sm flex-1" autoFocus />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-600" onClick={salvarEdicao}><Check className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={cancelarEdicao}><X className="h-3.5 w-3.5" /></Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{forma}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => iniciarEdicao(idx)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => excluir(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-3 border-t border-border mt-3">
          <Input placeholder="Nova forma de pagamento..." value={novaForma} onChange={e => setNovaForma(e.target.value)} onKeyDown={e => e.key === "Enter" && adicionar()} className="h-9 text-sm" />
          <Button variant="outline" onClick={adicionar} className="gap-1.5 shrink-0"><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Aba Empresa ────────────────────────────────────────────────────────────────

function AbaEmpresa() {
  const { empresa, setEmpresa } = useApp();
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid gap-1.5">
              <Label>Razão Social</Label>
              <Input value={empresa.razaoSocial} onChange={e => setEmpresa(p => ({ ...p, razaoSocial: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Nome Fantasia</Label>
              <Input value={empresa.nomeFantasia} onChange={e => setEmpresa(p => ({ ...p, nomeFantasia: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>CNPJ</Label>
              <Input value={empresa.cnpj} onChange={e => setEmpresa(p => ({ ...p, cnpj: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Inscrição Estadual (IE)</Label>
              <Input value={empresa.ie} onChange={e => setEmpresa(p => ({ ...p, ie: e.target.value }))} />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Endereço</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-1.5">
                <Label>Endereço</Label>
                <Input value={empresa.endereco} onChange={e => setEmpresa(p => ({ ...p, endereco: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>CEP</Label>
                <Input value={empresa.cep} onChange={e => setEmpresa(p => ({ ...p, cep: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Cidade</Label>
                <Input value={empresa.cidade} onChange={e => setEmpresa(p => ({ ...p, cidade: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Estado</Label>
                <Input value={empresa.estado} maxLength={2} onChange={e => setEmpresa(p => ({ ...p, estado: e.target.value.toUpperCase() }))} />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Contato</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label>Telefone</Label>
                <Input value={empresa.telefone} onChange={e => setEmpresa(p => ({ ...p, telefone: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={empresa.email} onChange={e => setEmpresa(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Site</Label>
                <Input value={empresa.site} onChange={e => setEmpresa(p => ({ ...p, site: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={salvar} className="gap-2 min-w-40">
              {salvo ? <><Check className="h-4 w-4" /> Configurações Salvas</> : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <Landmark className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Contas Bancárias</p>
              <p className="text-sm text-muted-foreground mt-0.5">Gerencie as contas bancárias da empresa</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/financeiro/contas" className="gap-1.5 flex items-center">Acessar <ChevronRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Aba Usuários ───────────────────────────────────────────────────────────────

function AbaUsuarios() {
  const { usuarios, atualizarUsuario, usuarioAtual } = useAuth();
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formLogin, setFormLogin] = useState("");
  const [trocandoSenhaId, setTrocandoSenhaId] = useState<number | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [salvoId, setSalvoId] = useState<number | null>(null);
  const [erroSenha, setErroSenha] = useState("");

  function iniciarEdicao(u: typeof usuarios[0]) {
    setEditandoId(u.id);
    setFormNome(u.nome);
    setFormLogin(u.login);
    setTrocandoSenhaId(null);
  }

  function salvarEdicao(id: number) {
    if (!formNome.trim() || !formLogin.trim()) return;
    atualizarUsuario(id, { nome: formNome.trim(), login: formLogin.trim() });
    setEditandoId(null);
    setSalvoId(id);
    setTimeout(() => setSalvoId(null), 2000);
  }

  function salvarSenha(id: number) {
    setErroSenha("");
    if (novaSenha.length < 4) { setErroSenha("A senha deve ter ao menos 4 caracteres."); return; }
    if (novaSenha !== confirmaSenha) { setErroSenha("As senhas não coincidem."); return; }
    atualizarUsuario(id, { senha: novaSenha });
    setTrocandoSenhaId(null);
    setNovaSenha("");
    setConfirmaSenha("");
    setSalvoId(id);
    setTimeout(() => setSalvoId(null), 2000);
  }

  function cancelarSenha() {
    setTrocandoSenhaId(null);
    setNovaSenha("");
    setConfirmaSenha("");
    setErroSenha("");
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold">Usuários do Sistema</p>
          <p className="text-xs text-muted-foreground">Gerencie os dois usuários autorizados</p>
        </div>
      </div>

      {usuarios.map((u) => {
        const isEditando = editandoId === u.id;
        const isTrocandoSenha = trocandoSenhaId === u.id;
        const isSalvo = salvoId === u.id;
        const isLogado = usuarioAtual?.id === u.id;

        return (
          <Card key={u.id}>
            <CardContent className="p-5 space-y-4">
              {/* Header do usuário */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{u.nome}</p>
                    <Badge variant={u.perfil === "admin" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                      {u.perfil === "admin" ? "Administrador" : "Operador"}
                    </Badge>
                    {isLogado && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-green-600 border-green-300">
                        Você
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Login: <span className="font-mono">{u.login}</span></p>
                </div>
                {isSalvo && (
                  <span className="text-xs text-green-600 flex items-center gap-1 shrink-0">
                    <Check className="h-3.5 w-3.5" /> Salvo
                  </span>
                )}
              </div>

              {/* Editar nome / login */}
              {isEditando ? (
                <div className="space-y-3 pt-1 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Editar dados</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={formNome}
                        onChange={(e) => setFormNome(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") salvarEdicao(u.id); if (e.key === "Escape") setEditandoId(null); }}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Login</Label>
                      <Input
                        value={formLogin}
                        onChange={(e) => setFormLogin(e.target.value)}
                        className="h-8 text-sm font-mono"
                        onKeyDown={(e) => { if (e.key === "Enter") salvarEdicao(u.id); if (e.key === "Escape") setEditandoId(null); }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditandoId(null)}>Cancelar</Button>
                    <Button size="sm" onClick={() => salvarEdicao(u.id)} disabled={!formNome.trim() || !formLogin.trim()} className="gap-1.5">
                      <Check className="h-3.5 w-3.5" /> Salvar
                    </Button>
                  </div>
                </div>
              ) : isTrocandoSenha ? (
                <div className="space-y-3 pt-1 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trocar senha</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Nova senha</Label>
                      <Input
                        type="password"
                        value={novaSenha}
                        onChange={(e) => { setNovaSenha(e.target.value); setErroSenha(""); }}
                        className="h-8 text-sm"
                        autoFocus
                        placeholder="Mínimo 4 caracteres"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Confirmar senha</Label>
                      <Input
                        type="password"
                        value={confirmaSenha}
                        onChange={(e) => { setConfirmaSenha(e.target.value); setErroSenha(""); }}
                        className="h-8 text-sm"
                        placeholder="Repita a senha"
                        onKeyDown={(e) => { if (e.key === "Enter") salvarSenha(u.id); if (e.key === "Escape") cancelarSenha(); }}
                      />
                    </div>
                  </div>
                  {erroSenha && (
                    <p className="text-xs text-destructive">{erroSenha}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={cancelarSenha}>Cancelar</Button>
                    <Button size="sm" onClick={() => salvarSenha(u.id)} disabled={!novaSenha || !confirmaSenha} className="gap-1.5">
                      <Check className="h-3.5 w-3.5" /> Salvar Senha
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-1 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => iniciarEdicao(u)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar dados
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => { setTrocandoSenhaId(u.id); setEditandoId(null); setNovaSenha(""); setConfirmaSenha(""); setErroSenha(""); }}
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Trocar senha
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card className="border-dashed">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            O sistema permite exatamente dois usuários ativos. Para segurança, troque as senhas padrão antes de usar em produção.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<Aba>("clientes");

  return (
    <div>
      <Header title="Configurações" subtitle="Gerencie clientes, fornecedores, categorias e dados da empresa" />

      <div className="border-b border-border px-6">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {ABAS.map(a => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-md whitespace-nowrap transition-colors",
                aba === a.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <a.icon className="h-4 w-4 shrink-0" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {aba === "clientes" && <AbaClientes />}
        {aba === "fornecedores" && <AbaFornecedores />}
        {aba === "categorias" && <AbaCategorias />}
        {aba === "formas-pagamento" && <AbaFormasPagamento />}
        {aba === "empresa" && <AbaEmpresa />}
        {aba === "usuarios" && <AbaUsuarios />}
      </div>
    </div>
  );
}
