# Second Me Windows - ルートパッケージ
from flask import Flask
import logging
import traceback

# ロガーの取得
logger = logging.getLogger(__name__)

# Flask アプリケーションを登録するための関数
def register_routes(app: Flask):
    """各ルートモジュールをFlaskアプリケーションに登録する"""
    
    # 各ルートモジュールを個別にインポートしてエラーハンドリング
    modules_registered = 0
    
    # 最優先: profile_debugエンドポイント（問題診断用）
    try:
        from routes import profile_debug
        profile_debug.register_routes(app)
        logger.info("Profile debug routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register profile_debug routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # health エンドポイント
    try:
        from routes import health
        health.register_routes(app)
        logger.info("Health routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register health routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # llama_server エンドポイント
    try:
        from routes import llama_server
        llama_server.register_routes(app)
        logger.info("Llama server routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register llama_server routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # models エンドポイント
    try:
        from routes import models
        models.register_routes(app)
        logger.info("Models routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register models routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # profiles エンドポイント - 最重要
    try:
        from routes import profiles
        profiles.register_routes(app)
        logger.info("Profiles routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register profiles routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # chat エンドポイント
    try:
        from routes import chat
        chat.register_routes(app)
        logger.info("Chat routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register chat routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # memory エンドポイント
    try:
        from routes import memory
        memory.register_routes(app)
        logger.info("Memory routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register memory routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # workspace エンドポイント
    try:
        from routes import workspace
        workspace.register_routes(app)
        logger.info("Workspace routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register workspace routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # training エンドポイント
    try:
        from routes import training
        training.register_routes(app)
        logger.info("Training routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register training routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # upload エンドポイント
    try:
        from routes import upload
        upload.register_routes(app)
        logger.info("Upload routes registered successfully")
        modules_registered += 1
    except Exception as e:
        logger.error(f"Failed to register upload routes: {str(e)}")
        logger.error(traceback.format_exc())
    
    # 手動でプロファイルエンドポイントを登録（緊急対策）
    if modules_registered == 0:
        logger.warning("No route modules registered! Adding manual profile endpoints")
        
        @app.route('/api/profiles', methods=['GET', 'OPTIONS'])
        def get_profiles_fallback():
            from flask import jsonify, make_response, request
            if request.method == 'OPTIONS':
                response = make_response()
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
                response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
                return response
                
            # 応急処置としてのプロファイル情報
            default_profile = {
                'id': 'default_profile',
                'name': 'Default Profile',
                'description': 'Emergency fallback profile',
                'created_at': '2025-03-23T00:00:00Z',
                'active': True,
                'is_active': True
            }
            
            response = jsonify({
                'profiles': [default_profile],
                'active_profile': 'default_profile',
                'profiles_dir': 'profiles'
            })
            
            # CORSヘッダーを追加
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
            
            return response
    
    logger.info(f"Registered {modules_registered} route modules")
