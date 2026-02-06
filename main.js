import { FRUITS as DEFAULT_FRUITS, PHYSICS_SETTINGS, GAME_SETTINGS } from './constants.js';
import { initCustomize, openCustomize, getCustomFruits } from './customize.js';

// カスタマイズされたFRUITS配列を使用
let FRUITS = getCustomFruits();

// Matter.js 
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events,
    Body = Matter.Body,
    Vector = Matter.Vector;

// Game State
const state = {
    score: 0,
    currFruitIdx: 0,
    nextFruitIdx: 0,
    isDropping: false,
    gameOver: false,
    gameOverTimer: 0,
    items: [] // Track created items
};

// DOM Elements
const scoreEl = document.getElementById('score-display');
const nextFruitPreview = document.getElementById('next-fruit-preview');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');
const uiLayer = document.getElementById('ui-layer');
const countdownEl = document.getElementById('countdown-display'); // 追加

// Screen Elements
const titleMenuScreen = document.getElementById('title-menu-screen'); // ID修正
const optionsScreen = document.getElementById('options-screen');
const highscoreScreen = document.getElementById('highscore-screen');
const gameContainer = document.getElementById('game-container');

// Settings Elements
const settingsBtn = document.getElementById('settings-btn');
const pauseMenu = document.getElementById('pause-menu');
const pauseRetryBtn = document.getElementById('pause-retry-btn');
const pauseCloseBtn = document.getElementById('pause-close-btn');
const pauseBgmSlider = document.getElementById('pause-bgm-volume');
const pauseSeSlider = document.getElementById('pause-se-volume');

// Audio Elements
const bgm = new Audio('assets/audio/bgm/Hmm.-Tasty.wav');
bgm.loop = true;
bgm.volume = 0.3; // BGMは控えめに

const seRelease = new Audio('assets/audio/se/release.mp3');
seRelease.volume = 0.5;

const seShinka = new Audio('assets/audio/se/shinka.mp3');
seShinka.volume = 0.6;

// BGM自動再生（ユーザー操作後に開始）
let bgmStarted = false;
function startBGM() {
    if (!bgmStarted) {
        bgm.play().catch(e => console.log('BGM autoplay prevented:', e));
        bgmStarted = true;
    }
}

// ハイスコア管理
let highScore = parseInt(localStorage.getItem('highScore') || '0');

// ランキング管理（上位3位）
// ランキング管理（上位3位）
function getRankings() {
    try {
        const rankings = localStorage.getItem('rankings');
        if (rankings) {
            let parsed = JSON.parse(rankings);
            if (Array.isArray(parsed)) {
                // 数値に変換し、不正な値は0にする
                parsed = parsed.map(v => {
                    const n = Number(v);
                    return isNaN(n) ? 0 : n;
                });
                // 長さが3未満なら0で埋める
                while (parsed.length < 3) parsed.push(0);
                return parsed.slice(0, 3);
            }
        }
    } catch (e) {
        console.error('Error parsing rankings:', e);
    }
    return [0, 0, 0]; // デフォルト
}

function updateRankings(newScore) {
    let rankings = getRankings();
    rankings.push(Number(newScore));
    rankings.sort((a, b) => b - a); // 降順ソート
    rankings = rankings.slice(0, 3); // 上位3位のみ保持
    localStorage.setItem('rankings', JSON.stringify(rankings));

    // ハイスコアも更新 (ランキングの1位がハイスコアになるはずだが、念のため既存ロジックも維持)
    if (rankings[0] > highScore) {
        highScore = rankings[0];
        localStorage.setItem('highScore', highScore.toString());
    }

    return rankings;
}

// ゲームオーバー判定用タイマー
let gameOverTimer = null;
let gameOverTimerStart = null;

// タイトル画面の制御
document.getElementById('start-btn').addEventListener('click', () => {
    // カスタマイズされたFRUITSを再読み込み
    FRUITS = getCustomFruits();
    // 進化ルートを更新
    initEvolutionChart();
    // 画像を再読み込み (サイズ計算のため)
    preloadImages();

    titleMenuScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    document.getElementById('ui-layer').classList.remove('hidden');
    document.getElementById('evolution-container').classList.remove('hidden');
    document.getElementById('settings-btn').classList.remove('hidden');

    spawnCurrentFruit();
});

// ... (中略) ...

// スプラッシュスクリーンの制御
document.getElementById('splash-screen').addEventListener('click', () => {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('title-menu-screen').classList.remove('hidden');
    startBGM(); // ここで開始
});

// ハイスコアボタン（タイトル）
document.getElementById('highscore-btn').addEventListener('click', () => {
    const rankings = getRankings();
    console.log('Current Rankings:', rankings); // デバッグログ

    // ハイスコア（1位）を左側に表示
    document.getElementById('menu-highscore').textContent = rankings[0];
    // 右側にランキング1〜3位を表示
    document.getElementById('menu-rank-1').textContent = rankings[0];
    document.getElementById('menu-rank-2').textContent = rankings[1];
    document.getElementById('menu-rank-3').textContent = rankings[2];
    highscoreScreen.classList.remove('hidden');
});

// オプションボタン（タイトル）
document.getElementById('options-btn').addEventListener('click', () => {
    optionsScreen.classList.remove('hidden');
});

// 戻るボタン（ハイスコア）
document.getElementById('highscore-back-btn').addEventListener('click', () => {
    highscoreScreen.classList.add('hidden');
});

// 戻るボタン（オプション）
document.getElementById('options-back-btn').addEventListener('click', () => {
    optionsScreen.classList.add('hidden');
});

// カスタマイズボタン
document.getElementById('customize-btn').addEventListener('click', () => {
    openCustomize();
});

// 対戦ボタン（未実装）
document.getElementById('battle-btn').addEventListener('click', () => {
    alert('対戦機能は現在開発中です！');
});

// カスタマイズ機能の初期化
initCustomize();

// タイトル画面の音量スライダー
const titleBgmSlider = document.getElementById('title-bgm-volume');
const titleSeSlider = document.getElementById('title-se-volume');

if (titleBgmSlider) {
    titleBgmSlider.addEventListener('input', (e) => {
        bgm.volume = e.target.value / 100;
        // ポーズメニューのスライダーも同期
        if (pauseBgmSlider) pauseBgmSlider.value = e.target.value;
    });
}

if (titleSeSlider) {
    titleSeSlider.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        seRelease.volume = val;
        seShinka.volume = val;
        // ポーズメニューのスライダーも同期
        if (pauseSeSlider) pauseSeSlider.value = e.target.value;
    });
}

// 設定（ポーズ）メニューの制御
settingsBtn.addEventListener('click', () => {
    pauseMenu.classList.remove('hidden');
    // ゲーム一時停止（物理演算ストップ）
    engine.enabled = false;
    Runner.stop(runner);
});

pauseCloseBtn.addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    // ゲーム再開
    engine.enabled = true;
    Runner.run(runner, engine);
});

pauseRetryBtn.addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    engine.enabled = true;
    Runner.run(runner, engine);
    // リスタート処理呼び出し
    resetGame();
});

// メインメニューに戻る
document.getElementById('pause-title-btn').addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    engine.enabled = true;
    Runner.run(runner, engine);
    // ゲームをリセットして初期状態に
    resetGame();
    // タイトル画面に戻る
    gameContainer.classList.add('hidden');
    document.getElementById('ui-layer').classList.add('hidden');
    document.getElementById('evolution-container').classList.add('hidden');
    document.getElementById('settings-btn').classList.add('hidden');
    titleMenuScreen.classList.remove('hidden');
});

// ポーズメニューの音量調整
pauseBgmSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    bgm.volume = value / 100;
});

pauseSeSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    const seVolume = value / 100;
    seRelease.volume = seVolume;
    seShinka.volume = seVolume;
});




// Initialize
const engine = Engine.create({
    enableSleeping: false // As requested: sleep logic managed by physics or generally off for "avalanche"
});
// Custom sleep threshold if needed, but 'enableSleeping: false' disables it globally which is what was requested ("Off").
// If "Low", we could set specific properties. Prompt says "Off or Low". Off is safest for avalanche.

const world = engine.world;

// Create Renderer
const render = Render.create({
    element: document.getElementById('canvas-wrapper'),
    engine: engine,
    options: {
        width: GAME_SETTINGS.WIDTH,
        height: GAME_SETTINGS.HEIGHT,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio
    }
});

// レスポンシブ対応 (Responsive Resize)
function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    const container = document.getElementById('game-container');

    // ウィンドウの幅と高さ
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // ゲームのアスペクト比
    const gameRatio = GAME_SETTINGS.WIDTH / GAME_SETTINGS.HEIGHT;
    const windowRatio = windowWidth / windowHeight;

    let scale = 1;

    // ウィンドウに合わせてスケール計算 (マージンなしで最大化)
    if (windowRatio < gameRatio) {
        // 横幅基準
        scale = (windowWidth - 20) / GAME_SETTINGS.WIDTH; // 少しマージン
    } else {
        // 高さ基準
        scale = (windowHeight - 40) / GAME_SETTINGS.HEIGHT; // 上下マージン
    }

    // スケール制限 (拡大しすぎない、縮小しすぎない)
    // モバイルの場合は小さくてもフィットさせる
    scale = Math.min(scale, 1.5); // 最大1.5倍まで
    // scale = Math.max(scale, 0.5); // 最小制限は一旦なし

    // 方法B: CSS width/height を操作 (Matter.jsが自動補正)
    const newWidth = GAME_SETTINGS.WIDTH * scale;
    const newHeight = GAME_SETTINGS.HEIGHT * scale;

    wrapper.style.width = `${newWidth}px`;
    wrapper.style.height = `${newHeight}px`;

    // UI要素の位置を更新
    updateUIPositions();
}

// UI要素をCanvas基準で配置
function updateUIPositions() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();

    // SCORE/NEXT (Canvasの右下)
    const uiLayer = document.getElementById('ui-layer');
    if (uiLayer) {
        uiLayer.style.position = 'fixed';
        uiLayer.style.left = 'auto';
        uiLayer.style.top = 'auto';
        uiLayer.style.right = `${window.innerWidth - rect.right + 10}px`;
        uiLayer.style.bottom = `${window.innerHeight - rect.bottom + 10}px`;
    }

    // 歯車アイコン (Canvasの左下)
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.style.position = 'fixed';
        settingsBtn.style.left = `${rect.left + 10}px`;
        settingsBtn.style.right = 'auto';
        settingsBtn.style.top = 'auto';
        settingsBtn.style.bottom = `${window.innerHeight - rect.bottom + 10}px`;
    }

    // 進化ルート (Canvasの左側、垂直中央)
    const evoContainer = document.getElementById('evolution-container');
    if (evoContainer) {
        evoContainer.style.position = 'fixed';
        evoContainer.style.left = 'auto';
        // Canvasの左端から進化ルートの幅(260)+余白(20)だけ左へ
        evoContainer.style.right = `${window.innerWidth - rect.left + 20}px`;
        // 垂直中央 (Canvasの中心に揃える)
        const evoHeight = 260; // CSS定義値
        evoContainer.style.top = `${rect.top + (rect.height - evoHeight) / 2}px`;
    }
}

// 初期化時とリサイズ時に実行
window.addEventListener('resize', resizeCanvas);
// 読み込み完了後にも実行
setTimeout(resizeCanvas, 100);

// Walls
const wallOptions = { isStatic: true, render: { fillStyle: '#444' } };
const ground = Bodies.rectangle(GAME_SETTINGS.WIDTH / 2, GAME_SETTINGS.HEIGHT, GAME_SETTINGS.WIDTH, GAME_SETTINGS.WALL_THICKNESS, wallOptions);
const leftWall = Bodies.rectangle(0, GAME_SETTINGS.HEIGHT / 2, GAME_SETTINGS.WALL_THICKNESS, GAME_SETTINGS.HEIGHT, wallOptions);
const rightWall = Bodies.rectangle(GAME_SETTINGS.WIDTH, GAME_SETTINGS.HEIGHT / 2, GAME_SETTINGS.WALL_THICKNESS, GAME_SETTINGS.HEIGHT, wallOptions);
// Top sensor (Game Over Line) - purely visual or sensor? 
// Let's make a visual line using a static body that is a sensor (doesn't collide physically but triggers events? No, visual only for now).
// Actually, I'll draw the line in afterRender.

Composite.add(world, [ground, leftWall, rightWall]);

// Preload Images to get dimensions
const loadedTextures = {}; // path -> { width, height, image }

function preloadImages() {
    let loadedCount = 0;
    const totalImages = FRUITS.reduce((sum, fruit) => sum + fruit.textures.length, 0);

    FRUITS.forEach(fruit => {
        fruit.textures.forEach(path => {
            const img = new Image();
            img.onload = () => {
                loadedTextures[path] = {
                    width: img.width,
                    height: img.height,
                    img: img
                };
                loadedCount++;
                console.log(`✓ Loaded: ${path} (${loadedCount}/${totalImages})`);
                if (loadedCount === totalImages) {
                    console.log('🎉 All images loaded successfully!');
                }
            };
            img.onerror = (e) => {
                console.error(`❌ Failed to load: ${path}`, e);
            };
            img.src = path;
        });
    });
}
preloadImages();

// Initialize Evolution Chart
// Initialize Evolution Chart
function initEvolutionChart() {
    const listEl = document.getElementById('evolution-list');
    if (!listEl) return;

    // 円形配置の設定
    const radius = 105; // 半径
    const centerX = 130; // コンテナ中心X (260/2)
    const centerY = 130; // コンテナ中心Y (260/2)
    const totalItems = FRUITS.length;
    const angleStep = (2 * Math.PI) / totalItems;

    // 開始角度 (-90度 = 12時の位置からスタート)
    const startAngle = -Math.PI / 2;

    FRUITS.forEach((fruit, index) => {
        const item = document.createElement('div');
        item.className = 'evo-item';

        // 座標計算
        const angle = startAngle + index * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        item.style.left = `${x}px`;
        item.style.top = `${y}px`;

        const img = document.createElement('img');
        if (fruit.textures.length > 0) {
            img.src = fruit.textures[0];
        }
        img.className = 'evo-img';
        img.alt = fruit.label;
        img.title = fruit.label;

        item.appendChild(img);

        // 矢印（次のアイテムへのつなぎ）
        if (index < FRUITS.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'evo-arrow';
            arrow.textContent = '▶'; // 三角矢印

            // 矢印の位置計算（現在のアイテムと次のアイテムの中間、少し内側）
            const nextAngle = startAngle + (index + 1) * angleStep;
            const midAngle = (angle + nextAngle) / 2;

            // 矢印は少し半径小さめに配置して内周を回る感じにする、あるいは同じ半径
            const arrowRadius = radius;
            const ax = centerX + arrowRadius * Math.cos(midAngle);
            const ay = centerY + arrowRadius * Math.sin(midAngle);

            arrow.style.left = `${ax}px`;
            arrow.style.top = `${ay}px`;

            // 回転角度（接線方向）
            // midAngle + 90度 (ラジアン)
            const rotation = midAngle + Math.PI / 2;
            arrow.style.transform = `translate(-50%, -50%) rotate(${rotation}rad)`;

            listEl.appendChild(arrow);
        }

        listEl.appendChild(item);
    });
}
initEvolutionChart();



// Input Handling
let currentX = GAME_SETTINGS.WIDTH / 2;
const dropY = 50; // Height where fruit spawns

// Helper to create fruit body
function createFruitBody(x, y, idx, isStatic = false) {
    const fruit = FRUITS[idx];
    const radius = fruit.radius * GAME_SETTINGS.BASE_RADIUS_SCALE;

    // Choose random texture from 2 options
    const texturePath = fruit.textures[Math.floor(Math.random() * fruit.textures.length)];

    // Calculate sprite scale
    let xScale = 1, yScale = 1;
    if (loadedTextures[texturePath]) {
        // Target diameter / Image width
        const targetSize = radius * 2;
        xScale = targetSize / loadedTextures[texturePath].width;
        yScale = targetSize / loadedTextures[texturePath].height;
        console.log(`Creating ${fruit.label}: radius=${radius.toFixed(1)}px, texture=${texturePath}, scale=${xScale.toFixed(3)}`);
    } else {
        // Fallback: assume 512px image
        const targetSize = radius * 2;
        xScale = targetSize / 512;
        yScale = targetSize / 512;
        console.warn(`⚠️ Texture not loaded yet for ${fruit.label}: ${texturePath}, using fallback scale`);
    }

    return Bodies.circle(x, y, radius, {
        isStatic: isStatic,
        label: `fruit_${idx}`,
        friction: PHYSICS_SETTINGS.FRICTION,
        restitution: PHYSICS_SETTINGS.RESTITUTION,
        slop: PHYSICS_SETTINGS.SLOP,
        render: {
            sprite: {
                texture: texturePath,
                xScale: xScale,
                yScale: yScale
            }
        },
        plugin: {
            born: Date.now() // Custom property to track age
        }
    });
}

// Next Fruit Logic
function updateNextFruit() {
    state.nextFruitIdx = Math.floor(Math.random() * 5); // Tsubumaru to Chori (0-4) typically
    // Update UI Preview
    const fruit = FRUITS[state.nextFruitIdx];
    // Use first texture for preview or random? Random might be confusing if it drops different one.
    // Let's use random but store it? Or just first one.
    // Ideally we decide the variant when we decide the next fruit index.
    // But 'state' only stores index.
    // Let's just use the first texture for preview to stay simple, or random.
    const previewTexture = fruit.textures[0];

    // Clear previous styles/content
    nextFruitPreview.style.backgroundColor = 'transparent';
    nextFruitPreview.textContent = '';

    // Create or update img element
    let img = nextFruitPreview.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        nextFruitPreview.appendChild(img);
    }
    img.src = previewTexture;
    // サイズはCSSで制御
}

function spawnCurrentFruit() {
    state.currFruitIdx = state.nextFruitIdx;
    updateNextFruit();
    state.isDropping = false;

    // Create a "ghost" or guide fruit at the top
    // We don't add it to the physics world yet, just render it or track it.
    // For simplicity, let's track the position and draw it in afterRender.
}

// Input Events
const container = document.getElementById('game-container');

container.addEventListener('mousemove', (e) => {
    if (state.gameOver || state.isDropping) return;

    // 座標変換 (レスポンシブ対応)
    const rect = render.canvas.getBoundingClientRect();
    const scaleX = GAME_SETTINGS.WIDTH / rect.width;

    // Canvas内座標に変換
    const x = (e.clientX - rect.left) * scaleX;

    // Clamp
    const currentRadius = FRUITS[state.currFruitIdx].radius * GAME_SETTINGS.BASE_RADIUS_SCALE;
    const minX = GAME_SETTINGS.WALL_THICKNESS / 2 + currentRadius;
    const maxX = GAME_SETTINGS.WIDTH - GAME_SETTINGS.WALL_THICKNESS / 2 - currentRadius;
    currentX = Math.max(minX, Math.min(maxX, x));
});

// タッチ対応 (スマホ)
container.addEventListener('touchmove', (e) => {
    if (state.gameOver || state.isDropping) return;
    e.preventDefault(); // スクロール防止

    const touch = e.touches[0];
    const rect = render.canvas.getBoundingClientRect();
    const scaleX = GAME_SETTINGS.WIDTH / rect.width;

    const x = (touch.clientX - rect.left) * scaleX;

    const currentRadius = FRUITS[state.currFruitIdx].radius * GAME_SETTINGS.BASE_RADIUS_SCALE;
    const minX = GAME_SETTINGS.WALL_THICKNESS / 2 + currentRadius;
    const maxX = GAME_SETTINGS.WIDTH - GAME_SETTINGS.WALL_THICKNESS / 2 - currentRadius;
    currentX = Math.max(minX, Math.min(maxX, x));
}, { passive: false });

container.addEventListener('click', (e) => {
    if (state.gameOver || state.isDropping) return;
    dropFruit();
});

// タッチ終了でドロップ
container.addEventListener('touchend', (e) => {
    if (state.gameOver || state.isDropping) return;
    e.preventDefault();
    dropFruit();
});

function dropFruit() {
    // BGMを開始（初回クリック時）
    startBGM();

    state.isDropping = true;
    const body = createFruitBody(currentX, dropY, state.currFruitIdx);
    Composite.add(world, body);

    // ボールを離したときのSE
    seRelease.currentTime = 0; // 再生位置をリセット
    seRelease.play().catch(e => console.log('SE play failed:', e));

    // Slight cooldown
    setTimeout(() => {
        spawnCurrentFruit();
    }, 500);
}

// Collision Handling
Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;

        // Check if both are fruits and same type
        if (bodyA.label.startsWith('fruit_') && bodyB.label.startsWith('fruit_')) {
            const idxA = parseInt(bodyA.label.split('_')[1]);
            const idxB = parseInt(bodyB.label.split('_')[1]);

            if (idxA === idxB && idxA < FRUITS.length - 1) {
                // Merge!
                handleMerge(bodyA, bodyB, idxA);
            }
        }
    }
});

function handleMerge(bodyA, bodyB, currentIdx) {
    // Prevent double processing
    if (bodyA.isRemoved || bodyB.isRemoved) return;
    bodyA.isRemoved = true;
    bodyB.isRemoved = true;

    // Midpoint
    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;

    // Remove old bodies
    Composite.remove(world, [bodyA, bodyB]);

    // Create new body
    const newIdx = currentIdx + 1;
    const newBody = createFruitBody(midX, midY, newIdx);

    // 進化時のSE
    seShinka.currentTime = 0;
    seShinka.play().catch(e => console.log('Shinka SE play failed:', e));

    // Momentum Cancellation & Pop Effect
    // "Pop": Apply force to neighbors?
    // Matter.js doesn't have "blast" built-in, but creating a body that expands rapidly is one way, 
    // or just applying a radial force to nearby bodies.

    // Reset velocity (mostly)
    Body.setVelocity(newBody, { x: 0, y: -2 }); // Slight upward hop

    Composite.add(world, newBody);

    // Apply "Pop" force to nearby bodies
    // Simple implementation: iterate all bodies, if close, apply vector away from center.
    const blastRadius = newBody.circleRadius * 3;
    const blastForce = 0.05 * newBody.mass; // Scale force

    const allBodies = Composite.allBodies(world);
    allBodies.forEach(b => {
        if (b === newBody || b.isStatic) return;
        const d = Vector.magnitude(Vector.sub(b.position, newBody.position));
        if (d < blastRadius) {
            const forceVec = Vector.normalise(Vector.sub(b.position, newBody.position));
            Body.applyForce(b, b.position, Vector.mult(forceVec, blastForce));
        }
    });

    // Score
    state.score += FRUITS[newIdx].score * 2; // Arbitrary scoring
    scoreEl.textContent = state.score;
}

// Game Over Check
// Logic: Check if any fruit is above the line, stable, for X seconds.
// Game Over Check
// Logic: Check if any fruit is above the line, stable, for X seconds.
Events.on(engine, 'afterUpdate', () => {
    if (state.gameOver || state.isExploding) return;

    let maxDuration = 0;
    let anyDanger = false;
    const bodies = Composite.allBodies(world);

    for (const body of bodies) {
        if (body.isStatic) continue;
        if (body.label.startsWith('fruit_')) {
            // Ignore young bodies (prevent game over on spawn)
            if (Date.now() - (body.plugin.born || 0) < 1000) continue;

            // Check position (Y-axis is 0 at top)
            if (body.position.y - body.circleRadius < GAME_SETTINGS.GAME_OVER_LINE_Y) {
                // Check velocity (is almost static?)
                if (body.speed < 0.2) {
                    anyDanger = true;
                    if (!body.dangerTimer) {
                        body.dangerTimer = Date.now();
                    }
                    const duration = Date.now() - body.dangerTimer;
                    if (duration > maxDuration) {
                        maxDuration = duration;
                    }
                } else {
                    body.dangerTimer = null;
                }
            } else {
                body.dangerTimer = null;
            }
        }
    }

    // カウントダウン表示処理
    if (anyDanger) {
        const remaining = GAME_SETTINGS.GAME_OVER_DURATION_MS - maxDuration;

        if (remaining <= 0) {
            // ゲームオーバー確定：爆発演出
            state.isExploding = true;
            countdownEl.textContent = 'BOOM!';
            countdownEl.classList.remove('hidden');
            countdownEl.style.transform = 'translate(-50%, -50%) scale(1.5)';
            countdownEl.style.color = '#ff0000';

            // 少し待ってからリザルト画面へ
            setTimeout(() => {
                triggerGameOver();
                countdownEl.classList.add('hidden');
                // スタイルリセット
                countdownEl.style.transform = '';
                countdownEl.style.color = '';
            }, 800);
        } else {
            // カウントダウン
            const seconds = Math.ceil(remaining / 1000);
            countdownEl.textContent = seconds;
            countdownEl.classList.remove('hidden');
            countdownEl.style.color = seconds === 1 ? '#ff0000' : '#FF4757'; // 1秒前は赤く
        }
    } else {
        countdownEl.classList.add('hidden');
    }
});

function triggerGameOver() {
    state.gameOver = true;
    gameOverScreen.classList.remove('hidden');
    engine.enabled = false;
    Runner.stop(runner);

    // BGMは停止しない

    // ランキング更新
    const rankings = updateRankings(state.score);
    console.log('Game Over - Rankings:', rankings);

    // UI更新
    document.getElementById('current-score-display').textContent = state.score;

    document.getElementById('rank-1').textContent = rankings[0];
    document.getElementById('rank-2').textContent = rankings[1];
    document.getElementById('rank-3').textContent = rankings[2];
}

function resetGame() {
    // Reset
    Composite.clear(world, false, true);
    Composite.clear(world);
    Composite.add(world, [
        Bodies.rectangle(GAME_SETTINGS.WIDTH / 2, GAME_SETTINGS.HEIGHT, GAME_SETTINGS.WIDTH, GAME_SETTINGS.WALL_THICKNESS, wallOptions),
        Bodies.rectangle(0, GAME_SETTINGS.HEIGHT / 2, GAME_SETTINGS.WALL_THICKNESS, GAME_SETTINGS.HEIGHT, wallOptions),
        Bodies.rectangle(GAME_SETTINGS.WIDTH, GAME_SETTINGS.HEIGHT / 2, GAME_SETTINGS.WALL_THICKNESS, GAME_SETTINGS.HEIGHT, wallOptions)
    ]);

    state.score = 0;
    scoreEl.textContent = '0';
    state.gameOver = false;
    state.isExploding = false; // reset
    gameOverScreen.classList.add('hidden');
    countdownEl.classList.add('hidden'); // Ensure countdown is hidden

    engine.enabled = true;
    Runner.stop(runner);
    Runner.start(runner, engine);

    // BGMを再開
    if (bgmStarted) {
        bgm.currentTime = 0;
        bgm.play().catch(e => console.log('BGM restart failed:', e));
    }

    // Initial spawn
    state.nextFruitIdx = 0;
    spawnCurrentFruit();
}

restartBtn.addEventListener('click', resetGame);

// タイトルに戻るボタン
document.getElementById('back-to-title-btn').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    uiLayer.classList.add('hidden');
    document.getElementById('evolution-container').classList.add('hidden');
    document.getElementById('settings-btn').classList.add('hidden');
    titleMenuScreen.classList.remove('hidden');

    // ゲームをリセット
    resetGame();

    // BGMを停止
    bgm.pause();
    bgm.currentTime = 0;
});

// Custom Rendering (lines, guide)
Events.on(render, 'afterRender', () => {
    const ctx = render.context;

    // Draw Game Over Line
    ctx.beginPath();
    ctx.moveTo(0, GAME_SETTINGS.GAME_OVER_LINE_Y);
    ctx.lineTo(GAME_SETTINGS.WIDTH, GAME_SETTINGS.GAME_OVER_LINE_Y);
    ctx.strokeStyle = '#ff6b6b';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Guide Fruit (if not dropping)
    if (!state.isDropping && !state.gameOver) {
        const fruit = FRUITS[state.currFruitIdx];
        const radius = fruit.radius * GAME_SETTINGS.BASE_RADIUS_SCALE;

        // Use first texture for guide
        const texture = loadedTextures[fruit.textures[0]];

        if (texture && texture.img) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            const size = radius * 2; // Match sprite scale logic
            ctx.drawImage(texture.img, currentX - size / 2, dropY - size / 2, size, size);
            ctx.restore();
        } else {
            // Fallback
            ctx.beginPath();
            ctx.arc(currentX, dropY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = fruit.color;
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Draw drop line
        ctx.beginPath();
        ctx.moveTo(currentX, dropY + radius);
        ctx.lineTo(currentX, GAME_SETTINGS.HEIGHT);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
});

// Start
spawnCurrentFruit();
const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

// 初回リサイズ実行
resizeCanvas();

// Matter.jsのマウス制御補正
// Canvasの表示サイズが変わるとマウス座標がずれるため、Matter.jsのMouseを更新
const mouse = Matter.Mouse.create(render.canvas);
const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});
// 今回はドラッグ操作不要だが、Mouseオブジェクトは入力取得に必要
// ただし、自前のmousemove/clickを使ってるので、そちらの座標変換が必要

// 自前の入力イベントでの座標変換
function getGameCoordinates(clientX, clientY) {
    const rect = render.canvas.getBoundingClientRect();
    const scaleX = GAME_SETTINGS.WIDTH / rect.width;
    const scaleY = GAME_SETTINGS.HEIGHT / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// イベントリスナーの更新
container.removeEventListener('mousemove', container.onmousemove); // 古いのがあれば（今回は直接定義してるので無理）
// 既存のイベントリスナー置き換えは難しいので、上の 'mousemove' ロジック内で変換を行うように修正が必要
// 既存コード修正のため、container.addEventListener('mousemove', ...) の中身を修正するアプローチをとる

// Gキーでデバッググリッド表示切り替え
window.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
        const grid = document.getElementById('debug-grid');
        if (grid) {
            console.log('Toggle Grid visibility');
            grid.classList.toggle('hidden');
            if (!grid.classList.contains('hidden')) {
                // 表示時だけ更新
                updateGridLabels();
            }
        } else {
            console.error('Debug grid element not found');
        }
    }
});

function updateGridLabels() {
    const grid = document.getElementById('debug-grid');
    if (!grid) return;

    // 既存ラベル削除
    grid.innerHTML = '';

    // ウィンドウ全体基準
    const w = window.innerWidth;
    const h = window.innerHeight;
    const step = 50;

    for (let x = 0; x <= w; x += step) {
        for (let y = 0; y <= h; y += step) {
            // 50px毎にラベル表示
            if (x % 50 === 0 && y % 50 === 0) {
                const label = document.createElement('div');
                label.className = 'grid-label';
                label.style.left = `${x}px`;
                label.style.top = `${y}px`;
                label.textContent = `${x},${y}`;
                grid.appendChild(label);
            }
        }
    }
}

// 初期表示
window.addEventListener('load', () => {
    updateGridLabels();
    window.addEventListener('resize', updateGridLabels);
});

