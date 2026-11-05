import os

class Settings:
    PROJECT_NAME: str = "CareConnect Pediatrician Consultation Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "careconnect_super_secret_jwt_key_2026_pediatrics_secure_auth_hash")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    PROJECT_ROOT: str = os.path.dirname(BASE_DIR)
    
    DB_PATH: str = os.path.join(BASE_DIR, "careconnect.db")
    _raw_db_url: str = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
    # Render and some providers provide postgres:// instead of postgresql://
    if _raw_db_url.startswith("postgres://"):
        _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL: str = _raw_db_url
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(PROJECT_ROOT, "uploads"))
    PRESCRIPTION_UPLOAD_DIR: str = os.path.join(UPLOAD_DIR, "prescriptions")
    MEDICAL_RECORDS_UPLOAD_DIR: str = os.path.join(UPLOAD_DIR, "medical_records")
    
    JITSI_DOMAIN: str = os.getenv("JITSI_DOMAIN", "meet.jit.si")
    JITSI_ROOM_PREFIX: str = "CareConnect-Pediatrics-"
    
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]
    _custom_cors: str = os.getenv("CORS_ORIGINS", "")
    if _custom_cors:
        CORS_ORIGINS = [orig.strip() for orig in _custom_cors.split(",") if orig.strip()]
    
    # Email settings (development simulation mode if credentials not provided)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAILS_ENABLED: bool = bool(SMTP_HOST and SMTP_USER)

settings = Settings()

os.makedirs(settings.PRESCRIPTION_UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MEDICAL_RECORDS_UPLOAD_DIR, exist_ok=True)
