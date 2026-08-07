import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

/**
 * Membungkus SEMUA response sukses jadi `{ data: ... }`
 * (docs/API-Contract-Smartbox.md §1.3) — satu titik penegakan, bukan
 * ditulis manual di tiap controller (rawan lupa/inkonsisten, seperti yang
 * sempat terjadi di Epic 1-3 sebelum interceptor ini ditambahkan).
 *
 * Response yang sudah eksplisit berbentuk `{ data: ... }` (mis. kalau ada
 * controller yang tetap ingin mengontrol bentuknya sendiri) TIDAK
 * dibungkus dua kali.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((body) => {
        if (body && typeof body === 'object' && 'data' in body) {
          return body;
        }
        return { data: body };
      }),
    );
  }
}
