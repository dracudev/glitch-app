import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/database/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const frontendUrl = configService.get<string>('FRONTEND_URL');

  if (!frontendUrl) {
    logger.warn('FRONTEND_URL environment variable not set. CORS might fail in production.');
  }

  app.enableCors({
    origin: frontendUrl || 'http://localhost:4321',
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );

  app.use(compression());

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Glitch API')
      .setDescription('A social network for gamers - API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management and profiles')
      .addTag('Games', 'Game catalog and information')
      .addTag('Reviews', 'Game reviews and ratings')
      .addTag('Social', 'Social features (follows, likes, comments)')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(
      `📚 Swagger documentation available at http://localhost:${configService.get('PORT', 3000)}/api/docs`,
    );
  }

  // Graceful shutdown
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error, 'Bootstrap');
  process.exit(1);
});
