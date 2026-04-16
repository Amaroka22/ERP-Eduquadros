"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { apiSyncLoad, apiSyncSave, getToken } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export type TipoConta =
  | "Conta Corrente"
  | "Conta Poupança"
  | "Conta Investimento"
  | "Caixa";

export type ContaBancaria = {
  id: number;
  banco: string;
  agencia: string;
  conta: string;
  tipo: TipoConta;
  saldo: number;
  ativa: boolean;
  cor: string;
};

export type Cliente = {
  id: number;
  nome: string;
  cnpjCpf: string;
  email: string;
  telefone: string;
  cidade: string;
  ativo: boolean;
};

export type Fornecedor = {
  id: number;
  nome: string;
  cnpjCpf: string;
  email: string;
  telefone: string;
  cidade: string;
  categoria: string;
  ativo: boolean;
};

export type EmpresaData = {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  ie: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  site: string;
};

export type Anexo = {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  criado: string;
};

export type StatusParcelaReceber = "pendente" | "recebido" | "vencido";
export type StatusParcelaPagar = "pendente" | "pago" | "vencido";

export type ParcelaReceber = {
  num: number;
  total: number;
  valor: number;
  vencimento: string;
  status: StatusParcelaReceber;
  dataBaixa?: string;
  valorRecebido?: number;
  formaPagamento?: string;
};

export type ParcelaPagar = {
  num: number;
  total: number;
  valor: number;
  vencimento: string;
  status: StatusParcelaPagar;
  dataPagamento?: string;
  valorPago?: number;
};

export type LancamentoReceber = {
  id: number;
  descricao: string;
  cliente: string;
  categoria: string;
  contaBancaria: string;
  valorTotal: number;
  parcelas: ParcelaReceber[];
  criado: string;
  anexos?: Anexo[];
};

export type LancamentoPagar = {
  id: number;
  descricao: string;
  fornecedor: string;
  categoria: string;
  contaBancaria: string;
  valorTotal: number;
  criado: string;
  parcelas: ParcelaPagar[];
  anexos?: Anexo[];
};

export type TipoCentroCusto = "receita" | "despesa" | "ambos";
export type CentroCusto = {
  id: number;
  codigo: string;
  nome: string;
  tipo: TipoCentroCusto;
  descricao: string;
  ativo: boolean;
  orcamento: number;
};

// ── Helpers de geração de parcelas ────────────────────────────────────────────

/** Formata Date → "YYYY-MM-DD" usando hora local (evita shift UTC). */
function localDateStr(d: Date): string {
  return (
    d.getFullYear() +
    "-" + String(d.getMonth() + 1).padStart(2, "0") +
    "-" + String(d.getDate()).padStart(2, "0")
  );
}

export function gerarParcelasReceber(
  valorTotal: number,
  numParcelas: number,
  primeiroVenc: string,
  statusOverride?: StatusParcelaReceber[]
): ParcelaReceber[] {
  const valorParcela = +(valorTotal / numParcelas).toFixed(2);
  const [ano, mes, dia] = primeiroVenc.split("-").map(Number);
  return Array.from({ length: numParcelas }, (_, i) => {
    const d = new Date(ano, mes - 1 + i, dia);
    return {
      num: i + 1,
      total: numParcelas,
      valor:
        i === numParcelas - 1
          ? +(valorTotal - valorParcela * (numParcelas - 1)).toFixed(2)
          : valorParcela,
      vencimento: localDateStr(d),
      status: statusOverride?.[i] ?? "pendente",
    };
  });
}

export function gerarParcelasPagar(
  total: number,
  n: number,
  primeiroVencimento: string,
  statuses?: StatusParcelaPagar[]
): ParcelaPagar[] {
  const valor = parseFloat((total / n).toFixed(2));
  const [ano, mes, dia] = primeiroVencimento.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(ano, mes - 1 + i, dia);
    return {
      num: i + 1,
      total: n,
      valor,
      vencimento: localDateStr(d),
      status: statuses ? (statuses[i] ?? "pendente") : "pendente",
    };
  });
}

// ── Dados iniciais (padrão) ────────────────────────────────────────────────────

const CLIENTES_DEFAULT: Cliente[] = [];

const FORNECEDORES_DEFAULT: Fornecedor[] = [];

const CONTAS_DEFAULT: ContaBancaria[] = [];

const EMPRESA_DEFAULT: EmpresaData = {
  razaoSocial: "",
  nomeFantasia: "Edu Quadros",
  cnpj: "",
  ie: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  telefone: "",
  email: "",
  site: "",
};

const LANCAMENTOS_RECEBER_DEFAULT: LancamentoReceber[] = [];

const LANCAMENTOS_PAGAR_DEFAULT: LancamentoPagar[] = [];

const CENTROS_DEFAULT: CentroCusto[] = [];

// ── Context type ───────────────────────────────────────────────────────────────

type AppState = {
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;

  fornecedores: Fornecedor[];
  setFornecedores: React.Dispatch<React.SetStateAction<Fornecedor[]>>;

  categoriasReceita: string[];
  setCategoriasReceita: React.Dispatch<React.SetStateAction<string[]>>;

  categoriasDespesa: string[];
  setCategoriasDespesa: React.Dispatch<React.SetStateAction<string[]>>;

  formasPagamento: string[];
  setFormasPagamento: React.Dispatch<React.SetStateAction<string[]>>;

  contasBancarias: ContaBancaria[];
  setContasBancarias: React.Dispatch<React.SetStateAction<ContaBancaria[]>>;

  lancamentosReceber: LancamentoReceber[];
  setLancamentosReceber: React.Dispatch<React.SetStateAction<LancamentoReceber[]>>;

  lancamentosPagar: LancamentoPagar[];
  setLancamentosPagar: React.Dispatch<React.SetStateAction<LancamentoPagar[]>>;

  empresa: EmpresaData;
  setEmpresa: React.Dispatch<React.SetStateAction<EmpresaData>>;

  centrosCusto: CentroCusto[];
  setCentrosCusto: React.Dispatch<React.SetStateAction<CentroCusto[]>>;

  // Helpers derivados
  nomesContasAtivas: string[];
  nomesClientesAtivos: string[];
  nomesFornecedoresAtivos: string[];
};

const AppContext = createContext<AppState | null>(null);

// ── localStorage ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "erp_eduquadros_v2";

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed[key] ?? fallback;
  } catch {
    return fallback;
  }
}

function usePersisted<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(loadFromStorage(key, defaultValue));
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, setValue, ready] as const;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes, r1] = usePersisted("clientes", CLIENTES_DEFAULT);
  const [fornecedores, setFornecedores, r2] = usePersisted("fornecedores", FORNECEDORES_DEFAULT);
  const [categoriasReceita, setCategoriasReceita, r3] = usePersisted("categoriasReceita", ["Pedido de Venda", "Adiantamento", "Serviço Prestado", "Outros Recebimentos"]);
  const [categoriasDespesa, setCategoriasDespesa, r4] = usePersisted("categoriasDespesa", ["Insumos", "Aluguel", "Utilidades", "Salários", "Impostos", "Serviços", "Matéria-Prima", "Outros Pagamentos"]);
  const [formasPagamento, setFormasPagamento, r5] = usePersisted("formasPagamento", ["PIX", "Boleto Bancário", "TED / DOC", "Dinheiro", "Cheque", "Cartão de Crédito", "Cartão de Débito"]);
  const [contasBancarias, setContasBancarias, r6] = usePersisted("contasBancarias", CONTAS_DEFAULT);
  const [lancamentosReceber, setLancamentosReceber, r7] = usePersisted("lancamentosReceber", LANCAMENTOS_RECEBER_DEFAULT);
  const [lancamentosPagar, setLancamentosPagar, r8] = usePersisted("lancamentosPagar", LANCAMENTOS_PAGAR_DEFAULT);
  const [empresa, setEmpresa, r9] = usePersisted("empresa", EMPRESA_DEFAULT);
  const [centrosCusto, setCentrosCusto, r10] = usePersisted("centrosCusto", CENTROS_DEFAULT);

  const allReady = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10;

  // Ref para evitar loop de sync (não salvar enquanto estamos carregando da API)
  const loadingFromApi = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Coleta o estado atual para salvar
  const getSnapshot = useCallback(() => ({
    clientes, fornecedores, categoriasReceita, categoriasDespesa,
    formasPagamento, contasBancarias, lancamentosReceber, lancamentosPagar, empresa, centrosCusto,
  }), [clientes, fornecedores, categoriasReceita, categoriasDespesa,
       formasPagamento, contasBancarias, lancamentosReceber, lancamentosPagar, empresa, centrosCusto]);

  // 1. Carrega dados da API uma vez após hydration local
  useEffect(() => {
    if (!allReady) return;
    if (!getToken()) return; // sem token = offline, usa localStorage

    loadingFromApi.current = true;
    apiSyncLoad()
      .then((dados) => {
        if (!dados || Object.keys(dados).length === 0) return; // API vazia, mantém localStorage
        // Aplica dados da API (sobrescreve localStorage)
        const d = dados as Record<string, unknown>;
        if (d.clientes)           setClientes(d.clientes as typeof clientes);
        if (d.fornecedores)       setFornecedores(d.fornecedores as typeof fornecedores);
        if (d.categoriasReceita)  setCategoriasReceita(d.categoriasReceita as typeof categoriasReceita);
        if (d.categoriasDespesa)  setCategoriasDespesa(d.categoriasDespesa as typeof categoriasDespesa);
        if (d.formasPagamento)    setFormasPagamento(d.formasPagamento as typeof formasPagamento);
        if (d.contasBancarias)    setContasBancarias(d.contasBancarias as typeof contasBancarias);
        if (d.lancamentosReceber) setLancamentosReceber(d.lancamentosReceber as typeof lancamentosReceber);
        if (d.lancamentosPagar)   setLancamentosPagar(d.lancamentosPagar as typeof lancamentosPagar);
        if (d.empresa)            setEmpresa(d.empresa as typeof empresa);
        if (d.centrosCusto)       setCentrosCusto(d.centrosCusto as typeof centrosCusto);
      })
      .catch(() => { /* offline ou erro: usa localStorage */ })
      .finally(() => {
        setTimeout(() => { loadingFromApi.current = false; }, 200);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReady]);

  // 2. Persiste no localStorage + API sempre que algo muda
  useEffect(() => {
    if (!allReady) return;
    const snapshot = getSnapshot();

    // localStorage imediato (cache offline)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {}

    // API com debounce de 1,5s (evita spam durante edição)
    if (!loadingFromApi.current && getToken()) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        apiSyncSave(snapshot).catch(() => { /* falha silenciosa: offline */ });
      }, 1500);
    }

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [allReady, getSnapshot]);

  const nomesContasAtivas = contasBancarias.filter((c) => c.ativa).map((c) => c.banco);
  const nomesClientesAtivos = clientes.filter((c) => c.ativo).map((c) => c.nome);
  const nomesFornecedoresAtivos = fornecedores.filter((f) => f.ativo).map((f) => f.nome);

  return (
    <AppContext.Provider
      value={{
        clientes, setClientes,
        fornecedores, setFornecedores,
        categoriasReceita, setCategoriasReceita,
        categoriasDespesa, setCategoriasDespesa,
        formasPagamento, setFormasPagamento,
        contasBancarias, setContasBancarias,
        lancamentosReceber, setLancamentosReceber,
        lancamentosPagar, setLancamentosPagar,
        empresa, setEmpresa,
        centrosCusto, setCentrosCusto,
        nomesContasAtivas,
        nomesClientesAtivos,
        nomesFornecedoresAtivos,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
