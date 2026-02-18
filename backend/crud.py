from sqlalchemy.orm import Session
from sqlalchemy import func, text
from models import Customer, Project, Expense, ProjectCustomer
from schemas import (
    CustomerCreate, CustomerUpdate, ProjectCreate, ProjectUpdate,
    ExpenseCreate, ExpenseUpdate, ProjectCustomerCreate, ProjectCustomerUpdate,
    CustomerCostOverview, CustomerCostDetail, ProjectCostOverview, ProjectCostDetail
)
from fastapi import HTTPException


# ============ Customer Operations ============

def create_customer(db: Session, customer: CustomerCreate):
    """Create a new customer"""
    db_customer = Customer(name=customer.name, description=customer.description)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def get_customer(db: Session, customer_id: int):
    """Get customer by ID"""
    return db.query(Customer).filter(Customer.id == customer_id).first()


def get_customers(db: Session, skip: int = 0, limit: int = 100):
    """Get all customers with pagination"""
    return db.query(Customer).offset(skip).limit(limit).all()


def update_customer(db: Session, customer_id: int, customer: CustomerUpdate):
    """Update a customer"""
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    
    update_data = customer.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int):
    """Delete a customer"""
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    
    db.delete(db_customer)
    db.commit()
    return db_customer


# ============ Project Operations ============

def create_project(db: Session, project: ProjectCreate):
    """Create a new project"""
    db_project = Project(name=project.name, description=project.description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def get_project(db: Session, project_id: int):
    """Get project by ID"""
    return db.query(Project).filter(Project.id == project_id).first()


def get_projects(db: Session, skip: int = 0, limit: int = 100):
    """Get all projects with pagination"""
    return db.query(Project).offset(skip).limit(limit).all()


def update_project(db: Session, project_id: int, project: ProjectUpdate):
    """Update a project"""
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    
    update_data = project.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: int):
    """Delete a project"""
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    
    db.delete(db_project)
    db.commit()
    return db_project


# ============ Expense Operations ============

def create_expense(db: Session, expense: ExpenseCreate):
    """Create a new expense"""
    # Verify project exists
    project = get_project(db, expense.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_expense = Expense(
        project_id=expense.project_id,
        expense_type=expense.expense_type,
        amount=expense.amount,
        description=expense.description
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


def get_expense(db: Session, expense_id: int):
    """Get expense by ID"""
    return db.query(Expense).filter(Expense.id == expense_id).first()


def get_expenses_by_project(db: Session, project_id: int):
    """Get all expenses for a project"""
    return db.query(Expense).filter(Expense.project_id == project_id).all()


def get_expenses(db: Session, skip: int = 0, limit: int = 100):
    """Get all expenses with pagination"""
    return db.query(Expense).offset(skip).limit(limit).all()


def update_expense(db: Session, expense_id: int, expense: ExpenseUpdate):
    """Update an expense"""
    db_expense = get_expense(db, expense_id)
    if not db_expense:
        return None
    
    update_data = expense.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense


def delete_expense(db: Session, expense_id: int):
    """Delete an expense"""
    db_expense = get_expense(db, expense_id)
    if not db_expense:
        return None
    
    db.delete(db_expense)
    db.commit()
    return db_expense


def bulk_create_expenses(db: Session, expenses: list):
    """Create multiple expenses"""
    db_expenses = []
    for expense in expenses:
        # Verify project exists
        project = get_project(db, expense.project_id)
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {expense.project_id} not found")
        
        db_expense = Expense(
            project_id=expense.project_id,
            expense_type=expense.expense_type,
            amount=expense.amount,
            description=expense.description
        )
        db_expenses.append(db_expense)
    
    db.add_all(db_expenses)
    db.commit()
    return db_expenses


# ============ Project Customer (Cost Sharing) Operations ============

def add_customer_to_project(db: Session, project_customer: ProjectCustomerCreate):
    """Add a customer to a project with cost sharing percentage"""
    # Verify customer and project exist
    customer = get_customer(db, project_customer.customer_id)
    project = get_project(db, project_customer.project_id)
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Acquire advisory lock for this project to serialize allocation changes
    db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": project_customer.project_id})

    # Check if customer already exists in project
    existing = db.query(ProjectCustomer).filter(
        ProjectCustomer.project_id == project_customer.project_id,
        ProjectCustomer.customer_id == project_customer.customer_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Customer already added to this project")
    # Validate that adding this allocation won't push total > 100
    current_total = db.query(func.coalesce(func.sum(ProjectCustomer.cost_percentage), 0)).filter(
        ProjectCustomer.project_id == project_customer.project_id
    ).scalar() or 0.0

    new_total = float(current_total) + float(project_customer.cost_percentage)
    if new_total > 100.0 + 1e-9:
        raise HTTPException(status_code=400, detail=f"Allocation exceeds 100% (current: {current_total}%, adding: {project_customer.cost_percentage}%)")

    db_pc = ProjectCustomer(
        project_id=project_customer.project_id,
        customer_id=project_customer.customer_id,
        cost_percentage=project_customer.cost_percentage
    )
    db.add(db_pc)
    db.commit()
    db.refresh(db_pc)
    return db_pc


def get_project_customers(db: Session, project_id: int):
    """Get all customers for a project"""
    return db.query(ProjectCustomer).filter(ProjectCustomer.project_id == project_id).all()


def get_project_customer(db: Session, project_id: int, customer_id: int):
    """Get specific customer in a project"""
    return db.query(ProjectCustomer).filter(
        ProjectCustomer.project_id == project_id,
        ProjectCustomer.customer_id == customer_id
    ).first()


def update_project_customer(db: Session, project_id: int, customer_id: int, 
                           project_customer: ProjectCustomerUpdate):
    """Update cost percentage for a customer in a project"""
    db_pc = get_project_customer(db, project_id, customer_id)
    if not db_pc:
        return None
    # Acquire advisory lock for this project to serialize allocation changes
    db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": project_id})

    # Validate that updating this allocation won't push total > 100
    # Sum current allocations excluding this customer
    current_total_excluding = db.query(func.coalesce(func.sum(ProjectCustomer.cost_percentage), 0)).filter(
        ProjectCustomer.project_id == project_id,
        ProjectCustomer.customer_id != customer_id
    ).scalar() or 0.0

    new_total = float(current_total_excluding) + float(project_customer.cost_percentage)
    if new_total > 100.0 + 1e-9:
        raise HTTPException(status_code=400, detail=f"Allocation exceeds 100% (others: {current_total_excluding}%, setting: {project_customer.cost_percentage}%)")

    db_pc.cost_percentage = project_customer.cost_percentage
    db.commit()
    db.refresh(db_pc)
    return db_pc


def remove_customer_from_project(db: Session, project_id: int, customer_id: int):
    """Remove a customer from a project"""
    # Acquire advisory lock for this project to serialize allocation changes
    db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": project_id})

    db_pc = get_project_customer(db, project_id, customer_id)
    if not db_pc:
        return None
    
    db.delete(db_pc)
    db.commit()
    return db_pc


def validate_project_cost_allocation(db: Session, project_id: int) -> dict:
    """Validate that cost percentages for a project sum to 100%"""
    project_customers = get_project_customers(db, project_id)
    total_percentage = sum(pc.cost_percentage for pc in project_customers)
    
    return {
        "project_id": project_id,
        "total_percentage": total_percentage,
        "is_valid": total_percentage == 100 if project_customers else True,
        "customer_count": len(project_customers),
        "allocation_details": [
            {
                "customer_id": pc.customer_id,
                "cost_percentage": pc.cost_percentage
            } for pc in project_customers
        ]
    }


# ============ Cost Overview Operations ============

def get_customer_cost_overview(db: Session, customer_id: int) -> CustomerCostOverview:
    """Get total costs and breakdown per project for a customer"""
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    project_customers = db.query(ProjectCustomer).filter(
        ProjectCustomer.customer_id == customer_id
    ).all()
    
    total_cost = 0.0
    projects_details = []
    
    for pc in project_customers:
        project = pc.project
        # Get total expenses for this project
        total_expenses = db.query(func.sum(Expense.amount)).filter(
            Expense.project_id == project.id
        ).scalar() or 0.0
        
        # Calculate allocated cost based on percentage
        allocated_cost = total_expenses * (pc.cost_percentage / 100)
        total_cost += allocated_cost
        
        projects_details.append(CustomerCostDetail(
            project_id=project.id,
            project_name=project.name,
            cost_percentage=pc.cost_percentage,
            total_expenses=total_expenses,
            allocated_cost=allocated_cost
        ))
    
    return CustomerCostOverview(
        customer_id=customer_id,
        customer_name=customer.name,
        total_cost=total_cost,
        projects=projects_details
    )


def get_project_cost_overview(db: Session, project_id: int) -> ProjectCostOverview:
    """Get total costs and breakdown per customer for a project"""
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get total expenses for this project
    total_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.project_id == project_id
    ).scalar() or 0.0
    
    project_customers = db.query(ProjectCustomer).filter(
        ProjectCustomer.project_id == project_id
    ).all()
    
    customers_details = []
    
    for pc in project_customers:
        customer = pc.customer
        allocated_cost = total_expenses * (pc.cost_percentage / 100)
        
        customers_details.append(ProjectCostDetail(
            customer_id=customer.id,
            customer_name=customer.name,
            cost_percentage=pc.cost_percentage,
            allocated_cost=allocated_cost
        ))
    
    return ProjectCostOverview(
        project_id=project_id,
        project_name=project.name,
        total_expenses=total_expenses,
        customers=customers_details
    )
