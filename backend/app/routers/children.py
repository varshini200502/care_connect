from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Child, User, UserRole, Appointment
from app.schemas.schemas import ChildCreate, ChildUpdate, ChildOut

router = APIRouter(prefix="/children", tags=["Children Profiles"])

def verify_child_access(child: Child, current_user: User, db: Session) -> bool:
    if current_user.role == UserRole.ADMIN.value:
        return True
    if current_user.role == UserRole.PARENT.value:
        return child.parent_id == current_user.id
    if current_user.role == UserRole.DOCTOR.value and current_user.doctor_profile:
        # Check if doctor has ever had or has an appointment with this child
        has_appt = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.doctor_profile.id,
            Appointment.child_id == child.id
        ).first()
        return has_appt is not None
    return False

@router.post("/", response_model=ChildOut, status_code=status.HTTP_201_CREATED)
def create_child_profile(
    payload: ChildCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.PARENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can register children profiles."
        )

    child = Child(
        parent_id=current_user.id,
        full_name=payload.full_name.strip(),
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        blood_group=payload.blood_group,
        allergies=payload.allergies,
        existing_conditions=payload.existing_conditions,
        medical_history=payload.medical_history
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return child

@router.get("/", response_model=List[ChildOut])
def list_children(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.PARENT.value:
        return db.query(Child).filter(Child.parent_id == current_user.id).order_by(Child.created_at.desc()).all()
    elif current_user.role == UserRole.ADMIN.value:
        return db.query(Child).order_by(Child.created_at.desc()).all()
    elif current_user.role == UserRole.DOCTOR.value and current_user.doctor_profile:
        # Return children who have appointments with this doctor
        children_ids = db.query(Appointment.child_id).filter(
            Appointment.doctor_id == current_user.doctor_profile.id
        ).distinct().all()
        ids = [cid[0] for cid in children_ids]
        return db.query(Child).filter(Child.id.in_(ids)).all() if ids else []
    return []

@router.get("/{child_id}", response_model=ChildOut)
def get_child_details(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found.")

    if not verify_child_access(child, current_user, db):
        raise HTTPException(status_code=403, detail="You do not have permission to view this child's record.")

    return child

@router.put("/{child_id}", response_model=ChildOut)
def update_child_profile(
    child_id: int,
    payload: ChildUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found.")

    if child.parent_id != current_user.id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="You can only update your own child's profile.")

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(child, field, val)

    db.commit()
    db.refresh(child)
    return child

@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child_profile(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found.")

    if child.parent_id != current_user.id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="You can only delete your own child's profile.")

    db.delete(child)
    db.commit()
    return None
