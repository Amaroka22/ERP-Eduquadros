import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async load(): Promise<Record<string, unknown>> {
    const row = await this.prisma.appState.findUnique({ where: { id: 'default' } });
    if (!row) return {};
    return row.dados as Record<string, unknown>;
  }

  async save(dados: Record<string, unknown>): Promise<Record<string, unknown>> {
    const row = await this.prisma.appState.upsert({
      where: { id: 'default' },
      update: { dados },
      create: { id: 'default', dados },
    });
    return row.dados as Record<string, unknown>;
  }
}
