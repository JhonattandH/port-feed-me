/**
 * Modelo de Usuário
 * Define a estrutura e comportamento dos documentos de usuário no MongoDB
 * Inclui métodos para hash de senha e validação
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// Interface para o documento do usuário sem métodos
export interface IUserDocument extends Document {
  name: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para o documento do usuário com métodos
export interface IUser extends IUserDocument {
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
}

// Interface para o modelo de usuário
export interface IUserModel extends mongoose.Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// Schema do usuário no MongoDB
const userSchema = new Schema({
  // Nome do usuário
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
  },
  // Sobrenome do usuário
  lastName: {
    type: String,
    required: [true, 'Sobrenome é obrigatório'],
    trim: true,
    minlength: [2, 'Sobrenome deve ter pelo menos 2 caracteres'],
    maxlength: [50, 'Sobrenome não pode ter mais de 50 caracteres']
  },
  // Email do usuário (único)
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor, use um email válido']
  },
  // Senha do usuário (será hash)
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
    select: false // Não retorna a senha em queries por padrão
  },
}, {
  // Adiciona campos createdAt e updatedAt automaticamente
  timestamps: true
});

// Método estático para encontrar usuário por email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email }).exec();
};

// Método para obter nome completo
userSchema.methods.getFullName = function(): string {
  return `${this.name} ${this.lastName}`;
};

// Middleware para hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  // Garante que estamos trabalhando com um documento que tem uma senha
  if (!this.isModified('password')) return next();

  try {
    // Gera o salt e faz o hash da senha
    const salt = await bcrypt.genSalt(10);
    this.set('password', await bcrypt.hash(this.get('password'), salt));
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método para comparar senha
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // Compara a senha fornecida com o hash armazenado
    const password = this.get('password', null, { getters: false });
    return await bcrypt.compare(candidatePassword, password);
  } catch (error) {
    throw error;
  }
};

// Cria e exporta o modelo
export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
