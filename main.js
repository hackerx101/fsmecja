import { initAuth, getUser, getRoom } from 'auth';
import { initRewards } from 'rewards';
import { initAudio, toggleMusic } from 'audio';

document.addEventListener('DOMContentLoaded', () => {
    // --- Matrix Background ---
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = '技术体育青年创新NFSMEC';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function drawMatrix() {
        ctx.fillStyle = 'rgba(10, 10, 20, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00aaff';
        ctx.font = `${fontSize}px arial`;

        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(drawMatrix, 40);

    // --- Page Navigation ---
    const homePage = document.getElementById('home-page');
    const rewardsPage = document.getElementById('rewards-page');
    const rewardsNavBtn = document.getElementById('rewards-nav-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const recruitBtn = document.getElementById('recruit-btn');
    const gamePage = document.getElementById('game-page');
    const playBtn = document.getElementById('play-game-btn');
    const backToHomeFromGameBtn = document.getElementById('back-to-home-from-game-btn');

    function showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        page.classList.add('active');
    }

    rewardsNavBtn.addEventListener('click', () => showPage(rewardsPage));
    backToHomeBtn.addEventListener('click', () => showPage(homePage));
    playBtn.addEventListener('click', () => {
        const user = getUser();
        if (!user || !user.username) {
            alert("Please log in as a guest first to play!");
            document.getElementById('profile-btn').click();
            return;
        }
        showPage(gamePage);
    });
    backToHomeFromGameBtn.addEventListener('click', () => {
        // Here we can add logic to leave a game room if necessary
        showPage(homePage);
        const gameContent = document.getElementById('game-content');
        const gameSetup = document.getElementById('game-setup');
        gameContent.style.display = 'none';
        gameSetup.style.display = 'flex';
    });


    // --- "Learn More" Modal ---
    const learnMoreBtn = document.getElementById('learn-more-btn');
    const codeModal = document.getElementById('code-modal');
    const closeCodeModalBtn = document.getElementById('close-code-modal');
    const codeDisplay = document.getElementById('code-display');

    learnMoreBtn.addEventListener('click', () => {
        fetch('index.html')
            .then(response => response.text())
            .then(html => {
                codeDisplay.textContent = html;
                codeModal.style.display = 'flex';
            });
    });

    closeCodeModalBtn.addEventListener('click', () => {
        codeModal.style.display = 'none';
    });
    
    // --- Crack The Code Game (Multiplayer) ---
    const codeInput = document.getElementById('code-input');
    const submitCodeBtn = document.getElementById('submit-code-btn');
    const gameMessage = document.getElementById('game-message');
    const playerList = document.getElementById('player-list');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const codePrompt = document.getElementById('code-prompt');

    function setupMultiplayerGame(difficulty) {
        const room = getRoom();
        if (!room) {
            alert("Connection error. Please try again.");
            return;
        }

        const gameContent = document.getElementById('game-content');
        const gameSetup = document.getElementById('game-setup');
        gameContent.style.display = 'flex';
        gameSetup.style.display = 'none';
        
        const roomName = `puzzle_room_${difficulty}`;
        room.updatePresence({ inRoom: roomName });

        // Initialize room if not already
        room.updateRoomState({
            [roomName]: {
                puzzle: room.roomState[roomName]?.puzzle || generateNewPuzzle(difficulty),
                solvedBy: room.roomState[roomName]?.solvedBy || null
            }
        });

        room.subscribeRoomState(handleRoomStateChange);
        room.subscribePresence(updatePlayerList);

        room.onmessage = handleGameMessages;
    }

    function handleRoomStateChange(roomState) {
        const room = getRoom();
        const roomName = room.presence[room.clientId]?.inRoom;
        if (!roomName || !roomState[roomName]) return;

        const currentPuzzleData = roomState[roomName];
        codePrompt.textContent = `Hint: ${currentPuzzleData.puzzle.hint}`;
        
        if (currentPuzzleData.solvedBy) {
            gameMessage.style.color = 'var(--secondary-color)';
            const solverUsername = room.peers[currentPuzzleData.solvedBy]?.username || 'A player';
            gameMessage.textContent = `Code cracked by ${solverUsername}! New round starts in 5s.`;
            
            // Host logic to reset round
            if (room.clientId === Object.keys(room.peers).sort()[0]) {
                 setTimeout(() => {
                    room.updateRoomState({
                        [roomName]: {
                            puzzle: generateNewPuzzle(roomName.split('_')[2]),
                            solvedBy: null
                        }
                    });
                }, 5000);
            }
        } else {
            gameMessage.textContent = '';
        }
    }

    function updatePlayerList(presence) {
        playerList.innerHTML = '';
        const room = getRoom();
        const roomName = room.presence[room.clientId]?.inRoom;
        if (!roomName) return;
        
        Object.entries(room.peers).forEach(([id, peer]) => {
             if (presence[id]?.inRoom === roomName) {
                const li = document.createElement('li');
                li.textContent = peer.username;
                playerList.appendChild(li);
            }
        });
    }

    function handleGameMessages(event) {
        const { type, clientId, username, message } = event.data;
        if (type === 'chat') {
            const p = document.createElement('p');
            p.classList.add('user-message');
            p.innerHTML = `<span class="username">${username}:</span> ${message}`;
            chatMessages.appendChild(p);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else if (type === 'system') {
            const p = document.createElement('p');
            p.classList.add('system-message');
            p.textContent = message;
            chatMessages.appendChild(p);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    const PUZZLES = {
        easy: [
            { code: "Future Stars", hint: "What NFSMEC looks for." },
            { code: "Matrix", hint: "The background animation style." },
            { code: "Innovation", hint: "A core value of NFSMEC." }
        ],
        hard: [
            { code: "Synergy", hint: "When the whole is greater than the sum of its parts." },
            { code: "Elite Combine", hint: "The 'EC' in NFSMEC." },
            { code: "Cybernetics", hint: "The fusion of tech and biology." }
        ]
    };

    function generateNewPuzzle(difficulty) {
        const puzzleList = PUZZLES[difficulty] || PUZZLES.easy;
        return puzzleList[Math.floor(Math.random() * puzzleList.length)];
    }

    submitCodeBtn.addEventListener('click', () => {
        const room = getRoom();
        const roomName = room.presence[room.clientId]?.inRoom;
        if (!roomName) return;

        const currentPuzzleData = room.roomState[roomName];
        if (currentPuzzleData.solvedBy) {
            gameMessage.textContent = 'This round is already over. Wait for the next one!';
            return;
        }

        const submittedCode = codeInput.value.trim();
        if (submittedCode.toLowerCase() === currentPuzzleData.puzzle.code.toLowerCase()) {
            room.updateRoomState({
                [roomName]: {
                    ...currentPuzzleData,
                    solvedBy: room.clientId,
                }
            });
            room.send({ type: 'system', message: `${room.peers[room.clientId].username} solved the puzzle!` });
            codeInput.value = '';
        } else {
            gameMessage.style.color = '#ff3333';
            gameMessage.textContent = 'Access Denied. Incorrect passphrase.';
            room.send({ type: 'system', message: `${room.peers[room.clientId].username} made an incorrect guess.` });
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            const room = getRoom();
            room.send({
                type: 'chat',
                message: chatInput.value.trim(),
            });
            chatInput.value = '';
        }
    });

    // Clear message on input
    codeInput.addEventListener('input', () => {
        gameMessage.textContent = '';
    });
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.target.dataset.difficulty;
            setupMultiplayerGame(difficulty);
        });
    });


    // --- Recruit Modal ---
    const recruitModal = document.getElementById('recruit-modal');
    const closeRecruitModalBtn = document.getElementById('close-recruit-modal');
    const sendRecruitmentBtn = document.getElementById('send-recruitment-btn');

    recruitBtn.addEventListener('click', () => {
        recruitModal.style.display = 'flex';
    });

    closeRecruitModalBtn.addEventListener('click', () => {
        recruitModal.style.display = 'none';
    });

    sendRecruitmentBtn.addEventListener('click', () => {
        const channel = document.querySelector('input[name="channel"]:checked').value;
        const rank = document.getElementById('rank-select').value;
        alert(`Recruitment sent to ${channel} chat for players rank ${rank} and above!`);
        recruitModal.style.display = 'none';
    });


    // --- Music Toggle ---
    const musicToggleBtn = document.getElementById('music-toggle-btn');
    musicToggleBtn.addEventListener('click', () => {
        toggleMusic();
        musicToggleBtn.classList.toggle('paused');
    });

    // --- Init Modules ---
    initAudio();
    initAuth();
    initRewards();

    // --- Close modals on outside click ---
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-container')) {
            event.target.style.display = 'none';
        }
    });
});