import { playSound } from 'audio';
import { getUser } from 'auth';

const rewardsGrid = document.getElementById('rewards-grid');
const chestAnimationContainer = document.getElementById('chest-animation-container');
const chestElement = document.getElementById('chest');
const xpRewardModal = document.getElementById('xp-reward-modal');
const closeXpModalBtn = document.getElementById('close-xp-modal');
const xpAmountSpan = document.getElementById('xp-amount');
const TOTAL_REWARD_DAYS = 7;

function getRewardData() {
    const data = localStorage.getItem('nfsmec_rewards');
    if (data) {
        return JSON.parse(data);
    }
    // Default structure
    return {
        lastClaimed: null, // ISO date string of last claim
        claimedDays: [] // Array of day numbers (1-7) that have been claimed
    };
}

function saveRewardData(data) {
    localStorage.setItem('nfsmec_rewards', JSON.stringify(data));
}

function canClaimToday(rewardData) {
    if (!rewardData.lastClaimed) {
        return true; // Never claimed before
    }
    const lastClaimDate = new Date(rewardData.lastClaimed);
    const today = new Date();

    // Reset if it's a new day
    lastClaimDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return today > lastClaimDate;
}

function showXpReward(xp) {
    xpAmountSpan.textContent = `+${xp}`;
    xpRewardModal.style.display = 'flex';
    playSound('xp_gain.mp3');
}

function playChestAnimation(callback) {
    chestAnimationContainer.style.display = 'flex';
    playSound('chest_opening.mp3');
    chestElement.style.backgroundImage = `url('chest_closed.png')`; // Reset image
    chestElement.style.animation = 'none';
    // Trigger reflow
    chestElement.offsetHeight; 
    chestElement.style.animation = 'open-chest 1.5s forwards';

    setTimeout(() => {
        chestAnimationContainer.style.display = 'none';
        if (callback) callback();
    }, 2000); // Animation duration + buffer
}

function claimReward(day) {
    const user = getUser();
    if (!user) {
        alert("Please log in as a guest to claim rewards!");
        return;
    }

    let rewardData = getRewardData();
    if (canClaimToday(rewardData)) {
        const nextDayToClaim = (rewardData.claimedDays.length % TOTAL_REWARD_DAYS) + 1;
        if (day === nextDayToClaim) {
            const xpGained = Math.floor(Math.random() * 401) + 100; // Random XP between 100 and 500
            
            playChestAnimation(() => {
                showXpReward(xpGained);
            });
            
            rewardData.claimedDays.push(day);
            rewardData.lastClaimed = new Date().toISOString();
            // Storing XP is not requested, but could be added here.
            saveRewardData(rewardData);
            
            // Update UI after a short delay to let animation start
            setTimeout(updateRewardsUI, 500);
        }
    } else {
        alert("You've already claimed your reward for today!");
    }
}

export function updateRewardsUI() {
    rewardsGrid.innerHTML = '';
    const user = getUser();
    const rewardData = getRewardData();
    const canClaim = user ? canClaimToday(rewardData) : false;
    const nextDayToClaim = (rewardData.claimedDays.length % TOTAL_REWARD_DAYS) + 1;

    for (let i = 1; i <= TOTAL_REWARD_DAYS; i++) {
        const card = document.createElement('div');
        card.className = 'reward-card';
        
        const isClaimed = rewardData.claimedDays.includes(i);
        const isToday = canClaim && i === nextDayToClaim;

        if (isClaimed) card.classList.add('claimed');
        if (isToday) card.classList.add('today');

        let buttonHtml;
        if (isClaimed) {
            buttonHtml = `<button disabled>Claimed</button>`;
        } else if (isToday && user) {
            buttonHtml = `<button class="claim-btn">Claim</button>`;
        } else {
            buttonHtml = `<button disabled>Locked</button>`;
        }

        card.innerHTML = `
            <h4>Day ${i}</h4>
            <div class="reward-item" style="background-image: url('chest_closed.png');"></div>
            ${buttonHtml}
        `;

        if (isToday && user) {
            card.querySelector('.claim-btn').addEventListener('click', () => claimReward(i));
        }

        rewardsGrid.appendChild(card);
    }
}

export function initRewards() {
    closeXpModalBtn.addEventListener('click', () => {
        xpRewardModal.style.display = 'none';
    });
    updateRewardsUI();
}