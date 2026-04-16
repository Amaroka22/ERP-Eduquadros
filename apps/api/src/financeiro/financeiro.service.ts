import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateContaReceberDto {
  descricao: string;
  clienteId?: string;
  pedidoId?: string;
  categoria?: string;
  centroCusto?: string;
  valor: number;
  desconto?: number;
  vencimento: string;
  formaPagamento?: string;
  obs?: string;
}

export class BaixaContaReceberDto {
  valorRecebido: number;
  recebimento: string;
  formaPagamento: string;
  obs?: string;
}

export class CreateContaPagarDto {
  descricao: string;
  fornecedorId?: string;
  categoria?: string;
  centroCusto?: string;
  valor: number;
  desconto?: number;
  vencimento: string;
  formaPagamento?: string;
  obs?: string;
  notaFiscal?: string;
}

export class BaixaContaPagarDto {
  valorPago: number;
  pagamento: string;
  formaPagamento: string;
  obs?: string;
}

@Injectable()
export class FinanceiroService {
  constructor(private prisma: PrismaService) {}

  // ─── CONTAS A RECEBER ────────────────────────────────────────

  async findAllReceber(params?: { status?: string; mes?: number; ano?: number }) {
    const where: Record<string, unknown> = {};
    if (params?.status && params.status !== 'todos') where.status = params.status;
    if (params?.mes && params?.ano) {
      const inicio = new Date(params.ano, params.mes - 1, 1);
      const fim = new Date(params.ano, params.mes, 0, 23, 59, 59);
      where.vencimento = { gte: inicio, lte: fim };
    }

    return this.prisma.contaReceber.findMany({
      where,
      include: { cliente: { include: { pessoa: true } } },
      orderBy: { vencimento: 'asc' },
    });
  }

  async createReceber(dto: CreateContaReceberDto) {
    return this.prisma.contaReceber.create({ data: { ...dto, vencimento: new Date(dto.vencimento) } });
  }

  async darBaixaReceber(id: string, dto: BaixaContaReceberDto) {
    const conta = await this.prisma.contaReceber.findUnique({ where: { id } });
    if (!conta) throw new NotFoundException('Conta não encontrada');

    const status = dto.valorRecebido >= Number(conta.valor) ? 'RECEBIDO' : 'RECEBIDO_PARCIAL';
    return this.prisma.contaReceber.update({
      where: { id },
      data: { ...dto, recebimento: new Date(dto.recebimento), status },
    });
  }

  // ─── CONTAS A PAGAR ─────────────────────────────────────────

  async findAllPagar(params?: { status?: string; mes?: number; ano?: number }) {
    const where: Record<string, unknown> = {};
    if (params?.status && params.status !== 'todos') where.status = params.status;
    if (params?.mes && params?.ano) {
      const inicio = new Date(params.ano, params.mes - 1, 1);
      const fim = new Date(params.ano, params.mes, 0, 23, 59, 59);
      where.vencimento = { gte: inicio, lte: fim };
    }

    return this.prisma.contaPagar.findMany({
      where,
      include: { fornecedor: { include: { pessoa: true } } },
      orderBy: { vencimento: 'asc' },
    });
  }

  async createPagar(dto: CreateContaPagarDto) {
    return this.prisma.contaPagar.create({ data: { ...dto, vencimento: new Date(dto.vencimento) } });
  }

  async darBaixaPagar(id: string, dto: BaixaContaPagarDto) {
    const conta = await this.prisma.contaPagar.findUnique({ where: { id } });
    if (!conta) throw new NotFoundException('Conta não encontrada');

    const status = dto.valorPago >= Number(conta.valor) ? 'PAGO' : 'PAGO_PARCIAL';
    return this.prisma.contaPagar.update({
      where: { id },
      data: { ...dto, pagamento: new Date(dto.pagamento), status },
    });
  }

  // ─── DRE ────────────────────────────────────────────────────

  async getDRE(ano: number) {
    const meses = Array.from({ length: 12 }, (_, i) => i + 1);

    const dre = await Promise.all(
      meses.map(async (mes) => {
        const inicio = new Date(ano, mes - 1, 1);
        const fim = new Date(ano, mes, 0, 23, 59, 59);

        const [receitas, despesas] = await Promise.all([
          this.prisma.contaReceber.findMany({
            where: { recebimento: { gte: inicio, lte: fim }, status: { in: ['RECEBIDO', 'RECEBIDO_PARCIAL'] } },
          }),
          this.prisma.contaPagar.findMany({
            where: { pagamento: { gte: inicio, lte: fim }, status: { in: ['PAGO', 'PAGO_PARCIAL'] } },
          }),
        ]);

        const totalReceitas = receitas.reduce((acc, c) => acc + Number(c.valorRecebido || c.valor), 0);
        const totalDespesas = despesas.reduce((acc, c) => acc + Number(c.valorPago || c.valor), 0);
        const lucro = totalReceitas - totalDespesas;

        return { mes, receitas: totalReceitas, despesas: totalDespesas, lucro };
      }),
    );

    const totais = dre.reduce(
      (acc, m) => ({
        receitas: acc.receitas + m.receitas,
        despesas: acc.despesas + m.despesas,
        lucro: acc.lucro + m.lucro,
      }),
      { receitas: 0, despesas: 0, lucro: 0 },
    );

    return { ano, meses: dre, totais };
  }

  // ─── FLUXO DE CAIXA ─────────────────────────────────────────

  async getFluxoCaixa(mes: number, ano: number) {
    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0, 23, 59, 59);

    const [receber, pagar] = await Promise.all([
      this.prisma.contaReceber.findMany({
        where: { vencimento: { gte: inicio, lte: fim } },
        include: { cliente: { include: { pessoa: true } } },
        orderBy: { vencimento: 'asc' },
      }),
      this.prisma.contaPagar.findMany({
        where: { vencimento: { gte: inicio, lte: fim } },
        include: { fornecedor: { include: { pessoa: true } } },
        orderBy: { vencimento: 'asc' },
      }),
    ]);

    const totalReceber = receber.reduce((acc, c) => acc + Number(c.valor), 0);
    const totalPagar = pagar.reduce((acc, c) => acc + Number(c.valor), 0);
    const saldo = totalReceber - totalPagar;

    return { mes, ano, receber, pagar, totalReceber, totalPagar, saldo };
  }
}
