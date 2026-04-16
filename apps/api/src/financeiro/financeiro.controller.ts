import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  FinanceiroService,
  CreateContaReceberDto,
  BaixaContaReceberDto,
  CreateContaPagarDto,
  BaixaContaPagarDto,
} from './financeiro.service';

@UseGuards(AuthGuard('jwt'))
@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  // Contas a Receber
  @Get('receber')
  findAllReceber(@Query() params: { status?: string; mes?: string; ano?: string }) {
    return this.financeiroService.findAllReceber({
      status: params.status,
      mes: params.mes ? Number(params.mes) : undefined,
      ano: params.ano ? Number(params.ano) : undefined,
    });
  }

  @Post('receber')
  createReceber(@Body() dto: CreateContaReceberDto) {
    return this.financeiroService.createReceber(dto);
  }

  @Patch('receber/:id/baixa')
  darBaixaReceber(@Param('id') id: string, @Body() dto: BaixaContaReceberDto) {
    return this.financeiroService.darBaixaReceber(id, dto);
  }

  // Contas a Pagar
  @Get('pagar')
  findAllPagar(@Query() params: { status?: string; mes?: string; ano?: string }) {
    return this.financeiroService.findAllPagar({
      status: params.status,
      mes: params.mes ? Number(params.mes) : undefined,
      ano: params.ano ? Number(params.ano) : undefined,
    });
  }

  @Post('pagar')
  createPagar(@Body() dto: CreateContaPagarDto) {
    return this.financeiroService.createPagar(dto);
  }

  @Patch('pagar/:id/baixa')
  darBaixaPagar(@Param('id') id: string, @Body() dto: BaixaContaPagarDto) {
    return this.financeiroService.darBaixaPagar(id, dto);
  }

  // DRE
  @Get('dre')
  getDRE(@Query('ano') ano: string) {
    return this.financeiroService.getDRE(Number(ano) || new Date().getFullYear());
  }

  // Fluxo de Caixa
  @Get('fluxo')
  getFluxoCaixa(@Query('mes') mes: string, @Query('ano') ano: string) {
    const now = new Date();
    return this.financeiroService.getFluxoCaixa(
      Number(mes) || now.getMonth() + 1,
      Number(ano) || now.getFullYear(),
    );
  }
}
