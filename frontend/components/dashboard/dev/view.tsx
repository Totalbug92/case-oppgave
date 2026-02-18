'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiTestCase {
  id: string;
  title: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  confirmText?: string;
  csvImport?: boolean;
}

interface LastResult {
  title: string;
  method: HttpMethod;
  url: string;
  status: number;
  statusText: string;
  ok: boolean;
  durationMs: number;
  requestBody?: Record<string, unknown> | null;
  responseBody: unknown;
  timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TESTS: ApiTestCase[] = [
  {
    id: 'admin-reset-db',
    title: 'Admin: Reset database',
    method: 'POST',
    path: '/admin/reset-db',
    confirmText: 'Dette nullstiller og reseeder databasen. Er du sikker?',
  },
  { id: 'root', title: 'Health: Root', method: 'GET', path: '/' },
  { id: 'health', title: 'Health: /health', method: 'GET', path: '/health' },

  { id: 'customers-list', title: 'Customers: List', method: 'GET', path: '/customers' },
  { id: 'customers-get-1', title: 'Customers: Get #1', method: 'GET', path: '/customers/1' },
  {
    id: 'customers-create',
    title: 'Customers: Create',
    method: 'POST',
    path: '/customers',
    body: { name: 'Dev kommune', description: 'Opprettet fra /dev' },
  },
  {
    id: 'customers-update-1',
    title: 'Customers: Update #1',
    method: 'PUT',
    path: '/customers/1',
    body: { description: 'Oppdatert fra /dev route' },
  },
  {
    id: 'customers-delete-99999',
    title: 'Customers: Delete #99999',
    method: 'DELETE',
    path: '/customers/99999',
    confirmText: 'Prøver å slette customer #99999. Fortsette?',
  },

  { id: 'projects-list', title: 'Projects: List', method: 'GET', path: '/projects' },
  { id: 'projects-get-1', title: 'Projects: Get #1', method: 'GET', path: '/projects/1' },
  {
    id: 'projects-create',
    title: 'Projects: Create',
    method: 'POST',
    path: '/projects',
    body: { name: 'Dev prosjekt', description: 'Opprettet fra /dev' },
  },
  {
    id: 'projects-update-1',
    title: 'Projects: Update #1',
    method: 'PUT',
    path: '/projects/1',
    body: { description: 'Oppdatert fra /dev route' },
  },
  {
    id: 'projects-delete-99999',
    title: 'Projects: Delete #99999',
    method: 'DELETE',
    path: '/projects/99999',
    confirmText: 'Prøver å slette project #99999. Fortsette?',
  },

  { id: 'expenses-list', title: 'Expenses: List', method: 'GET', path: '/expenses' },
  { id: 'expenses-get-1', title: 'Expenses: Get #1', method: 'GET', path: '/expenses/1' },
  { id: 'project-1-expenses', title: 'Expenses: Project #1', method: 'GET', path: '/projects/1/expenses' },
  {
    id: 'expenses-create',
    title: 'Expenses: Create',
    method: 'POST',
    path: '/expenses',
    body: {
      project_id: 1,
      expense_type: 'Tekniske kostnader',
      amount: 12345,
      description: 'Opprettet fra /dev route',
    },
  },
  {
    id: 'expenses-update-1',
    title: 'Expenses: Update #1',
    method: 'PUT',
    path: '/expenses/1',
    body: { amount: 11111, description: 'Oppdatert fra /dev route' },
  },
  {
    id: 'expenses-delete-99999',
    title: 'Expenses: Delete #99999',
    method: 'DELETE',
    path: '/expenses/99999',
    confirmText: 'Prøver å slette expense #99999. Fortsette?',
  },
  {
    id: 'expenses-bulk',
    title: 'Expenses: Bulk create',
    method: 'POST',
    path: '/expenses/bulk',
    body: {
      expenses: [
        {
          project_id: 1,
          expense_type: 'Kontorkostnader',
          amount: 1000,
          description: 'Bulk test 1',
        },
        {
          project_id: 1,
          expense_type: 'Reisekostnader',
          amount: 2000,
          description: 'Bulk test 2',
        },
      ],
    },
  },

  {
    id: 'pc-add',
    title: 'Cost sharing: Add customer #1 to project #1',
    method: 'POST',
    path: '/projects/1/customers',
    body: { project_id: 1, customer_id: 1, cost_percentage: 10 },
  },
  { id: 'pc-list', title: 'Cost sharing: List project #1 customers', method: 'GET', path: '/projects/1/customers' },
  { id: 'pc-get', title: 'Cost sharing: Get project #1 customer #1', method: 'GET', path: '/projects/1/customers/1' },
  {
    id: 'pc-update',
    title: 'Cost sharing: Update project #1 customer #1',
    method: 'PUT',
    path: '/projects/1/customers/1',
    body: { cost_percentage: 25 },
  },
  {
    id: 'pc-delete-99999',
    title: 'Cost sharing: Remove customer #99999 from project #1',
    method: 'DELETE',
    path: '/projects/1/customers/99999',
    confirmText: 'Prøver å fjerne ukjent kunde fra prosjekt. Fortsette?',
  },
  { id: 'pc-validation', title: 'Cost sharing: Validate project #1', method: 'GET', path: '/projects/1/validation' },

  { id: 'overview-customer-1', title: 'Cost overview: Customer #1', method: 'GET', path: '/customers/1/cost-overview' },
  { id: 'overview-project-1', title: 'Cost overview: Project #1', method: 'GET', path: '/projects/1/cost-overview' },

  { id: 'full-project-1', title: 'Export: Project #1 full data', method: 'GET', path: '/projects/1/full' },
  { id: 'all-data', title: 'Export: All data', method: 'GET', path: '/all-data' },

  {
    id: 'import-expenses-csv',
    title: 'Import: /import/expenses-csv (sample)',
    method: 'POST',
    path: '/import/expenses-csv',
    csvImport: true,
  },
];

export function DevApiView() {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  const grouped = useMemo(() => {
    const admin = TESTS.filter((test) => test.id === 'admin-reset-db');
    const rest = TESTS.filter((test) => test.id !== 'admin-reset-db');
    return { admin, rest };
  }, []);

  const runTest = async (test: ApiTestCase) => {
    if (test.confirmText && !confirm(test.confirmText)) {
      return;
    }

    const url = `${API_BASE_URL}${test.path}`;
    const startedAt = performance.now();
    setRunningId(test.id);

    try {
      let response: Response;

      if (test.csvImport) {
        const csvContent = [
          'ID,ProjectID,ExpenseType,Amount,Description',
          '1,1,Tekniske kostnader,12345,Importert via /dev',
        ].join('\n');

        const formData = new FormData();
        formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'dev-import.csv');

        response = await fetch(url, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(url, {
          method: test.method,
          headers: test.body ? { 'Content-Type': 'application/json' } : undefined,
          body: test.body ? JSON.stringify(test.body) : undefined,
        });
      }

      const responseText = await response.text();
      let parsedBody: unknown = responseText;

      if (responseText) {
        try {
          parsedBody = JSON.parse(responseText);
        } catch {
          parsedBody = responseText;
        }
      }

      const endedAt = performance.now();
      setLastResult({
        title: test.title,
        method: test.method,
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        durationMs: Math.round(endedAt - startedAt),
        requestBody: test.body ?? null,
        responseBody: parsedBody,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      const endedAt = performance.now();
      setLastResult({
        title: test.title,
        method: test.method,
        url,
        status: 0,
        statusText: 'NETWORK_ERROR',
        ok: false,
        durationMs: Math.round(endedAt - startedAt),
        requestBody: test.body ?? null,
        responseBody: {
          error: error?.message || 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dev API Tester</h1>
        <p className="text-muted-foreground mt-1">Kjør backend-endepunkter direkte og se siste respons.</p>
        <p className="text-xs text-muted-foreground mt-2">Base URL: {API_BASE_URL}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-border p-3 space-y-2 max-h-[75vh] overflow-y-auto">
          <div>
            <h2 className="text-lg font-semibold text-foreground">API Kall</h2>
            <p className="text-sm text-muted-foreground">Klikk for å kjøre en test-request.</p>
          </div>

          {grouped.admin.map((test) => (
            <div
              key={test.id}
              className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1"
              title={test.title}
            >
              <span className="w-14 shrink-0 text-[11px] font-semibold uppercase text-destructive">
                {test.method}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-foreground">{test.path}</span>
              <Button
                size="sm"
                className="h-7 px-2"
                onClick={() => runTest(test)}
                disabled={runningId !== null}
              >
                {runningId === test.id ? 'Kjører...' : 'Kjør'}
              </Button>
            </div>
          ))}

          {grouped.rest.map((test) => (
            <div
              key={test.id}
              className="flex items-center gap-2 rounded-md border border-border bg-secondary/20 px-2 py-1"
              title={test.title}
            >
              <span className="w-14 shrink-0 text-[11px] font-semibold uppercase text-primary">
                {test.method}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-foreground">{test.path}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => runTest(test)}
                disabled={runningId !== null}
              >
                {runningId === test.id ? 'Kjører...' : 'Kjør'}
              </Button>
            </div>
          ))}
        </Card>

        <Card className="bg-card border border-border p-4 min-h-[75vh]">
          <h2 className="text-lg font-semibold text-foreground">Siste resultat</h2>
          {!lastResult ? (
            <p className="text-sm text-muted-foreground mt-2">Ingen kall kjørt ennå.</p>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Kall</div>
                <div className="text-foreground font-medium">{lastResult.title}</div>
                <div className="text-muted-foreground">Request</div>
                <div className="text-foreground font-medium">{lastResult.method} {lastResult.url}</div>
                <div className="text-muted-foreground">Status</div>
                <div className={lastResult.ok ? 'text-green-400 font-medium' : 'text-destructive font-medium'}>
                  {lastResult.status} {lastResult.statusText}
                </div>
                <div className="text-muted-foreground">Varighet</div>
                <div className="text-foreground font-medium">{lastResult.durationMs}ms</div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Request body</p>
                <pre className="text-xs bg-secondary p-3 rounded-md border border-border overflow-auto max-h-32 text-foreground">
                  {JSON.stringify(lastResult.requestBody, null, 2)}
                </pre>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Response body</p>
                <pre className="text-xs bg-secondary p-3 rounded-md border border-border overflow-auto max-h-[40vh] text-foreground">
                  {JSON.stringify(lastResult.responseBody, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
