/**
 * Arquivo de configuração central da aplicação
 * Define variáveis de ambiente e configurações gerais usadas em todo o backend
 */

import * as dotenv from 'dotenv';
dotenv.config();

// Função auxiliar para validar variáveis de ambiente críticas
const validateEnv = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    console.warn(`⚠️ Variável de ambiente ${name} não definida!`);
  }
  return value || defaultValue || '';
};

// Configuração central da aplicação
export const config = {
  // Ambiente de execução
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // URL de conexão com o MongoDB
  mongoUri: validateEnv('MONGODB_URI', 'mongodb://localhost:27017/feed-me-pls'),
  
  // Porta do servidor
  port: parseInt(validateEnv('PORT', '3001'), 10),
    // Origens permitidas para CORS
  corsOrigin: '*', // Permite acesso de qualquer origem
  
  // Chave secreta para JWT
  jwtSecret: validateEnv('JWT_SECRET', 'dev-secret-key-change-in-production'),
  
  // Duração do token JWT
  jwtExpiry: '7d',
  
  // Configurações específicas do MongoDB
  mongodb: {
    options: {
      dbName: 'feed-me-pls',
    }
  },

  // Chave da API do Google (se aplicável)
  googleApiKey: process.env.GOOGLE_API_KEY || '',
};
