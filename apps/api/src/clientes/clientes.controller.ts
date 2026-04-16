import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientesService, CreateClienteDto } from './clientes.service';

@UseGuards(AuthGuard('jwt'))
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.clientesService.findAll(search);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.clientesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateClienteDto>) {
    return this.clientesService.update(id, dto);
  }

  @Patch(':id/toggle-ativo')
  toggleAtivo(@Param('id') id: string) {
    return this.clientesService.toggleAtivo(id);
  }
}
