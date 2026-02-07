export const FRUITS = [
    {
        label: 'つぶまる',
        radius: 1.0,
        color: '#FF3333',
        score: 1,
        textures: [
            'assets/ball/tsubumaru/tsubumaru_01.png',
            'assets/ball/tsubumaru/tsubumaru_02.png'
        ]
    },         // 1: さくらんぼ
    {
        label: '夕凪',
        radius: 1.3,
        color: '#FF6666',
        score: 3,
        textures: [
            'assets/ball/yunagi/yunagi_01.png',
            'assets/ball/yunagi/yunagi_02.png'
        ]
    },             // 2: いちご
    {
        label: 'ユキ',
        radius: 1.8,
        color: '#9933FF',
        score: 6,
        textures: [
            'assets/ball/yuki/yuki01.png',
            'assets/ball/yuki/yuki02.png'
        ]
    },             // 3: ぶどう
    {
        label: 'シロツバキ',
        radius: 2.2,
        color: '#FFAA00',
        score: 10,
        textures: [
            'assets/ball/sirotsubaki/sirotsubaki01.png',
            'assets/ball/sirotsubaki/sirotsubaki02.png'
        ]
    },      // 4: デコポン
    {
        label: 'ちょり',
        radius: 2.7,
        color: '#FF8800',
        score: 15,
        textures: [
            'assets/ball/cyori/cyori01.png',
            'assets/ball/cyori/cyori08.png'
        ]
    },          // 5: かき
    {
        label: 'sarapi',
        radius: 3.4,
        color: '#FF0000',
        score: 21,
        textures: [
            'assets/ball/sarapi/sarapi01.png',
            'assets/ball/sarapi/sarapi02.png'
        ]
    },          // 6: りんご -> sarapi
    {
        label: 'Y',
        radius: 4.0,
        color: '#EEDD00',
        score: 28,
        textures: [
            'assets/ball/y/y01.png',
            'assets/ball/y/y02.png'
        ]
    },               // 7: なし
    {
        label: 'ユー',
        radius: 4.9,
        color: '#FF99CC',
        score: 36,
        textures: [
            'assets/ball/yuu/yuu01.png',
            'assets/ball/yuu/yuu02.png'
        ]
    },            // 8: もも
    {
        label: 'ヴァルキリー',
        radius: 5.4,
        color: '#FFFF00',
        score: 45,
        textures: [
            'assets/ball/val/val01.png',
            'assets/ball/val/val02.png'
        ]
    },    // 9: パイン
    {
        label: 'あじゃ',
        radius: 6.6,
        color: '#99FF99',
        score: 55,
        textures: [
            'assets/ball/azya/azya01.png',
            'assets/ball/azya/azya02.png'
        ]
    },          // 10: メロン
    {
        label: '盞華',
        radius: 7.9,
        color: '#008800',
        score: 66,
        textures: [
            'assets/ball/senka/senka01.png',
            'assets/ball/senka/senka02.png'
        ]
    },            // 11: スイカ
];

// 物理演算設定
export const PHYSICS_SETTINGS = {
    FRICTION: 0.2,      // 0.1 ~ 0.3
    RESTITUTION: 0.15,  // 0.1 ~ 0.2
    SLOP: 0.05,         // Defult is usually lower (0.01?)
    SLEEP_THRESHOLD: 10 // Low value or infinite
};

export const GAME_SETTINGS = {
    WIDTH: 400,          // 箱の幅（380 -> 400に変更）
    HEIGHT: 515,         // 箱の高さ (500 -> 515)
    WALL_THICKNESS: 10,  // 壁の厚さ
    BASE_RADIUS_SCALE: 15, // 1.0 radius = 15px（箱サイズに合わせて調整）
    GAME_OVER_LINE_Y: 60, // ゲームオーバーラインの位置 (45 -> 15px下げて60)
    GAME_OVER_DURATION_MS: 3000, // 3 seconds
};
