import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export class EmailService {
  transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT || 587),
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async renderTemplate(name: string, data: unknown): Promise<string> {
    try {
      const file = path.join(__dirname, '..', '..', 'templates', `${name}.hbs`);
      const src = fs.readFileSync(file, 'utf8');
      const tpl = Handlebars.compile(src);
      return tpl(data);
    } catch (error) {
      // log and fall back to JSON string
      console.error('renderTemplate error', { name, error });
      return JSON.stringify(data ?? {});
    }
  }

  async send(
    to: string,
    subject: string,
    opts: { data?: unknown; template?: string },
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      const html = opts.template
        ? await this.renderTemplate(opts.template, opts.data)
        : `<pre>${JSON.stringify(opts.data ?? {})}</pre>`;

      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        to,
        subject,
        html,
      });

      console.log('sent email', info && (info as any).messageId);
      return info;
    } catch (error) {
      // centralized error logging; rethrow so caller (worker) can decide DLQ/retry
      console.error('EmailService.send error', { to, subject, error });
      throw error;
    }
  }
}
