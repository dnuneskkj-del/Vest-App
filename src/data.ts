/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Delivery, DeliveryStatus, Motoboy, MotoboyStatus, FinancialTransaction, AppSettings } from "./types";

export const MOCK_MOTOBOYS: Motoboy[] = [
  {
    id: "moto-1",
    name: "Carlos Eduardo (Cadu)",
    phone: "(11) 98765-4321",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    status: MotoboyStatus.AVAILABLE,
    vehicle: "Moto",
    plate: "ABC-1234",
    rating: 4.9,
    completedDeliveries: 142,
    earningsBalance: 320.50
  },
  {
    id: "moto-2",
    name: "Rodrigo Silva",
    phone: "(11) 97654-3210",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: MotoboyStatus.BUSY,
    vehicle: "Moto",
    plate: "XYZ-9876",
    rating: 4.8,
    completedDeliveries: 98,
    earningsBalance: 180.00
  },
  {
    id: "moto-3",
    name: "Bruno " + "Oliveira",
    phone: "(11) 96543-2109",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    status: MotoboyStatus.AVAILABLE,
    vehicle: "Moto",
    plate: "MNO-4567",
    rating: 4.7,
    completedDeliveries: 76,
    earningsBalance: 95.20
  },
  {
    id: "moto-4",
    name: "Amanda Souza",
    phone: "(11) 95432-1098",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    status: MotoboyStatus.OFFLINE,
    vehicle: "Bicicleta",
    rating: 5.0,
    completedDeliveries: 34,
    earningsBalance: 0.00
  }
];

export const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "VEST-1025",
    clientName: "Mariana Alencar",
    clientPhone: "(11) 94321-0987",
    origin: {
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      postalCode: "01310-100"
    },
    destination: {
      street: "Rua Augusta",
      number: "1500",
      neighborhood: "Consolação",
      city: "São Paulo",
      postalCode: "01305-100"
    },
    distanceKm: 2.4,
    deliveryFee: 12.50,
    motoboySplit: 10.00,
    motoboyId: "moto-2",
    status: DeliveryStatus.IN_TRANSIT,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    paymentMethod: "Pix",
    orderValue: 89.90,
    notes: "Tocar interfone 42B"
  },
  {
    id: "VEST-1024",
    clientName: "João Pedro Santos",
    clientPhone: "(11) 93210-9876",
    origin: {
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      postalCode: "01310-100"
    },
    destination: {
      street: "Rua Pamplona",
      number: "750",
      neighborhood: "Jardim Paulista",
      city: "São Paulo",
      postalCode: "01405-001"
    },
    distanceKm: 1.8,
    deliveryFee: 10.00,
    motoboySplit: 8.00,
    motoboyId: "moto-1",
    status: DeliveryStatus.DELIVERED,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    deliveredAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "Pago Online",
    orderValue: 124.50,
    notes: "Deixar na portaria"
  },
  {
    id: "VEST-1026",
    clientName: "Beatriz Franco",
    clientPhone: "(11) 92109-8765",
    origin: {
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      postalCode: "01310-100"
    },
    destination: {
      street: "Alameda Lorena",
      number: "1200",
      neighborhood: "Cerqueira César",
      city: "São Paulo",
      postalCode: "01424-001"
    },
    distanceKm: 3.1,
    deliveryFee: 15.00,
    motoboySplit: 12.00,
    status: DeliveryStatus.PENDING,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    paymentMethod: "Cartão (Entregador)",
    orderValue: 45.00
  },
  {
    id: "VEST-1023",
    clientName: "Guilherme Mota",
    clientPhone: "(11) 91098-7654",
    origin: {
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      postalCode: "01310-100"
    },
    destination: {
      street: "Rua Vergueiro",
      number: "2300",
      neighborhood: "Vila Mariana",
      city: "São Paulo",
      postalCode: "04101-100"
    },
    distanceKm: 4.8,
    deliveryFee: 18.50,
    motoboySplit: 14.80,
    motoboyId: "moto-3",
    status: DeliveryStatus.DELIVERED,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 3.4 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "Dinheiro",
    orderValue: 210.00,
    notes: "Troco para R$ 100"
  },
  {
    id: "VEST-1022",
    clientName: "Carla Silveira",
    clientPhone: "(11) 90987-6543",
    origin: {
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      postalCode: "01310-100"
    },
    destination: {
      street: "Av. Brigadeiro Luís Antônio",
      number: "3000",
      neighborhood: "Jardim Paulista",
      city: "São Paulo",
      postalCode: "01402-000"
    },
    distanceKm: 2.1,
    deliveryFee: 11.50,
    motoboySplit: 9.20,
    status: DeliveryStatus.CANCELLED,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "Pix",
    orderValue: 62.10,
    notes: "Cliente desistiu da compra"
  }
];

export const MOCK_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: "TX-001",
    type: "Receita",
    description: "Taxa de Entrega VEST-1024 (Pago Online)",
    amount: 10.00,
    date: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    status: "Concluído"
  },
  {
    id: "TX-002",
    type: "Despesa",
    description: "Repasse de Entrega VEST-1024 (Carlos Eduardo)",
    amount: -8.00,
    date: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    status: "Concluído"
  },
  {
    id: "TX-003",
    type: "Receita",
    description: "Taxa de Entrega VEST-1023 (Dinheiro)",
    amount: 18.50,
    date: new Date(Date.now() - 3.4 * 60 * 60 * 1000).toISOString(),
    status: "Concluído"
  },
  {
    id: "TX-004",
    type: "Despesa",
    description: "Repasse de Entrega VEST-1023 (Bruno Oliveira)",
    amount: -14.80,
    date: new Date(Date.now() - 3.4 * 60 * 60 * 1000).toISOString(),
    status: "Concluído"
  },
  {
    id: "TX-005",
    type: "Saque Motoboy",
    description: "Saque solicitado por Carlos Eduardo",
    amount: -150.00,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Concluído"
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  baseFee: 6.50,
  perKmFee: 2.50,
  motoboyPercent: 80,
  storeName: "VestApp Logistics Hub SP",
  storePhone: "(11) 3254-0999",
  storeAddress: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
  apiKey: "vest_live_55a82c91b8d2ef01024c",
  webhookUrl: "https://vest-app-six.vercel.app/api/webhooks/deliveries"
};

export const MOCK_CHART_DATA = [
  { name: "Seg", entregas: 28, faturamento: 310, repasses: 248 },
  { name: "Ter", entregas: 35, faturamento: 420, repasses: 336 },
  { name: "Qua", entregas: 42, faturamento: 512, repasses: 409 },
  { name: "Qui", entregas: 38, faturamento: 460, repasses: 368 },
  { name: "Sex", entregas: 55, faturamento: 680, repasses: 544 },
  { name: "Sáb", entregas: 68, faturamento: 890, repasses: 712 },
  { name: "Dom", entregas: 45, faturamento: 550, repasses: 440 }
];
