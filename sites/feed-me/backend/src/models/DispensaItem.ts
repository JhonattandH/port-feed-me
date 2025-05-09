/**
 * Modelo de Item da Dispensa
 * Define a estrutura dos itens armazenados na dispensa do usuário
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface para o documento do item da dispensa
export interface IDispensaItem extends Document {
  // Nome do item
  name: string;
  
  // Quantidade disponível
  quantity: number;
  
  // Unidade de medida (kg, g, unidade, etc)
  unit: string;
  
  // Categoria do item (legume, fruta, carne, etc)
  category: string;
  
  // Data de validade (opcional)
  expirationDate?: Date;
  
  // Metadados de data
  createdAt: Date;
  updatedAt: Date;
  
  // ID do usuário que possui este item
  userId: mongoose.Types.ObjectId;
}

// Interface para o modelo
export interface IDispensaItemModel extends Model<IDispensaItem> {
  findByCategory(category: string): Promise<IDispensaItem[]>;
  findByUser(userId: mongoose.Types.ObjectId): Promise<IDispensaItem[]>;
  findExpired(): Promise<IDispensaItem[]>;
}

// Schema do item da dispensa no MongoDB
const DispensaItemSchema = new Schema({
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
  expirationDate: { 
    type: Date,
    default: null
  },  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Temporariamente opcional para desenvolvimento
    index: true
  }
}, {
  timestamps: true
});

// Índices compostos
DispensaItemSchema.index({ userId: 1, category: 1 });
DispensaItemSchema.index({ userId: 1, expirationDate: 1 });

// Método estático para encontrar itens por categoria
DispensaItemSchema.statics.findByCategory = function(category: string) {
  return this.find({ category }).exec();
};

// Método estático para encontrar itens de um usuário específico
DispensaItemSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({ userId }).sort({ createdAt: -1 }).exec();
};

// Método estático para encontrar itens expirados
DispensaItemSchema.statics.findExpired = function() {
  return this.find({
    expirationDate: { $lt: new Date() }
  }).sort({ expirationDate: 1 }).exec();
};

// Cria e exporta o modelo
const DispensaItem = mongoose.model<IDispensaItem, IDispensaItemModel>('DispensaItem', DispensaItemSchema);
export default DispensaItem;
