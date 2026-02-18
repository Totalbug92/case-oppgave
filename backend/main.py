from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
import csv
import io
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

# Import our modules
from models import Base
from database import engine, get_db
from routes import router
from schemas import ExpenseCreate
import crud
from seed import init_db

load_dotenv()

# Initialize database and seed with data
init_db()

app = FastAPI(
    title="Case API",
    description="API for managing project costs and customer allocations",
    version="1.0.0"
)

# CORS middleware - allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)


@app.get("/", tags=["Health"])
def read_root():
    return {
        "message": "Welcome to Case API",
        "docs_url": "/docs",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


@app.post("/import/expenses-csv", tags=["Import"])
async def import_expenses_from_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import expenses from a CSV file.
    
    CSV format should include columns: ID, ProjectID, ExpenseType, Amount, Description
    
    The ID column is ignored (auto-generated), and the rest are mapped to expense fields.
    """
    if not file.filename.endswith('.csv'):
        return {"error": "File must be a CSV"}
    
    contents = await file.read()
    stream = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(stream)
    
    expenses = []
    errors = []
    
    for row_num, row in enumerate(reader, start=2):  # Start at 2 because header is row 1
        try:
            expense = ExpenseCreate(
                project_id=int(row['ProjectID']),
                expense_type=row['ExpenseType'],
                amount=float(row['Amount']),
                description=row.get('Description', '')
            )
            expenses.append(expense)
        except (ValueError, KeyError) as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    if errors:
        return {
            "status": "partial_import",
            "imported": len(expenses),
            "errors": errors
        }
    
    try:
        created = crud.bulk_create_expenses(db, expenses)
        return {
            "status": "success",
            "imported": len(created),
            "message": f"Successfully imported {len(created)} expenses"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
