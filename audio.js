let audioContext;
let backgroundMusicSource;
let backgroundMusicBuffer;
let isPlaying = false;
const soundBuffers = new Map();

async function setupAudioContext() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

async function loadSound(url, isMusic = false) {
    await setupAudioContext();

    if (soundBuffers.has(url)) {
        return soundBuffers.get(url);
    }

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        if (!isMusic) {
             soundBuffers.set(url, audioBuffer);
        }
        return audioBuffer;
    } catch (error) {
        console.error(`Error loading audio file ${url}:`, error);
        return null;
    }
}

export async function initAudio() {
    backgroundMusicBuffer = await loadSound('/accompaniment.mp3', true);
    // Preload other sounds
    await loadSound('chest_opening.mp3');
    await loadSound('xp_gain.mp3');
}

export function toggleMusic() {
    if (!audioContext) {
        console.warn("Audio context not ready.");
        // Try to start it on user interaction
        initAudio().then(() => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            toggleMusic();
        });
        return;
    }
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (isPlaying) {
        backgroundMusicSource.stop();
        isPlaying = false;
    } else {
        if (backgroundMusicBuffer) {
            backgroundMusicSource = audioContext.createBufferSource();
            backgroundMusicSource.buffer = backgroundMusicBuffer;
            backgroundMusicSource.loop = true;
            backgroundMusicSource.connect(audioContext.destination);
            backgroundMusicSource.start(0);
            isPlaying = true;
        }
    }
}

export async function playSound(url) {
    await setupAudioContext();
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    let buffer = soundBuffers.get(url);
    if (!buffer) {
        console.warn(`Sound ${url} not preloaded. Loading now.`);
        buffer = await loadSound(url);
    }

    if (buffer) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    }
}