import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL, 
      'https://33dfde4daea54c11912db39ff7dc75dc-glow-world.projects.builder.my',
      'http://localhost:3000',
    ].filter(Boolean), 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(3001);
  console.log('🚀 Server running on http://localhost:3001');
}
bootstrap();
