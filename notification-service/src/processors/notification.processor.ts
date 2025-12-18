// notifications/notification.processor.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from '../rabbitmq/worker';
import { EmailService } from 'src/services/email.service';

@Injectable()
export class NotificationProcessor implements OnModuleInit {
  constructor(
    private readonly worker: Worker,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.worker.init();
    await this.start();
  }

  async start() {
    const ch = this.worker.ch;

    // email DLX / DLQ
    await this.worker.assertQueue('queue.email', {
      durable: true,
      arguments: { 'x-dead-letter-exchange': 'dlx.email' },
    });
    await this.worker.assertQueue('queue.email.dlq', { durable: true });
    await ch.assertExchange('dlx.email', 'fanout', { durable: true });
    await ch.bindQueue('queue.email.dlq', 'dlx.email', '');

    await this.worker.bindQueue('queue.email', 'user.signup.email');
    await this.worker.bindQueue('queue.email', 'order.completed.email');
    await this.worker.bindQueue('queue.email', 'notify.email');

    // sms DLX / DLQ
    await this.worker.assertQueue('queue.sms', {
      durable: true,
      arguments: { 'x-dead-letter-exchange': 'dlx.sms' },
    });
    await this.worker.assertQueue('queue.sms.dlq', { durable: true });
    await ch.assertExchange('dlx.sms', 'fanout', { durable: true });
    await ch.bindQueue('queue.sms.dlq', 'dlx.sms', '');
    await this.worker.bindQueue('queue.sms', '*.sms');

    // consumers
    await this.worker.consume('queue.email', async (msg, ch) => {
      const content = JSON.parse(msg.content.toString());
      const headers = msg.properties.headers || {};
      const attempts = (headers['attempts'] || 0) + 1;

      try {
        await this.emailService.send(
          content.payload.to || content.payload.email,
          'Notification',
          { data: content.payload },
        );
        ch.ack(msg);
      } catch (err: unknown) {
        console.log('err: ', err);
        if (attempts >= 3) {
          ch.nack(msg, false, false); // to DLQ
        } else {
          const newHeaders = { ...headers, attempts };
          console.log('new Header: ', newHeaders);
          // you can re‑publish with new headers if you want a smarter retry
          ch.nack(msg, false, true);
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    await this.worker.consume('queue.sms', async (msg, ch) => {
      const content = JSON.parse(msg.content.toString());
      console.log('content: ', content);
      try {
        // TODO: send SMS
        ch.ack(msg);
      } catch {
        ch.nack(msg, false, false);
      }
    });
  }
}
