/**
 * Arquivo principal da aplicação
 * Responsável pela configuração do servidor Express e suas middlewares
 * Define as rotas e configurações básicas como CORS e conexão com MongoDB
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from './config/config';
import { authRoutes } from './routes/authRoutes';
import dispensaRoutes from './routes/dispensaRoutes';
import comprasRoutes from './routes/comprasRoutes';
import recipeRoutes from './routes/recipeRoutes';

// Inicialização do Express
const app = express();

// Middleware para logging (somente em desenvolvimento)
if (config.isDev) {
  app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    
    next();
  });
}

// Configuração do CORS - Permitindo acesso de qualquer origem
app.use(cors({
  origin: true, // Permite todas as origens
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204,
  preflightContinue: false
}));

// Middlewares para parsing do corpo das requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota básica
app.get('/', (req, res) => {
  res.json({ message: 'API Feed Me - Server OK', version: '1.0.0' });
});

// Rota de health check
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongo: mongoStatus,
    env: {
      nodeEnv: config.nodeEnv,
      port: config.port,
    }
  });
});

// Registro das rotas da API
app.use('/api/auth', authRoutes);        // Rotas de autenticação
app.use('/api', dispensaRoutes);         // Rotas da dispensa
app.use('/api', comprasRoutes);          // Rotas de compras
app.use('/api', recipeRoutes);           // Rotas de receitas

// Importação dos middlewares de erro
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware';

// Middleware para rotas não encontradas
app.use('*', notFoundHandler);

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout após 5 segundos
    });
    console.log('✅ Conectado com sucesso ao MongoDB');
    
    // Listeners para eventos de conexão
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão com MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Desconectado do MongoDB. Tentando reconectar...');
      setTimeout(connectDB, 5000);
    });

    // Tratamento de encerramento gracioso
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexão MongoDB fechada devido ao encerramento da aplicação');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    setTimeout(connectDB, 5000); // Tenta reconectar
  }
};

// Error handling middleware
app.use(errorHandler);

// Inicialização do servidor
const startServer = async () => {
  try {
    const server = app.listen(config.port, () => {
      console.log(`✅ Servidor rodando na porta ${config.port}`);
    });

    // Inicializa conexão com o banco de dados
    await connectDB();

    // Handler para erros do servidor
    server.on('error', (err) => {
      console.error('❌ Erro no servidor HTTP:', err);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Exportamos o app para testes e inicia o servidor
export { app };

// Inicia o servidor apenas se não estiver sendo importado (para testes)
if (require.main === module) {
  startServer();
}
