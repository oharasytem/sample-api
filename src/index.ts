import { Hono } from "hono";

// D1 データベースの型定義
type CloudflareBindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/message", (c) => {
  // env.DB で D1 にアクセス可能
  const db = c.env.DB;
  return c.text("Hello Hono!");
});

app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ message: "Internal Server Error", error: err.message }, 500);
});

export default app;

app.get("/items", async (c) => {
  try {
    // D1 から全てのアイテムを取得
    const { results } = await c.env.DB.prepare("SELECT * FROM items").all();
    return c.json(results); // 取得したデータをJSONで返す
  } catch (error) {
    // エラーハンドリングはonErrorミドルウェアが捕捉するが、個別のログ出力なども可能
    throw error; // onErrorミドルウェアに処理を委譲
  }
});

app.get("/items/:id", async (c) => {
  const id = c.req.param("id"); // URLパラメータからIDを取得

  try {
    // IDをバインドして特定のアイテムを取得
    // .first() は結果セットの最初の行を返す
    const item = await c.env.DB.prepare("SELECT * FROM items WHERE id = ?")
      .bind(id)
      .first();

    if (!item) {
      return c.json({ message: `Item with ID ${id} not found` }, 404); // アイテムが見つからない場合
    }
    return c.json(item); // 取得したアイテムをJSONで返す
  } catch (error) {
    throw error;
  }
});

app.post("/items", async (c) => {
  try {
    const { name, description } = await c.req.json(); // リクエストボディからJSONデータを取得

    // 簡易的なバリデーション
    if (!name) {
      return c.json({ message: "Name is required" }, 400); // Bad Request
    }

    // D1 に新しいアイテムを挿入
    // .run() は DML (INSERT, UPDATE, DELETE) の実行結果を返す
    const result = await c.env.DB.prepare(
      "INSERT INTO items (name, description) VALUES (?, ?)"
    )
      .bind(name, description || null) // descriptionが省略された場合はNULLを挿入
      .run();

    // 挿入されたアイテムのIDを取得 (SQLiteのlast_insert_rowid()に相当)
    const newItemId = result.meta.last_row_id;

    // 作成されたアイテムの情報を返す (IDを含めることでクライアントが利用しやすくなる)
    return c.json({ id: newItemId, name, description }, 201); // 201 Created
  } catch (error) {
    throw error;
  }
});

app.put("/items/:id", async (c) => {
  const id = c.req.param("id"); // URLパラメータからIDを取得
  try {
    const { name, description } = await c.req.json(); // リクエストボディから更新データを取得

    // 簡易的なバリデーション
    if (!name) {
      return c.json({ message: "Name is required for update" }, 400); // Bad Request
    }

    // D1 でアイテムを更新
    const result = await c.env.DB.prepare(
      "UPDATE items SET name = ?, description = ? WHERE id = ?"
    )
      .bind(name, description || null, id)
      .run();

    if (result.meta.changes === 0) {
      // 変更された行がない場合、アイテムが見つからなかったと判断
      return c.json({ message: `Item with ID ${id} not found` }, 404);
    }

    // 更新後のアイテム情報を返す (通常は更新成功のメッセージや更新された内容を返す)
    return c.json({
      message: `Item with ID ${id} updated successfully`,
      id,
      name,
      description,
    });
  } catch (error) {
    throw error;
  }
});

app.delete("/items/:id", async (c) => {
  const id = c.req.param("id"); // URLパラメータからIDを取得

  try {
    // D1 からアイテムを削除
    const result = await c.env.DB.prepare("DELETE FROM items WHERE id = ?")
      .bind(id)
      .run();

    if (result.meta.changes === 0) {
      // 削除された行がない場合、アイテムが見つからなかったと判断
      return c.json({ message: `Item with ID ${id} not found` }, 404);
    }

    return c.text("", 204); // 204 No Content (成功、かつレスポンスボディなし)
  } catch (error) {
    throw error;
  }
});
