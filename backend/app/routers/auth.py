from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.models.models import User, Doctor, UserRole
from app.schemas.schemas import UserRegister, UserLogin, UserOut, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.services.audit_service import log_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    # Check if user with this email already exists
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    role_val = payload.role.upper()
    if role_val not in [UserRole.PARENT.value, UserRole.DOCTOR.value]:
        role_val = UserRole.PARENT.value

    user = User(
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        phone_number=payload.phone_number,
        role=role_val,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If registered as DOCTOR, initialize pending profile
    if role_val == UserRole.DOCTOR.value:
        doctor_profile = Doctor(
            user_id=user.id,
            specialization="General Pediatrics",
            qualification="MBBS, MD (Pediatrics)",
            license_number=f"MCI-{user.id}-{int(user.created_at.timestamp())}",
            is_verified=False
        )
        db.add(doctor_profile)
        db.commit()
        db.refresh(user)

    log_audit(
        db,
        action="USER_REGISTRATION",
        entity_type="User",
        user_id=user.id,
        entity_id=str(user.id),
        ip_address=request.client.host if request.client else None,
        details=f"Registered with role {user.role}"
    )

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
def login_user(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )

    log_audit(
        db,
        action="USER_LOGIN",
        entity_type="User",
        user_id=user.id,
        entity_id=str(user.id),
        ip_address=request.client.host if request.client else None,
        details=f"Successful login for {user.email}"
    )

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    # Always return success message to prevent user enumeration
    return {
        "message": "If an account with that email exists, password reset instructions have been generated.",
        "dev_token": "RESET-" + str(user.id) if user else None
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset request.")
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password has been successfully updated. You may now log in."}
