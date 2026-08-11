import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';

@Module({
  imports: [ActivityLogModule],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
