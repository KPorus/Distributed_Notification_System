import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqplib';

@Injectable()
export class Publisher {
  conn: amqp.Connection;
  ch: amqp.Channel;
  exchange: string;
  url: string;
  confirmsEnabled = false;
  // constructor(
  //   private readonly amqpUrl: string = 'amqp://guest:guest@rabbitmq:5672',
  //   private readonly exchangeName: string = 'notifications.topic',
  //   configService: ConfigService,
  // ) {
  //   // this.url = this.amqpUrl;
  //   this.url = configService.get<string>('AMQP_URL') || this.amqpUrl;
  //   console.log(configService.get<string>('AMQP_URL'));
  //   this.exchange = this.exchangeName;
  //   this.init().catch((err) => {
  //     console.error('Failed to initialize publisher', err);
  //   });
  // }

  constructor(private readonly configService: ConfigService) {
    // console.log(this.configService.get<string>('AMQP_URL'));
    this.url = this.configService.get<string>('AMQP_URL') as string;
    this.exchange = 'notifications.topic';

    this.init().catch((err) => {
      console.error('Failed to initialize publisher', err);
    });
  }

  async init() {
    try {
      this.conn = await amqp.connect(this.url);
      this.ch = await this.conn.createChannel();
      await this.ch.assertExchange(this.exchange, 'topic', { durable: true });

      // init succeeded
      this.confirmsEnabled = true;
      console.log('Publisher connected to', this.url);
    } catch (error) {
      // init failed
      this.confirmsEnabled = false;
      this.ch = undefined as any;
      this.conn = undefined as any;

      console.error('Failed to initialize publisher', {
        url: this.url,
        error,
      });
    }
  }

  // async init() {
  //   this.conn = await amqp.connect(this.url);
  //   this.ch = await this.conn.createChannel();
  //   await this.ch.assertExchange(this.exchange, 'topic', { durable: true });
  //   // this.confirmsEnabled = this.ch instanceof amqp.ConfirmChannel;
  //   this.confirmsEnabled = true;
  //   console.log(this.confirmsEnabled);
  //   console.log('Publisher connected to', this.url);
  // }
  async publish(routingKey: string, message: any) {
    if (!this.ch) throw new Error('channel not ready');
    const payload = Buffer.from(JSON.stringify(message));
    const success = await this.ch.publish(this.exchange, routingKey, payload, {
      persistent: true,
      headers: { attempts: 0 },
    });
    if (success && this.confirmsEnabled) {
      await new Promise((resolve, reject) => {
        this.ch.once('ack', resolve);
        this.ch.once('nack', reject);
      });
    } else if (!success) {
      throw new Error('Publish failed - queue full');
    }
  }
  async close() {
    await this.ch?.close();
    await this.conn?.close();
  }
}
