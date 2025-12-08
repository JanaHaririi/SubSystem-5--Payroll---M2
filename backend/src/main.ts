import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true, // Allow cookies
  });

  // Enable cookie parsing
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server running on ${process.env.PORT}`)
}
bootstrap();
