import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Validasi body request pakai skema Zod (§9.3) — dipasang per-route lewat
 * `@UsePipes(new ZodValidationPipe(schema))`, bukan class-validator
 * decorator, supaya skema validasi tetap satu sumber kebenaran yang bisa
 * dibagi ke frontend (§9.3).
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ');
      throw new BadRequestException({
        error: { code: 'VALIDATION_ERROR', message },
      });
    }
    return result.data;
  }
}
