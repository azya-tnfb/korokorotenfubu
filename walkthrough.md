# 開発ログ - 10.ころころてんふぶ

## 2026-02-05
- プロジェクト開始。
- フォルダ `10_ころころてんふぶ` 作成。
- ドキュメント (`task.md`, `implementation_plan.md`) 作成。
- `constants.js` 作成: フルーツ及び物理パラメータの定義。
- `style.css` 作成: ダークテーマ、プレミアム感のあるUIスタイル。
- `index.html` 作成: Canvasコンテナ、Matter.js CDN読み込み。
- `main.js` 作成:
    - Matter.js エンジン初期化 (SleepThreshold: OFF)。
    - 壁・床の生成。
    - マウス操作によるフルーツ落下 (落下ガイド含む)。
    - フルーツ生成処理 (`createFruitBody`)。
    - 衝突検知 `collisionStart` によるシンカ(合体)処理。
    - シンカ時の挙動実装:
        - 中間地点での生成。
        - 運動量キャンセル (Velocity Reset)。
        - Pop Effect (周囲への衝撃 `applyForce`)。
    - ゲームオーバー判定:
        - ライン越えチェック + 速度ほぼゼロ + 猶予時間。
        - 生成直後のフルーツを除外するロジック追加。
    - リスタート機能実装。
