# Second Me Windows - ルートパッケージ
from flask import Flask

# Flask アプリケーションを登録するための関数
def register_routes(app: Flask):
    """各ルートモジュールをFlaskアプリケーションに登録する"""
    # 各ルートモジュールをインポート
    from routes import health, models, profiles, chat, memory, workspace, training, upload
    
    # 各モジュールのregister_routes関数を呼び出す
    health.register_routes(app)
    models.register_routes(app)
    profiles.register_routes(app)
    chat.register_routes(app)
    memory.register_routes(app)
    workspace.register_routes(app)
    training.register_routes(app)
    upload.register_routes(app)
