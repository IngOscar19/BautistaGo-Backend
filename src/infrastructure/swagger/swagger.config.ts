import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BautistaGo API',
      version: '1.0.0',
      description: 'API REST para sistema de pedidos Carnitas Bautista',
    },
    servers: [
      {
        url: '/',
        description: 'Servidor actual (Render / Producción / Local)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Servidor local de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/http/routes/*.ts', './dist/http/routes/*.js'],
});
