import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { 
    Calendar, 
    Sparkles, 
    Clock, 
    BookOpen, 
    Plus, 
    Trash2, 
    Save, 
    RefreshCw,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Task {
    time: string;
    subject: string;
    topic: string;
    duration: string;
    completed: boolean;
}

interface ScheduleDay {
    day: string;
    tasks: Task[];
}

interface UserPreferences {
    subjects: string[];
    hoursPerDay: number;
    examDate?: string;
    focusAreas: string[];
}

interface StudyScheduleProps {
    userId: string;
    isOwner: boolean;
}

const StudySchedule: React.FC<StudyScheduleProps> = ({ userId, isOwner }) => {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [schedule, setSchedule] = useState<ScheduleDay[] | null>(null);
    const [notes, setNotes] = useState('');
    const [currentUser, setCurrentUser] = useState(auth.currentUser);
    const [preferences, setPreferences] = useState<UserPreferences>({
        subjects: ['Matemática', 'Português', 'Biologia', 'Física', 'Química', 'História', 'Geografia'],
        hoursPerDay: 4,
        focusAreas: []
    });
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<{ dayIdx: number, taskIdx: number | null, task: Task } | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, 'schedules', userId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSchedule(data.plan);
                setPreferences(data.preferences || preferences);
                setNotes(data.notes || '');
            } else if (isOwner) {
                setShowForm(true);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching schedule:", error);
            setLoading(false);
            // Only throw handleFirestoreError if specifically requested or for logged in users to help debug rules
            // but don't let it crash the component render for visitors
            if (auth.currentUser) {
                try {
                    handleFirestoreError(error, OperationType.GET, `schedules/${userId}`);
                } catch (e) {
                    console.error("Firestore error details:", e);
                }
            }
        });

        return () => unsubscribe();
    }, [userId, isOwner]);

    const saveSchedule = async (newPlan: ScheduleDay[], newNotes?: string) => {
        if (!isOwner) return;
        try {
            await setDoc(doc(db, 'schedules', userId), {
                plan: newPlan,
                notes: newNotes !== undefined ? newNotes : notes,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving schedule:", error);
            handleFirestoreError(error, OperationType.WRITE, `schedules/${userId}`);
        }
    };

    const generateSchedule = async () => {
        if (!isOwner) return;
        if (!currentUser) {
            toast.error("Você precisa estar logado para gerar um cronograma personalizado.");
            return;
        }

        setGenerating(true);
        try {
            const response = await fetch('/api/generate-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error('Falha na comunicação com a API do servidor.');
                }
                throw new Error(errorData.error || 'Failed to generate schedule');
            }

            const generatedPlan = await response.json();
            const planWithStatus = generatedPlan.map((day: any) => ({
                ...day,
                tasks: day.tasks.map((task: any) => ({ 
                    ...task, 
                    completed: false,
                    duration: task.duration || '1h'
                }))
            }));

            setSchedule(planWithStatus);
            setShowForm(false);
            toast.success("Cronograma gerado com sucesso!");
            
            await setDoc(doc(db, 'schedules', userId), {
                userId: userId,
                plan: planWithStatus,
                preferences,
                notes: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error generating schedule:", error);
            const errorMessage = error instanceof Error ? error.message : "Erro ao gerar cronograma pela IA. Tente novamente.";
            toast.error(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    const toggleTask = async (dayIndex: number, taskIndex: number) => {
        if (!schedule || !isOwner) return;
        const newSchedule = [...schedule];
        newSchedule[dayIndex].tasks[taskIndex].completed = !newSchedule[dayIndex].tasks[taskIndex].completed;
        setSchedule(newSchedule);
        saveSchedule(newSchedule);
    };

    const handleTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask || !schedule) return;

        const newSchedule = [...schedule];
        const { dayIdx, taskIdx, task } = editingTask;

        if (taskIdx === null) {
            // Add new task
            newSchedule[dayIdx].tasks.push(task);
        } else {
            // Edit existing task
            newSchedule[dayIdx].tasks[taskIdx] = task;
        }

        setSchedule(newSchedule);
        saveSchedule(newSchedule);
        setEditingTask(null);
        toast.success(taskIdx === null ? "Tarefa adicionada!" : "Tarefa atualizada!");
    };

    const deleteTask = (dayIdx: number, taskIdx: number) => {
        if (!schedule || !isOwner) return;
        const newSchedule = [...schedule];
        newSchedule[dayIdx].tasks.splice(taskIdx, 1);
        setSchedule(newSchedule);
        saveSchedule(newSchedule);
        toast.success("Tarefa removida");
    };

    const deleteSchedule = async () => {
        if (!isOwner || !confirm("Tem certeza que deseja excluir seu cronograma atual?")) return;
        setSchedule(null);
        setShowForm(true);
        try {
            await setDoc(doc(db, 'schedules', userId), {
                plan: null,
                notes: '',
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error deleting schedule:", error);
            handleFirestoreError(error, OperationType.WRITE, `schedules/${userId}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-accent-1" size={32} />
            </div>
        );
    }

    return (
        <div className="study-schedule-container">
            {!showForm && schedule ? (
                <div className="schedule-view">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h3 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                                <span className="p-2 bg-accent-1/10 rounded-xl">
                                    <Sparkles className="text-accent-1" size={24} />
                                </span>
                                Seu Plano de Estudos
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 ml-11">Organização semanal para sua aprovação no ENEM</p>
                        </div>
                        {isOwner && (
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowForm(true)}
                                    className="group px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95"
                                >
                                    <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" /> 
                                    <span>Reajustar</span>
                                </button>
                                <button 
                                    onClick={deleteSchedule}
                                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                        {schedule.map((day, dIdx) => (
                            <div key={day.day} className="flex flex-col h-full">
                                <div className="sticky top-0 z-10 mb-4">
                                    <div className="bg-bg-secondary/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl p-3 text-center flex flex-col items-center gap-1 shadow-lg">
                                        <h4 className="font-bold text-slate-900 dark:text-gray-200 text-xs tracking-wider uppercase">{day.day}</h4>
                                        <div className="h-0.5 w-8 bg-accent-1/30 rounded-full"></div>
                                        {isOwner && (
                                            <button 
                                                onClick={() => setEditingTask({ 
                                                    dayIdx: dIdx, 
                                                    taskIdx: null, 
                                                    task: { time: '08:00', subject: '', topic: '', duration: '1h', completed: false } 
                                                })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-1/50 hover:text-accent-1 hover:bg-accent-1/10 p-1.5 rounded-lg transition-all"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 min-h-[100px]">
                                    {day.tasks.length === 0 ? (
                                        <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-2xl p-4">
                                            <span className="text-[10px] text-gray-500 italic">Folga</span>
                                        </div>
                                    ) : (
                                        day.tasks.map((task, tIdx) => (
                                            <motion.div
                                                key={tIdx}
                                                whileHover={isOwner ? { y: -2, scale: 1.02 } : {}}
                                                className={`p-4 rounded-2xl border transition-all group relative overflow-hidden ${
                                                    task.completed 
                                                    ? 'bg-green-500/5 border-green-500/20 opacity-70 shadow-sm' 
                                                    : 'bg-bg-secondary border border-slate-200 dark:border-white/10 hover:border-accent-1/30 hover:bg-slate-50 dark:hover:bg-white/[0.07] shadow-lg shadow-black/10'
                                                }`}
                                            >
                                                {/* Decorative background accent */}
                                                {!task.completed && (
                                                    <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-accent-1/5 blur-2xl group-hover:bg-accent-1/10 transition-colors"></div>
                                                )}

                                                <div onClick={() => isOwner && toggleTask(dIdx, tIdx)} className="cursor-pointer">
                                                    <div className="flex items-center justify-between gap-2 mb-3">
                                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                                            <div className="p-1 bg-accent-1/10 rounded-md shrink-0">
                                                                <Clock size={10} className="text-accent-1" />
                                                            </div>
                                                            <span className="text-[9px] font-mono font-bold text-accent-1 tracking-tighter">
                                                                {task.time}
                                                            </span>
                                                        </div>
                                                        {task.completed ? (
                                                            <div className="flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
                                                                <span className="text-[8px] font-bold text-green-500 uppercase">OK</span>
                                                                <CheckCircle2 size={10} className="text-green-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-white/10 group-hover:border-accent-1/30 transition-colors flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-accent-1 scale-0 group-hover:scale-100 transition-transform"></div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h5 className={`text-[13px] font-bold leading-tight mb-1 ${task.completed ? 'line-through text-slate-400 dark:text-gray-500' : 'text-slate-900 dark:text-gray-100 group-hover:text-accent-1 transition-colors'}`}>
                                                        {task.subject}
                                                    </h5>
                                                    <p className={`text-[10px] leading-snug line-clamp-2 ${task.completed ? 'text-slate-400 dark:text-gray-600' : 'text-slate-500 dark:text-gray-400'}`}>
                                                        {task.topic}
                                                    </p>
                                                    
                                                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                                                        <span className="text-[8px] text-slate-400 dark:text-gray-500 font-mono tracking-wider uppercase">Duração: {task.duration}</span>
                                                    </div>
                                                </div>

                                                {isOwner && (
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pointer-events-none group-hover:pointer-events-auto">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingTask({ dayIdx: dIdx, taskIdx: tIdx, task: { ...task } });
                                                            }}
                                                            className="p-1.5 bg-white/10 hover:bg-accent-1 hover:text-[color:var(--btn-text-color,white)] rounded-lg transition-all"
                                                        >
                                                            <PenTool size={10} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteTask(dIdx, tIdx);
                                                            }}
                                                            className="p-1.5 bg-red-500/10 hover:bg-red-500 text-white rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bento-card relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <BookOpen size={64} className="text-accent-1" />
                            </div>
                            <h4 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
                                <span className="p-2 bg-accent-1/10 rounded-lg">
                                    <BookOpen size={18} className="text-accent-1" />
                                </span>
                                Notas e Observações
                            </h4>
                            <textarea 
                                value={notes}
                                onChange={(e) => {
                                    setNotes(e.target.value);
                                    if (isOwner) saveSchedule(schedule, e.target.value);
                                }}
                                readOnly={!isOwner}
                                placeholder={isOwner ? "Adicione anotações sobre seu progresso, metas ou lembretes..." : "Sem notas."}
                                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-600 dark:text-gray-300 min-h-[140px] resize-none placeholder:text-slate-400 dark:placeholder:text-gray-600 leading-relaxed"
                            />
                        </div>

                        <div className="bento-card relative overflow-hidden">
                            <div className="absolute -top-4 -right-4 w-32 h-32 bg-accent-1/[0.05] rounded-full blur-3xl"></div>
                            <div className="flex items-start gap-5 relative z-10">
                                <div className="p-3 bg-accent-1/10 rounded-2xl shrink-0 shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                                    <AlertCircle className="text-accent-1" size={28} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold mb-2 text-slate-900 dark:text-white">Dica do Corvo</h4>
                                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                                        "O sucesso é o somatório de pequenos esforços repetidos dia após dia." <br /><br />
                                        Mantenha a constância. Se uma tarefa for muito longa, fracione-a. Use a técnica Pomodoro e lembre-se de que cada dia de estudo aproxima você do Ninho da aprovação.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-accent-1/10 text-accent-1 text-[9px] font-bold rounded-md uppercase tracking-wider">Foco Total</span>
                                        <span className="px-2 py-1 bg-white/5 text-gray-400 text-[9px] font-bold rounded-md uppercase tracking-wider">Hábito</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            ) : isOwner ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-bg-secondary border border-slate-200 dark:border-white/10 rounded-2xl p-6"
                >
                    <div className="text-center mb-6">
                        <Sparkles className="text-accent-1 mx-auto mb-3" size={32} />
                        <h3 className="text-lg font-bold">Configurar Cronograma</h3>
                        <p className="text-sm text-gray-400">Personalize seu plano de estudos com IA</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Horas por dia: <span className="text-accent-1 font-bold">{preferences.hoursPerDay}h</span></label>
                            <input 
                                type="range" min="1" max="12" 
                                value={preferences.hoursPerDay}
                                onChange={(e) => setPreferences({...preferences, hoursPerDay: parseInt(e.target.value)})}
                                className="w-full accent-accent-1"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Matérias</label>
                            <div className="flex flex-wrap gap-1.5">
                                {['Matemática', 'Português', 'Biologia', 'Física', 'Química', 'História', 'Geografia', 'Redação'].map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => {
                                            const newSubs = preferences.subjects.includes(sub)
                                                ? preferences.subjects.filter(s => s !== sub)
                                                : [...preferences.subjects, sub];
                                            setPreferences({...preferences, subjects: newSubs});
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
                                            preferences.subjects.includes(sub)
                                            ? 'bg-accent-1 text-[color:var(--btn-text-color,white)]'
                                            : 'bg-white/5 text-gray-400'
                                        }`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={generateSchedule}
                            disabled={generating || preferences.subjects.length === 0}
                            className="w-full py-3 bg-accent-1 hover:bg-accent-1/90 disabled:opacity-50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                        >
                            {generating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                            {generating ? 'O Corvo está pensando...' : 'Gerar Cronograma'}
                        </button>
                        
                        {schedule && (
                            <button onClick={() => setShowForm(false)} className="w-full text-xs text-gray-500 hover:text-white">
                                Voltar ao plano atual
                            </button>
                        )}
                    </div>
                </motion.div>
            ) : (
                <div className="text-center p-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
                    <p className="text-gray-400">Este usuário ainda não configurou um cronograma público.</p>
                </div>
            )}

            {/* Task Editor Modal */}
            <AnimatePresence>
                {editingTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-bg-secondary border border-glass-border rounded-3xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">
                                    {editingTask.taskIdx === null ? 'Nova Tarefa' : 'Editar Tarefa'}
                                </h3>
                                <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleTaskSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Matéria</label>
                                    <input 
                                        type="text" 
                                        value={editingTask.task.subject}
                                        onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, subject: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-1 outline-none"
                                        placeholder="Ex: Matemática"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Tópico</label>
                                    <input 
                                        type="text" 
                                        value={editingTask.task.topic}
                                        onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, topic: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-1 outline-none"
                                        placeholder="Ex: Funções de 1º Grau"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Horário</label>
                                        <input 
                                            type="time" 
                                            value={editingTask.task.time}
                                            onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, time: e.target.value } })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-1 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Duração</label>
                                        <input 
                                            type="text" 
                                            value={editingTask.task.duration}
                                            onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, duration: e.target.value } })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-1 outline-none"
                                            placeholder="Ex: 1h 30min"
                                            required
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full py-3 bg-accent-1 hover:bg-accent-1/90 rounded-xl font-bold text-sm transition-all mt-4"
                                >
                                    {editingTask.taskIdx === null ? 'Adicionar Tarefa' : 'Salvar Alterações'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudySchedule;
