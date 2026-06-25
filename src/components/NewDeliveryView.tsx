/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  User, 
  Phone, 
  DollarSign, 
  Calculator, 
  Plus, 
  Truck, 
  Coins, 
  CheckCircle2, 
  ClipboardList, 
  CreditCard, 
  QrCode,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { Delivery, DeliveryStatus, Motoboy, AppSettings } from "../types";

interface NewDeliveryViewProps {
  motoboys: Motoboy[];
  settings: AppSettings;
  onCreateDelivery: (delivery: Omit<Delivery, "id" | "createdAt">) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function NewDeliveryView({ 
  motoboys, 
  settings, 
  onCreateDelivery,
  onNavigateToTab
}: NewDeliveryViewProps) {
  // Form States
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  
  // Addresses
  const [destStreet, setDestStreet] = useState("");
  const [destNumber, setDestNumber] = useState("");
  const [destNeighborhood, setDestNeighborhood] = useState("");
  const [destCity, setDestCity] = useState("São Paulo");
  const [destPostalCode, setDestPostalCode] = useState("");
  
  // Package details
  const [orderValue, setOrderValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<Delivery["paymentMethod"]>("Pago Online");
  const [notes, setNotes] = useState("");
  const [selectedMotoboyId, setSelectedMotoboyId] = useState("");
  
  // Simulated Calculation States
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [calculatedFee, setCalculatedFee] = useState<number>(0);
  const [motoboyPayout, setMotoboyPayout] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-calculate shipping fee when distance or settings change
  useEffect(() => {
    if (distanceKm > 0) {
      const fee = settings.baseFee + (distanceKm * settings.perKmFee);
      const split = fee * (settings.motoboyPercent / 100);
      setCalculatedFee(Number(fee.toFixed(2)));
      setMotoboyPayout(Number(split.toFixed(2)));
    } else {
      setCalculatedFee(0);
      setMotoboyPayout(0);
    }
  }, [distanceKm, settings]);

  // Handle address/distance simulation
  const handleSimulateDistance = () => {
    if (!destStreet || !destNeighborhood) {
      setErrorMsg("Por favor, preencha a Rua e o Bairro para calcular o frete.");
      return;
    }
    
    setErrorMsg("");
    setIsCalculating(true);
    
    // Simulates distance calculation between 1.0 and 8.0 KM
    setTimeout(() => {
      const simulatedDistance = Number((Math.random() * 7 + 1).toFixed(1));
      setDistanceKm(simulatedDistance);
      setIsCalculating(false);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !destStreet || !destNeighborhood) {
      setErrorMsg("Os campos Nome do Cliente, Rua e Bairro de destino são obrigatórios.");
      return;
    }
    
    if (distanceKm === 0) {
      setErrorMsg("Por favor, calcule o frete simulando a distância primeiro.");
      return;
    }

    // Create delivery paylaod
    const newDeliveryData: Omit<Delivery, "id" | "createdAt"> = {
      clientName,
      clientPhone: clientPhone || "(11) 99999-9999",
      origin: {
        street: "Av. Paulista",
        number: "1000",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        postalCode: "01310-100"
      },
      destination: {
        street: destStreet,
        number: destNumber || "S/N",
        neighborhood: destNeighborhood,
        city: destCity,
        postalCode: destPostalCode || "01000-000"
      },
      distanceKm,
      deliveryFee: calculatedFee,
      motoboySplit: motoboyPayout,
      status: DeliveryStatus.PENDING,
      paymentMethod,
      orderValue: Number(orderValue) || 0,
      notes,
      motoboyId: selectedMotoboyId || undefined
    };

    onCreateDelivery(newDeliveryData);
    setIsSuccess(true);
  };

  const resetForm = () => {
    setClientName("");
    setClientPhone("");
    setDestStreet("");
    setDestNumber("");
    setDestNeighborhood("");
    setDestPostalCode("");
    setOrderValue(0);
    setPaymentMethod("Pago Online");
    setNotes("");
    setSelectedMotoboyId("");
    setDistanceKm(0);
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-100 shadow-sm rounded-2xl p-8 text-center space-y-6" id="success-screen">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100 shadow-sm animate-bounce">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Entrega Criada com Sucesso!</h2>
          <p className="text-sm text-slate-500">
            A entrega para <span className="font-semibold text-slate-700">{clientName}</span> foi inserida no painel de triagem e já está visível para os motoboys.
          </p>
        </div>

        {/* Quick summary ticket */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 divide-y divide-slate-200 text-left space-y-3 font-sans text-xs">
          <div className="flex justify-between pb-2">
            <span className="text-slate-400">Cliente</span>
            <span className="font-bold text-slate-700">{clientName}</span>
          </div>
          <div className="flex justify-between pt-2 pb-2">
            <span className="text-slate-400">Destino</span>
            <span className="font-semibold text-slate-700 line-clamp-1">{destStreet}, {destNumber} - {destNeighborhood}</span>
          </div>
          <div className="flex justify-between pt-2 pb-2">
            <span className="text-slate-400">Distância Calculada</span>
            <span className="font-bold text-slate-700">{distanceKm} KM</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-slate-400 font-medium">Valor Total do Frete</span>
            <span className="font-extrabold text-indigo-600 text-sm">R$ {calculatedFee.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button 
            onClick={resetForm}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
          >
            Cadastrar Outra Entrega
          </button>
          <button 
            onClick={() => onNavigateToTab("entregas")}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Ver Todas no Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6" id="new-delivery-container">
      {/* Main Creation Form */}
      <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="new-delivery-form-card">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Plus size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">Nova Solicitação de Entrega</h2>
            <p className="text-xs text-slate-400">Preencha os dados e simule a taxa por distância</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" id="new-delivery-form">
          {/* Section 1: Client */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} />
              <span>1. Destinatário da Entrega</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Nome Completo</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Mariana Alencar"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Destination Address */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={12} />
              <span>2. Endereço de Destino</span>
            </h3>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-1">
                <label className="text-xs font-semibold text-slate-600">Rua / Avenida</label>
                <input 
                  type="text" 
                  value={destStreet} 
                  onChange={(e) => setDestStreet(e.target.value)}
                  placeholder="Ex: Alameda Santos"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                  required
                />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-xs font-semibold text-slate-600">Número</label>
                <input 
                  type="text" 
                  value={destNumber} 
                  onChange={(e) => setDestNumber(e.target.value)}
                  placeholder="100"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Bairro</label>
                <input 
                  type="text" 
                  value={destNeighborhood} 
                  onChange={(e) => setDestNeighborhood(e.target.value)}
                  placeholder="Ex: Cerqueira César"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Cidade</label>
                <input 
                  type="text" 
                  value={destCity} 
                  onChange={(e) => setDestCity(e.target.value)}
                  placeholder="São Paulo"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">CEP</label>
                <input 
                  type="text" 
                  value={destPostalCode} 
                  onChange={(e) => setDestPostalCode(e.target.value)}
                  placeholder="01419-001"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Simulated Rate button */}
            <div className="pt-1 flex items-center justify-between gap-4">
              <p className="text-[10px] text-slate-400">
                Ponto de partida do Hub Central: <span className="font-semibold text-slate-600">{settings.storeAddress}</span>
              </p>
              <button
                type="button"
                onClick={handleSimulateDistance}
                disabled={isCalculating}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-xs font-bold rounded-xl transition-all border border-indigo-150 shadow-sm disabled:opacity-50"
              >
                <Calculator size={13} />
                {isCalculating ? "Calculando..." : "Calcular Taxa de Entrega"}
              </button>
            </div>
          </div>

          {/* Section 3: Package & Payment */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList size={12} />
              <span>3. Detalhes do Pedido & Pagamento</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Valor Declarado das Mercadorias (R$)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-semibold">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={orderValue || ""} 
                    onChange={(e) => setOrderValue(Number(e.target.value))}
                    placeholder="0,00"
                    className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Forma de Pagamento</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as Delivery["paymentMethod"])}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
                >
                  <option value="Pago Online">Pago Online (Sem cobrança na entrega)</option>
                  <option value="Pix">Cobrar via Pix na Entrega</option>
                  <option value="Cartão (Entregador)">Cobrar no Cartão com o Entregador</option>
                  <option value="Dinheiro">Cobrar em Dinheiro na Entrega</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Observações adicionais para o Motoboy</label>
              <textarea 
                rows={2}
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Tocar o interfone do apto 15, ou trocar troco para R$ 50..."
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Section 4: Motoboy Allocation */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck size={12} />
              <span>4. Vincular Motoboy (Opcional)</span>
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Designar entregador imediatamente:</label>
              <select 
                value={selectedMotoboyId}
                onChange={(e) => setSelectedMotoboyId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
              >
                <option value="">Aguardar aceite de qualquer motoboy do canal (Padrão)</option>
                {motoboys.map((moto) => (
                  <option key={moto.id} value={moto.id} disabled={moto.status === "Offline"}>
                    {moto.name} ({moto.vehicle}) - Status: {moto.status}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Se você não designar nenhum entregador, a corrida ficará disponível para todo o canal de motoboys ativos.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
              <ShieldAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 flex gap-3 border-t border-slate-100">
            <button 
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition-all"
            >
              Limpar Campos
            </button>
            <button 
              type="submit"
              disabled={distanceKm === 0}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50 disabled:hover:bg-indigo-600 inline-flex items-center justify-center gap-1"
            >
              <span>Gerar e Enviar para Canal</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </form>
      </div>

      {/* Calculator Ticket Sidebar preview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 self-start" id="calculator-receipt">
        <h3 className="font-bold text-slate-800 text-sm">Resumo da Simulação</h3>
        
        <div className="space-y-4" id="simulated-receipt-content">
          {distanceKm > 0 ? (
            <>
              {/* Receipt Specs */}
              <div className="space-y-3 font-sans text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tarifa Base</span>
                  <span className="font-semibold text-slate-700">R$ {settings.baseFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Preço por KM</span>
                  <span className="font-semibold text-slate-700">R$ {settings.perKmFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Distância Total</span>
                  <span className="font-bold text-indigo-600">{distanceKm} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Repasse Entregador ({settings.motoboyPercent}%)</span>
                  <span className="font-semibold text-emerald-600">R$ {motoboyPayout.toFixed(2)}</span>
                </div>
                
                <div className="h-px bg-slate-150 my-2"></div>
                
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-slate-600 font-bold">Total do Frete</span>
                  <span className="font-extrabold text-slate-900 text-xl">R$ {calculatedFee.toFixed(2)}</span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2.5 text-[11px] text-indigo-700 leading-normal font-sans">
                <Coins size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Taxa de Frete Justa VestApp</span>
                  A taxa é calculada em tempo real para garantir repasses competitivos aos motoboys locais de São Paulo.
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400 space-y-3">
              <Calculator size={32} className="mx-auto text-slate-300 animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Aguardando Endereço</p>
                <p className="text-[10px] leading-relaxed">
                  Insira os dados de entrega de destino e clique em <strong>"Calcular Taxa de Entrega"</strong> para ver as estimativas de frete e splits.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
