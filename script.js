let gameState = {
    roomCode: '',
    playerName: '',
    isHost: false,
    players: [],
    myRole: '',
    phase: 'day',
    day: 1,
    isGameActive: false,
    selectedTarget: null,
    votes: {},
    nightActions: {
        mafiaTarget: null,
        doctorTarget: null,
        detectiveTarget: null
    },
    maxPlayers: 6
};

// Simulate room storage (في التطبيق الحقيقي سيكون هناك خادم)
let roomStorage = {};

const roles = {
    mafia: { 
        name: 'مافيا', 
        icon: '🔫', 
        description: 'أنت جزء من المافيا! تعاون مع زملائك لقتل المواطنين. تعرف من هم أعضاء المافيا الآخرون.' 
    },
    doctor: { 
        name: 'طبيب', 
        icon: '👨‍⚕️', 
        description: 'أنت الطبيب! يمكنك حماية شخص واحد كل ليلة من هجمات المافيا. يمكنك حماية نفسك.' 
    },
    detective: { 
        name: 'محقق', 
        icon: '🕵️', 
        description: 'أنت المحقق! يمكنك التحقق من هوية شخص واحد كل ليلة لمعرفة إذا كان مافيا أم مواطن بريء.' 
    },
    citizen: { 
        name: 'مواطن', 
        icon: '👤', 
        description: 'أنت مواطن بريء! ساعد في كشف المافيا والتصويت ضدهم في النهار.' 
    }
};

function showAlert(message, type = 'error') {
    const alertContainer = document.getElementById('alertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
    
    // Hide alert after 3 seconds
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 3000);
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom() {
    const hostName = document.getElementById('hostName').value.trim();
    const playerCount = parseInt(document.getElementById('playerCount').value);

    // Validation
    if (!hostName) {
        showAlert('يرجى إدخال اسمك');
        return;
    }

    if (hostName.length < 2) {
        showAlert('يجب أن يكون الاسم على الأقل حرفين');
        return;
    }

    if (playerCount < 4 || playerCount > 12) {
        showAlert('عدد اللاعبين يجب أن يكون بين 4 و 12');
        return;
    }

    // Generate unique room code
    let roomCode;
    do {
        roomCode = generateRoomCode();
    } while (roomStorage[roomCode]);

    // Initialize room data
    gameState.roomCode = roomCode;
    gameState.playerName = hostName;
    gameState.isHost = true;
    gameState.maxPlayers = playerCount;
    gameState.players = [{
        name: hostName,
        id: Date.now(), // Use timestamp as unique ID
        role: '',
        alive: true,
        isHost: true
    }];

    // Store room in simulated storage
    roomStorage[roomCode] = {
        host: hostName,
        maxPlayers: playerCount,
        players: [...gameState.players],
        gameStarted: false
    };

    showAlert('تم إنشاء الغرفة بنجاح!', 'success');
    
    // Show waiting room after short delay
    setTimeout(() => {
        showWaitingRoom();
    }, 1000);
}

function joinRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();

    // Validation
    if (!playerName) {
        showAlert('يرجى إدخال اسمك');
        return;
    }

    if (playerName.length < 2) {
        showAlert('يجب أن يكون الاسم على الأقل حرفين');
        return;
    }

    if (!roomCode) {
        showAlert('يرجى إدخال كود الغرفة');
        return;
    }

    if (roomCode.length !== 6) {
        showAlert('كود الغرفة يجب أن يكون 6 أحرف');
        return;  
    }

    // Check if room exists
    if (!roomStorage[roomCode]) {
        showAlert('الغرفة غير موجودة. تأكد من كود الغرفة');
        return;
    }

    const room = roomStorage[roomCode];

    // Check if game already started
    if (room.gameStarted) {
        showAlert('اللعبة قد بدأت بالفعل في هذه الغرفة');
        return;
    }

    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
        showAlert('الغرفة ممتلئة');
        return;
    }

    // Check if name already exists
    if (room.players.some(p => p.name === playerName)) {
        showAlert('هذا الاسم مستخدم بالفعل في الغرفة');
        return;
    }

    // Add player to room
    const newPlayer = {
        name: playerName,
        id: Date.now(),
        role: '',
        alive: true,
        isHost: false
    };

    room.players.push(newPlayer);
    
    // Update game state
    gameState.roomCode = roomCode;
    gameState.playerName = playerName;
    gameState.isHost = false;
    gameState.maxPlayers = room.maxPlayers;
    gameState.players = [...room.players];

    showAlert('تم الانضمام للغرفة بنجاح!', 'success');
    
    // Show waiting room after short delay
    setTimeout(() => {
        showWaitingRoom();
    }, 1000);
}

function showWaitingRoom() {
    document.getElementById('roomSetup').classList.add('hidden');
    document.getElementById('waitingRoom').classList.remove('hidden');
    
    document.getElementById('displayRoomCode').textContent = gameState.roomCode;
    document.getElementById('maxPlayersDisplay').textContent = gameState.maxPlayers;
    updateWaitingRoom();
}

function updateWaitingRoom() {
    const playersList = document.getElementById('waitingPlayersList');
    const playerCount = document.getElementById('playerCountDisplay');
    
    playerCount.textContent = gameState.players.length;
    
    let html = '';
    gameState.players.forEach(player => {
        html += `
            <div class="player-card alive">
                <div style="font-size: 1.5rem;">${player.isHost ? '👑' : '👤'}</div>
                <div style="font-weight: bold;">${player.name}</div>
                <div style="font-size: 0.9rem; opacity: 0.8;">${player.isHost ? 'مضيف الغرفة' : 'لاعب'}</div>
            </div>
        `;
    });
    
    playersList.innerHTML = html;

    // Enable start game button if host and enough players
    const startBtn = document.getElementById('startGameBtn');
    if (gameState.isHost && gameState.players.length >= 4) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
}

function addDemoPlayers() {
    if (!gameState.isHost) {
        showAlert('فقط مضيف الغرفة يمكنه إضافة لاعبين');
        return;
    }

    const demoNames = ['أحمد', 'فاطمة', 'محمد', 'سارة', 'علي', 'نور', 'يوسف', 'مريم'];
    let added = 0;

    for (let name of demoNames) {
        if (gameState.players.length >= gameState.maxPlayers) break;
        if (gameState.players.some(p => p.name === name)) continue;

        gameState.players.push({
            name: name,
            id: Date.now() + Math.random(),
            role: '',
            alive: true,
            isHost: false
        });
        added++;
    }

    if (added > 0) {
        // Update room storage
        roomStorage[gameState.roomCode].players = [...gameState.players];
        updateWaitingRoom();
        showAlert(`تم إضافة ${added} لاعبين تجريبيين`, 'success');
    } else {
        showAlert('لا