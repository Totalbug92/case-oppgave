import csv
import os
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Project, Expense, Customer, ProjectCustomer
from database import SessionLocal, engine
from models import Base


def seed_default_customers(db: Session):
    """Create some default customers for testing"""
    
    # Check if customers already exist
    existing_customers = db.query(Customer).first()
    if existing_customers:
        print("Database already has customers. Skipping customer seeding.")
        return
    
    default_customers = [
        Customer(name="Oslo kommune", description="Kommune i Oslo fylke"),
        Customer(name="Bergen kommune", description="Kommune i Vestland fylke"),
        Customer(name="Trondheim kommune", description="Kommune i Trøndelag fylke"),
    ]
    
    db.add_all(default_customers)
    db.commit()
    
    # Reset customer sequence
    try:
        db.execute(text("SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers) + 1)"))
        db.commit()
    except Exception as seq_err:
        print(f"Warning: Could not reset customer sequence: {seq_err}")
    
    print(f"Successfully created {len(default_customers)} default customers")


def seed_expenses_from_csv(db: Session):
    """Load and seed expenses from dataset.csv"""
    
    # Check if expenses already exist to avoid duplicate imports
    existing_expenses = db.query(Expense).first()
    if existing_expenses:
        print("Database already seeded with expenses. Skipping import.")
        return
    
    # Look for dataset.csv in multiple locations
    csv_paths = [
        os.path.join(os.path.dirname(__file__), 'dataset.csv'),  # Current directory
        os.path.join(os.path.dirname(__file__), '..', 'dataset.csv'),  # Parent directory fallback
        '/app/../dataset.csv',  # Docker context
    ]
    
    imported = False

    for csv_file in csv_paths:
        if not os.path.exists(csv_file):
            continue

        print(f"Loading expenses from {csv_file}...")

        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)

                if not reader.fieldnames or 'ProjectID' not in reader.fieldnames:
                    print(f"Warning: Invalid or empty CSV at {csv_file}. Trying next path...")
                    continue

                expenses = []
                projects_seen = set()

                for row in reader:
                    project_id = int(row['ProjectID'])

                    if project_id not in projects_seen:
                        existing_project = db.query(Project).filter(Project.id == project_id).first()
                        if not existing_project:
                            project = Project(
                                id=project_id,
                                name=f"Project {project_id}",
                                description=f"Auto-created project {project_id}"
                            )
                            db.add(project)
                            db.flush()
                        projects_seen.add(project_id)

                    expense = Expense(
                        project_id=project_id,
                        expense_type=row['ExpenseType'],
                        amount=float(row['Amount']),
                        description=row.get('Description', '')
                    )
                    expenses.append(expense)

                if not expenses:
                    print(f"Warning: CSV at {csv_file} has no data rows. Trying next path...")
                    continue

                db.add_all(expenses)
                db.commit()

                try:
                    db.execute(text("SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects) + 1)"))
                    db.commit()
                except Exception as seq_err:
                    print(f"Warning: Could not reset sequence: {seq_err}")

                print(f"Successfully imported {len(expenses)} expenses and {len(projects_seen)} projects")
                imported = True
                break

        except Exception as e:
            print(f"Error loading CSV from {csv_file}: {e}")
            db.rollback()

    if not imported:
        print("Warning: No usable dataset.csv found. Skipping expense import.")


def seed_default_project_allocations(db: Session):
    """Create deterministic default customer allocations per project for demo data."""

    existing_allocations = db.query(ProjectCustomer).first()
    if existing_allocations:
        print("Database already has project-customer allocations. Skipping allocation seeding.")
        return

    projects = db.query(Project).order_by(Project.id.asc()).all()
    customers = db.query(Customer).order_by(Customer.id.asc()).all()

    if not projects or not customers:
        print("No projects or customers found. Skipping allocation seeding.")
        return

    allocations_to_add = []

    for project in projects:
        if len(customers) >= 3:
            distribution = [(0, 50.0), (1, 30.0), (2, 20.0)]
        elif len(customers) == 2:
            distribution = [(0, 60.0), (1, 40.0)]
        else:
            distribution = [(0, 100.0)]

        for customer_idx, percentage in distribution:
            allocations_to_add.append(
                ProjectCustomer(
                    project_id=project.id,
                    customer_id=customers[customer_idx].id,
                    cost_percentage=percentage,
                )
            )

    db.add_all(allocations_to_add)
    db.commit()
    print(f"Successfully created {len(allocations_to_add)} project-customer allocations")


def init_db():
    """Initialize database and seed with data"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Seed data
        db = SessionLocal()
        try:
            seed_default_customers(db)
            seed_expenses_from_csv(db)
            seed_default_project_allocations(db)
            
            # After seeding, reset all sequences to ensure auto-increment works correctly
            try:
                db.execute(text("SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM projects))"))
                db.execute(text("SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM customers))"))
                db.execute(text("SELECT setval('expenses_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM expenses))"))
                db.execute(text("SELECT setval('project_customers_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM project_customers))"))
                db.commit()
            except Exception as seq_err:
                print(f"Warning: Could not reset sequences: {seq_err}")
        finally:
            db.close()
    except Exception as e:
        print(f"Warning: Could not initialize database: {e}")
        print("Make sure PostgreSQL is running and DATABASE_URL is correct.")
        print("For local development without Docker, you can:")
        print("  1. Start PostgreSQL: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16-alpine")
        print("  2. Or use Docker Compose: docker-compose up")
