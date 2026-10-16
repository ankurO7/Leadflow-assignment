from datetime import datetime, timezone
from typing import Literal, Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints, field_serializer, field_validator

Status = Literal["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
OptText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)]


def _to_utc_naive(v: datetime | None) -> datetime | None:
    """Accept aware or naive input; store as naive UTC."""
    if v is None:
        return None
    if v.tzinfo is not None:
        v = v.astimezone(timezone.utc).replace(tzinfo=None)
    return v


def _as_utc(v: datetime | None) -> str | None:
    if v is None:
        return None
    return v.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


class _UtcOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LeadCreate(BaseModel):
    name: Name
    company: OptText | None = None
    phone: Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)] | None = None
    status: Status = "New"

    @field_validator("company", "phone")
    @classmethod
    def blank_to_none(cls, v):
        return v or None


class LeadUpdate(BaseModel):
    """PATCH body. Only fields that are present are applied; follow_up_at may be null to clear."""
    name: Name | None = None
    company: OptText | None = None
    phone: Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)] | None = None
    status: Status | None = None
    follow_up_at: datetime | None = None

    @field_validator("follow_up_at")
    @classmethod
    def norm(cls, v):
        return _to_utc_naive(v)


class DiscussionCreate(BaseModel):
    note: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]
    follow_up_at: datetime | None = None

    @field_validator("follow_up_at")
    @classmethod
    def norm(cls, v):
        return _to_utc_naive(v)


class DiscussionOut(_UtcOut):
    id: int
    lead_id: int
    note: str
    follow_up_at: datetime | None
    created_at: datetime

    @field_serializer("follow_up_at", "created_at")
    def ser(self, v):
        return _as_utc(v)


class LeadOut(_UtcOut):
    id: int
    name: str
    company: str | None
    phone: str | None
    status: Status
    follow_up_at: datetime | None
    created_at: datetime
    last_note: str | None = None
    last_discussion_at: datetime | None = None

    @field_serializer("follow_up_at", "created_at", "last_discussion_at")
    def ser(self, v):
        return _as_utc(v)


class DiscussionCreated(BaseModel):
    discussion: DiscussionOut
    lead: LeadOut
