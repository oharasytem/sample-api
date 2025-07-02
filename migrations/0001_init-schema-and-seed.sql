-- Migration number: 0001 	 2025-07-02T14:36:29.030Z

-- 1. items テーブルの作成 (DDL)
-- id: 主キー、自動増分
-- name: アイテム名、必須
-- description: アイテムの説明
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

-- 2. サンプルデータの挿入 (DML)
-- テーブル作成後に、初期データとしていくつかのアイテムを挿入します。
INSERT INTO items (name, description) VALUES
('Hono Tシャツ', 'Honoフレームワークのロゴ入りTシャツ。快適な着心地。'),
('Cloudflare Workers マグカップ', 'Cloudflare Workersのロゴ入りマグカップ。コーヒーブレイクに最適。'),
('D1 ステッカー', 'Cloudflare D1のロゴステッカー。ノートPCや水筒に。');