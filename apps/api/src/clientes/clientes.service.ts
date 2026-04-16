import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateClienteDto {
  tipo: 'PF' | 'PJ';
  nome: string;
  nomeFantasia?: string;
  documento: string;
  ie?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  limiteCredito?: number;
  condicaoPagamento?: string;
  obs?: string;
}

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.cliente.findMany({
      where: search
        ? {
            OR: [
              { pessoa: { nome: { contains: search, mode: 'insensitive' } } },
              { pessoa: { documento: { contains: search } } },
            ],
          }
        : undefined,
      include: {
        pessoa: true,
        _count: { select: { pedidos: true } },
      },
      orderBy: { pessoa: { nome: 'asc' } },
    });
  }

  async findById(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        pessoa: true,
        pedidos: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { itens: true },
        },
        quadros: true,
        contasReceber: {
          where: { status: { in: ['PENDENTE', 'VENCIDO'] } },
          orderBy: { vencimento: 'asc' },
        },
      },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async create(dto: CreateClienteDto) {
    const docExists = await this.prisma.pessoa.findUnique({ where: { documento: dto.documento } });
    if (docExists) throw new ConflictException('Documento já cadastrado');

    const { limiteCredito, condicaoPagamento, ...pessoaData } = dto;

    return this.prisma.cliente.create({
      data: {
        pessoa: { create: pessoaData },
        limiteCredito,
        condicaoPagamento,
      },
      include: { pessoa: true },
    });
  }

  async update(id: string, dto: Partial<CreateClienteDto>) {
    await this.findById(id);
    const { limiteCredito, condicaoPagamento, ...pessoaData } = dto;

    return this.prisma.cliente.update({
      where: { id },
      data: {
        pessoa: { update: pessoaData },
        limiteCredito,
        condicaoPagamento,
      },
      include: { pessoa: true },
    });
  }

  async toggleAtivo(id: string) {
    const cliente = await this.findById(id);
    return this.prisma.pessoa.update({
      where: { id: cliente.pessoaId },
      data: { ativo: !cliente.pessoa.ativo },
    });
  }
}
