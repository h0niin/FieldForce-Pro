import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  constructor(private readonly maxSizeInBytes: number = 5 * 1024 * 1024) {} // 5MB default

  transform(value: Express.Multer.File) {
    if (!value) {
      throw new BadRequestException('File is required');
    }
    if (value.size > this.maxSizeInBytes) {
      const maxMB = (this.maxSizeInBytes / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(`File size exceeds the limit of ${maxMB}MB`);
    }
    return value;
  }
}
