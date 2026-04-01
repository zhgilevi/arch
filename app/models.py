from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    CheckConstraint,
    Float,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class BurialInfo(Base):
    __tablename__ = "burial_infos"

    id = Column(Integer, primary_key=True, index=True)
    burial_name = Column(String, nullable=False)
    burial_short_name = Column(String, nullable=False)

    burials = relationship("Burial", back_populates="burial_info")


class Burial(Base):
    __tablename__ = "burials"

    id = Column(Integer, primary_key=True, index=True)
    kkm = Column(String, nullable=False)

    burial_info_id = Column(
        Integer,
        ForeignKey("burial_infos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    items = Column(ARRAY(String))

    burial_info = relationship("BurialInfo", back_populates="burials")

    embeddings = relationship(
        "BurialEmbedding",
        back_populates="burial",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "kkm",
            "burial_info_id",
            name="uq_burials_kkm_burial_info_id",
        ),
    )


class EmbeddingVersion(Base):
    __tablename__ = "embedding_versions"

    id = Column(Integer, primary_key=True)
    version_no = Column(Integer, nullable=False, unique=True)
    status = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    activated_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "status in ('BUILDING', 'ACTIVE', 'ARCHIVED', 'FAILED')",
            name="ck_embedding_versions_status",
        ),
    )

    embeddings = relationship(
        "BurialEmbedding",
        back_populates="version",
        cascade="all, delete-orphan",
    )


class BurialEmbedding(Base):
    __tablename__ = "burial_embeddings"

    burial_id = Column(
        Integer,
        ForeignKey("burials.id", ondelete="CASCADE"),
        primary_key=True,
    )
    embedding_version_id = Column(
        Integer,
        ForeignKey("embedding_versions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    vector = Column(ARRAY(Float), nullable=False)

    burial = relationship("Burial", back_populates="embeddings")
    version = relationship("EmbeddingVersion", back_populates="embeddings")