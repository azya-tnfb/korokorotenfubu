// customize.js - カスタマイズ機能
// 現在のデッキとボールプールで管理
// ドラッグ＆ドロップで入れ替え

// 半径とスコアの設定（進化順に対応）- 位置によって決まる固定値
const SIZE_SETTINGS = [
    { radius: 1.0, score: 1 },
    { radius: 1.3, score: 3 },
    { radius: 1.8, score: 6 },
    { radius: 2.2, score: 10 },
    { radius: 2.7, score: 15 },
    { radius: 3.4, score: 21 },
    { radius: 4.0, score: 28 },
    { radius: 4.9, score: 36 },
    { radius: 5.4, score: 45 },
    { radius: 6.6, score: 55 },
    { radius: 7.9, score: 66 },
];

// 利用可能なすべてのボールデータ
export const ALL_BALLS = [
    { id: 'tsubumaru', label: 'つぶまる', folder: 'tsubumaru', textures: ['tsubumaru_01.png', 'tsubumaru_02.png'] },
    { id: 'yunagi', label: '夕凪', folder: 'yunagi', textures: ['yunagi_01.png', 'yunagi_02.png'] },
    { id: 'yuki', label: 'ユキ', folder: 'yuki', textures: ['yuki01.png', 'yuki02.png'] },
    { id: 'sirotsubaki', label: 'シロツバキ', folder: 'sirotsubaki', textures: ['sirotsubaki01.png', 'sirotsubaki02.png'] },
    { id: 'cyori', label: 'ちょり', folder: 'cyori', textures: ['cyori01.png', 'cyori08.png'] },
    { id: 'sarapi', label: 'さらぴ', folder: 'sarapi', textures: ['sarapi01.png', 'sarapi02.png'] },
    { id: 'y', label: 'Y', folder: 'y', textures: ['y01.png', 'y02.png'] },
    { id: 'yuu', label: 'ユー', folder: 'yuu', textures: ['yuu01.png', 'yuu02.png'] },
    { id: 'val', label: 'ヴァルキリー', folder: 'val', textures: ['val01.png', 'val02.png'] },
    { id: 'azya', label: 'あじゃ', folder: 'azya', textures: ['azya01.png', 'azya02.png'] },
    { id: 'senka', label: '盞華', folder: 'senka', textures: ['senka01.png', 'senka02.png'] },
    // 追加ボール
    { id: 'alice', label: 'アリス', folder: 'alice', textures: ['alice01.png', 'alice02.png'] },
    { id: 'ama', label: 'あま', folder: 'ama', textures: ['ama01.png', 'ama02.png'] },
    { id: 'baniki', label: 'バニキ', folder: 'baniki', textures: ['baniki01.png', 'baniki02.png'] },
    { id: 'butti', label: 'ぶっち', folder: 'butti', textures: ['butti01.png', 'butti02.png'] },
    { id: 'chatora', label: 'ちゃとら', folder: 'chatora', textures: ['chatora01.png', 'chatora02.png'] },
    { id: 'potechi', label: 'ぽてち', folder: 'potechi', textures: ['potechi01.png', 'potechi02.png'] },
    { id: 'urara', label: 'うらら', folder: 'urara', textures: ['urara01.png', 'urara02.png'] },
];

// デフォルトの進化順（11個）
const DEFAULT_ORDER = [
    'tsubumaru', 'yunagi', 'yuki', 'sirotsubaki', 'cyori',
    'sarapi', 'y', 'yuu', 'val', 'azya', 'senka'
];

// カスタマイズマネージャー
class CustomizeManager {
    constructor() {
        this.currentDeck = this.loadOrder();
        this.draggedItem = null;
        this.draggedIndex = -1;
        this.dragSource = null; // 'deck' or 'pool'
        this.draggedPoolId = null;
    }

    // LocalStorageから進化順を読み込み
    loadOrder() {
        const saved = localStorage.getItem('customEvolutionOrder');
        if (saved) {
            try {
                const order = JSON.parse(saved);
                if (Array.isArray(order) && order.length === 11) {
                    return order;
                }
            } catch (e) {
                console.log('Failed to parse saved order:', e);
            }
        }
        return [...DEFAULT_ORDER];
    }

    // 進化順を保存
    saveOrder() {
        localStorage.setItem('customEvolutionOrder', JSON.stringify(this.currentDeck));
    }

    // リセット
    resetOrder() {
        this.currentDeck = [...DEFAULT_ORDER];
    }

    // ボール情報を取得
    getBallById(id) {
        return ALL_BALLS.find(b => b.id === id);
    }

    // プール内のボール（デッキに入っていないもの）を取得
    getPoolBalls() {
        return ALL_BALLS.filter(ball => !this.currentDeck.includes(ball.id));
    }

    // デッキのボールとプールのボールを入れ替え
    swapBallWithPool(deckIndex, poolId) {
        if (deckIndex < 0 || deckIndex >= this.currentDeck.length) return false;
        this.currentDeck[deckIndex] = poolId;
        return true;
    }

    // デッキ内の順番を入れ替え
    swapInDeck(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.currentDeck.length) return;
        if (toIndex < 0 || toIndex >= this.currentDeck.length) return;

        const [removed] = this.currentDeck.splice(fromIndex, 1);
        this.currentDeck.splice(toIndex, 0, removed);
    }

    // カスタマイズされたFRUITS配列を生成
    // ※サイズは「位置」によって決まる（どのボールかではなく、進化順の何番目かで決まる）
    generateFruitsArray() {
        const colors = [
            '#FF3333', '#FF6666', '#9933FF', '#FFAA00', '#FF8800',
            '#FF0000', '#EEDD00', '#FF99CC', '#FFFF00', '#99FF99', '#008800'
        ];

        return this.currentDeck.map((id, index) => {
            const ball = this.getBallById(id);
            // サイズは位置（index）によって固定で決まる
            const size = SIZE_SETTINGS[index];
            return {
                label: ball.label,
                radius: size.radius,  // 位置に応じた固定サイズ
                color: colors[index],
                score: size.score,    // 位置に応じた固定スコア
                textures: ball.textures.map(t => `assets/ball/${ball.folder}/${t}`)
            };
        });
    }

    // 現在のデッキをレンダリング
    renderDeck() {
        const container = document.getElementById('current-deck');
        if (!container) return;

        container.innerHTML = '';

        this.currentDeck.forEach((id, index) => {
            const ball = this.getBallById(id);
            if (!ball) return;

            const item = document.createElement('div');
            item.className = 'deck-item';
            item.draggable = true;
            item.dataset.id = id;
            item.dataset.index = index;

            const img = document.createElement('img');
            img.src = `assets/ball/${ball.folder}/${ball.textures[0]}`;
            img.alt = ball.label;
            img.draggable = false;
            item.appendChild(img);

            const num = document.createElement('span');
            num.className = 'order-num';
            num.textContent = index + 1;
            item.appendChild(num);

            // ドラッグイベント（デッキ内の並べ替え）
            item.addEventListener('dragstart', (e) => this.handleDeckDragStart(e, index, id));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDeckDrop(e, index));
            item.addEventListener('dragend', () => this.handleDragEnd());

            container.appendChild(item);
        });
    }

    // ボールプールをレンダリング
    renderPool() {
        const container = document.getElementById('ball-pool');
        if (!container) return;

        container.innerHTML = '';
        const poolBalls = this.getPoolBalls();

        if (poolBalls.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'pool-empty';
            empty.textContent = '全てのボールがデッキに入っています';
            container.appendChild(empty);
            return;
        }

        poolBalls.forEach(ball => {
            const item = document.createElement('div');
            item.className = 'pool-item';
            item.dataset.id = ball.id;
            item.draggable = true;

            const img = document.createElement('img');
            img.src = `assets/ball/${ball.folder}/${ball.textures[0]}`;
            img.alt = ball.label;
            img.draggable = false;
            item.appendChild(img);

            const name = document.createElement('span');
            name.className = 'ball-name';
            name.textContent = ball.label;
            item.appendChild(name);

            // ドラッグイベント（プールからデッキへ）
            item.addEventListener('dragstart', (e) => this.handlePoolDragStart(e, ball.id));
            item.addEventListener('dragend', () => this.handleDragEnd());

            container.appendChild(item);
        });
    }

    // デッキアイテムのドラッグ開始
    handleDeckDragStart(e, index, id) {
        this.draggedItem = e.target.closest('.deck-item');
        this.draggedIndex = index;
        this.dragSource = 'deck';
        this.draggedPoolId = null;
        this.draggedItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    }

    // プールアイテムのドラッグ開始
    handlePoolDragStart(e, poolId) {
        this.draggedItem = e.target.closest('.pool-item');
        this.draggedIndex = -1;
        this.dragSource = 'pool';
        this.draggedPoolId = poolId;
        this.draggedItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', poolId);
    }

    // ドラッグオーバー
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        // ドロップ可能を視覚的に表示
        const target = e.target.closest('.deck-item');
        if (target && !target.classList.contains('drag-over')) {
            document.querySelectorAll('.deck-item.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            target.classList.add('drag-over');
        }
    }

    // デッキへのドロップ
    handleDeckDrop(e, targetIndex) {
        e.preventDefault();

        // ドラッグオーバーのハイライトを解除
        document.querySelectorAll('.deck-item.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });

        if (this.dragSource === 'deck') {
            // デッキ内の並べ替え
            if (this.draggedIndex !== targetIndex) {
                this.swapInDeck(this.draggedIndex, targetIndex);
                this.renderDeck();
            }
        } else if (this.dragSource === 'pool' && this.draggedPoolId) {
            // プールからデッキへの入れ替え
            this.swapBallWithPool(targetIndex, this.draggedPoolId);
            this.renderDeck();
            this.renderPool();
        }
    }

    // ドラッグ終了
    handleDragEnd() {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
        }
        document.querySelectorAll('.deck-item.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        this.draggedItem = null;
        this.draggedIndex = -1;
        this.dragSource = null;
        this.draggedPoolId = null;
    }
}

// グローバルインスタンス
export const customizeManager = new CustomizeManager();

// カスタマイズされたFRUITS配列を取得
export function getCustomFruits() {
    return customizeManager.generateFruitsArray();
}

// 初期化関数
export function initCustomize() {
    const screen = document.getElementById('customize-screen');
    const backBtn = document.getElementById('customize-back-btn');
    const saveBtn = document.getElementById('customize-save-btn');
    const resetBtn = document.getElementById('customize-reset-btn');

    // 戻るボタン
    backBtn?.addEventListener('click', () => {
        screen.classList.add('hidden');
    });

    // 保存ボタン
    saveBtn?.addEventListener('click', () => {
        if (customizeManager.currentDeck.length !== 11) {
            alert('デッキは11個のボールが必要です');
            return;
        }
        customizeManager.saveOrder();
        alert('設定を保存しました！\n次回ゲーム開始時から反映されます。');
    });

    // リセットボタン
    resetBtn?.addEventListener('click', () => {
        if (confirm('設定をデフォルトに戻しますか？')) {
            customizeManager.resetOrder();
            customizeManager.renderDeck();
            customizeManager.renderPool();
        }
    });

    // 初期レンダリング
    customizeManager.renderDeck();
    customizeManager.renderPool();
}

// カスタマイズ画面を開く
export function openCustomize() {
    const screen = document.getElementById('customize-screen');
    screen?.classList.remove('hidden');
    customizeManager.renderDeck();
    customizeManager.renderPool();
}
