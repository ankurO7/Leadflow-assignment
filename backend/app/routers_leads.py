from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from . import schemas
from .database import get_db
from .models import Discussion, Lead

router = APIRouter(prefix="/api/leads", tags=["leads"])


def to_out(lead: Lead) -> schemas.LeadOut:
    out = schemas.LeadOut.model_validate(lead)
    if lead.discussions:
        latest = lead.discussions[0]  # relationship is ordered newest-first
        out.last_note = latest.note
        out.last_discussion_at = latest.created_at
    return out


def get_lead_or_404(db: Session, lead_id: int) -> Lead:
    lead = db.scalar(select(Lead).options(selectinload(Lead.discussions)).where(Lead.id == lead_id))
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Lead {lead_id} not found")
    return lead


@router.get("", response_model=list[schemas.LeadOut])
def list_leads(
    status_: schemas.Status | None = Query(None, alias="status"),
    q: str | None = Query(None, description="Case-insensitive name search"),
    db: Session = Depends(get_db),
):
    stmt = select(Lead).options(selectinload(Lead.discussions)).order_by(Lead.id.desc())
    if status_:
        stmt = stmt.where(Lead.status == status_)
    if q and q.strip():
        stmt = stmt.where(Lead.name.ilike(f"%{q.strip()}%"))
    return [to_out(l) for l in db.scalars(stmt)]


@router.post("", response_model=schemas.LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(body: schemas.LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**body.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return to_out(lead)


@router.get("/{lead_id}", response_model=schemas.LeadOut)
def read_lead(lead_id: int, db: Session = Depends(get_db)):
    return to_out(get_lead_or_404(db, lead_id))


@router.patch("/{lead_id}", response_model=schemas.LeadOut)
def update_lead(lead_id: int, body: schemas.LeadUpdate, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    for field in body.model_fields_set:
        value = getattr(body, field)
        if value is None and field in ("name", "status"):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"{field} cannot be null")
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return to_out(lead)


@router.get("/{lead_id}/discussions", response_model=list[schemas.DiscussionOut])
def list_discussions(lead_id: int, db: Session = Depends(get_db)):
    """Full history, newest first."""
    return get_lead_or_404(db, lead_id).discussions


@router.post("/{lead_id}/discussions", response_model=schemas.DiscussionCreated, status_code=status.HTTP_201_CREATED)
def add_discussion(lead_id: int, body: schemas.DiscussionCreate, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    discussion = Discussion(lead_id=lead.id, note=body.note, follow_up_at=body.follow_up_at)
    db.add(discussion)
    if body.follow_up_at is not None:
        lead.follow_up_at = body.follow_up_at
    db.commit()
    db.refresh(lead)  # reload relationship so last_note reflects the new entry
    return schemas.DiscussionCreated(discussion=schemas.DiscussionOut.model_validate(discussion), lead=to_out(lead))
