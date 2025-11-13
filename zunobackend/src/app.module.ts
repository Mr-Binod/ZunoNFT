import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { WalletModule } from './wallet/wallet.module';
// import { ModelModule } from './model/model.module';
// import { SequelizeModule } from '@nestjs/sequelize';
import { AccountModule } from './account/account.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartAccInfoEntity } from './account/entities/account.entity';
import { BundlerModule } from './bundler/bundler.module';
import { ContractsModule } from './contracts/contracts.module';
import { NftUriEntity } from './contracts/entities/nft-uri.entity';
import { SellNftEntity } from './contracts/entities/sell-nft.entity';
import { UserNftEntity } from './contracts/entities/user-nft.entity';


@Module({
  // imports: [WalletModule, ModelModule,
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available app-wide
    }),
   TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST', 'localhost'), // env 파일에 host가 없다면 localhost 기본값
        port: configService.get<number>('DB_PORT', 3306), // 포트는 env에 없다면 기본값 3306 사용
        username: configService.get<string>('DATABASE_NAME'), // process.env.DATABASE_NAME 대신 사용
        password: configService.get<string>('DATABASE_PASSWORD'), // process.env.DATABASE_PASSWORD 대신 사용
        database: 'b3project',
        entities: [SmartAccInfoEntity, UserNftEntity, NftUriEntity, SellNftEntity],
        synchronize: false,
      }),
      inject: [ConfigService], // ConfigService를 주입합니다.
    }),
    // SequelizeModule.forRoot({
    //   dialect: 'mysql', // or 'postgres', etc.
    //   host: 'localhost',
    //   port: 3306,
    //   username: 'myid',
    //   password: '1994!BDs',
    //   database: 'B3project',
    //   autoLoadModels: true,
    //   synchronize: true,
    //   sync: { force: false },
    // }),
    TypeOrmModule.forFeature([SmartAccInfoEntity, UserNftEntity, NftUriEntity, SellNftEntity]),
    AccountModule,
    BundlerModule,
    ContractsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

  
