import { updateRewardsUI } from 'rewards';

const loginModal = document.getElementById('login-modal');
const usernameModal = document.getElementById('username-modal');
const profileBtn = document.getElementById('profile-btn');
const closeLoginModalBtn = document.getElementById('close-login-modal');
const guestLoginBtn = document.getElementById('guest-login-btn');
const setUsernameBtn = document.getElementById('set-username-btn');
const usernameInput = document.getElementById('username-input');
const logoutBtn = document.getElementById('logout-btn');
const copyUidBtn = document.getElementById('copy-uid-btn');
const addFriendBtn = document.getElementById('add-friend-btn');

const profileView = document.getElementById('profile-view');
const guestLoginView = document.getElementById('guest-login-view');
const displayUid = document.getElementById('display-uid');
const displayUsername = document.getElementById('display-username');

let user = null;
let room; // Multiplayer room instance

export function getRoom() {
    return room;
}

export async function initializeWebsim(username) {
    if (room) {
        console.log("Websim already initialized.");
        return;
    }
    room = new WebsimSocket();

    await room.initialize({
        username: username,
        avatarUrl: `https://api.dicebear.com/8.x/bottts/svg?seed=${username}`
    });

    console.log("Websim initialized for", room.clientId);
    return room;
}

function getUser() {
    const userData = localStorage.getItem('nfsmec_user');
    return userData ? JSON.parse(userData) : null;
}

function saveUser(userData) {
    localStorage.setItem('nfsmec_user', JSON.stringify(userData));
    user = userData;
    updateProfileStatus();
}

function generateUID() {
    return Math.random().toString(36).substring(2, 7) + Math.random().toString(36).substring(2, 7);
}

export function updateProfileStatus() {
    user = getUser();
    if (user && user.username) {
        profileView.style.display = 'block';
        guestLoginView.style.display = 'none';
        displayUid.textContent = user.uid;
        displayUsername.textContent = user.username;
    } else {
        profileView.style.display = 'none';
        guestLoginView.style.display = 'block';
    }
}

export function initAuth() {
    profileBtn.addEventListener('click', () => {
        updateProfileStatus();
        loginModal.style.display = 'flex';
    });

    closeLoginModalBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    guestLoginBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
        usernameModal.style.display = 'flex';
    });

    setUsernameBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        if (username) {
            const newUser = {
                uid: generateUID(),
                username: username
            };
            saveUser(newUser);
            usernameModal.style.display = 'none';
            alert(`Welcome, ${username}! Your UID is ${newUser.uid}`);
            
            // Initialize multiplayer connection after setting username
            await initializeWebsim(username);

            updateRewardsUI(); // Refresh rewards after login
        } else {
            alert('Please enter a valid username.');
        }
    });
    
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('nfsmec_user');
        localStorage.removeItem('nfsmec_rewards'); // Also clear rewards on logout
        user = null;
        updateProfileStatus();
        updateRewardsUI(); // Refresh rewards after logout
        loginModal.style.display = 'none';
    });

    copyUidBtn.addEventListener('click', () => {
        if(user && user.uid) {
            navigator.clipboard.writeText(user.uid).then(() => {
                alert('UID copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy UID: ', err);
            });
        }
    });

    addFriendBtn.addEventListener('click', () => {
        if (user && user.uid) {
            const referralLink = `https://rewards.nfsmec.com/refer/region=na/${user.uid}`;
            navigator.clipboard.writeText(referralLink).then(() => {
                alert(`Referral link copied to clipboard!\n${referralLink}`);
            }).catch(err => {
                console.error('Failed to copy referral link: ', err);
                alert('Could not copy the link.');
            });
        }
    });

    updateProfileStatus();
    // Auto-login and initialize websim if user exists
    user = getUser();
    if (user && user.username) {
        initializeWebsim(user.username);
    }
}

export { user, getUser };