from fastapi import HTTPException
from sqlalchemy import text as sqlalchemy_text

import crud
from models import Customer, Project
from schemas import ProjectCustomerCreate, ProjectCustomerUpdate


def _seed_customer_and_project(db_session):
    customer1 = Customer(name="Customer A", description="A")
    customer2 = Customer(name="Customer B", description="B")
    customer3 = Customer(name="Customer C", description="C")
    project = Project(name="Project 1", description="Demo")

    db_session.add_all([customer1, customer2, customer3, project])
    db_session.commit()
    db_session.refresh(customer1)
    db_session.refresh(customer2)
    db_session.refresh(customer3)
    db_session.refresh(project)

    return customer1, customer2, customer3, project


def _patch_advisory_lock_for_sqlite(monkeypatch):
    # Replace PostgreSQL advisory lock SQL with a SQLite-compatible no-op query.
    monkeypatch.setattr(crud, "text", lambda _: sqlalchemy_text("SELECT 1"))


def test_add_customer_to_project_accepts_total_up_to_100(db_session, monkeypatch):
    _patch_advisory_lock_for_sqlite(monkeypatch)
    customer1, customer2, _, project = _seed_customer_and_project(db_session)

    crud.add_customer_to_project(
        db_session,
        ProjectCustomerCreate(
            project_id=project.id,
            customer_id=customer1.id,
            cost_percentage=60,
        ),
    )

    result = crud.add_customer_to_project(
        db_session,
        ProjectCustomerCreate(
            project_id=project.id,
            customer_id=customer2.id,
            cost_percentage=40,
        ),
    )

    assert result.project_id == project.id
    assert result.customer_id == customer2.id
    validation = crud.validate_project_cost_allocation(db_session, project.id)
    assert validation["total_percentage"] == 100
    assert validation["is_valid"] is True


def test_add_customer_to_project_rejects_total_over_100(db_session, monkeypatch):
    _patch_advisory_lock_for_sqlite(monkeypatch)
    customer1, customer2, _, project = _seed_customer_and_project(db_session)

    crud.add_customer_to_project(
        db_session,
        ProjectCustomerCreate(
            project_id=project.id,
            customer_id=customer1.id,
            cost_percentage=80,
        ),
    )

    try:
        crud.add_customer_to_project(
            db_session,
            ProjectCustomerCreate(
                project_id=project.id,
                customer_id=customer2.id,
                cost_percentage=30,
            ),
        )
        assert False, "Expected HTTPException when total allocation exceeds 100%"
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "exceeds 100%" in exc.detail


def test_update_project_customer_rejects_total_over_100(db_session, monkeypatch):
    _patch_advisory_lock_for_sqlite(monkeypatch)
    customer1, customer2, _, project = _seed_customer_and_project(db_session)

    crud.add_customer_to_project(
        db_session,
        ProjectCustomerCreate(
            project_id=project.id,
            customer_id=customer1.id,
            cost_percentage=50,
        ),
    )
    crud.add_customer_to_project(
        db_session,
        ProjectCustomerCreate(
            project_id=project.id,
            customer_id=customer2.id,
            cost_percentage=50,
        ),
    )

    try:
        crud.update_project_customer(
            db_session,
            project_id=project.id,
            customer_id=customer1.id,
            project_customer=ProjectCustomerUpdate(cost_percentage=60),
        )
        assert False, "Expected HTTPException when updated allocation exceeds 100%"
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "exceeds 100%" in exc.detail


def test_update_project_customer_allows_valid_rebalance(db_session, monkeypatch):
    _patch_advisory_lock_for_sqlite(monkeypatch)
    customer1, customer2, _, project = _seed_customer_and_project(db_session)

    crud.add_customer_to_project(
        db_session,
        ProjectCustomerCreate(
            project_id=project.id,
            customer_id=customer1.id,
            cost_percentage=60,
        ),
    )
    crud.add_customer_to_project(
        db_session,
        ProjectCustomerCreate(
            project_id=project.id,
            customer_id=customer2.id,
            cost_percentage=20,
        ),
    )

    updated = crud.update_project_customer(
        db_session,
        project_id=project.id,
        customer_id=customer2.id,
        project_customer=ProjectCustomerUpdate(cost_percentage=40),
    )

    assert updated is not None
    assert updated.cost_percentage == 40
    validation = crud.validate_project_cost_allocation(db_session, project.id)
    assert validation["total_percentage"] == 100
    assert validation["is_valid"] is True


def test_validate_project_cost_allocation_marks_incomplete_distribution(db_session, monkeypatch):
    _patch_advisory_lock_for_sqlite(monkeypatch)
    customer1, _, _, project = _seed_customer_and_project(db_session)

    crud.add_customer_to_project(
        db_session,
        ProjectCustomerCreate(
            project_id=project.id,
            customer_id=customer1.id,
            cost_percentage=75,
        ),
    )

    validation = crud.validate_project_cost_allocation(db_session, project.id)
    assert validation["total_percentage"] == 75
    assert validation["is_valid"] is False
    assert validation["customer_count"] == 1
