import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export class CreateUsuarioDto {
  nome: string;
  email: string;
  senha: string;
  perfil?: 'ADMIN' | 'FINANCEIRO' | 'OPERADOR';
}

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, perfil: true, ativo: true, createdAt: true },
    });
  }

  async create(dto: CreateUsuarioDto) {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const senhaHash = await bcrypt.hash(dto.senha, 12);
    return this.prisma.usuario.create({
      data: { ...dto, senha: senhaHash },
      select: { id: true, nome: true, email: true, perfil: true, ativo: true, createdAt: true },
    });
  }

  async findById(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, perfil: true, ativo: true },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }
}
