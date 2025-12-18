import { appService } from './app.service';
import { Controller, Post, Get, Body } from '@nestjs/common';
import type { Response } from 'express';
import { NotifyDto, OrderDto } from './Dto/dto';

@Controller('api-service')
export class AppController {
  constructor(private readonly appService: appService) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Post('/api/v1/order')
  async orderCreation(@Body() body: OrderDto) {
    return this.appService.order(body);
  }
  @Post('/api/v1/notify')
  async notify(@Body() body: NotifyDto) {
    return this.appService.notify(body);
  }

  @Get('/api/v1/health')
  getHealth(res: Response) {
    return res.status(200).send('OK');
  }

  @Get('/api/v1/metrics')
  getMetrics(res: Response) {
    return res.json({ published: 0, delivered: 0, failed: 0 });
  }
}
