/**
 * Modelo de Item da Lista de Compras
 * Define a estrutura dos itens na lista de compras do usuário
 * e o histórico de compras realizadas
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface para o documento do item da lista de compras
export interface IComprasItem extends Document {
  // Nome do item
  name: string;
  
  // Quantidade a ser comprada
  quantity: number;
  
  // Unidade de medida (kg, g, unidade, etc)
  unit: string;
  
  // Categoria do item (legume, fruta, carne, etc)
  category: string;
  
  // Quantidade já comprada (para compras parciais)
  bought: number;
  
  // Preço unitário (se disponível)
  price?: number;
  
  // Metadados de data
  createdAt: Date;
  updatedAt: Date;
  
  // ID do usuário que possui este item
  userId: mongoose.Types.ObjectId;
  
  // Prioridade do item (baixa, média, alta)
  priority?: string;
}

// Interface para compra finalizada/histórico
export interface ICompletedPurchase extends Document {
  // Itens comprados
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    bought: number;
    price: number;
  }>;
  
  // Data da compra
  date: Date;
  
  // Total gasto
  totalSpent: number;
  
  // ID do usuário
  userId: mongoose.Types.ObjectId;
  
  // Local da compra (opcional)
  store?: string;
  
  // Observações
  notes?: string;
}

// Interface para o modelo de item da lista de compras
export interface IComprasItemModel extends Model<IComprasItem> {
  findByCategory(category: string): Promise<IComprasItem[]>;
  findByUser(userId: mongoose.Types.ObjectId): Promise<IComprasItem[]>;
  findPendingByUser(userId: mongoose.Types.ObjectId): Promise<IComprasItem[]>;
}

// Interface para o modelo de compra finalizada
export interface ICompletedPurchaseModel extends Model<ICompletedPurchase> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<ICompletedPurchase[]>;
  findByDateRange(userId: mongoose.Types.ObjectId, start: Date, end: Date): Promise<ICompletedPurchase[]>;
}

// Schema do item da lista de compras no MongoDB
const ComprasItemSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Nome do item é obrigatório'],
    trim: true,
    index: true
  },
  quantity: { 
    type: Number, 
    required: [true, 'Quantidade é obrigatória'],
    min: [0, 'Quantidade não pode ser negativa']
  },
  unit: { 
    type: String, 
    required: [true, 'Unidade de medida é obrigatória'],
    enum: ['kg', 'g', 'ml', 'l', 'unidade', 'outro'],
    default: 'unidade'
  },
  category: { 
    type: String, 
    required: [true, 'Categoria é obrigatória'],
    index: true
  },
  bought: {
    type: Number,
    default: 0,
    min: [0, 'Quantidade comprada não pode ser negativa']
  },  price: {
    type: Number,
    min: [0, 'Preço não pode ser negativo']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Temporariamente opcional para desenvolvimento
    index: true
  },
  priority: {
    type: String,
    enum: ['baixa', 'média', 'alta'],
    default: 'média'
  }
}, {
  timestamps: true
});

// Schema de compra finalizada no MongoDB
const CompletedPurchaseSchema = new Schema({
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    category: { type: String, required: true },
    bought: { type: Number, required: true },
    price: { type: Number }
  }],
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  totalSpent: {
    type: Number,
    required: true,
    min: [0, 'Valor não pode ser negativo']
  },  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Temporariamente opcional para desenvolvimento
    index: true
  },
  store: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Índices compostos
ComprasItemSchema.index({ userId: 1, category: 1 });
ComprasItemSchema.index({ userId: 1, bought: 1 });

CompletedPurchaseSchema.index({ userId: 1, date: -1 });

// Métodos estáticos para ComprasItem
ComprasItemSchema.statics.findByCategory = function(category: string) {
  return this.find({ category }).exec();
};

ComprasItemSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({ userId }).sort({ createdAt: -1 }).exec();
};

ComprasItemSchema.statics.findPendingByUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({ 
    userId,
    $expr: { $lt: ['$bought', '$quantity'] }
  }).sort({ priority: -1 }).exec();
};

// Métodos estáticos para CompletedPurchase
CompletedPurchaseSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({ userId }).sort({ date: -1 }).exec();
};

CompletedPurchaseSchema.statics.findByDateRange = function(userId: mongoose.Types.ObjectId, start: Date, end: Date) {
  return this.find({ 
    userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: -1 }).exec();
};

// Cria e exporta os modelos
export const ComprasItem = mongoose.model<IComprasItem, IComprasItemModel>('ComprasItem', ComprasItemSchema);
export const CompletedPurchase = mongoose.model<ICompletedPurchase, ICompletedPurchaseModel>('CompletedPurchase', CompletedPurchaseSchema);

export default ComprasItem;
