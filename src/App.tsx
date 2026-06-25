/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Truck, 
  Users, 
  DollarSign, 
  Settings, 
  Bell, 
  Menu, 
  X, 
  MapPin,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  PackageCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types & Data
import { 
  Delivery, 
  DeliveryStatus, 
  Motoboy, 
  MotoboyStatus, 
  FinancialTransaction, 
  AppSettings, 
  Notification 
} from "./types";
import { 
  MOCK_DELIVERIES, 
  MOCK_MOTOBOYS, 
  MOCK_TRANSACTIONS, 
  INITIAL_SETTINGS 
} from "./data";

// Views
import DashboardView from "./components/DashboardView";
import NewDeliveryView from "./components/NewDeliveryView";
import DeliveriesListView from "./components/DeliveriesListView";
import MotoboysView from "./components/MotoboysView";
import FinanceView from "./components/FinanceView";
import SettingsView from "./components/SettingsView";

export default function App() {
  // Navigation & Menu Mobile
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Persistence States
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  
  // App Notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "n-1",
      title: "Nova entrega solicitada",
      message: "A entrega VEST-1025 está aguardando aceite do canal.",
      type: "info",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: "n-2",
      title: "Carlos Eduardo ficou online",
      message: "Motoboy disponível para coletas.",
      type: "success",
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      read: true
    }
  ]);

  // Selected delivery for active tracking
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  // Load from local storage or initial datasets
  useEffect(() => {
    const cachedDeliveries = localStorage.getItem("vest_deliveries");
    const cachedMotoboys = localStorage.getItem("vest_motoboys");
    const cachedTransactions = localStorage.getItem("vest_transactions");
    const cachedSettings = localStorage.getItem("vest_settings");

    if (cachedDeliveries) setDeliveries(JSON.parse(cachedDeliveries));
    else setDeliveries(MOCK_DELIVERIES);

    if (cachedMotoboys) setMotoboys(JSON.parse(cachedMotoboys));
    else setMotoboys(MOCK_MOTOBOYS);

    if (cachedTransactions) setTransactions(JSON.parse(cachedTransactions));
    else setTransactions(MOCK_TRANSACTIONS);

    if (cachedSettings) setSettings(JSON.parse(cachedSettings));
    else setSettings(INITIAL_SETTINGS);
  }, []);

  // Save to cache on state changes
  const saveState = (
    updatedDeliveries: Delivery[],
    updatedMotoboys: Motoboy[],
    updatedTransactions: FinancialTransaction[],
    updatedSettings: AppSettings
  ) => {
    localStorage.setItem("vest_deliveries", JSON.stringify(updatedDeliveries));
    localStorage.setItem("vest_motoboys", JSON.stringify(updatedMotoboys));
    localStorage.setItem("vest_transactions", JSON.stringify(updatedTransactions));
    localStorage.setItem("vest_settings", JSON.stringify(updatedSettings));
  };

  // 1. Create a brand new Delivery
  const handleCreateDelivery = (newDeliveryData: Omit<Delivery, "id" | "createdAt">) => {
    const nextIdNumber = deliveries.length > 0 
      ? Math.max(...deliveries.map(d => parseInt(d.id.split("-")[1] || "1000"))) + 1
      : 1026;
    
    const newDelivery: Delivery = {
      ...newDeliveryData,
      id: `VEST-${nextIdNumber}`,
      createdAt: new Date().toISOString()
    };

    const nextDeliveries = [newDelivery, ...deliveries];
    setDeliveries(nextDeliveries);

    // If a specific motoboy was selected immediately, update their status to BUSY
    let nextMotoboys = [...motoboys];
    if (newDelivery.motoboyId) {
      nextMotoboys = motoboys.map(m => 
        m.id === newDelivery.motoboyId ? { ...m, status: MotoboyStatus.BUSY } : m
      );
      setMotoboys(nextMotoboys);
    }

    // Add notification
    const newNotification: Notification = {
      id: `n-${Date.now()}`,
      title: "Corrida Publicada",
      message: `Entrega ${newDelivery.id} criada para ${newDelivery.clientName} (${newDelivery.distanceKm} KM).`,
      type: "info",
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotification, ...notifications]);

    saveState(nextDeliveries, nextMotoboys, transactions, settings);
  };

  // 2. Update Delivery Status (Pendente -> Coletando -> Trânsito -> Entregue)
  const handleUpdateDeliveryStatus = (deliveryId: string, status: DeliveryStatus) => {
    let nextTransactions = [...transactions];
    let nextMotoboys = [...motoboys];

    const nextDeliveries = deliveries.map(d => {
      if (d.id === deliveryId) {
        const updatedDelivery = { 
          ...d, 
          status,
          deliveredAt: status === DeliveryStatus.DELIVERED ? new Date().toISOString() : d.deliveredAt
        };

        // If newly delivered, split and payout to Motoboy balance, record transactions
        if (status === DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.DELIVERED) {
          // Increase motoboy earnings balance
          if (d.motoboyId) {
            nextMotoboys = motoboys.map(m => {
              if (m.id === d.motoboyId) {
                return {
                  ...m,
                  earningsBalance: m.earningsBalance + d.motoboySplit,
                  completedDeliveries: m.completedDeliveries + 1,
                  status: MotoboyStatus.AVAILABLE // Make driver available again
                };
              }
              return m;
            });
          }

          // Record Income (Faturamento de Frete)
          const transactionRevenue: FinancialTransaction = {
            id: `TX-${Date.now()}`,
            type: "Receita",
            description: `Taxa de Entrega ${d.id} (${d.paymentMethod})`,
            amount: d.deliveryFee,
            date: new Date().toISOString(),
            status: "Concluído"
          };

          // Record Expense (Repasse para Entregador)
          const transactionSplit: FinancialTransaction = {
            id: `TX-${Date.now() + 1}`,
            type: "Despesa",
            description: `Repasse de Entrega ${d.id}`,
            amount: -d.motoboySplit,
            date: new Date().toISOString(),
            status: "Concluído"
          };

          nextTransactions = [transactionRevenue, transactionSplit, ...transactions];
        }

        // If cancelled, return assigned motoboy back to available
        if (status === DeliveryStatus.CANCELLED && d.motoboyId) {
          nextMotoboys = motoboys.map(m => 
            m.id === d.motoboyId ? { ...m, status: MotoboyStatus.AVAILABLE } : m
          );
        }

        return updatedDelivery;
      }
      return d;
    });

    setDeliveries(nextDeliveries);
    setTransactions(nextTransactions);
    setMotoboys(nextMotoboys);

    // Add alert notification
    const dObj = deliveries.find(d => d.id === deliveryId);
    const notificationTitle = status === DeliveryStatus.DELIVERED ? "Entrega Entregue! 🎉" : "Status Atualizado";
    const newNotification: Notification = {
      id: `n-${Date.now()}`,
      title: notificationTitle,
      message: `O pacote ${deliveryId} para ${dObj?.clientName} está agora com status: "${status}".`,
      type: status === DeliveryStatus.DELIVERED ? "success" : "info",
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotification, ...notifications]);

    saveState(nextDeliveries, nextMotoboys, nextTransactions, settings);
  };

  // 3. Link/Assign motoboy to order
  const handleAssignMotoboy = (deliveryId: string, motoboyId: string) => {
    let nextMotoboys = [...motoboys];

    const nextDeliveries = deliveries.map(d => {
      if (d.id === deliveryId) {
        // Return previous driver back to available
        if (d.motoboyId) {
          nextMotoboys = nextMotoboys.map(m => 
            m.id === d.motoboyId ? { ...m, status: MotoboyStatus.AVAILABLE } : m
          );
        }

        // Set new driver to busy and assign
        if (motoboyId) {
          nextMotoboys = nextMotoboys.map(m => 
            m.id === motoboyId ? { ...m, status: MotoboyStatus.BUSY } : m
          );
        }

        return { ...d, motoboyId: motoboyId || undefined };
      }
      return d;
    });

    setDeliveries(nextDeliveries);
    setMotoboys(nextMotoboys);

    const mObj = motoboys.find(m => m.id === motoboyId);
    const newNotification: Notification = {
      id: `n-${Date.now()}`,
      title: "Motoboy Vinculado 🏍️",
      message: `O motoboy ${mObj?.name} foi atribuído para a entrega ${deliveryId}.`,
      type: "info",
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotification, ...notifications]);

    saveState(nextDeliveries, nextMotoboys, transactions, settings);
  };

  // 4. Register new motoboy
  const handleAddMotoboy = (newMotoData: Omit<Motoboy, "id" | "completedDeliveries" | "earningsBalance">) => {
    const nextId = `moto-${motoboys.length + 1}`;
    const newMoto: Motoboy = {
      ...newMotoData,
      id: nextId,
      completedDeliveries: 0,
      earningsBalance: 0
    };

    const nextMotoboys = [...motoboys, newMoto];
    setMotoboys(nextMotoboys);

    const newNotification: Notification = {
      id: `n-${Date.now()}`,
      title: "Motoboy Credenciado",
      message: `${newMoto.name} foi adicionado ao seu canal de motoboys.`,
      type: "success",
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotification, ...notifications]);

    saveState(deliveries, nextMotoboys, transactions, settings);
  };

  // 5. Update Motoboy status online/offline
  const handleUpdateMotoboyStatus = (id: string, status: MotoboyStatus) => {
    const nextMotoboys = motoboys.map(m => 
      m.id === id ? { ...m, status } : m
    );
    setMotoboys(nextMotoboys);
    saveState(deliveries, nextMotoboys, transactions, settings);
  };

  // 6. Execute Motoboy Split balance cash-out transfer
  const handleMotoboyCashout = (motoboyId: string, amount: number) => {
    const nextMotoboys = motoboys.map(m => {
      if (m.id === motoboyId) {
        return {
          ...m,
          earningsBalance: m.earningsBalance - amount
        };
      }
      return m;
    });

    // Record cash-out transaction log
    const mObj = motoboys.find(m => m.id === motoboyId);
    const transactionCashout: FinancialTransaction = {
      id: `TX-${Date.now()}`,
      type: "Saque Motoboy",
      description: `Saque PIX efetuado p/ ${mObj?.name}`,
      amount: -amount,
      date: new Date().toISOString(),
      status: "Concluído"
    };

    const nextTransactions = [transactionCashout, ...transactions];
    setTransactions(nextTransactions);
    setMotoboys(nextMotoboys);

    const newNotification: Notification = {
      id: `n-${Date.now()}`,
      title: "Saque PIX Efetuado",
      message: `Transferência de R$ ${amount.toFixed(2)} enviada para a conta de ${mObj?.name}.`,
      type: "success",
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotification, ...notifications]);

    saveState(deliveries, nextMotoboys, nextTransactions, settings);
  };

  // 7. Update general setting fees
  const handleUpdateSettings = (updatedSettings: AppSettings) => {
    setSettings(updatedSettings);
    saveState(deliveries, motoboys, transactions, updatedSettings);
  };

  // Navigation handlers
  const handleSelectDeliveryFromRecent = (delivery: Delivery) => {
    setSelectedDeliveryId(delivery.id);
    setActiveTab("entregas");
  };

  // Clear unread notifications
  const clearUnreadNotifications = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-root-container">
      
      {/* Upper Navigation Header bar */}
      <header className="bg-slate-900 text-white h-16 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40" id="app-header">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 lg:hidden"
            id="mobile-menu-trigger"
          >
            <Menu size={20} />
          </button>
          
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-gradient-to-tr from-indigo-500 to-indigo-600 p-2 rounded-xl text-white shadow-sm transition-transform group-hover:scale-105">
              <PackageCheck size={18} />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight block leading-none">VestApp</span>
              <span className="text-[10px] text-slate-400 font-medium">Logística Inteligente</span>
            </div>
          </div>
        </div>

        {/* Header Right menu details */}
        <div className="flex items-center gap-4">
          
          {/* Real-time Online status indicator */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-[10px] font-bold text-emerald-400 rounded-full border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Canal Ativo</span>
          </div>

          {/* Interactive Notifications Bell widget */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (!isNotificationsOpen) clearUnreadNotifications();
              }}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 transition-colors relative"
              id="notification-bell"
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
              )}
            </button>

            {/* Dropdown menu list */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-50 text-slate-800"
                  id="notifications-dropdown"
                >
                  <div className="p-3.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                    <span className="font-bold text-xs">Alertas do Canal</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{notifications.length} Avisos</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 text-[11px] hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-700">{n.title}</span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(n.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User profile identifier */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 shadow-inner bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
              VA
            </div>
          </div>
        </div>
      </header>

      {/* Main Structural Frame (Sidebar + View Canvas) */}
      <div className="flex flex-grow relative" id="main-structural-frame">
        
        {/* Sidebar Nav menu (Responsive layout) */}
        <nav className={`bg-slate-900 border-r border-slate-800 text-slate-300 flex-shrink-0 flex flex-col justify-between py-6 transition-all duration-300 z-30 lg:static lg:w-64 absolute top-0 bottom-0 left-0 ${isMobileMenuOpen ? "w-64" : "w-0 -translate-x-full lg:translate-x-0"}`} id="app-sidebar">
          <div className="space-y-6">
            
            <div className="px-4">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-3">Módulos Administrativos</span>
              
              {/* Menu items list */}
              <div className="space-y-1" id="sidebar-menu-links">
                {/* 1 */}
                <button
                  onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "dashboard" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "hover:bg-slate-800 hover:text-slate-100"}`}
                >
                  <LayoutDashboard size={16} />
                  <span>Painel Geral</span>
                </button>
                
                {/* 2 */}
                <button
                  onClick={() => { setActiveTab("nova-entrega"); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "nova-entrega" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "hover:bg-slate-800 hover:text-slate-100"}`}
                >
                  <PlusCircle size={16} />
                  <span>Nova Entrega</span>
                </button>

                {/* 3 */}
                <button
                  onClick={() => { setActiveTab("entregas"); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "entregas" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "hover:bg-slate-800 hover:text-slate-100"}`}
                >
                  <Truck size={16} />
                  <span>Entregas Ativas</span>
                </button>

                {/* 4 */}
                <button
                  onClick={() => { setActiveTab("motoboys"); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "motoboys" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "hover:bg-slate-800 hover:text-slate-100"}`}
                >
                  <Users size={16} />
                  <span>Gestão de Motoboys</span>
                </button>

                {/* 5 */}
                <button
                  onClick={() => { setActiveTab("financeiro"); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "financeiro" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "hover:bg-slate-800 hover:text-slate-100"}`}
                >
                  <DollarSign size={16} />
                  <span>Financeiro & Splits</span>
                </button>
              </div>
            </div>

            <div className="px-4 border-t border-slate-800 pt-4">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-3">Ajustes Básicos</span>
              <button
                onClick={() => { setActiveTab("configuracoes"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "configuracoes" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "hover:bg-slate-800 hover:text-slate-100"}`}
              >
                <Settings size={16} />
                <span>Configurações do Canal</span>
              </button>
            </div>

          </div>

          <div className="px-4 text-center">
            <p className="text-[10px] text-slate-500">VestApp V3.2.1 • SP</p>
            <p className="text-[9px] text-slate-600 mt-0.5">Vínculo com GitHub Ativo</p>
          </div>
        </nav>

        {/* Overlay for Mobile menu */}
        {isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-20 lg:hidden"
          ></div>
        )}

        {/* Central Dashboard Canvas */}
        <main className="flex-grow p-6 overflow-y-auto max-h-[calc(100vh-4rem)]" id="main-view-canvas">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === "dashboard" && (
                  <DashboardView 
                    deliveries={deliveries}
                    motoboys={motoboys}
                    onSelectDelivery={handleSelectDeliveryFromRecent}
                    onNavigateToTab={setActiveTab}
                  />
                )}

                {activeTab === "nova-entrega" && (
                  <NewDeliveryView 
                    motoboys={motoboys}
                    settings={settings}
                    onCreateDelivery={handleCreateDelivery}
                    onNavigateToTab={setActiveTab}
                  />
                )}

                {activeTab === "entregas" && (
                  <DeliveriesListView 
                    deliveries={deliveries}
                    motoboys={motoboys}
                    onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
                    onAssignMotoboy={handleAssignMotoboy}
                    selectedDeliveryId={selectedDeliveryId}
                    onSelectDeliveryId={setSelectedDeliveryId}
                  />
                )}

                {activeTab === "motoboys" && (
                  <MotoboysView 
                    motoboys={motoboys}
                    onAddMotoboy={handleAddMotoboy}
                    onUpdateMotoboyStatus={handleUpdateMotoboyStatus}
                  />
                )}

                {activeTab === "financeiro" && (
                  <FinanceView 
                    transactions={transactions}
                    motoboys={motoboys}
                    onMotoboyCashout={handleMotoboyCashout}
                  />
                )}

                {activeTab === "configuracoes" && (
                  <SettingsView 
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

      </div>
    </div>
  );
}
