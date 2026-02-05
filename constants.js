export const FRUITS = [
    { label: 'つぶまる', radius: 1.0, color: '#FF3333', score: 1 },         // 1: さくらんぼ
    { label: '夕凪', radius: 1.3, color: '#FF6666', score: 3 },             // 2: いちご
    { label: 'ユキ', radius: 1.8, color: '#9933FF', score: 6 },             // 3: ぶどう
    { label: 'シロツバキ', radius: 2.2, color: '#FFAA00', score: 10 },      // 4: デコポン
    { label: 'ちょり', radius: 2.7, color: '#FF8800', score: 15 },          // 5: かき
    { label: 'バルラ', radius: 3.4, color: '#FF0000', score: 21 },          // 6: りんご
    { label: 'Y', radius: 4.0, color: '#EEDD00', score: 28 },               // 7: なし
    { label: 'ユー', radius: 4.9, color: '#FF99CC', score: 36 },            // 8: もも
    { label: 'ヴァルキリー', radius: 5.4, color: '#FFFF00', score: 45 },    // 9: パイン
    { label: 'あじゃ', radius: 6.6, color: '#99FF99', score: 55 },          // 10: メロン
    { label: '盞華', radius: 7.9, color: '#008800', score: 66 },            // 11: スイカ
];

// 物理演算設定
export const PHYSICS_SETTINGS = {
    FRICTION: 0.2,      // 0.1 ~ 0.3
    RESTITUTION: 0.15,  // 0.1 ~ 0.2
    SLOP: 0.05,         // Defult is usually lower (0.01?)
    SLEEP_THRESHOLD: 10 // Low value or infinite
};

export const GAME_SETTINGS = {
    WIDTH: 600,
    HEIGHT: 800,
    WALL_THICKNESS: 50,
    BASE_RADIUS_SCALE: 16, // 1.0 radius = 16px
    GAME_OVER_LINE_Y: 150, // Top margin for game over
    GAME_OVER_DURATION_MS: 3000, // 3 seconds
};
