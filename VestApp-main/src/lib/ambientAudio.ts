// Web Audio API Synthesizer for Focus ambient study sounds.
// Generates rain, ocean waves, cosmic drones, cozy fireplace, and forest wind procedurally.
// No external asset loading, completely offline-compatible, and zero CORS/network issues.

let audioCtx: AudioContext | null = null;

// Track all active audio nodes for simple cleanup
let activeNodes: any[] = [];
// Track active timeouts for procedural generation (fire crackles, etc.)
let activeTimers: any[] = [];

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Generate White Noise Buffer
function createWhiteNoiseBuffer(ctx: AudioContext, seconds: number = 2): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

// Generate Pink Noise Buffer (smoother, warm noise)
function createPinkNoiseBuffer(ctx: AudioContext, seconds: number = 2): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // normalise pink noise standard amplitude
        b6 = white * 0.115926;
    }
    return buffer;
}

// Generate Brown Noise Buffer (deep waterfall/rumble sound)
function createBrownNoiseBuffer(ctx: AudioContext, seconds: number = 2): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // gain normalization
    }
    return buffer;
}

// Fireplace Crackling Spark Generator
function startFireCrackles(ctx: AudioContext, targetNode: AudioNode) {
    const playSparks = () => {
        if (!audioCtx || audioCtx.state === 'suspended') return;

        // Random interval for cozy crackling (between 60ms and 500ms)
        const nextInterval = 60 + Math.random() * 440;

        const timer = setTimeout(() => {
            if (!audioCtx || audioCtx.state === 'suspended') return;

            // Generate extremely short high-pitched pops
            const osc = ctx.createOscillator();
            const popGain = ctx.createGain();

            osc.connect(popGain);
            popGain.connect(targetNode);

            // Filter out bass, keep crisp wooden spark snap
            osc.frequency.setValueAtTime(800 + Math.random() * 1900, ctx.currentTime);
            // Triangle or saw for sharper wooden click
            osc.type = Math.random() > 0.3 ? 'triangle' : 'sine';

            popGain.gain.setValueAtTime(0, ctx.currentTime);
            popGain.gain.linearRampToValueAtTime(0.003 + Math.random() * 0.007, ctx.currentTime + 0.002);
            popGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.01 + Math.random() * 0.02);

            osc.start();
            osc.stop(ctx.currentTime + 0.04);

            activeNodes.push(osc);
            activeNodes.push(popGain);

            playSparks();
        }, nextInterval);

        activeTimers.push(timer);
    };

    playSparks();
}

export async function playAmbientSound(soundId: string) {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        stopAmbientSound(); // Reset previous running state

        // Main output node with smooth volume control to safeguard hearing
        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0.32, ctx.currentTime);
        mainGain.connect(ctx.destination);
        activeNodes.push(mainGain);

        if (soundId === 'chuva') {
            // --- RAIN ON THE WINDOW ---
            // Blending brown noise (rumble) and pink noise (droplets patter)
            const brownBuffer = createBrownNoiseBuffer(ctx);
            const pinkBuffer = createPinkNoiseBuffer(ctx);

            const brownSource = ctx.createBufferSource();
            brownSource.buffer = brownBuffer;
            brownSource.loop = true;

            const pinkSource = ctx.createBufferSource();
            pinkSource.buffer = pinkBuffer;
            pinkSource.loop = true;

            const brownFilter = ctx.createBiquadFilter();
            brownFilter.type = 'lowpass';
            brownFilter.frequency.setValueAtTime(450, ctx.currentTime);

            const pinkFilter = ctx.createBiquadFilter();
            pinkFilter.type = 'bandpass';
            pinkFilter.frequency.setValueAtTime(800, ctx.currentTime);
            pinkFilter.Q.setValueAtTime(1.2, ctx.currentTime);

            const pinkGain = ctx.createGain();
            pinkGain.gain.setValueAtTime(0.2, ctx.currentTime);

            brownSource.connect(brownFilter);
            brownFilter.connect(mainGain);

            pinkSource.connect(pinkFilter);
            pinkFilter.connect(pinkGain);
            pinkGain.connect(mainGain);

            brownSource.start();
            pinkSource.start();

            activeNodes.push(brownSource, pinkSource, brownFilter, pinkFilter, pinkGain);

        } else if (soundId === 'ondas') {
            // --- CALMING OCEAN WAVES ---
            // Low-pass filtered brown noise with slow sinusoidal tide modulation
            const brownBuffer = createBrownNoiseBuffer(ctx);
            const source = ctx.createBufferSource();
            source.buffer = brownBuffer;
            source.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(280, ctx.currentTime);

            const waveGain = ctx.createGain();
            waveGain.gain.setValueAtTime(0.12, ctx.currentTime);

            source.connect(filter);
            filter.connect(waveGain);
            waveGain.connect(mainGain);

            // Very slow volume modulator (0.07Hz = 1 wave swell every ~14 seconds)
            const lfo = ctx.createOscillator();
            lfo.frequency.setValueAtTime(0.07, ctx.currentTime);
            lfo.type = 'sine';

            const lfoGain = ctx.createGain();
            lfoGain.gain.setValueAtTime(0.09, ctx.currentTime);

            lfo.connect(lfoGain);
            lfoGain.connect(waveGain.gain);

            lfo.start();
            source.start();

            activeNodes.push(source, filter, waveGain, lfo, lfoGain);

        } else if (soundId === 'drone') {
            // --- ZEN COSMIC DEEP DRONE ---
            // Lush, warm ambient soundscape synthesized using 5 tuned oscillators
            // Swelling slowly in and out using separate sub-audible LFOs
            const baseFreqs = [110.0, 164.8, 220.0, 277.2, 330.0]; // A2, E3, A3, C#4, E4: Beautiful A Major Chord
            const lfoSpeeds = [0.03, 0.05, 0.04, 0.02, 0.035];   // Individual swelling speeds

            const masterFilter = ctx.createBiquadFilter();
            masterFilter.type = 'lowpass';
            masterFilter.frequency.setValueAtTime(380, ctx.currentTime); // Warm and cozy filter
            masterFilter.connect(mainGain);
            activeNodes.push(masterFilter);

            baseFreqs.forEach((freq, idx) => {
                // Generate tone osc
                const osc = ctx.createOscillator();
                osc.type = 'triangle'; // Warm, harmonics-rich wave
                osc.frequency.setValueAtTime(freq, ctx.currentTime);

                const oscGain = ctx.createGain();
                oscGain.gain.setValueAtTime(0.04, ctx.currentTime);

                osc.connect(oscGain);
                oscGain.connect(masterFilter);

                // Modulate this voice slowly
                const slowLFO = ctx.createOscillator();
                slowLFO.frequency.setValueAtTime(lfoSpeeds[idx], ctx.currentTime);
                slowLFO.type = 'sine';

                const slowLFOGain = ctx.createGain();
                slowLFOGain.gain.setValueAtTime(0.03, ctx.currentTime);

                slowLFO.connect(slowLFOGain);
                slowLFOGain.connect(oscGain.gain);

                osc.start();
                slowLFO.start();

                activeNodes.push(osc, oscGain, slowLFO, slowLFOGain);
            });

        } else if (soundId === 'lareira') {
            // --- COZY FIREPLACE ---
            // low rumble pink noise + crackling sparkles scheduler
            const pinkBuffer = createPinkNoiseBuffer(ctx);
            const source = ctx.createBufferSource();
            source.buffer = pinkBuffer;
            source.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(220, ctx.currentTime); // Low roar of wood logs

            source.connect(filter);
            filter.connect(mainGain);
            source.start();

            activeNodes.push(source, filter);

            // Add the sparks pop scheduler!
            startFireCrackles(ctx, mainGain);

        } else if (soundId === 'vento') {
            // --- FOREST BREEZE ---
            // Slowly wandering bandpass filter on white/pink noise to simulate natural breeze
            const pinkBuffer = createPinkNoiseBuffer(ctx);
            const source = ctx.createBufferSource();
            source.buffer = pinkBuffer;
            source.loop = true;

            const breezeFilter = ctx.createBiquadFilter();
            breezeFilter.type = 'bandpass';
            breezeFilter.frequency.setValueAtTime(400, ctx.currentTime);
            breezeFilter.Q.setValueAtTime(1.5, ctx.currentTime);

            source.connect(breezeFilter);
            breezeFilter.connect(mainGain);
            source.start();

            // LFO to make the wind rise and fall (modulating filter frequency)
            const breezeLFO = ctx.createOscillator();
            breezeLFO.frequency.setValueAtTime(0.08, ctx.currentTime); // Wave every 12 seconds
            breezeLFO.type = 'triangle';

            const breezeLFOGain = ctx.createGain();
            breezeLFOGain.gain.setValueAtTime(260, ctx.currentTime); // Sweep filter frequency up and down by 260Hz

            breezeLFO.connect(breezeLFOGain);
            breezeLFOGain.connect(breezeFilter.frequency);

            breezeLFO.start();

            activeNodes.push(source, breezeFilter, breezeLFO, breezeLFOGain);
        }
    } catch (e) {
        console.error("Failed to boot synthesizer engine:", e);
    }
}

export function stopAmbientSound() {
    // 1. Clear all active procedural timers
    activeTimers.forEach(timer => clearTimeout(timer));
    activeTimers = [];

    // 2. Stop and disconnect all Web Audio nodes
    activeNodes.forEach(node => {
        try {
            if (node.stop) {
                node.stop();
            }
        } catch (e) {}

        try {
            node.disconnect();
        } catch (e) {}
    });
    activeNodes = [];
}
