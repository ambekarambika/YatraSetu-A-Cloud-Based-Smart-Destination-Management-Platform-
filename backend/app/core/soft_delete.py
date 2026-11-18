"""
YatraSetu Platform — Soft Deletion & Active Entity Query Utilities
Provides standardized query filters and scoping helpers to exclude inactive or
soft-deleted records across all models while preserving administrative bypass.
"""

from typing import Type, TypeVar, Any
from sqlalchemy.orm import Query, Session
from sqlalchemy import sql

T = TypeVar("T")


class SoftDeleteManager:
    """
    Standardized scoping helper for active and soft-deleted entities.
    """

    @staticmethod
    def filter_active(query: Query, model: Type[T], include_inactive: bool = False) -> Query:
        """
        Applies active/non-deleted filtering to a SQLAlchemy query if the target
        model defines `is_active` or `deleted_at`.
        
        Args:
            query: The active SQLAlchemy Query object.
            model: The ORM model class being queried.
            include_inactive: When True, bypasses filter (for authorized admin auditing).
        """
        if include_inactive:
            return query

        # Check for is_active column
        if hasattr(model, "is_active"):
            query = query.filter(getattr(model, "is_active") == True)

        # Check for deleted_at column (if present in model)
        if hasattr(model, "deleted_at"):
            query = query.filter(getattr(model, "deleted_at") == None)

        return query

    @classmethod
    def get_active(
        cls,
        session: Session,
        model: Type[T],
        ident: Any,
        include_inactive: bool = False,
    ) -> Any:
        """
        Loads a single record by primary key, respecting active/soft-delete status.
        """
        query = session.query(model)
        query = cls.filter_active(query, model, include_inactive=include_inactive)

        # Handle models with primary key attribute 'id'
        if hasattr(model, "id"):
            return query.filter(getattr(model, "id") == ident).first()
        return session.get(model, ident)

    @classmethod
    def soft_delete(cls, session: Session, instance: Any) -> None:
        """
        Marks an entity as inactive / soft-deleted without physically removing the row.
        """
        if hasattr(instance, "is_active"):
            setattr(instance, "is_active", False)
        if hasattr(instance, "deleted_at"):
            setattr(instance, "deleted_at", sql.func.now())
