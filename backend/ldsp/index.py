import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    """API для каталога остатков ЛДСП Egger: получение списка и добавление позиций."""

    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    method = event.get("httpMethod", "GET")

    if method == "GET":
        cur.execute(
            "SELECT id, name, article, width, height, depth, created_at FROM ldsp_remainders ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        items = [
            {
                "id": r[0],
                "name": r[1],
                "article": r[2],
                "width": r[3],
                "height": r[4],
                "depth": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"items": items})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        name = body.get("name", "").strip()
        article = body.get("article", "").strip()
        width = int(body.get("width", 0))
        height = int(body.get("height", 0))
        depth = int(body.get("depth", 0))

        if not name or not article or width <= 0 or height <= 0 or depth <= 0:
            conn.close()
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Заполните все поля"})}

        cur.execute(
            "INSERT INTO ldsp_remainders (name, article, width, height, depth) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (name, article, width, height, depth),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 201, "headers": cors, "body": json.dumps({"id": new_id, "success": True})}

    if method == "DELETE":
        params = event.get("queryStringParameters") or {}
        item_id = params.get("id")
        if not item_id:
            conn.close()
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Не указан id"})}
        cur.execute("DELETE FROM ldsp_remainders WHERE id = %s", (item_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"success": True})}

    conn.close()
    return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "Method not allowed"})}
