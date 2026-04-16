import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SyncService } from './sync.service';

@UseGuards(AuthGuard('jwt'))
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  load() {
    return this.syncService.load();
  }

  @Put()
  save(@Body() body: Record<string, unknown>) {
    return this.syncService.save(body);
  }
}
