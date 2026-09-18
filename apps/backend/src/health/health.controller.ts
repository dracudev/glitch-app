import { Controller, Get } from '@nestjs/common';
import { Public } from '@/auth/decorators';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  health(): { status: string } {
    return { status: 'ok' };
  }
}
