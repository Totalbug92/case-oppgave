# Case API - Backend Documentation

## Overview

The Case API is a FastAPI-based CRUD backend that manages project costs, customer allocations, and expense tracking. It solves the problem of cost distribution across multiple customers on shared projects while maintaining data integrity.

**Key Features:**
- Customer and Project Management (CRUD operations)
- Expense Tracking with CSV import
- Cost Sharing/Allocation with validation
- Cost Overview and Analytics
- Built with FastAPI, SQLAlchemy, and PostgreSQL

---

## Architecture & Design Decisions

### 1. Database Design

#### Entity-Relationship Model
```
Customer (1) ---> (M) ProjectCustomer (M) <--- (1) Project
                         |
                         └---> (M) Expense
```

#### Tables

**`customers`**
- `id` (PK): Auto-increment identifier
- `name` (UNIQUE): Customer name for quick lookup
- `description`: Optional description
- `created_at`, `updated_at`: Audit timestamps

**`projects`**
- `id` (PK): Auto-increment identifier
- `name`: Project name
- `description`: Optional description
- `created_at`, `updated_at`: Audit timestamps

**`project_customers`** (Join table)
- `id` (PK): Auto-increment identifier
- `project_id` (FK): Reference to project
- `customer_id` (FK): Reference to customer
- `cost_percentage` (0-100): Customer's share of project costs
- **Constraint**: `CHECK (cost_percentage >= 0 AND cost_percentage <= 100)`
- **Purpose**: Enforces valid percentage ranges at the database level
- `created_at`, `updated_at`: Audit timestamps

**`expenses`**
- `id` (PK): Auto-increment identifier
- `project_id` (FK): Which project this expense belongs to
- `expense_type`: Category of expense (e.g., "Markedsføring og salg")
- `amount`: Expense amount in currency
- `description`: Details about the expense
- `created_at`, `updated_at`: Audit timestamps

### 2. Cost Allocation Strategy

#### The Problem
Multiple customers can share costs on a single project. We need to ensure:
1. The sum of all customer percentages never exceeds 100%
2. Cost calculations are accurate across all views
3. Atomicity: all-or-nothing operations

#### The Solution

**Two-tier validation:**

1. **Database Level**: CHECK constraint on `cost_percentage` (0-100)
2. **Application Level**: Business logic validation
   - When adding/updating customer allocations, validate the allocation
   - GET `/projects/{project_id}/validation` endpoint for verification
   - Endpoint returns: `{ total_percentage, is_valid, customer_count, allocation_details }`

**Cost Calculation Formula:**
```
Customer_Cost = Total_Project_Expenses × (Customer_Percentage / 100)
```

**Example:**
- Project A has €10,000 in total expenses
- Customer X is allocated 50%, Customer Y is allocated 50%
- Customer X allocated cost: €10,000 × (50/100) = €5,000
- Customer Y allocated cost: €10,000 × (50/100) = €5,000
- Total distributed: €10,000 ✓

### 3. Data Integrity Measures

1. **Foreign Key Constraints**: Prevent orphaned records
2. **Cascading Deletes**: When a project is deleted, its expenses and allocations are automatically removed
3. **Transaction Handling**: All multi-step operations are wrapped in database transactions
4. **Validation at Multiple Levels**:
   - Pydantic schemas validate input types and ranges
   - SQLAlchemy ORM constraints enforce database rules
   - CRUD layer implements business logic validation

Additional server-side protections implemented:

- **Allocation validation in the CRUD layer**: the backend now enforces that the sum of `cost_percentage` values for a project's `ProjectCustomer` rows does not exceed 100%. Attempts to add or update allocations that would push the total over 100% return a 400/422 error. This is enforced in `backend/crud.py`.

- **Seeding and sequence reset**: the seeder (`seed.py`) now inserts default customers (used by the demo) and resets PostgreSQL sequences after importing seeded rows so auto-increment values do not collide with seeded IDs. The admin reset endpoint also reseeds defaults and resets sequences to keep a reproducible demo state.

- **Concurrency note**: while application-level checks prevent invalid allocations in the common case, race conditions are still possible under concurrent requests. For production safety, consider using one of the following in the CRUD paths that modify allocations:
  - PostgreSQL advisory locks scoped per `project_id` to serialize allocation changes
  - `SELECT FOR UPDATE` on a dedicated lock row in a small single-row `project_locks` table
  - Serializable transactions (more heavyweight) with retry logic on serialization failures

These approaches ensure atomic validation + write semantics under concurrent traffic.

### 4. Performance Considerations

- **Indexes on foreign keys** for faster joins
- **Aggregate queries**: Use `SUM` to calculate totals efficiently
- **Connection pooling**: Recycle connections after 1 hour
- **Connection health checks**: `pool_pre_ping=True` prevents "lost connection" errors

---

## API Endpoints Specification

### Base URL
```
http://localhost:8000
```

### Authentication
Currently no authentication (adjust based on requirements).

### Response Format
All responses follow JSON format with appropriate HTTP status codes.

---

## 1. Customer Management

### Create Customer
```
POST /customers
Content-Type: application/json

{
  "name": "Kommune Oslo",
  "description": "Oslo Municipality"
}

Response (201):
{
  "id": 1,
  "name": "Kommune Oslo",
  "description": "Oslo Municipality",
  "created_at": "2024-02-17T10:30:00",
  "updated_at": "2024-02-17T10:30:00"
}
```

**Validation:**
- `name`: Required, 1-255 characters, unique across system
- `description`: Optional string

**Error Cases:**
- 400: Customer with this name already exists
- 422: Validation error (invalid input)

### List Customers
```
GET /customers?skip=0&limit=100

Response (200):
[
  {
    "id": 1,
    "name": "Kommune Oslo",
    "description": "Oslo Municipality",
    "created_at": "2024-02-17T10:30:00",
    "updated_at": "2024-02-17T10:30:00"
  },
  ...
]
```

**Query Parameters:**
- `skip`: Offset for pagination (default: 0)
- `limit`: Number of records to return (default: 100, max: 100)

### Get Customer
```
GET /customers/{customer_id}

Response (200):
{
  "id": 1,
  "name": "Kommune Oslo",
  "description": "Oslo Municipality",
  "created_at": "2024-02-17T10:30:00",
  "updated_at": "2024-02-17T10:30:00"
}
```

**Error Cases:**
- 404: Customer not found

### Update Customer
```
PUT /customers/{customer_id}
Content-Type: application/json

{
  "name": "Nye Kommune Oslo",
  "description": "Updated description"
}

Response (200): Updated customer object
```

**Notes:**
- All fields are optional for updates
- Only provided fields are updated
- Returns updated object

### Delete Customer
```
DELETE /customers/{customer_id}

Response (200):
{
  "status": "deleted",
  "customer_id": 1
}
```

**Cascading Effects:**
- All project allocations for this customer are deleted
- Customer's cost relationships are removed

---

## 2. Project Management

### Create Project
```
POST /projects
Content-Type: application/json

{
  "name": "Infrastructure Upgrade 2024",
  "description": "City-wide infrastructure modernization"
}

Response (201):
{
  "id": 1,
  "name": "Infrastructure Upgrade 2024",
  "description": "City-wide infrastructure modernization",
  "created_at": "2024-02-17T10:30:00",
  "updated_at": "2024-02-17T10:30:00"
}
```

### List Projects
```
GET /projects?skip=0&limit=100

Response (200): Array of project objects
```

### Get Project
```
GET /projects/{project_id}

Response (200): Project object
```

### Update Project
```
PUT /projects/{project_id}
Content-Type: application/json

{
  "name": "Updated project name"
}

Response (200): Updated project object
```

### Delete Project
```
DELETE /projects/{project_id}

Response (200):
{
  "status": "deleted",
  "project_id": 1
}
```

**Cascading Effects:**
- All expenses for this project are deleted
- All customer allocations for this project are deleted

---

## 3. Expense Management

### Create Expense
```
POST /expenses
Content-Type: application/json

{
  "project_id": 1,
  "expense_type": "Markedsføring og salg",
  "amount": 531378.00,
  "description": "Forsikring for prosjektet og skatter"
}

Response (201):
{
  "id": 1,
  "project_id": 1,
  "expense_type": "Markedsføring og salg",
  "amount": 531378.00,
  "description": "Forsikring for prosjektet og skatter",
  "created_at": "2024-02-17T10:30:00",
  "updated_at": "2024-02-17T10:30:00"
}
```

**Validation:**
- `project_id`: Must reference existing project
- `expense_type`: Required, 1-255 characters
- `amount`: Required, must be > 0
- `description`: Optional string

**Error Cases:**
- 404: Project not found
- 422: Validation error

### List Expenses
```
GET /expenses?skip=0&limit=100

Response (200): Array of expense objects
```

### Get Expense
```
GET /expenses/{expense_id}

Response (200): Expense object
```

### Get Project Expenses
```
GET /projects/{project_id}/expenses

Response (200):
[
  {
    "id": 1,
    "project_id": 1,
    "expense_type": "Markedsføring og salg",
    "amount": 531378.00,
    "description": "...",
    "created_at": "...",
    "updated_at": "..."
  },
  ...
]
```

### Update Expense
```
PUT /expenses/{expense_id}
Content-Type: application/json

{
  "amount": 550000.00,
  "description": "Updated description"
}

Response (200): Updated expense object
```

### Delete Expense
```
DELETE /expenses/{expense_id}

Response (200):
{
  "status": "deleted",
  "expense_id": 1
}
```

### Bulk Import from CSV
```
POST /import/expenses-csv
Content-Type: multipart/form-data

[File: dataset.csv]

Response (200):
{
  "status": "success",
  "imported": 100,
  "message": "Successfully imported 100 expenses"
}
```

**CSV Format Required:**
```
ID,ProjectID,ExpenseType,Amount,Description
1,1,Markedsføring og salg,531378,Forsikring for prosjektet og skatter
2,2,Personalkostnader,500110,Forsikring for prosjektet og skatter
...
```

**Notes:**
- The `ID` column is ignored (auto-generated)
- All other columns are required
- Partial imports: Returns list of errors and count of successful imports
- All-or-nothing: If projects don't exist, import fails with error details

---

## 4. Cost Sharing / Project Customer Allocation

### Add Customer to Project (with cost allocation)
```
POST /projects/{project_id}/customers
Content-Type: application/json

{
  "project_id": 1,
  "customer_id": 1,
  "cost_percentage": 50.0
}

Response (201):
{
  "id": 1,
  "project_id": 1,
  "customer_id": 1,
  "cost_percentage": 50.0,
  "created_at": "2024-02-17T10:30:00",
  "updated_at": "2024-02-17T10:30:00"
}
```

**Validation:**
- `cost_percentage`: Must be 0-100
- Customer must exist
- Project must exist
- Customer cannot be added twice to same project

**Error Cases:**
- 404: Customer or Project not found
- 400: Customer already added to this project

### List Project Customers
```
GET /projects/{project_id}/customers

Response (200):
[
  {
    "id": 1,
    "project_id": 1,
    "customer_id": 1,
    "cost_percentage": 50.0,
    "created_at": "2024-02-17T10:30:00",
    "updated_at": "2024-02-17T10:30:00"
  },
  {
    "id": 2,
    "project_id": 1,
    "customer_id": 2,
    "cost_percentage": 50.0,
    "created_at": "2024-02-17T10:30:00",
    "updated_at": "2024-02-17T10:30:00"
  }
]
```

### Get Specific Project Customer
```
GET /projects/{project_id}/customers/{customer_id}

Response (200): ProjectCustomer object
```

### Update Cost Percentage
```
PUT /projects/{project_id}/customers/{customer_id}
Content-Type: application/json

{
  "cost_percentage": 60.0
}

Response (200): Updated ProjectCustomer object
```

**Notes:**
- Update validation prevents percentages outside 0-100 range
- No automatic rebalancing (frontend responsibility)

### Remove Customer from Project
```
DELETE /projects/{project_id}/customers/{customer_id}

Response (200):
{
  "status": "removed",
  "project_id": 1,
  "customer_id": 1
}
```

### Validate Project Cost Allocation
```
GET /projects/{project_id}/validation

Response (200):
{
  "project_id": 1,
  "total_percentage": 100.0,
  "is_valid": true,
  "customer_count": 2,
  "allocation_details": [
    {
      "customer_id": 1,
      "cost_percentage": 50.0
    },
    {
      "customer_id": 2,
      "cost_percentage": 50.0
    }
  ]
}
```

**Purpose:** Check if allocations sum to 100% (valid for a complete project)

**Response Fields:**
- `is_valid`: True if sum = 100% (or 0 customers)
- `total_percentage`: Sum of all percentages
- `allocation_details`: List of each customer's allocation

---

## 5. Cost Overview & Analytics

### Get Customer Cost Overview
```
GET /customers/{customer_id}/cost-overview

Response (200):
{
  "customer_id": 1,
  "customer_name": "Kommune Oslo",
  "total_cost": 1250000.00,
  "projects": [
    {
      "project_id": 1,
      "project_name": "Infrastructure Upgrade 2024",
      "cost_percentage": 50.0,
      "total_expenses": 2000000.00,
      "allocated_cost": 1000000.00
    },
    {
      "project_id": 2,
      "project_name": "Park Renovation",
      "cost_percentage": 25.0,
      "total_expenses": 1000000.00,
      "allocated_cost": 250000.00
    }
  ]
}
```

**Features:**
- Shows all projects customer is involved in
- Calculates allocated cost based on percentage
- Total cost = sum of all allocated costs
- Breakdown per project included

### Get Project Cost Overview
```
GET /projects/{project_id}/cost-overview

Response (200):
{
  "project_id": 1,
  "project_name": "Infrastructure Upgrade 2024",
  "total_expenses": 2000000.00,
  "customers": [
    {
      "customer_id": 1,
      "customer_name": "Kommune Oslo",
      "cost_percentage": 50.0,
      "allocated_cost": 1000000.00
    },
    {
      "customer_id": 2,
      "customer_name": "Kommune Bergen",
      "cost_percentage": 50.0,
      "allocated_cost": 1000000.00
    }
  ]
}
```

**Features:**
- Shows all customers involved in project
- Displays cost distribution
- Validates 100% allocation (if required)
- Useful for project cost breakdown reports

---

## Testing Strategy for Cost Sharing Feature

### Unit Tests

**Test: Percentage Validation**
```python
def test_cost_percentage_validation():
    # Valid: 0-100
    assert validate_percentage(0)
    assert validate_percentage(50)
    assert validate_percentage(100)
    
    # Invalid: outside range
    with pytest.raises(ValidationError):
        validate_percentage(-1)
    with pytest.raises(ValidationError):
        validate_percentage(101)
```

**Test: Cost Calculation**
```python
def test_allocated_cost_calculation():
    project_total = 1000
    percentage = 50
    expected = 500
    
    allocated = project_total * (percentage / 100)
    assert allocated == expected
```

### Integration Tests

**Test: Add Multiple Customers to Project**
```python
def test_add_multiple_customers_to_project():
    project = create_project(db, "Test Project")
    customer1 = create_customer(db, "Customer 1")
    customer2 = create_customer(db, "Customer 2")
    
    # Add both customers
    add_customer_to_project(db, project.id, customer1.id, 50)
    add_customer_to_project(db, project.id, customer2.id, 50)
    
    # Validate allocation
    allocation = validate_project_cost_allocation(db, project.id)
    assert allocation['total_percentage'] == 100
    assert allocation['is_valid'] == True
```

**Test: Cannot Add Same Customer Twice**
```python
def test_cannot_add_customer_twice():
    project = create_project(db, "Test Project")
    customer = create_customer(db, "Customer 1")
    
    add_customer_to_project(db, project.id, customer.id, 50)
    
    with pytest.raises(HTTPException) as exc:
        add_customer_to_project(db, project.id, customer.id, 50)
    assert exc.value.status_code == 400
```

**Test: Cost Allocation Validation**
```python
def test_cost_allocation_validation():
    project = create_project(db, "Test Project")
    customer1 = create_customer(db, "Customer 1")
    customer2 = create_customer(db, "Customer 2")
    
    # Add first customer with 60%
    add_customer_to_project(db, project.id, customer1.id, 60)
    
    # Try to add second customer with 50% (would exceed 100%)
    # Frontend should prevent this, but API should validate
    with pytest.raises(ValidationError):
        add_customer_to_project(db, project.id, customer2.id, 50)
```

**Test: Cost Calculation with Expenses**
```python
def test_cost_overview_calculation():
    project = create_project(db, "Test Project")
    customer1 = create_customer(db, "Customer 1")
    customer2 = create_customer(db, "Customer 2")
    
    # Setup allocations
    add_customer_to_project(db, project.id, customer1.id, 60)
    add_customer_to_project(db, project.id, customer2.id, 40)
    
    # Add expenses
    create_expense(db, project.id, "Type 1", 1000)
    
    # Verify calculations
    overview1 = get_customer_cost_overview(db, customer1.id)
    overview2 = get_customer_cost_overview(db, customer2.id)
    
    assert overview1.total_cost == 600  # 1000 * 0.6
    assert overview2.total_cost == 400  # 1000 * 0.4
    assert overview1.total_cost + overview2.total_cost == 1000  # Sum check
```

**Test: Update Customer Percentage**
```python
def test_update_customer_percentage():
    project = create_project(db, "Test Project")
    customer1 = create_customer(db, "Customer 1")
    
    # Add with 50%
    add_customer_to_project(db, project.id, customer1.id, 50)
    
    # Update to 75%
    update_project_customer(db, project.id, customer1.id, 75)
    
    pc = get_project_customer(db, project.id, customer1.id)
    assert pc.cost_percentage == 75
```

### End-to-End Tests

**Test: Complete Workflow**
```python
def test_complete_cost_tracking_workflow():
    # 1. Create customers
    kommune_oslo = create_customer(db, "Kommune Oslo")
    kommune_bergen = create_customer(db, "Kommune Bergen")
    
    # 2. Create project
    project = create_project(db, "Infrastructure 2024")
    
    # 3. Allocate customers
    add_customer_to_project(db, project.id, kommune_oslo.id, 50)
    add_customer_to_project(db, project.id, kommune_bergen.id, 50)
    
    # 4. Validate allocation
    allocation = validate_project_cost_allocation(db, project.id)
    assert allocation['is_valid'] == True
    
    # 5. Add expenses
    create_expense(db, project.id, "Markedsføring", 2000)
    create_expense(db, project.id, "Personalkostnader", 3000)
    
    # 6. Verify cost overviews
    oslo_overview = get_customer_cost_overview(db, kommune_oslo.id)
    bergen_overview = get_customer_cost_overview(db, kommune_bergen.id)
    
    assert oslo_overview.total_cost == 2500  # 5000 * 0.5
    assert bergen_overview.total_cost == 2500  # 5000 * 0.5
```

### Regression Tests

**Test: Existing Data Not Affected**
```python
def test_no_regression_on_existing_data():
    # Setup: Create project with expenses
    project = create_project(db, "Old Project")
    create_expense(db, project.id, "Old Expense", 1000)
    
    # Action: Add cost sharing feature
    customer = create_customer(db, "New Customer")
    add_customer_to_project(db, project.id, customer.id, 50)
    
    # Verify: Old data still accessible and correct
    expenses = get_expenses_by_project(db, project.id)
    assert len(expenses) == 1
    assert expenses[0].amount == 1000
```

**Test: Delete Operations Cascade Properly**
```python
def test_cascading_deletes():
    project = create_project(db, "Test Project")
    customer = create_customer(db, "Test Customer")
    
    add_customer_to_project(db, project.id, customer.id, 50)
    create_expense(db, project.id, "Expense", 1000)
    
    # Delete project
    delete_project(db, project.id)
    
    # Verify all related data is deleted
    assert get_project(db, project.id) is None
    assert get_expenses_by_project(db, project.id) == []
    assert get_project_customers(db, project.id) == []
    
    # Customer should still exist (not cascade up)
    assert get_customer(db, customer.id) is not None
```

---

## Frontend Implementation Guide

### 1. API Client Setup (JavaScript/TypeScript)

```typescript
// api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = {
  // Customers
  getCustomers: () => fetch(`${API_BASE_URL}/customers`).then(r => r.json()),
  getCustomer: (id: number) => fetch(`${API_BASE_URL}/customers/${id}`).then(r => r.json()),
  createCustomer: (data) => fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateCustomer: (id: number, data) => fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteCustomer: (id: number) => fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'DELETE'
  }).then(r => r.json()),

  // Projects
  getProjects: () => fetch(`${API_BASE_URL}/projects`).then(r => r.json()),
  getProject: (id: number) => fetch(`${API_BASE_URL}/projects/${id}`).then(r => r.json()),
  createProject: (data) => fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // Expenses
  getExpenses: () => fetch(`${API_BASE_URL}/expenses`).then(r => r.json()),
  getProjectExpenses: (projectId: number) => fetch(`${API_BASE_URL}/projects/${projectId}/expenses`).then(r => r.json()),
  createExpense: (data) => fetch(`${API_BASE_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // Cost Sharing
  addCustomerToProject: (projectId: number, data) => fetch(`${API_BASE_URL}/projects/${projectId}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  getProjectCustomers: (projectId: number) => fetch(`${API_BASE_URL}/projects/${projectId}/customers`).then(r => r.json()),
  updateProjectCustomer: (projectId: number, customerId: number, data) => fetch(`${API_BASE_URL}/projects/${projectId}/customers/${customerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  validateProjectAllocation: (projectId: number) => fetch(`${API_BASE_URL}/projects/${projectId}/validation`).then(r => r.json()),

  // Cost Overview
  getCustomerCostOverview: (customerId: number) => fetch(`${API_BASE_URL}/customers/${customerId}/cost-overview`).then(r => r.json()),
  getProjectCostOverview: (projectId: number) => fetch(`${API_BASE_URL}/projects/${projectId}/cost-overview`).then(r => r.json()),

  // Import
  importExpensesCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE_URL}/import/expenses-csv`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
  }
};
```

### 2. Customer Management Component

```typescript
// components/CustomerForm.tsx
import { useState } from 'react';
import { apiClient } from '@/api/client';

export function CustomerForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.createCustomer({ name, description });
      setName('');
      setDescription('');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Customer Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Customer'}
      </button>
    </form>
  );
}
```

### 3. Cost Sharing Component

```typescript
// components/ProjectCostSharing.tsx
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

export function ProjectCostSharing({ projectId }: { projectId: number }) {
  const [customers, setCustomers] = useState([]);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [customersRes, allocationRes] = await Promise.all([
        apiClient.getProjectCustomers(projectId),
        apiClient.validateProjectAllocation(projectId)
      ]);
      setCustomers(customersRes);
      setAllocation(allocationRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePercentage = async (customerId: number, newPercentage: number) => {
    // Frontend validation: Prevent exceeding 100%
    const otherTotal = customers
      .filter(c => c.customer_id !== customerId)
      .reduce((sum, c) => sum + c.cost_percentage, 0);

    if (newPercentage + otherTotal > 100) {
      alert('Total allocation cannot exceed 100%');
      return;
    }

    try {
      await apiClient.updateProjectCustomer(projectId, customerId, {
        cost_percentage: newPercentage
      });
      await loadData();
    } catch (err) {
      alert('Error updating percentage');
    }
  };

  if (loading) return <div>Loading...</div>;

  const isValid = allocation?.is_valid;
  const totalPercentage = allocation?.total_percentage || 0;

  return (
    <div>
      <h3>Cost Allocation: {totalPercentage.toFixed(1)}%</h3>
      {!isValid && <div className="warning">Allocation must sum to 100%</div>}

      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Percentage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td>{c.customer_id}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={c.cost_percentage}
                  onChange={(e) => handleUpdatePercentage(c.customer_id, parseFloat(e.target.value))}
                />
              </td>
              <td>
                <button onClick={() => apiClient.removeCustomerFromProject(projectId, c.customer_id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 4. Cost Overview Component

```typescript
// components/CustomerCostOverview.tsx
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

export function CustomerCostOverview({ customerId }: { customerId: number }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await apiClient.getCustomerCostOverview(customerId);
        setOverview(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, [customerId]);

  if (loading) return <div>Loading...</div>;
  if (!overview) return <div>No data</div>;

  return (
    <div>
      <h2>{overview.customer_name}</h2>
      <h3>Total Cost: €{overview.total_cost.toFixed(2)}</h3>

      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Percentage</th>
            <th>Total Expenses</th>
            <th>Allocated Cost</th>
          </tr>
        </thead>
        <tbody>
          {overview.projects.map(p => (
            <tr key={p.project_id}>
              <td>{p.project_name}</td>
              <td>{p.cost_percentage}%</td>
              <td>€{p.total_expenses.toFixed(2)}</td>
              <td>€{p.allocated_cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. CSV Import Component

```typescript
// components/ImportExpenses.tsx
import { useRef, useState } from 'react';
import { apiClient } from '@/api/client';

export function ImportExpenses({ onSuccess }: { onSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await apiClient.importExpensesCSV(file);
      setResult(result);
      if (result.status === 'success') {
        onSuccess();
      }
    } catch (err) {
      setResult({ status: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        disabled={loading}
      />
      {result && (
        <div>
          <p>{result.message}</p>
          {result.errors && (
            <ul>
              {result.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Deployment & Configuration

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@db:5432/casedb
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://backend:8000
```

### Docker Compose

Services communicate via container network:
- Frontend calls `http://backend:8000` (internal Docker network)
- Frontend accessible externally on `http://localhost:3000`
- Backend accessible externally on `http://localhost:8000`

---

## Summary

This API provides a complete solution for managing project costs with flexible customer allocation. Key strengths:

1. **Data Integrity**: Database constraints + application validation
2. **Cost Accuracy**: Precise calculation formulas with audit trails
3. **Scalability**: PostgreSQL with proper indexing
4. **Flexibility**: Support for partial cost sharing (not just 50/50 splits)
5. **Testing Ready**: Clear separation of concerns for unit/integration tests
