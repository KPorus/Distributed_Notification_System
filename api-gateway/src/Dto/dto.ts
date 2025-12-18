// notify.dto.ts
import { IsString, IsOptional, IsObject } from 'class-validator';

export class NotifyDto {
  @IsString()
  type: string;

  @IsString()
  to: string;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
export class OrderDto {
  @IsString()
  orderId: string;

  @IsString()
  userId: string;

  @IsString()
  email: string;

  @IsObject()
  amount: Record<string, any>;

  @IsObject()
  items: Record<string, any>;
}
export class UserDto {
  @IsString()
  userId: string;

  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsString()
  pass: Record<string, any>;
}
