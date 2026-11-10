import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim()),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Interview Preparation API')
    .setDescription(
      'Cadastro de perguntas e execução local isolada de pequenos trechos.',
    )
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}

void bootstrap().catch((error: unknown) => {
  console.error('Failed to start the API.', error);
  process.exitCode = 1;
});
