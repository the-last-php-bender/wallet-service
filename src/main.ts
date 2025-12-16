import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Accept,Authorization',
    credentials: true,
  });

  // Set global API prefix with version
  const apiVersion =process.env.API_VERSION || 'v1';
  app.setGlobalPrefix(`api/${apiVersion}`);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger only in development
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(`Wallet API ${apiVersion}`)
      .setDescription('API documentation for wallet service')
      .setVersion(apiVersion)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`api/docs/${apiVersion}`, app, document);
  }

  // Start server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV ?? 'development'} mode`);
}

bootstrap();
