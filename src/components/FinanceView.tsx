/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Coins, 
  Wallet, 
  CheckCircle, 
  Clock, 
  CreditCard,
  Building,
  HelpCircle,
  QrCode,
  Lock,
  ArrowRight
} from "lucide-react";
import { FinancialTransaction, Motoboy } from "../types";

interface FinanceViewProps {
  transactions: FinancialTransaction[];
  motoboys: Motoboy[];
  onMotoboyCashout: (motoboyId: string, amount: number) => void;
}

export default function FinanceView({
  transactions,
  motoboys,
  onMotoboyCashout
}: FinanceViewProps) {
  const [selectedMotoboyId, setSelectedMotoboyId] = useState("");
  const [cashoutAmount, setCashoutAmount] = useState<number>(0);
  const [cashoutSuccess, setCashoutSuccess] = useState("");
  const [cashoutError, setCashoutError] = useState("");

  // Sum finances
  const totalRevenue = transactions
    .filter(t => t.type === "Receita")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "Despesa" || t.type === "Saque Motoboy")
    .reduce((sum, t) => sum + t.amount, 0); // Note expenses are negative in data.ts

  // Available in platform wallet
  const platformBalance = totalRevenue + totalExpense;

  const handleCashoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCashoutSuccess("");
    setCashoutError("");

    if (!selectedMotoboyId) {
      setCashoutError("Por favor, selecione um motoboy para transferir.");
      return;
    }

    const moto = motoboys.find(m => m.id === selectedMotoboyId);
    if (!moto) return;

    if (cashoutAmount <= 0) {
      setCashoutError("O valor de saque deve ser maior que zero.");
      return;
    }

    if (cashoutAmount > moto.earningsBalance) {
      setCashoutError(`Saldo insuficiente. O motoboy possui apenas R$ ${moto.earningsBalance.toFixed(2)} disponíveis.`);
      return;
    }

    onMotoboyCashout(selectedMotoboyId, cashoutAmount);
    setCashoutSuccess(`Transferência PIX de R$ ${cashoutAmount.toFixed(2)} efetuada com sucesso para ${moto.name}!`);
    setCashoutAmount(0);
    setSelectedMotoboyId("");
  };

  return (
    <div className="space-y-6" id="finance-view-container">
      {/* Wallet Metric highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="finance-highlights">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Saldo Geral da Plataforma</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">R$ {platformBalance.toFixed(2)}</span>
            <p className="text-[10px] text-slate-400">Total acumulado líquido pós-repasses</p>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Wallet size={24} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Total Arrecadado</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">R$ {totalRevenue.toFixed(2)}</span>
            <p className="text-[10px] text-slate-400">Entrada bruta de taxas de entregas</p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ArrowDownLeft size={24} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Total Repassado / Sacado</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">R$ {Math.abs(totalExpense).toFixed(2)}</span>
            <p className="text-[10px] text-slate-400">Ganhos de motoboys liberados</p>
          </div>
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </div>

      {/* Grid: Statement vs PIX Cashout panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="finance-main-grid">
        
        {/* Transaction History log list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4" id="payout-transactions-log">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Extrato de Repasses e Receitas</h3>
            <p className="text-xs text-slate-400">Lista completa de movimentações financeiras</p>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[350px] pr-1 space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="pt-3.5 pb-3.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${tx.type === "Receita" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {tx.type === "Receita" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {tx.id} • {new Date(tx.date).toLocaleDateString("pt-BR")} às {new Date(tx.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className={`font-extrabold ${tx.type === "Receita" ? "text-emerald-600" : "text-rose-600"}`}>
                    {tx.type === "Receita" ? "+" : ""}R$ {tx.amount.toFixed(2)}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pix Transfer payment simulator panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 self-start" id="pix-payout-panel">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">Efetuar Repasse via PIX</h3>
            <p className="text-xs text-slate-400">Pague o saldo acumulado aos motoboys imediatamente</p>
          </div>

          <form onSubmit={handleCashoutSubmit} className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Selecione o Motoboy</label>
              <select
                value={selectedMotoboyId}
                onChange={(e) => {
                  setSelectedMotoboyId(e.target.value);
                  const m = motoboys.find(moto => moto.id === e.target.value);
                  setCashoutAmount(m ? m.earningsBalance : 0);
                }}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50 cursor-pointer"
              >
                <option value="">Selecione...</option>
                {motoboys.map((moto) => (
                  <option key={moto.id} value={moto.id}>
                    {moto.name} (Disponível: R$ {moto.earningsBalance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Valor de Transferência (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">R$</span>
                <input 
                  type="number"
                  step="0.01"
                  value={cashoutAmount || ""}
                  onChange={(e) => setCashoutAmount(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {cashoutError && (
              <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{cashoutError}</p>
            )}

            {cashoutSuccess && (
              <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100 leading-normal">
                {cashoutSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedMotoboyId || cashoutAmount <= 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
            >
              <QrCode size={13} />
              <span>Transferir via PIX Seguro</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-start gap-2.5 text-[10px] text-slate-400 leading-normal">
            <Lock size={12} className="text-slate-350 shrink-0 mt-0.5" />
            <span>As transações de transferência de repasse PIX são instantâneas e rastreáveis na rede do Banco Central do Brasil.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
