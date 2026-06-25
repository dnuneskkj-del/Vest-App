import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, GraduationCap, Clock, BookOpen, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase';
import { toast } from 'sonner';
import { UserProfile } from '../types';

interface OnboardingQuizProps {
  onComplete: (data: UserProfile) => void;
}

const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: auth.currentUser?.displayName || '',
    studentType: '',
    studyTime: '',
  });

  const steps = [
    {
      id: 1,
      title: 'Como você quer ser chamado?',
      icon: <Rocket className="text-accent-1" size={32} />,
      isInput: true,
      fields: [
        { name: 'displayName', label: 'Seu Nome', placeholder: 'Ex: João Silva' },
      ],
    },
    {
      id: 2,
      title: 'Que tipo de estudante você é?',
      icon: <GraduationCap className="text-accent-1" size={32} />,
      options: [
        { id: 'vestibulando', label: 'Vestibulando', desc: 'Focado em entrar na faculdade' },
        { id: 'concurseiro', label: 'Concurseiro', desc: 'Focado em concursos públicos' },
        { id: 'universitario', label: 'Universitário', desc: 'Focado em passar nas matérias' },
        { id: 'curioso', label: 'Autodidata', desc: 'Estudando por prazer ou carreira' },
      ],
      field: 'studentType'
    },
    {
      id: 3,
      title: 'Quanto tempo você tem para estudar?',
      icon: <Clock className="text-accent-2" size={32} />,
      options: [
        { id: 'pouco', label: 'Pouco tempo', desc: 'Até 2 horas por dia' },
        { id: 'moderado', label: 'Moderado', desc: 'De 2 a 5 horas por dia' },
        { id: 'integral', label: 'Tempo Integral', desc: 'Mais de 6 horas por dia' },
        { id: 'flexivel', label: 'Flexível', desc: 'Varia conforme o dia' },
      ],
      field: 'studyTime'
    }
  ];

  const currentStep = steps[step - 1];

  const handleSelect = (value: string) => {
    setFormData({ ...formData, [currentStep.field as string]: value });
    if (step < steps.length) {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    
    if (!formData.displayName) {
      toast.error('Por favor, nos diga como quer ser chamado.');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      const generatedHandle = formData.displayName.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, '');

      const userData: UserProfile = {
        uid: auth.currentUser.uid,
        displayName: formData.displayName,
        email: auth.currentUser.email || '',
        photoURL: auth.currentUser.photoURL || '',
        avatarEdited: false,
        handle: generatedHandle,
        bio: `Estudante focado nos estudos! 🚀`,
        level: 1,
        xp: 0,
        followersCount: 0,
        followingCount: 0,
        createdAt: serverTimestamp(),
        studentType: formData.studentType,
        studyTime: formData.studyTime,
        studyGoal: 'Geral',
      };

      await setDoc(userRef, userData);
      try {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName
        });
      } catch (authError) {
        console.error("Erro ao atualizar o perfil Auth durante onboarding:", authError);
      }
      toast.success('Perfil criado com sucesso! Bem-vindo ao ninho.');
      onComplete(userData);
    } catch (error) {
      console.error('Erro ao salvar onboarding:', error);
      toast.error('Erro ao salvar suas informações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-lg overflow-hidden relative"
        style={{ padding: '40px' }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
          <motion.div 
            className="h-full bg-accent-1"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 p-4 bg-white/5 rounded-2xl">
              {currentStep.icon}
            </div>
            
            <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase">{currentStep.title}</h2>
            <p className="text-slate-400 mb-8 uppercase tracking-[0.3em] text-[10px] font-black">Passo {step} de {steps.length}</p>

            {currentStep.isInput ? (
              <div className="flex flex-col gap-6 w-full">
                {currentStep.fields?.map((f) => (
                  <div key={f.name} className="text-center group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 opacity-50 group-focus-within:opacity-100 transition-opacity">{f.label}</label>
                    <input
                      type="text"
                      name={f.name}
                      autoFocus
                      placeholder={f.placeholder}
                      value={(formData as any)[f.name]}
                      onChange={handleInputChange}
                      className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 focus:border-accent-1 text-slate-800 dark:text-white outline-none transition-all text-2xl font-black text-center tracking-tight"
                    />
                    <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-40 leading-relaxed italic">
                      Seu nome será usado para criar seu @usuario único e como a Arena irá te chamar oficialmente
                    </p>
                  </div>
                ))}
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!formData.displayName}
                  className="btn-main mt-6 w-full py-6 flex items-center justify-center gap-3 uppercase font-black tracking-[0.3em] text-xs rounded-3xl shadow-2xl shadow-accent-1/40 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Continuar Desafio <ChevronRight size={20} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 w-full">
                {currentStep.options?.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                      (formData as any)[currentStep.field as string] === option.id
                        ? 'bg-accent-1/10 border-accent-1'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-xs text-text-secondary">{option.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || loading}
            className="flex items-center gap-2 text-text-secondary hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={20} /> Voltar
          </button>

          {step === steps.length ? (
            <button
              onClick={handleSubmit}
              disabled={!formData.studyTime || loading}
              className="btn-main flex items-center gap-2"
              style={{ padding: '12px 24px' }}
            >
              {loading ? 'Criando...' : 'Finalizar'} <Rocket size={20} />
            </button>
          ) : (
            <div className="text-xs text-text-secondary">
              Selecione uma opção para continuar
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingQuiz;
