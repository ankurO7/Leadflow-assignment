"""Seed demo data. Run with:  python -m app.seed   (add --reset to wipe first)"""
import sys
from datetime import timedelta

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import Discussion, Lead, utcnow


def _lead(db: Session, name, company, phone, status, notes, follow_up_in=None):
    """notes: list of (hours_ago, text, follow_up_hours_from_now|None), oldest first."""
    now = utcnow()
    lead = Lead(name=name, company=company, phone=phone, status=status, created_at=now - timedelta(days=30))
    db.add(lead)
    db.flush()
    for hours_ago, text, fu in notes:
        d = Discussion(
            lead_id=lead.id,
            note=text,
            created_at=now - timedelta(hours=hours_ago),
            follow_up_at=now + timedelta(hours=fu) if fu is not None else None,
        )
        db.add(d)
    if follow_up_in is not None:
        lead.follow_up_at = now + timedelta(hours=follow_up_in)


def seed(db: Session) -> None:
    _lead(db, "Priya Nair", "Northwind Logistics", "+91 98450 11223", "Qualified", [
        (240, "Intro call. They run 40 trucks and track dispatch in spreadsheets.", None),
        (96, "Demo done. Ops head liked route view; wants pricing for 50 seats.", 2),
    ], follow_up_in=2)  # due later today
    _lead(db, "Rahul Deshpande", "Sahyadri Foods", "+91 98860 44120", "Proposal Sent", [
        (170, "Met at the Pune trade show. Interested in a pilot for two plants.", None),
        (50, "Sent proposal v1 (Rs 4.2L/yr). CFO reviewing.", -6),
    ], follow_up_in=-6)  # overdue
    _lead(db, "Meera Kulkarni", "Bluebird Clinics", "+91 99000 87654", "Contacted", [
        (30, "Left voicemail and sent intro email.", 1),
    ], follow_up_in=1)  # due soon
    _lead(db, "Arjun Mehta", "Mehta & Sons Textiles", None, "New", [])
    _lead(db, "Sana Sheikh", "Crescent EdTech", "+91 90350 22871", "Won", [
        (700, "Kickoff call. Budget approved for Q3.", None),
        (400, "Contract signed for 120 seats. Onboarding next week.", None),
    ])
    _lead(db, "Vikram Rao", "Rao Auto Components", "+91 98800 33145", "Lost", [
        (500, "Needed on-prem hosting; we only offer cloud.", None),
        (300, "Went with a competitor. Revisit in 6 months.", 24 * 180),
    ], follow_up_in=24 * 180)
    _lead(db, "Ananya Iyer", None, "+91 97410 55902", "Contacted", [
        (10, "Referred by Priya. Wants a call after Diwali.", 24 * 3),
    ], follow_up_in=24 * 3)
    db.commit()


def seed_if_empty(db: Session) -> bool:
    if db.scalar(select(func.count()).select_from(Lead)):
        return False
    seed(db)
    return True


if __name__ == "__main__":
    if "--reset" in sys.argv:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        print("Seeded." if seed_if_empty(session) else "DB not empty - skipped (use --reset).")
