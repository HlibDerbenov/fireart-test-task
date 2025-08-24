import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [AuthModule, UsersModule, ItemsModule, EmailModule],
})
export class AppModule {}
