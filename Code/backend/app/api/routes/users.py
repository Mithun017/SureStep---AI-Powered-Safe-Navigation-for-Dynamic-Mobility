from fastapi import APIRouter, HTTPException, status
from typing import List, Dict
from uuid import UUID, uuid4
from datetime import datetime
from app.schemas import schemas

router = APIRouter(prefix="/users", tags=["users"])

# In-memory storage
users_db: Dict[str, dict] = {} # email -> user_dict

@router.post("", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate):
    # Check for existing user
    if user.email in users_db:
        return users_db[user.email]

    user_id = uuid4()
    db_user = {
        "id": user_id,
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "created_at": datetime.now(),
        "is_active": True
    }
    users_db[user.email] = db_user
    return db_user

@router.get("", response_model=List[schemas.UserOut])
def list_users():
    return list(users_db.values())

@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: UUID):
    for u in users_db.values():
        if u["id"] == user_id:
            return u
    raise HTTPException(status_code=404, detail="User not found")

@router.delete("/{user_id}")
def delete_user(user_id: UUID):
    target_email = None
    for email, u in users_db.items():
        if u["id"] == user_id:
            target_email = email
            break
    if not target_email:
        raise HTTPException(status_code=404, detail="User not found")
    del users_db[target_email]
    return {"message": "User deleted"}

# Simplified contacts (not persisted between restarts, but functional)
contacts_db: Dict[UUID, List[dict]] = {}

@router.post("/{user_id}/contacts", response_model=schemas.TrustedContactOut)
def add_contact(user_id: UUID, contact: schemas.TrustedContactCreate):
    contact_id = uuid4()
    db_contact = {
        "id": contact_id,
        "user_id": user_id,
        "contact_name": contact.contact_name,
        "contact_phone": contact.contact_phone,
        "contact_email": contact.contact_email,
        "created_at": datetime.now()
    }
    if user_id not in contacts_db:
        contacts_db[user_id] = []
    contacts_db[user_id].append(db_contact)
    return db_contact

@router.get("/{user_id}/contacts", response_model=List[schemas.TrustedContactOut])
def list_contacts(user_id: UUID):
    return contacts_db.get(user_id, [])

@router.delete("/{user_id}/contacts/{contact_id}")
def delete_contact(user_id: UUID, contact_id: UUID):
    if user_id in contacts_db:
        contacts_db[user_id] = [c for c in contacts_db[user_id] if c["id"] != contact_id]
    return {"message": "Contact deleted"}

