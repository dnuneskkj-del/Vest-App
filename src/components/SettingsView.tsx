/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Settings, 
  MapPin, 
  Phone, 
  Coins, 
  Lock, 
  Link2, 
  Check, 
  Globe, 
  RefreshCw,
  BellRing
} from "lucide-react";
import { AppSettings } from "../types";

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function SettingsView({
  settings,
  onUpdateSettings
}: SettingsViewProps) {
  // Local form states
  const [baseFee, setBaseFee] = useState(settings.baseFee);
  const [perKmFee, setPerKmFee] = useState(settings.perKmFee);
  const [motoboyPercent, setMotoboyPercent] = useState(settings.motoboyPercent);
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl);

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      baseFee: Number(baseFee),
      perKmFee: Number(perKmFee),
      motoboyPercent: Number(motoboyPercent),
      storeName,
      storePhone,
      storeAddress,
      apiKey,
      webhookUrl
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleRegenerateKey = () => {
    const randomHex = Array.from({ length: 20 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setApiKey(`vest_live_${randomHex}`);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6" id="settings-view-container">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Settings size={18} />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-base">Configurações Gerais do Canal</h2>
          <p className="text-xs text-slate-400">Gerencie taxas de entrega, splits e credenciais de integração</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-sans" id="settings-form">
        {/* Section 1: Pricing Rates */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-700 border-l-2 border-indigo-500 pl-2 text-xs flex items-center gap-1">
            <Coins size={14} className="text-indigo-500" />
            <span>Valores e Taxas de Entrega</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Taxa de Saída Base (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                <input 
                  type="number"
                  step="0.01"
                  value={baseFee}
                  onChange={(e) => setBaseFee(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Adicional por KM (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                <input 
                  type="number"
                  step="0.01"
                  value={perKmFee}
                  onChange={(e) => setPerKmFee(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Repasse para Motoboy (%)</label>
              <div className="relative">
                <span className="absolute right-3 top-2.5 text-slate-400">%</span>
                <input 
                  type="number"
                  value={motoboyPercent}
                  onChange={(e) => setMotoboyPercent(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Store / HUB info */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-700 border-l-2 border-indigo-500 pl-2 text-xs flex items-center gap-1">
            <MapPin size={14} className="text-indigo-500" />
            <span>Dados da Loja (HUB de Partida)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Nome do HUB / Comércio</label>
              <input 
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Telefone para Suporte</label>
              <input 
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600">Endereço Físico Completo</label>
            <input 
              type="text"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50"
              required
            />
          </div>
        </div>

        {/* Section 3: Integrations / API */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-700 border-l-2 border-indigo-500 pl-2 text-xs flex items-center gap-1">
            <Lock size={14} className="text-indigo-500" />
            <span>Chaves de Integração (API & Webhooks)</span>
          </h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Chave secreta de Produção (API Key)</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-grow border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none bg-slate-100 text-slate-500 font-mono tracking-tight"
                />
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  className="px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all inline-flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Regerar</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600">URL de Destino do Webhook</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <Globe size={13} />
                </span>
                <input 
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://exemplo.com/api/webhooks"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50"
                />
              </div>
              <p className="text-[10px] text-slate-400 pt-0.5">
                O VestApp enviará atualizações instantâneas de status da entrega (ex: Coletado, Em trânsito, Entregue) para esta URL.
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 italic">
            Salvo localmente em seu navegador.
          </p>
          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-flex items-center gap-1">
                <Check size={12} />
                <span>Salvo!</span>
              </span>
            )}
            <button
              type="submit"
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
