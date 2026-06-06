import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DataResponseDto<T> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional()
  meta?: Record<string, unknown>;

  @ApiPropertyOptional()
  token?: string;

  constructor(partial: Partial<DataResponseDto<T>>) {
    Object.assign(this, partial);
  }

  static success<T>(data: T, message = 'Operation successful', meta?: Record<string, unknown>) {
    return new DataResponseDto<T>({
      statusCode: 200,
      status: true,
      message,
      data,
      meta,
    });
  }

  static created<T>(data: T, message = 'Created successfully') {
    return new DataResponseDto<T>({
      statusCode: 201,
      status: true,
      message,
      data,
    });
  }

  static error(message: string, statusCode = 400) {
    return new DataResponseDto({
      statusCode,
      status: false,
      message,
    });
  }
}
