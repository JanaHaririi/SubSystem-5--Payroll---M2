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

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Server running on ${port}`)
}
bootstrap();
