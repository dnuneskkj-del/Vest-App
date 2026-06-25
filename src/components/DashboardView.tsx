/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  TrendingUp, 
  MapPin, 
  Truck, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User, 
  Navigation, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend 
} from "recharts";
import { Delivery, Motoboy, DeliveryStatus, MotoboyStatus } from "../types";
import { MOCK_CHART_DATA } from "../data";

interface DashboardViewProps {
  deliveries: Delivery[];
  motoboys: Motoboy[];
  onSelectDelivery: (delivery: Delivery) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({ 
  deliveries, 
  motoboys, 
  onSelectDelivery,
  onNavigateToTab 
}: DashboardViewProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  // Calculates metrics
  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter(d => d.status === DeliveryStatus.PENDING).length;
  const activeDeliveries = deliveries.filter(d => 
    d.status === DeliveryStatus.COLLECTING || d.status === DeliveryStatus.IN_TRANSIT
  ).length;
  const completedDeliveries = deliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length;
  
  const totalRevenue = deliveries
    .filter(d => d.status === DeliveryStatus.DELIVERED)
    .reduce((sum, d) => sum + d.deliveryFee, 0);
    
  const totalMotoboyEarnings = deliveries
    .filter(d => d.status === DeliveryStatus.DELIVERED)
    .reduce((sum, d) => sum + d.motoboySplit, 0);

  const activeMotoboysCount = motoboys.filter(m => m.status !== MotoboyStatus.OFFLINE).length;

  const averageDistance = totalDeliveries > 0 
    ? (deliveries.reduce((sum, d) => sum + d.distanceKm, 0) / totalDeliveries).toFixed(1)
    : "0";

  // Active status color helper
  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case DeliveryStatus.COLLECTING:
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case DeliveryStatus.IN_TRANSIT:
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case DeliveryStatus.DELIVERED:
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case DeliveryStatus.CANCELLED:
        return "bg-rose-50 text-rose-700 border border-rose-200";
    }
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden" id="welcome-banner">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-10 -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500 rounded-full filter blur-3xl opacity-5 -mb-20"></div>
        
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 text-indigo-200 text-xs font-semibold rounded-full border border-indigo-500/30">
            <Sparkles size={12} />
            <span>Painel de Logística Ativo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, VestApp Manager! 👋
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Seu canal de entregas local está funcionando perfeitamente. Hoje você tem <span className="text-white font-semibold">{pendingDeliveries} entregas aguardando</span> motoboy e <span className="text-indigo-200 font-semibold">{activeDeliveries} rotas em andamento</span>.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-grid">
        {/* Metric 1 */}
        <div 
          className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${hoveredMetric === "pending" ? "border-amber-400 scale-[1.02]" : ""}`}
          onMouseEnter={() => setHoveredMetric("pending")}
          onMouseLeave={() => setHoveredMetric(null)}
          onClick={() => onNavigateToTab("entregas")}
          id="metric-pending"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-semibold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full">Pendentes</span>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">{pendingDeliveries}</span>
            <p className="text-xs text-slate-500 font-medium">Aguardando Coleta</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${hoveredMetric === "active" ? "border-indigo-400 scale-[1.02]" : ""}`}
          onMouseEnter={() => setHoveredMetric("active")}
          onMouseLeave={() => setHoveredMetric(null)}
          onClick={() => onNavigateToTab("entregas")}
          id="metric-active"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Truck size={20} />
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-full">Em Rota</span>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">{activeDeliveries}</span>
            <p className="text-xs text-slate-500 font-medium">Motoristas em Trânsito</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${hoveredMetric === "revenue" ? "border-emerald-400 scale-[1.02]" : ""}`}
          onMouseEnter={() => setHoveredMetric("revenue")}
          onMouseLeave={() => setHoveredMetric(null)}
          onClick={() => onNavigateToTab("financeiro")}
          id="metric-revenue"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">Faturamento</span>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">R$ {totalRevenue.toFixed(2)}</span>
            <p className="text-xs text-slate-500 font-medium">Ganhos de Frete de Hoje</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${hoveredMetric === "motoboys" ? "border-slate-400 scale-[1.02]" : ""}`}
          onMouseEnter={() => setHoveredMetric("motoboys")}
          onMouseLeave={() => setHoveredMetric(null)}
          onClick={() => onNavigateToTab("motoboys")}
          id="metric-motoboys"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-700">
              <User size={20} />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded-full">Motoboys</span>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">{activeMotoboysCount}</span>
            <p className="text-xs text-slate-500 font-medium">Ativos no App Agora</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-main-grid">
        
        {/* Charts Panel */}
        <div className="lg:col-span-2 space-y-6" id="charts-panel">
          {/* Main Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="volume-chart">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Faturamento & Volume de Entregas</h3>
                <p className="text-xs text-slate-500">Histórico de rendimento nos últimos 7 dias</p>
              </div>
              <div className="flex gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                  Ganhos (R$)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Repasses (R$)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRepasses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }} />
                  <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFaturamento)" />
                  <Area type="monotone" dataKey="repasses" name="Repasse Motoboys" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRepasses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick interactive Simulator Map Mockup */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="delivery-tracking-simulation">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Localização dos Motoboys em Tempo Real</h3>
                <p className="text-xs text-slate-500">Monitoramento GPS simulado da frota</p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  GPRS Ativo
                </span>
              </div>
            </div>

            {/* Simulated Vector Map */}
            <div className="relative h-48 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center">
              {/* Decorative Map Lines */}
              <svg className="absolute inset-0 w-full h-full text-slate-200 opacity-80" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 40 L 400 40 M 100 0 L 100 200 M 0 120 L 400 120 M 280 0 L 280 200 M 0 170 Q 200 100 400 170" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                <path d="M 50 10 L 120 180 M 310 10 L 250 190" stroke="currentColor" strokeWidth="1.5" fill="none" />
                {/* Hub/Store Location */}
                <circle cx="200" cy="100" r="32" fill="#4f46e5" fillOpacity="0.08" />
                <circle cx="200" cy="100" r="16" fill="#4f46e5" fillOpacity="0.15" />
                <circle cx="200" cy="100" r="5" fill="#4f46e5" />
              </svg>

              {/* Map Pins / Motoboy Markers */}
              {motoboys.map((moto, idx) => {
                const positions = [
                  { left: "28%", top: "35%" }, // Carlos
                  { left: "48%", top: "65%" }, // Rodrigo
                  { left: "70%", top: "25%" }, // Bruno
                  { left: "80%", top: "75%" }  // Amanda
                ];
                const pos = positions[idx % positions.length];

                if (moto.status === MotoboyStatus.OFFLINE) return null;

                return (
                  <div 
                    key={moto.id} 
                    className="absolute flex flex-col items-center group cursor-pointer transition-all hover:scale-110"
                    style={{ left: pos.left, top: pos.top }}
                  >
                    <div className="relative">
                      <div className={`absolute -inset-1.5 rounded-full opacity-35 animate-ping ${moto.status === MotoboyStatus.AVAILABLE ? "bg-emerald-500" : "bg-indigo-500"}`}></div>
                      <div className={`w-8 h-8 rounded-full border-2 overflow-hidden bg-white shadow-md flex items-center justify-center ${moto.status === MotoboyStatus.AVAILABLE ? "border-emerald-500" : "border-indigo-500"}`}>
                        <img src={moto.avatar} alt={moto.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="mt-1 bg-slate-900/90 text-[9px] text-white font-bold py-0.5 px-2 rounded shadow-md whitespace-nowrap pointer-events-none opacity-90">
                      {moto.name.split(" ")[0]}
                    </div>
                  </div>
                );
              })}

              {/* Store center badge */}
              <div className="absolute left-[180px] top-[75px] flex flex-col items-center">
                <div className="bg-indigo-600 text-white p-1 rounded-lg shadow-md border border-indigo-400">
                  <MapPin size={14} />
                </div>
                <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow mt-0.5">HUB VestApp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Deliveries Live List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between" id="recent-deliveries-list">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Últimas Entregas</h3>
            <p className="text-xs text-slate-500">Status em tempo real das saídas</p>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px] pr-1 space-y-3 mt-4 flex-grow">
            {deliveries.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <AlertCircle size={32} className="mx-auto text-slate-300" />
                <p className="text-sm font-medium text-slate-500">Nenhuma entrega cadastrada</p>
              </div>
            ) : (
              deliveries.slice(0, 5).map((delivery) => {
                const moto = motoboys.find(m => m.id === delivery.motoboyId);
                return (
                  <div 
                    key={delivery.id} 
                    className="pt-3 pb-3 first:pt-0 last:pb-0 flex items-center justify-between group hover:bg-slate-50/50 p-2 rounded-xl transition-all cursor-pointer"
                    onClick={() => onSelectDelivery(delivery)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 text-slate-600 transition-colors">
                        <Navigation size={16} className="rotate-45" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700">{delivery.id}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${getStatusBadge(delivery.status)}`}>
                            {delivery.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{delivery.clientName}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 flex items-center gap-0.5">
                          <MapPin size={10} />
                          {delivery.destination.neighborhood}, {delivery.destination.city}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-xs font-bold text-slate-800">R$ {delivery.deliveryFee.toFixed(2)}</span>
                      {moto && (
                        <p className="text-[9px] text-slate-400 max-w-[80px] truncate">
                          🏍️ {moto.name.split(" ")[0]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button 
            onClick={() => onNavigateToTab("entregas")}
            className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200/60"
          >
            <span>Ver todas as entregas</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
