import { auth } from '../firebase';
import StudySchedule from '../components/StudySchedule';
import IntelligentScheduleGenerator from '../components/IntelligentScheduleGenerator';
import Layout from '../components/Layout';
import { Calendar, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const Schedule = () => {
    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                        <Sparkles size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Otimização de Tempo Ativa</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">
                        Plataforma de <span className="text-accent-1">Cronogramas</span>
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-[0.3em] max-w-xl mx-auto">
                        Crie, monitore e ajuste sua rota de estudos em tempo real.
                    </p>
                </motion.header>

                {auth.currentUser && (
                    <div className="space-y-24 pb-20">
                        {/* Section 1: Interaction/Generator */}
                        <section>
                            <IntelligentScheduleGenerator 
                                userId={auth.currentUser.uid} 
                                isOwner={true}
                            />
                        </section>

                        {/* Section 2: Active Visualization */}
                        <section className="pt-24 border-t border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Cronograma Ativo</h2>
                                    <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest">Painel de monitoramento de progresso</p>
                                </div>
                            </div>
                            
                            <StudySchedule 
                                userId={auth.currentUser.uid} 
                                isOwner={true}
                            />
                        </section>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Schedule;
