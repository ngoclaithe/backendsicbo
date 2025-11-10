import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { GameModule } from './game/game.module';
import { AdminModule } from './admin/admin.module';
import { HistoryModule } from './history/history.module';
import { ChatModule} from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
    }), 

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], 
      inject: [ConfigService], 
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'txmini'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, 
      }),
    }),
    
    AuthModule,
    UsersModule,
    WalletModule,
    GameModule,
    AdminModule,
    HistoryModule,
    ChatModule
  ],
})
export class AppModule {}