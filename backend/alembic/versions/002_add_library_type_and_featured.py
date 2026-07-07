"""Add library_type and is_featured to book_metadata

Revision ID: 002
Revises: 001
Create Date: 2026-07-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add library_type column to book_metadata
    op.add_column(
        'book_metadata',
        sa.Column('library_type', sa.String(length=20), nullable=False, server_default='public')
    )

    # Add is_featured column to book_metadata
    op.add_column(
        'book_metadata',
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false')
    )

    # Add check constraint for library_type
    op.create_check_constraint(
        'chk_library_type',
        'book_metadata',
        "library_type IN ('school', 'public')"
    )

    # Add index on library_type for filtering
    op.create_index('idx_book_metadata_library_type', 'book_metadata', ['library_type'])

    # Add index on is_featured for featured books query
    op.create_index('idx_book_metadata_is_featured', 'book_metadata', ['is_featured'])


def downgrade() -> None:
    op.drop_index('idx_book_metadata_is_featured', table_name='book_metadata')
    op.drop_index('idx_book_metadata_library_type', table_name='book_metadata')
    op.drop_constraint('chk_library_type', 'book_metadata', type_='check')
    op.drop_column('book_metadata', 'is_featured')
    op.drop_column('book_metadata', 'library_type')
