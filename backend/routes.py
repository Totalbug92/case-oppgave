from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import crud
import schemas
from database import get_db

router = APIRouter()


# ============ Customer Endpoints ============

@router.post("/customers", response_model=schemas.CustomerResponse, tags=["Customers"])
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    # Check if customer already exists
    existing = db.query(crud.Customer).filter(crud.Customer.name == customer.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this name already exists")
    return crud.create_customer(db, customer)


@router.get("/customers", response_model=list[schemas.CustomerResponse], tags=["Customers"])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all customers"""
    return crud.get_customers(db, skip=skip, limit=limit)


@router.get("/customers/{customer_id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get customer by ID"""
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/customers/{customer_id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def update_customer(customer_id: int, customer: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    """Update a customer"""
    db_customer = crud.update_customer(db, customer_id, customer)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer


@router.delete("/customers/{customer_id}", tags=["Customers"])
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer"""
    db_customer = crud.delete_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"status": "deleted", "customer_id": customer_id}


# ============ Project Endpoints ============

@router.post("/projects", response_model=schemas.ProjectResponse, tags=["Projects"])
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project"""
    return crud.create_project(db, project)


@router.get("/projects", response_model=list[schemas.ProjectResponse], tags=["Projects"])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all projects"""
    return crud.get_projects(db, skip=skip, limit=limit)


@router.get("/projects/{project_id}", response_model=schemas.ProjectResponse, tags=["Projects"])
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get project by ID"""
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/projects/{project_id}", response_model=schemas.ProjectResponse, tags=["Projects"])
def update_project(project_id: int, project: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    """Update a project"""
    db_project = crud.update_project(db, project_id, project)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project


@router.delete("/projects/{project_id}", tags=["Projects"])
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project"""
    db_project = crud.delete_project(db, project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted", "project_id": project_id}


# ============ Expense Endpoints ============

@router.post("/expenses", response_model=schemas.ExpenseResponse, tags=["Expenses"])
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense"""
    return crud.create_expense(db, expense)


@router.get("/expenses", response_model=list[schemas.ExpenseResponse], tags=["Expenses"])
def get_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all expenses"""
    return crud.get_expenses(db, skip=skip, limit=limit)


@router.get("/expenses/{expense_id}", response_model=schemas.ExpenseResponse, tags=["Expenses"])
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    """Get expense by ID"""
    expense = crud.get_expense(db, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.get("/projects/{project_id}/expenses", response_model=list[schemas.ExpenseResponse], tags=["Expenses"])
def get_project_expenses(project_id: int, db: Session = Depends(get_db)):
    """Get all expenses for a project"""
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.get_expenses_by_project(db, project_id)


@router.put("/expenses/{expense_id}", response_model=schemas.ExpenseResponse, tags=["Expenses"])
def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    """Update an expense"""
    db_expense = crud.update_expense(db, expense_id, expense)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense


@router.delete("/expenses/{expense_id}", tags=["Expenses"])
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense"""
    db_expense = crud.delete_expense(db, expense_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"status": "deleted", "expense_id": expense_id}


@router.post("/expenses/bulk", response_model=list[schemas.ExpenseResponse], tags=["Expenses"])
def bulk_create_expenses(request: schemas.BulkExpenseImport, db: Session = Depends(get_db)):
    """Bulk create multiple expenses"""
    return crud.bulk_create_expenses(db, request.expenses)


# ============ Cost Sharing / Project Customer Endpoints ============

@router.post("/projects/{project_id}/customers", response_model=schemas.ProjectCustomerResponse, 
             tags=["Cost Sharing"])
def add_customer_to_project(
    project_id: int,
    project_customer: schemas.ProjectCustomerCreate,
    db: Session = Depends(get_db)
):
    """Add a customer to a project with cost sharing percentage"""
    if project_customer.project_id != project_id:
        raise HTTPException(status_code=400, detail="Project ID mismatch")
    return crud.add_customer_to_project(db, project_customer)


@router.get("/projects/{project_id}/customers", response_model=list[schemas.ProjectCustomerResponse],
            tags=["Cost Sharing"])
def get_project_customers(project_id: int, db: Session = Depends(get_db)):
    """Get all customers assigned to a project"""
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.get_project_customers(db, project_id)


@router.get("/projects/{project_id}/customers/{customer_id}", response_model=schemas.ProjectCustomerResponse,
            tags=["Cost Sharing"])
def get_project_customer(project_id: int, customer_id: int, db: Session = Depends(get_db)):
    """Get a specific customer in a project"""
    pc = crud.get_project_customer(db, project_id, customer_id)
    if not pc:
        raise HTTPException(status_code=404, detail="Customer not found in this project")
    return pc


@router.put("/projects/{project_id}/customers/{customer_id}", response_model=schemas.ProjectCustomerResponse,
            tags=["Cost Sharing"])
def update_project_customer(
    project_id: int,
    customer_id: int,
    project_customer: schemas.ProjectCustomerUpdate,
    db: Session = Depends(get_db)
):
    """Update cost percentage for a customer in a project"""
    pc = crud.update_project_customer(db, project_id, customer_id, project_customer)
    if not pc:
        raise HTTPException(status_code=404, detail="Customer not found in this project")
    return pc


@router.delete("/projects/{project_id}/customers/{customer_id}", tags=["Cost Sharing"])
def remove_customer_from_project(project_id: int, customer_id: int, db: Session = Depends(get_db)):
    """Remove a customer from a project"""
    pc = crud.remove_customer_from_project(db, project_id, customer_id)
    if not pc:
        raise HTTPException(status_code=404, detail="Customer not found in this project")
    return {"status": "removed", "project_id": project_id, "customer_id": customer_id}


@router.get("/projects/{project_id}/validation", tags=["Cost Sharing"])
def validate_project_allocation(project_id: int, db: Session = Depends(get_db)):
    """Validate cost allocation for a project (should sum to 100%)"""
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.validate_project_cost_allocation(db, project_id)


# ============ Cost Overview Endpoints ============

@router.get("/customers/{customer_id}/cost-overview", response_model=schemas.CustomerCostOverview,
            tags=["Cost Overview"])
def get_customer_cost_overview(customer_id: int, db: Session = Depends(get_db)):
    """Get total costs for a customer across all their projects"""
    return crud.get_customer_cost_overview(db, customer_id)


@router.get("/projects/{project_id}/cost-overview", response_model=schemas.ProjectCostOverview,
            tags=["Cost Overview"])
def get_project_cost_overview(project_id: int, db: Session = Depends(get_db)):
    """Get cost breakdown by customer for a project"""
    return crud.get_project_cost_overview(db, project_id)


# ============ Comprehensive Data Endpoints ============

@router.get("/projects/{project_id}/full", tags=["Data Export"])
def get_project_full_data(project_id: int, db: Session = Depends(get_db)):
    """Get complete project data including expenses, customers, and cost overview"""
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    expenses = crud.get_expenses_by_project(db, project_id)
    customers = crud.get_project_customers(db, project_id)
    cost_overview = crud.get_project_cost_overview(db, project_id)
    
    return {
        "project": project,
        "expenses": expenses,
        "customers": customers,
        "cost_overview": cost_overview
    }


@router.get("/all-data", tags=["Data Export"])
def get_all_data(db: Session = Depends(get_db)):
    """Get all customers, projects, expenses, and cost overviews"""
    customers = crud.get_customers(db, skip=0, limit=1000)
    projects = crud.get_projects(db, skip=0, limit=1000)
    expenses = crud.get_expenses(db, skip=0, limit=10000)
    
    # Build cost overviews for all customers
    customer_overviews = []
    for customer in customers:
        try:
            overview = crud.get_customer_cost_overview(db, customer.id)
            customer_overviews.append(overview)
        except:
            pass
    
    # Build cost overviews for all projects
    project_overviews = []
    for project in projects:
        try:
            overview = crud.get_project_cost_overview(db, project.id)
            project_overviews.append(overview)
        except:
            pass
    
    return {
        "customers": customers,
        "projects": projects,
        "expenses": expenses,
        "customer_cost_overviews": customer_overviews,
        "project_cost_overviews": project_overviews
    }


# ============ System / Admin Endpoints ============

@router.post("/admin/reset-db", tags=["Admin"])
def reset_database(db: Session = Depends(get_db)):
    """Reset database to initial state and reseed from dataset.csv"""
    from models import Base
    from database import engine
    from seed import seed_expenses_from_csv, seed_default_customers, seed_default_project_allocations
    from sqlalchemy import text
    
    try:
        # Delete all tables
        Base.metadata.drop_all(bind=engine)
        
        # Recreate all tables
        Base.metadata.create_all(bind=engine)
        
        # Reseed data
        seed_default_customers(db)
        seed_expenses_from_csv(db)
        seed_default_project_allocations(db)
        
        # Reset sequences
        try:
            db.execute(text("SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM projects))"))
            db.execute(text("SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM customers))"))
            db.execute(text("SELECT setval('expenses_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM expenses))"))
            db.execute(text("SELECT setval('project_customers_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM project_customers))"))
            db.commit()
        except Exception as seq_err:
            print(f"Warning: Could not reset sequences: {seq_err}")
        
        return {
            "status": "success",
            "message": "Database reset and reseeded successfully"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
