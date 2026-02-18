'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, DollarSign, Plus, ReceiptText, Trash2, Users } from 'lucide-react';
import { getCustomers, getProjects } from '@/lib/api-client';
import { LinkCustomerModal } from '@/components/dashboard/cost-sharing/link-customer-modal';

interface Project {
  id: number;
  name: string;
  description: string;
  total_cost: number;
  customers?: number;
}

interface Customer {
  id: number;
  name: string;
}

interface ProjectCustomer {
  id: number;
  customer_id: number;
  project_id: number;
  cost_share: number;
  cost_percentage?: number;
  customer_name?: string;
}

interface ProjectExpense {
  id: number;
  expense_type: string;
  amount: number;
  description?: string;
}

interface ProjectDetailViewProps {
  projectId: number;
}

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projectCustomers, setProjectCustomers] = useState<ProjectCustomer[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [expenseForm, setExpenseForm] = useState({
    expense_type: '',
    amount: '',
    description: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [projectsList, customersList, projectCustomersRes, expensesRes] = await Promise.all([
        getProjects(),
        getCustomers(),
        fetch(`/api/projects/${projectId}/customers`),
        fetch(`/api/projects/${projectId}/expenses`),
      ]);

      const projects = Array.isArray(projectsList) ? projectsList : projectsList.data || [];
      const customerList = Array.isArray(customersList) ? customersList : customersList.data || [];
      const selectedProject = projects.find((p: Project) => p.id === projectId) || null;

      setProject(selectedProject);
      setCustomers(customerList);

      if (projectCustomersRes.ok) {
        const data = await projectCustomersRes.json();
        setProjectCustomers(data);
      }

      if (expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('[ProjectDetailPage] Error loading project detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return;
    }
    fetchData();
  }, [projectId]);

  const availableCustomers = useMemo(
    () => customers.filter((c) => !projectCustomers.some((pc) => pc.customer_id === c.id)),
    [customers, projectCustomers]
  );

  const totalAllocatedPercentage = useMemo(
    () =>
      projectCustomers.reduce(
        (sum, projectCustomer) => sum + (Number(projectCustomer.cost_percentage) || 0),
        0
      ),
    [projectCustomers]
  );

  const canAddMoreCustomers = availableCustomers.length > 0 && totalAllocatedPercentage < 100;

  const handleRemoveCustomer = async (customerId: number) => {
    if (!confirm('Er du sikker på at du vil fjerne denne kunden fra prosjektet?')) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProjectCustomers((prev) => prev.filter((pc) => pc.customer_id !== customerId));
      }
    } catch (error) {
      console.error('[ProjectDetailPage] Error removing customer:', error);
    }
  };

  const formatMillion = (value: number | undefined) => {
    const amount = Number(value ?? 0);
    if (!isFinite(amount)) return '0.0';
    return (amount / 1000000).toFixed(2);
  };

  const resetExpenseForm = () => {
    setExpenseForm({ expense_type: '', amount: '', description: '' });
    setExpenseError('');
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSavingExpense(true);
      setExpenseError('');

      const amount = Number(expenseForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setExpenseError('Beløp må være større enn 0.');
        return;
      }

      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_type: expenseForm.expense_type.trim(),
          amount,
          description: expenseForm.description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExpenseError(data?.error || 'Kunne ikke opprette utgiftspost.');
        return;
      }

      resetExpenseForm();
      setShowAddExpenseModal(false);
      await fetchData();
    } catch (error) {
      console.error('[ProjectDetailPage] Error creating expense:', error);
      setExpenseError('Kunne ikke opprette utgiftspost.');
    } finally {
      setIsSavingExpense(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-foreground">Laster inn prosjektdetaljer...</p>
      </div>
    );
  }

  if (!Number.isFinite(projectId) || projectId <= 0) {
    return (
      <Card className="bg-card border border-border p-8 text-center">
        <p className="text-muted-foreground">Ugyldig prosjekt-ID</p>
        <Button asChild className="mt-4">
          <Link href="/projects">Tilbake til prosjekter</Link>
        </Button>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="bg-card border border-border p-8 text-center">
        <p className="text-muted-foreground">Prosjekt ikke funnet</p>
        <Button asChild className="mt-4">
          <Link href="/projects">Tilbake til prosjekter</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[70vh]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 -ml-3">
            <Link href="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake til prosjekter
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description || 'Ingen beskrivelse'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border border-border p-5">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total kostnad</p>
              <p className="text-2xl font-bold text-foreground">{formatMillion(project.total_cost)}M</p>
            </div>
          </div>
        </Card>
        <Card className="bg-card border border-border p-5">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Involverte kunder</p>
              <p className="text-2xl font-bold text-foreground">{projectCustomers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:flex-1 min-h-0">
        <Card className="bg-card border border-border flex flex-col min-h-0">
          <div className="p-6 border-b border-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Utgiftsposter ({expenses.length})
              </h2>
            </div>
            <Button
              onClick={() => setShowAddExpenseModal(true)}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Legg til utgift
            </Button>
          </div>

          <div className="divide-y divide-border overflow-y-auto flex-1 min-h-0">
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <div key={expense.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{expense.expense_type}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {expense.description || 'Ingen beskrivelse'}
                      </p>
                    </div>
                    <p className="text-base font-semibold text-primary whitespace-nowrap">
                      {formatMillion(expense.amount)}M
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">Ingen utgiftsposter funnet</div>
            )}
          </div>
        </Card>

        <Card className="bg-card border border-border flex flex-col min-h-0">
          <div className="p-6 border-b border-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Kostnadsdeling ({projectCustomers.length})
              </h2>
            </div>

            {canAddMoreCustomers && (
              <Button onClick={() => setShowLinkModal(true)} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Legg til kunde
              </Button>
            )}
          </div>

          {!canAddMoreCustomers && availableCustomers.length > 0 && (
            <div className="px-6 py-3 border-b border-border text-sm text-muted-foreground">
              Total kostnadsdeling er {totalAllocatedPercentage.toFixed(1)}% og kan ikke overstige 100%.
            </div>
          )}

          <div className="divide-y divide-border overflow-y-auto flex-1 min-h-0">
            {projectCustomers.length > 0 ? (
              projectCustomers.map((projectCustomer) => (
                <div key={projectCustomer.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {projectCustomer.customer_name || `Kunde ${projectCustomer.customer_id}`}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatMillion(projectCustomer.cost_share)}M
                        {typeof projectCustomer.cost_percentage === 'number'
                          ? ` (${projectCustomer.cost_percentage.toFixed(1)}%)`
                          : ''}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomer(projectCustomer.customer_id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">Ingen kunder tilknyttet prosjektet</div>
            )}
          </div>
        </Card>
      </div>

      {showLinkModal && (
        <LinkCustomerModal
          project={{ id: project.id, name: project.name, total_cost: project.total_cost }}
          availableCustomers={availableCustomers}
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => {
            setShowLinkModal(false);
            fetchData();
          }}
        />
      )}

      <Dialog open={showAddExpenseModal} onOpenChange={setShowAddExpenseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legg til utgiftspost</DialogTitle>
            <DialogDescription>
              Registrer en ny utgift for prosjektet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Utgiftstype</label>
              <Input
                value={expenseForm.expense_type}
                onChange={(e) =>
                  setExpenseForm((prev) => ({ ...prev, expense_type: e.target.value }))
                }
                placeholder="Eks: Kontorkostnader"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Beløp (NOK)</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="Eks: 120000"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Beskrivelse</label>
              <Textarea
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Valgfri beskrivelse"
              />
            </div>

            {expenseError && <p className="text-sm text-destructive">{expenseError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddExpenseModal(false);
                  resetExpenseForm();
                }}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSavingExpense}>
                {isSavingExpense ? 'Lagrer...' : 'Lagre utgift'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
