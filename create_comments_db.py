import sqlite3
import os

# 数据库路径
db_path = r'C:\Users\A\Desktop\机设\database mode\lvliang_comments.db'

# 确保目录存在
os.makedirs(os.path.dirname(db_path), exist_ok=True)

# 连接数据库（如果不存在则创建）
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 创建评论表
cursor.execute('''
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# 创建索引
cursor.execute('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)')

# 插入一些测试数据
cursor.execute('''
INSERT INTO comments (user_id, username, content) VALUES
(1, '测试用户1', '吕梁精神，永垂不朽！'),
(2, '测试用户2', '传承红色基因，弘扬吕梁精神'),
(3, '测试用户3', '英雄吕梁，精神长存')
''')

# 提交事务
conn.commit()

# 验证数据
cursor.execute('SELECT * FROM comments')
rows = cursor.fetchall()
print(f"评论数据库创建成功，共 {len(rows)} 条测试数据：")
for row in rows:
    print(f"ID: {row[0]}, 用户: {row[2]}, 内容: {row[3]}")

# 关闭连接
cursor.close()
conn.close()

print("\n评论数据库创建完成！")