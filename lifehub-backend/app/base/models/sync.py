"""SyncLog model for incremental sync tracking."""

import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base.db.base_model import Base, TimestampMixin, UUIDMixin


class SyncLog(UUIDMixin, TimestampMixin, Base):
    """Record of data synchronization events."""

    __tablename__ = "sync_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    action: Mapped[str] = mapped_column(String(20), nullable=False)  # CREATE / UPDATE / DELETE
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    user = relationship("User", back_populates="sync_logs")

    def __repr__(self) -> str:
        return f"<SyncLog {self.action} {self.entity_type}:{self.entity_id}>"
