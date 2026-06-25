/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum DeliveryStatus {
  PENDING = "Pendente",
  COLLECTING = "Coletando",
  IN_TRANSIT = "Em trânsito",
  DELIVERED = "Entregue",
  CANCELLED = "Cancelado"
}

export enum MotoboyStatus {
  AVAILABLE = "Disponível",
  BUSY = "Em entrega",
  OFFLINE = "Offline"
}

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  postalCode: string;
}

export interface Delivery {
  id: string; // e.g. "VEST-1024"
  clientName: string;
  clientPhone: string;
  origin: Address;
  destination: Address;
  distanceKm: number;
  deliveryFee: number;
  motoboySplit: number; // money going to the motoboy
  motoboyId?: string; // id of assigned motoboy
  status: DeliveryStatus;
  createdAt: string;
  deliveredAt?: string;
  notes?: string;
  paymentMethod: "Dinheiro" | "Pix" | "Cartão (Entregador)" | "Pago Online";
  orderValue: number; // value of products being delivered
}

export interface Motoboy {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  status: MotoboyStatus;
  vehicle: "Moto" | "Bicicleta" | "Carro";
  plate?: string;
  rating: number;
  completedDeliveries: number;
  earningsBalance: number; // what they currently earned and is pending split payout
}

export interface FinancialTransaction {
  id: string;
  type: "Receita" | "Despesa" | "Saque Motoboy";
  description: string;
  amount: number;
  date: string;
  status: "Concluído" | "Pendente";
}

export interface AppSettings {
  baseFee: number;       // R$ base rate
  perKmFee: number;      // R$ per KM rate
  motoboyPercent: number; // % going to motoboy, default e.g. 80%
  storeName: string;
  storePhone: string;
  storeAddress: string;
  apiKey: string;
  webhookUrl: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: string;
  read: boolean;
}
