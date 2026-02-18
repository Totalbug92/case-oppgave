"""create project_customers table

Revision ID: 0001_create_project_customers
Revises: 
Create Date: 2026-02-18 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_create_project_customers'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'project_customers',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('customer_id', sa.Integer(), sa.ForeignKey('customers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('cost_percentage', sa.Numeric(5, 2), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('project_id', 'customer_id', name='uq_project_customer'),
        sa.CheckConstraint('cost_percentage >= 0 AND cost_percentage <= 100', name='ck_cost_percentage_range')
    )

    op.create_index('idx_pc_project', 'project_customers', ['project_id'])
    op.create_index('idx_pc_customer', 'project_customers', ['customer_id'])

    # Optional trigger to enforce total percentage <= 100 per project
    op.execute("""
    CREATE OR REPLACE FUNCTION check_total_pct() RETURNS trigger AS $$
    DECLARE
      total numeric;
    BEGIN
      IF TG_OP = 'INSERT' THEN
        SELECT COALESCE(SUM(cost_percentage),0) INTO total FROM project_customers WHERE project_id = NEW.project_id;
        IF total + NEW.cost_percentage > 100 THEN
          RAISE EXCEPTION 'Allocation > 100%% for project %', NEW.project_id;
        END IF;
        RETURN NEW;
      ELSIF TG_OP = 'UPDATE' THEN
        SELECT COALESCE(SUM(cost_percentage),0) - COALESCE(OLD.cost_percentage,0) INTO total FROM project_customers WHERE project_id = NEW.project_id;
        IF total + NEW.cost_percentage > 100 THEN
          RAISE EXCEPTION 'Allocation > 100%% for project %', NEW.project_id;
        END IF;
        RETURN NEW;
      ELSE
        RETURN OLD;
      END IF;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_check_total_pct
    BEFORE INSERT OR UPDATE ON project_customers
    FOR EACH ROW EXECUTE FUNCTION check_total_pct();
    """)


def downgrade():
    op.execute('DROP TRIGGER IF EXISTS trg_check_total_pct ON project_customers')
    op.execute('DROP FUNCTION IF EXISTS check_total_pct()')
    op.drop_index('idx_pc_customer', table_name='project_customers')
    op.drop_index('idx_pc_project', table_name='project_customers')
    op.drop_table('project_customers')
