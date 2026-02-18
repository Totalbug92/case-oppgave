from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


# Customer Schemas
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Project Schemas
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Expense Schemas
class ExpenseBase(BaseModel):
    expense_type: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    description: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    project_id: int


class ExpenseUpdate(BaseModel):
    expense_type: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ProjectCustomer (Cost Sharing) Schemas
class ProjectCustomerBase(BaseModel):
    project_id: int
    customer_id: int
    cost_percentage: float = Field(..., gt=0, le=100)

    @validator('cost_percentage')
    def validate_percentage(cls, v):
        if v <= 0 or v > 100:
            raise ValueError('Cost percentage must be greater than 0 and at most 100')
        return v


class ProjectCustomerCreate(ProjectCustomerBase):
    pass


class ProjectCustomerUpdate(BaseModel):
    cost_percentage: float = Field(..., gt=0, le=100)

    @validator('cost_percentage')
    def validate_percentage(cls, v):
        if v <= 0 or v > 100:
            raise ValueError('Cost percentage must be greater than 0 and at most 100')
        return v


class ProjectCustomerResponse(ProjectCustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Cost Overview Schemas
class CustomerCostDetail(BaseModel):
    project_id: int
    project_name: str
    cost_percentage: float
    total_expenses: float
    allocated_cost: float


class CustomerCostOverview(BaseModel):
    customer_id: int
    customer_name: str
    total_cost: float
    projects: List[CustomerCostDetail]


class ProjectCostDetail(BaseModel):
    customer_id: int
    customer_name: str
    cost_percentage: float
    allocated_cost: float


class ProjectCostOverview(BaseModel):
    project_id: int
    project_name: str
    total_expenses: float
    customers: List[ProjectCostDetail]


# Bulk Import Schema
class BulkExpenseImport(BaseModel):
    expenses: List[ExpenseCreate]
