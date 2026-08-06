import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: '@smartbox/backend',
      description:
        'Smartbox API — lihat docs/API-Contract-Smartbox.md untuk kontrak endpoint lengkap.',
    };
  }
}
