from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_resultraw'
down_revision = '096ab1d92cda'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'result_raw',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('scan_id', sa.String(64), index=True, nullable=False),
        sa.Column('batch_index', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('xml_path', sa.String(512), nullable=False),
        sa.Column('stdout_path', sa.String(512), nullable=False),
        sa.Column('stderr_path', sa.String(512), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('result_raw')
