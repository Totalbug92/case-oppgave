import csv
import os
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Project, Expense, Customer
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
        Customer(name="Acme Corp", description="Acme Corporation"),
        Customer(name="TechStart Inc", description="TechStart Industries"),
        Customer(name="Global Solutions", description="Global Solutions Ltd"),
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
        os.path.join(os.path.dirname(__file__), '..', 'dataset.csv'),  # Parent directory
        os.path.join(os.path.dirname(__file__), 'dataset.csv'),  # Current directory
        '/app/../dataset.csv',  # Docker context
    ]
    
    csv_file = None
    for path in csv_paths:
        if os.path.exists(path):
            csv_file = path
            break
    
    if not csv_file:
        print("Warning: dataset.csv not found. Skipping expense import.")
        return
    
    print(f"Loading expenses from {csv_file}...")
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            expenses = []
            projects_seen = set()
            
            for row in reader:
                project_id = int(row['ProjectID'])
                
                # Auto-create projects as needed
                if project_id not in projects_seen:
                    existing_project = db.query(Project).filter(Project.id == project_id).first()
                    if not existing_project:
                        project = Project(
                            id=project_id,
                            name=f"Project {project_id}",
                            description=f"Auto-created project {project_id}"
                        )
                        db.add(project)
                        db.flush()  # Flush to ensure project exists for FK constraint
                    projects_seen.add(project_id)
                
                expense = Expense(
                    project_id=int(row['ProjectID']),
                    expense_type=row['ExpenseType'],
                    amount=float(row['Amount']),
                    description=row.get('Description', '')
                )
                expenses.append(expense)
            
            db.add_all(expenses)
            db.commit()
            
            # Reset sequences to avoid conflicts with auto-increment
            try:
                db.execute(text("SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects) + 1)"))
                db.commit()
            except Exception as seq_err:
                print(f"Warning: Could not reset sequence: {seq_err}")
            
            print(f"Successfully imported {len(expenses)} expenses and {len(projects_seen)} projects")
    
    except Exception as e:
        print(f"Error loading CSV: {e}")
        db.rollback()


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
