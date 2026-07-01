"""Tag and TagLink models for global tagging."""

import uuid

from sqlalchemy import ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base.db.base_model import Base, TimestampMixin, UUIDMixin


class Tag(UUIDMixin, TimestampMixin, Base):
    """Global tag entity."""

    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=True, default="#6366f1")
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="tags")
    links = relationship("TagLink", back_populates="tag", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Tag {self.name}>"


class TagLink(UUIDMixin, TimestampMixin, Base):
    """Polymorphic association between a tag and any entity."""

    __tablename__ = "tag_links"

    tag_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tags.id"), nullable=False
    )
    target_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    target_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )

    # Relationships
    tag = relationship("Tag", back_populates="links")
    user = relationship("User")
