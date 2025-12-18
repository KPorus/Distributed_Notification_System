import { Module } from '@nestjs/common';
import { NotificationProcessor } from './processors/notification.processor';
import { EmailService } from './services/email.service';
import { Worker } from './rabbitmq/worker';
import { ConfigModule } from '@nestjs/config';
// import { EmailService } from './services/email.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [Worker, EmailService, NotificationProcessor],
  exports: [EmailService, Worker, NotificationProcessor],
})
export class AppModule {}
