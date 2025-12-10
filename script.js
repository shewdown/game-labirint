document.addEventListener('keydown', function(e) {
    // Проверяем, нажата ли одна из стрелок (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
    if ([37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault(); // Предотвращаем стандартное действие браузера
    }
});

// Основные переменные игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageDiv = document.getElementById('message');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const restartButton = document.getElementById('restartButton');
const levelElement = document.getElementById('level');
const stepsElement = document.getElementById('steps');
const threadLeftElement = document.getElementById('threadLeft');
const threadPercentElement = document.getElementById('threadPercent');
const threadFillElement = document.getElementById('threadFill');
const mazeSizeElement = document.getElementById('mazeSize');

// Параметры игры
let gameState = {
    level: 1,
    steps: 0,
    maxThread: 100,
    threadLeft: 100,
    cellSize: 30,
    player: {x: 1, y: 1},
    exit: {x: 0, y: 0},
    thread: [{x: 1, y: 1}], // История позиций игрока
    maze: [],
    mazeWidth: 10,
    mazeHeight: 10,
    gameOver: false,
    win: false,
    keys: {}
};

// Генерация лабиринта с помощью алгоритма DFS
function generateMaze(width, height) {
    // Создаем сетку со стенами
    const maze = Array(height * 2 + 1).fill().map(() => Array(width * 2 + 1).fill(1));
    
    // Рекурсивная функция для создания путей
    function carve(x, y) {
        maze[y][x] = 0;
        
        // Случайный порядок направлений
        const directions = [
            [0, -2], // Вверх
            [2, 0],  // Вправо
            [0, 2],  // Вниз
            [-2, 0]  // Влево
        ].sort(() => Math.random() - 0.5);
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx > 0 && nx < width * 2 && ny > 0 && ny < height * 2 && maze[ny][nx] === 1) {
                // Убираем стену между текущей и следующей клеткой
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }
    
    // Начинаем с левого верхнего угла
    carve(1, 1);
    
    // Создаем выход в правом нижнем углу
    maze[height * 2 - 1][width * 2 - 1] = 0;
    
    return maze;
}

// Инициализация новой игры
function initGame() {
    // Увеличиваем сложность с каждым уровнем
    gameState.mazeWidth = 8 + gameState.level * 2;
    gameState.mazeHeight = 8 + gameState.level * 2;
    
    // Обновляем отображение размера лабиринта
    mazeSizeElement.textContent = `${gameState.mazeWidth}×${gameState.mazeHeight}`;
    
    // Генерируем новый лабиринт
    gameState.maze = generateMaze(gameState.mazeWidth, gameState.mazeHeight);
    
    // Устанавливаем начальную позицию игрока
    gameState.player = {x: 1, y: 1};
    
    // Устанавливаем выход
    gameState.exit = {
        x: gameState.maze[0].length - 2,
        y: gameState.maze.length - 2
    };
    
    // Сбрасываем нить
    gameState.thread = [{x: gameState.player.x, y: gameState.player.y}];
    
    // Сбрасываем параметры игры
    gameState.steps = 0;
    gameState.threadLeft = gameState.maxThread;
    gameState.gameOver = false;
    gameState.win = false;
    
    // Обновляем UI
    updateUI();
    
    // Скрываем сообщение
    messageDiv.style.display = 'none';
    
    // Рисуем начальное состояние
    draw();
}

// Обновление интерфейса
function updateUI() {
    levelElement.textContent = gameState.level;
    stepsElement.textContent = gameState.steps;
    threadLeftElement.textContent = gameState.threadLeft;
    
    const percent = Math.floor((gameState.threadLeft / gameState.maxThread) * 100);
    threadPercentElement.textContent = `${percent}%`;
    threadFillElement.style.width = `${percent}%`;
    
    // Меняем цвет индикатора в зависимости от количества нити
    threadFillElement.classList.remove('danger', 'critical');
    if (percent < 30) {
        threadFillElement.classList.add('critical');
    } else if (percent < 60) {
        threadFillElement.classList.add('danger');
    }
}

// Отрисовка игры
function draw() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Настраиваем размер клетки в зависимости от размера лабиринта
    const cellSize = Math.min(
        canvas.width / gameState.maze[0].length,
        canvas.height / gameState.maze.length
    );
    
    // Отрисовка лабиринта
    for (let y = 0; y < gameState.maze.length; y++) {
        for (let x = 0; x < gameState.maze[y].length; x++) {
            ctx.fillStyle = gameState.maze[y][x] === 1 ? '#1c2b5c' : '#0f1b33';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            
            // Рисуем стены
            if (gameState.maze[y][x] === 1) {
                ctx.strokeStyle = '#283593';
                ctx.lineWidth = 1;
                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Отрисовка нити Ариадны
    ctx.strokeStyle = '#ff9a00';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    for (let i = 0; i < gameState.thread.length; i++) {
        const pos = gameState.thread[i];
        const x = pos.x * cellSize + cellSize / 2;
        const y = pos.y * cellSize + cellSize / 2;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Отрисовка игрока
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(
        gameState.player.x * cellSize + cellSize / 2,
        gameState.player.y * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#0277bd';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Отрисовка выхода
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(
        gameState.exit.x * cellSize + 2,
        gameState.exit.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
    );
    
    // Рисуем значок двери на выходе
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(
        gameState.exit.x * cellSize + cellSize / 2 - 5,
        gameState.exit.y * cellSize + 5,
        10,
        cellSize - 10
    );
    
    // Рисуем ручку
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(
        gameState.exit.x * cellSize + cellSize / 2 + 3,
        gameState.exit.y * cellSize + cellSize / 2,
        3,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Проверка движения игрока
function movePlayer(dx, dy) {
    if (gameState.gameOver || gameState.win) return;
    
    const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;
    
    // Проверяем, не выходит ли игрок за границы лабиринта
    if (
        newX < 0 || newY < 0 ||
        newY >= gameState.maze.length || newX >= gameState.maze[0].length
    ) {
        return;
    }
    
    // Проверяем, не является ли клетка стеной
    if (gameState.maze[newY][newX] === 1) {
        return;
    }
    
    // Увеличиваем счетчик шагов
    gameState.steps++;
    
    // Проверяем, не возвращается ли игрок по своей нити
    const threadIndex = gameState.thread.findIndex(pos => pos.x === newX && pos.y === newY);
    
    if (threadIndex !== -1) {
        // Игрок возвращается по нити - сматываем её
        gameState.thread = gameState.thread.slice(0, threadIndex + 1);
        
        // Возвращаем часть нити (но не больше максимального значения)
        const returnedThread = gameState.thread.length - (threadIndex + 1);
        gameState.threadLeft = Math.min(gameState.maxThread, gameState.threadLeft + returnedThread);
    } else {
        // Игрок движется в новую клетку - разматываем нить
        gameState.thread.push({x: newX, y: newY});
        gameState.threadLeft--;
        
        // Проверяем, не закончилась ли нить
        if (gameState.threadLeft < 0) {
            gameOver();
            return;
        }
    }
    
    // Обновляем позицию игрока
    gameState.player.x = newX;
    gameState.player.y = newY;
    
    // Проверяем, не достиг ли игрок выхода
    if (gameState.player.x === gameState.exit.x && gameState.player.y === gameState.exit.y) {
        win();
    }
    
    // Обновляем интерфейс и перерисовываем
    updateUI();
    draw();
}

// Окончание игры (поражение)
function gameOver() {
    gameState.gameOver = true;
    messageTitle.textContent = "Нить оборвалась!";
    messageText.textContent = `Вы застряли в лабиринте на уровне ${gameState.level}. Попробуйте снова!`;
    messageDiv.style.display = 'block';
}

// Победа в уровне
function win() {
    gameState.win = true;
    messageTitle.textContent = "Уровень пройден!";
    messageText.textContent = `Вы нашли выход из лабиринта за ${gameState.steps} шагов!`;
    messageDiv.style.display = 'block';
    
    // Увеличиваем уровень для следующей игры
    gameState.level++;
}

// Обработка нажатий клавиш
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key.toLowerCase()] = true;
    
    // Обработка движения
    if (e.key === 'w' || e.key === 'ArrowUp') {
        movePlayer(0, -1);
    } else if (e.key === 's' || e.key === 'ArrowDown') {
        movePlayer(0, 1);
    } else if (e.key === 'a' || e.key === 'ArrowLeft') {
        movePlayer(-1, 0);
    } else if (e.key === 'd' || e.key === 'ArrowRight') {
        movePlayer(1, 0);
    } else if (e.key === 'r') {
        // Перезапуск уровня
        initGame();
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key.toLowerCase()] = false;
});

// Обработка кнопки рестарта
restartButton.addEventListener('click', () => {
    initGame();
});

// Запуск игры при загрузке страницы
window.addEventListener('load', () => {
    initGame();
    
    // Фокус на холсте для обработки клавиш
    canvas.focus();
    canvas.setAttribute('tabindex', '0');
});