import React, { useState, useEffect } from 'react';

const Countdown: React.FC<{ title?: string }> = ({ title = "Foco no ENEM" }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTime = () => {
            const examDate = new Date(2026, 10, 1, 13, 0, 0); // November 1st, 2026 (Month is 0-indexed)
            const now = new Date();
            const difference = examDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        };

        const timer = setInterval(calculateTime, 1000);
        calculateTime();
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="countdown-widget p-[15px] rounded-[20px] w-full max-w-[350px] mx-auto my-[15px] 
            dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-[10px] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)]
            bg-white/70 border-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-[12px] border">
            <h3 className="text-[0.85rem] dark:text-white text-slate-900 mb-[2px] font-bold uppercase tracking-[1px]">{title}</h3>
            
            <div className="countdown-grid mt-[10px]">
                <div className="countdown-item flex flex-col items-center">
                    <span className="countdown-value text-accent-1 text-[1.4rem] font-extrabold">{timeLeft.days}</span>
                    <span className="countdown-label dark:text-white/70 text-slate-500 text-[0.7rem] uppercase font-semibold">Dias</span>
                </div>
                <div className="countdown-item flex flex-col items-center">
                    <span className="countdown-value text-accent-1 text-[1.4rem] font-extrabold">{timeLeft.hours}</span>
                    <span className="countdown-label dark:text-white/70 text-slate-500 text-[0.7rem] uppercase font-semibold">Hrs</span>
                </div>
                <div className="countdown-item flex flex-col items-center">
                    <span className="countdown-value text-accent-1 text-[1.4rem] font-extrabold">{timeLeft.minutes}</span>
                    <span className="countdown-label dark:text-white/70 text-slate-500 text-[0.7rem] uppercase font-semibold">Min</span>
                </div>
                <div className="countdown-item flex flex-col items-center">
                    <span className="countdown-value text-accent-1 text-[1.4rem] font-extrabold">{timeLeft.seconds}</span>
                    <span className="countdown-label dark:text-white/70 text-slate-500 text-[0.7rem] uppercase font-semibold">Seg</span>
                </div>
            </div>
        </div>
    );
};

export default Countdown;
