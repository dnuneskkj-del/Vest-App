/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Phone, 
  Clock, 
  User, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Truck, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  AlertCircle,
  HelpCircle,
  X
} from "lucide-react";
import { Delivery, DeliveryStatus, Motoboy } from "../types";

interface DeliveriesListViewProps {
  deliveries: Delivery[];
  motoboys: Motoboy[];
  onUpdateDeliveryStatus: (id: string, status: DeliveryStatus) => void;
  onAssignMotoboy: (deliveryId: string, motoboyId: string) => void;
  selectedDeliveryId: string | null;
  onSelectDeliveryId: (id: string | null) => void;
}

export default function DeliveriesListView({
  deliveries,
  motoboys,
  onUpdateDeliveryStatus,
  onAssignMotoboy,
  selectedDeliveryId,
  onSelectDeliveryId
}: DeliveriesListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [motoboyFilter, setMotoboyFilter] = useState<string>("TODOS");

  // Selected delivery for drawer
  const selectedDelivery = deliveries.find(d => d.id === selectedDeliveryId);

  // Status color badge helper
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

  // Filtered deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch = 
      d.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.destination.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.destination.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "TODOS" || d.status === statusFilter;
    
    const matchesMotoboy = motoboyFilter === "TODOS" || 
      (motoboyFilter === "NENHUM" && !d.motoboyId) ||
      d.motoboyId === motoboyFilter;

    return matchesSearch && matchesStatus && matchesMotoboy;
  });

  const handlePrintSlip = (delivery: Delivery) => {
    // Elegant mock of a printed slip
    const receiptText = `
=================================
       VESTAPP ENTREGAS
      COMPROVANTE DE ENVIO
=================================
ID: ${delivery.id}
DATA: ${new Date(delivery.createdAt).toLocaleString("pt-BR")}
STATUS: ${delivery.status.toUpperCase()}

DESTINATÁRIO:
Nome: ${delivery.clientName}
Tel: ${delivery.clientPhone}

ORIGEM:
${delivery.origin.street}, ${delivery.origin.number}
Bairro: ${delivery.origin.neighborhood}
Cidade: ${delivery.origin.city}

DESTINO:
${delivery.destination.street}, ${delivery.destination.number}
Bairro: ${delivery.destination.neighborhood}
Cidade: ${delivery.destination.city}
CEP: ${delivery.destination.postalCode}

---------------------------------
DISTÂNCIA: ${delivery.distanceKm} KM
TAXA ENTREGA: R$ ${delivery.deliveryFee.toFixed(2)}
FORMA PAGT: ${delivery.paymentMethod}
OBS: ${delivery.notes || "Nenhuma"}
=================================
    Obrigado por usar VestApp!
=================================
    `;
    
    // Create popup window with text
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px; padding: 20px; border: 1px dashed #ccc; width: 300px; margin: auto;">${receiptText}</pre>`);
      printWindow.document.write(`<script>window.print();</script>`);
      printWindow.document.close();
    } else {
      alert("Popup bloqueado pelo navegador. Veja os dados de impressão abaixo:\n\n" + receiptText);
    }
  };

  return (
    <div className="space-y-6" id="deliveries-list-container">
      {/* Search and Filters panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="filters-card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-3.5 top-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, nome de cliente ou bairro de destino..."
              className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-4 py-3 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Quick status dropdown filters */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex-1 sm:flex-initial space-y-0.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Filtrar por Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all cursor-pointer w-full"
              >
                <option value="TODOS">Todos os Status</option>
                <option value={DeliveryStatus.PENDING}>Pendente</option>
                <option value={DeliveryStatus.COLLECTING}>Coletando</option>
                <option value={DeliveryStatus.IN_TRANSIT}>Em trânsito</option>
                <option value={DeliveryStatus.DELIVERED}>Entregue</option>
                <option value={DeliveryStatus.CANCELLED}>Cancelado</option>
              </select>
            </div>

            <div className="flex-1 sm:flex-initial space-y-0.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Motoboy Designado</label>
              <select 
                value={motoboyFilter}
                onChange={(e) => setMotoboyFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all cursor-pointer w-full"
              >
                <option value="TODOS">Todos os Entregadores</option>
                <option value="NENHUM">Sem Entregador Atribuído</option>
                {motoboys.map((moto) => (
                  <option key={moto.id} value={moto.id}>{moto.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table vs List Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="deliveries-content-layout">
        
        {/* Deliveries Table/Card list (Takes up 2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-4" id="deliveries-main-list">
          {filteredDeliveries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-3">
              <AlertCircle size={36} className="mx-auto text-slate-300" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">Nenhuma entrega encontrada</p>
                <p className="text-xs text-slate-400">Verifique os termos de busca ou tente redefinir seus filtros.</p>
              </div>
            </div>
          ) : (
            filteredDeliveries.map((delivery) => {
              const assignedMoto = motoboys.find(m => m.id === delivery.motoboyId);
              const isSelected = selectedDeliveryId === delivery.id;

              return (
                <div 
                  key={delivery.id}
                  onClick={() => onSelectDeliveryId(delivery.id)}
                  className={`bg-white rounded-2xl border transition-all duration-300 p-5 shadow-sm hover:shadow-md cursor-pointer flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center ${isSelected ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-100"}`}
                  id={`delivery-card-${delivery.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Visual transport status icon indicator */}
                    <div className={`p-3 rounded-2xl ${isSelected ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-600"}`}>
                      <Truck size={18} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-800">{delivery.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${getStatusBadge(delivery.status)}`}>
                          {delivery.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          • {new Date(delivery.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900">{delivery.clientName}</h4>
                      
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1">
                        <MapPin size={11} className="text-slate-400 inline" />
                        <span>{delivery.destination.street}, {delivery.destination.number} - {delivery.destination.neighborhood}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right space-y-0.5">
                      <span className="text-xs font-extrabold text-slate-800 block">R$ {delivery.deliveryFee.toFixed(2)}</span>
                      <p className="text-[10px] text-slate-400">
                        {delivery.distanceKm} KM • {delivery.paymentMethod}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {assignedMoto ? (
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-xl">
                          <img src={assignedMoto.avatar} alt={assignedMoto.name} className="w-5 h-5 rounded-full object-cover border border-slate-300" />
                          <span className="text-[10px] font-bold text-slate-600 max-w-[80px] truncate">{assignedMoto.name.split(" ")[0]}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-xl">Aguardando Motoboy</span>
                      )}

                      <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detailed Delivery Drawer (Side Panel - Column 3 on Desktop) */}
        <div className="lg:col-span-1" id="delivery-details-sidebar">
          {selectedDelivery ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 sticky top-6" id="delivery-details-card">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-extrabold text-slate-400">Detalhes da Entrega</span>
                  <h3 className="font-extrabold text-slate-800 text-sm">{selectedDelivery.id}</h3>
                </div>
                <button 
                  onClick={() => onSelectDeliveryId(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status and Action Panel */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Ações de Entrega</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onUpdateDeliveryStatus(selectedDelivery.id, DeliveryStatus.DELIVERED)}
                    disabled={selectedDelivery.status === DeliveryStatus.DELIVERED || selectedDelivery.status === DeliveryStatus.CANCELLED}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:opacity-40 text-[10px] font-bold rounded-xl transition-all border border-emerald-150 inline-flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={12} />
                    <span>Marcar Entregue</span>
                  </button>
                  <button 
                    onClick={() => onUpdateDeliveryStatus(selectedDelivery.id, DeliveryStatus.CANCELLED)}
                    disabled={selectedDelivery.status === DeliveryStatus.DELIVERED || selectedDelivery.status === DeliveryStatus.CANCELLED}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-40 text-[10px] font-bold rounded-xl transition-all border border-rose-150 inline-flex items-center justify-center gap-1"
                  >
                    <XCircle size={12} />
                    <span>Cancelar</span>
                  </button>
                </div>

                {/* Flow update */}
                {selectedDelivery.status === DeliveryStatus.PENDING && (
                  <button 
                    onClick={() => onUpdateDeliveryStatus(selectedDelivery.id, DeliveryStatus.COLLECTING)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <Truck size={12} />
                    <span>Iniciar Coleta de Pacote</span>
                  </button>
                )}
                {selectedDelivery.status === DeliveryStatus.COLLECTING && (
                  <button 
                    onClick={() => onUpdateDeliveryStatus(selectedDelivery.id, DeliveryStatus.IN_TRANSIT)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <Truck size={12} />
                    <span>Colocar em Trânsito</span>
                  </button>
                )}
              </div>

              {/* Courier Assignment */}
              <div className="space-y-2 border-t border-b border-slate-100 py-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Atribuir Motoboy</span>
                <div className="flex gap-2">
                  <select
                    value={selectedDelivery.motoboyId || ""}
                    onChange={(e) => onAssignMotoboy(selectedDelivery.id, e.target.value)}
                    className="flex-grow text-[11px] border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Aguardando aceite...</option>
                    {motoboys.map((moto) => (
                      <option key={moto.id} value={moto.id}>{moto.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery Specs */}
              <div className="space-y-4 text-xs font-sans">
                {/* Client detail */}
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Cliente</span>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{selectedDelivery.clientName}</span>
                    <a href={`tel:${selectedDelivery.clientPhone}`} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 font-semibold text-[11px]">
                      <Phone size={10} />
                      Ligar
                    </a>
                  </div>
                </div>

                {/* Address spec */}
                <div className="space-y-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Endereço de Entrega</span>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 text-[11px] text-slate-600">
                    <p className="font-semibold text-slate-800">Destino:</p>
                    <p>{selectedDelivery.destination.street}, {selectedDelivery.destination.number}</p>
                    <p>{selectedDelivery.destination.neighborhood} - {selectedDelivery.destination.city}</p>
                    <p className="text-[10px] text-slate-400">CEP: {selectedDelivery.destination.postalCode}</p>
                  </div>
                </div>

                {/* Money spec */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Taxa de Frete</span>
                    <span className="font-extrabold text-slate-800">R$ {selectedDelivery.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Repasse Motoboy</span>
                    <span className="font-extrabold text-emerald-600">R$ {selectedDelivery.motoboySplit.toFixed(2)}</span>
                  </div>
                </div>

                {selectedDelivery.notes && (
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Observações</span>
                    <p className="text-[11px] text-slate-500 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 italic">
                      "{selectedDelivery.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Utility actions */}
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handlePrintSlip(selectedDelivery)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/60 text-[10px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Imprimir Comprovante de Envio</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 space-y-2 sticky top-6">
              <HelpCircle size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Nenhuma entrega selecionada</p>
              <p className="text-[10px]">Clique em qualquer cartão de entrega para visualizar detalhes, modificar rotas, designar motoboys ou imprimir o comprovante de postagem.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
