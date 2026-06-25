/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  UserPlus, 
  Search, 
  MapPin, 
  Phone, 
  Award, 
  Truck, 
  Bike, 
  Car, 
  Check, 
  AlertCircle, 
  X,
  Star,
  Coins,
  DollarSign
} from "lucide-react";
import { Motoboy, MotoboyStatus } from "../types";

interface MotoboysViewProps {
  motoboys: Motoboy[];
  onAddMotoboy: (motoboy: Omit<Motoboy, "id" | "completedDeliveries" | "earningsBalance">) => void;
  onUpdateMotoboyStatus: (id: string, status: MotoboyStatus) => void;
}

export default function MotoboysView({
  motoboys,
  onAddMotoboy,
  onUpdateMotoboyStatus
}: MotoboysViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  
  // Registration Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newVehicle, setNewVehicle] = useState<"Moto" | "Bicicleta" | "Carro">("Moto");
  const [newPlate, setNewPlate] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [formError, setFormError] = useState("");

  const getStatusBadge = (status: MotoboyStatus) => {
    switch (status) {
      case MotoboyStatus.AVAILABLE:
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case MotoboyStatus.BUSY:
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case MotoboyStatus.OFFLINE:
        return "bg-slate-100 text-slate-500 border border-slate-200";
    }
  };

  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case "Bicicleta":
        return <Bike size={14} />;
      case "Carro":
        return <Car size={14} />;
      default:
        return <Truck size={14} />;
    }
  };

  const filteredMotoboys = motoboys.filter((moto) => {
    const matchesSearch = 
      moto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      moto.phone.includes(searchTerm) ||
      (moto.plate && moto.plate.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === "TODOS" || moto.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) {
      setFormError("Nome e Telefone são campos obrigatórios.");
      return;
    }

    onAddMotoboy({
      name: newName,
      phone: newPhone,
      vehicle: newVehicle,
      plate: newVehicle !== "Bicicleta" ? newPlate : undefined,
      avatar: newAvatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150&auto=format&fit=crop&q=80`,
      status: MotoboyStatus.AVAILABLE,
      rating: 5.0
    });

    // Reset and close
    setNewName("");
    setNewPhone("");
    setNewVehicle("Moto");
    setNewPlate("");
    setNewAvatar("");
    setFormError("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6" id="motoboys-view-container">
      {/* Search and Register block */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4" id="motoboys-header-filters">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto flex-grow">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute left-3.5 top-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar motoboy..."
              className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-4 py-3 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3.5 py-3 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all cursor-pointer w-full sm:w-44"
          >
            <option value="TODOS">Todos os Status</option>
            <option value={MotoboyStatus.AVAILABLE}>Disponível</option>
            <option value={MotoboyStatus.BUSY}>Em entrega</option>
            <option value={MotoboyStatus.OFFLINE}>Offline</option>
          </select>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          <UserPlus size={14} />
          <span>Cadastrar Motoboy</span>
        </button>
      </div>

      {/* Motoboys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="motoboys-cards-grid">
        {filteredMotoboys.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-2">
            <AlertCircle size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Nenhum motoboy localizado</p>
          </div>
        ) : (
          filteredMotoboys.map((moto) => (
            <div key={moto.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
              {/* Profile card header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                    <img src={moto.avatar} alt={moto.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{moto.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{moto.phone}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusBadge(moto.status)}`}>
                  {moto.status}
                </span>
              </div>

              {/* Statistics panel */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Avaliação</span>
                  <div className="flex items-center justify-center gap-0.5 text-amber-500 font-bold">
                    <Star size={11} fill="currentColor" />
                    <span>{moto.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-0.5 border-l border-r border-slate-200">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Entregas</span>
                  <span className="font-extrabold text-slate-700">{moto.completedDeliveries}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Saldo</span>
                  <span className="font-extrabold text-emerald-600">R$ {moto.earningsBalance.toFixed(2)}</span>
                </div>
              </div>

              {/* Vehicle parameters */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="p-1 bg-slate-100 rounded-lg text-slate-600">
                    {getVehicleIcon(moto.vehicle)}
                  </span>
                  <span className="font-medium text-[11px]">{moto.vehicle} {moto.plate ? `(${moto.plate})` : ""}</span>
                </div>

                {/* Change status actions */}
                <div className="flex gap-1.5">
                  {moto.status !== MotoboyStatus.AVAILABLE && (
                    <button 
                      onClick={() => onUpdateMotoboyStatus(moto.id, MotoboyStatus.AVAILABLE)}
                      className="px-2 py-1 text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-150 transition-colors"
                    >
                      Liberar
                    </button>
                  )}
                  {moto.status !== MotoboyStatus.OFFLINE && (
                    <button 
                      onClick={() => onUpdateMotoboyStatus(moto.id, MotoboyStatus.OFFLINE)}
                      className="px-2 py-1 text-[9px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors"
                    >
                      Offline
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Registration Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Cadastrar Novo Entregador</h3>
                <p className="text-[10px] text-slate-400">Adicione um motoboy ao canal de entregas</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Nome Completo</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo (Cadu)"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Telefone / WhatsApp</label>
                <input 
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Veículo</label>
                  <select
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="Moto">Moto</option>
                    <option value="Bicicleta">Bicicleta</option>
                    <option value="Carro">Carro</option>
                  </select>
                </div>

                {newVehicle !== "Bicicleta" && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Placa do Veículo</label>
                    <input 
                      type="text"
                      value={newPlate}
                      onChange={(e) => setNewPlate(e.target.value)}
                      placeholder="ABC-1234"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Link da Foto de Perfil (Opcional)</label>
                <input 
                  type="text"
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>

              {formError && (
                <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{formError}</p>
              )}

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl transition-all border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
