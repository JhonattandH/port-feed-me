/**
 * Controlador de Autenticação
 * Gerencia todas as operações relacionadas a autenticação de usuários
 * Inclui registro (signup), login e validação de tokens
 */

import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import mongoose from 'mongoose';
import { TypedRequestBody } from '../types/express';

// Interface para dados de registro
interface RegisterDTO {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

// Interface para dados de login
interface LoginDTO {
  email: string;
  password: string;
}

// Interface para dados do token JWT
interface JwtPayload {
  userId: string;
}

// Classe de erro personalizada para erros HTTP
class HttpError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// Implementação do controlador de autenticação
export const authController = {
  /**
   * Registra um novo usuário
   * @param req Requisição contendo nome, sobrenome, email e senha
   * @param res Resposta contendo token JWT e dados do usuário
   */
  async register(req: Request, res: Response) {
    try {
      const { name, lastName, email, password } = req.body;
      
      // Validação dos campos obrigatórios
      if (!name || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }

      // Verifica conexão com MongoDB
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Erro de conexão com o banco de dados' });
      }

      // Verifica se o email já está em uso
      const existingUser = await User.findOne({ email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: 'Este email já está em uso' });
      }

      // Cria o novo usuário
      const user = new User({
        name,
        lastName,
        email,
        password
      });

      try {
        await user.save();
      } catch (saveError: any) {
        if (saveError.code === 11000) {
          return res.status(400).json({ message: 'Email já está em uso' });
        }
        throw saveError;
      }
      
      // Gera o token JWT
      const token = jwt.sign(
        { userId: user._id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiry }
      );

      // Retorna os dados do usuário e o token
      return res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          lastName: user.lastName,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return res.status(500).json({ message: 'Erro ao criar conta' });
    }
  },

  /**
   * Realiza o login do usuário
   * @param req Requisição contendo email e senha
   * @param res Resposta contendo token JWT e dados do usuário
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validação dos campos obrigatórios
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }

      // Verifica conexão com MongoDB
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Serviço temporariamente indisponível' });
      }

      // Busca o usuário pelo email
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Email ou senha inválidos' });
      }

      // Verifica a senha
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Email ou senha inválidos' });
      }

      // Gera o token JWT
      const token = jwt.sign(
        { userId: user._id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiry }
      );

      // Retorna os dados do usuário e o token
      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          lastName: user.lastName,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return res.status(500).json({ message: 'Erro ao fazer login' });
    }
  },

  /**
   * Verifica se o token JWT é válido
   * @param req Requisição contendo token JWT no header Authorization
   * @param res Resposta com status 200 se o token for válido
   */
  async verifyToken(req: Request, res: Response) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido' });
      }
      
      try {
        // Verifica o token
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        
        // Verifica se o usuário existe
        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Usuário não encontrado' });
        }
        
        return res.json({ 
          valid: true, 
          user: {
            id: user._id,
            name: user.name,
            lastName: user.lastName,
            email: user.email
          } 
        });
      } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return res.status(500).json({ message: 'Erro ao verificar autenticação' });
    }
  }
};
