'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  total_cost: number;
}

interface Customer {
  id: number;
  name: string;
}

interface LinkCustomerModalProps {
  project: Project;
  availableCustomers: Customer[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkCustomerModal({
  project,
  availableCustomers,
  isOpen,
  onClose,
  onSuccess,
}: LinkCustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    availableCustomers[0]?.id.toString() || ''
  );
  const [costPercentage, setCostPercentage] = useState('0');
  const [costAmount, setCostAmount] = useState('0');
  const [mode, setMode] = useState<'percent' | 'amount'>('percent');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Determine percentage to send
      let percent = parseFloat(costPercentage) || 0;
      if (mode === 'amount') {
        const amt = parseFloat(costAmount) || 0;
        percent = project.total_cost ? (amt / project.total_cost) * 100 : 0;
      }

      const res = await fetch(`/api/projects/${project.id}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          customer_id: parseInt(selectedCustomerId, 10),
          cost_percentage: Math.min(100, Math.max(0, percent)),
        }),
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('[LinkCustomer] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCustomer = availableCustomers.find(
    (c) => c.id.toString() === selectedCustomerId
  );
  const percentage = parseFloat(costPercentage) || 0;
  const allocatedNok = ((project.total_cost * percentage) / 100) || 0;

  // Sync handlers
  const onChangePercentage = (v: string) => {
    setCostPercentage(v);
    const p = parseFloat(v) || 0;
    setCostAmount(((project.total_cost * p) / 100).toFixed(2));
    setMode('percent');
  };

  const onChangeAmount = (v: string) => {
    setCostAmount(v);
    const a = parseFloat(v) || 0;
    const p = project.total_cost ? (a / project.total_cost) * 100 : 0;
    setCostPercentage(p.toFixed(2));
    setMode('amount');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-card border border-border w-full max-w-md">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Legg til Kunde til Prosjekt
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Info */}
            <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Prosjekt</p>
            <p className="font-semibold text-foreground">{project.name}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Total kostnad: {(project.total_cost / 1000000).toFixed(1)}M
            </p>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Velg Kunde *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground outline-none focus:border-primary transition-colors"
              required
            >
              {availableCustomers.map((customer) => (
                <option key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Share Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Kostnadsandel — velg modus
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setMode('percent')}
                className={`px-3 py-1 rounded-lg text-sm ${mode === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
              >
                Prosent
              </button>
              <button
                type="button"
                onClick={() => setMode('amount')}
                className={`px-3 py-1 rounded-lg text-sm ${mode === 'amount' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
              >
                Beløp (NOK)
              </button>
            </div>

            {mode === 'percent' ? (
              <>
                <input
                  type="number"
                  required
                  min="0"
                  max={100}
                  step="0.1"
                  value={costPercentage}
                  onChange={(e) => onChangePercentage(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {percentage.toFixed(1)}% — {(allocatedNok / 1000000).toFixed(2)}M
                </p>
              </>
            ) : (
              <>
                <input
                  type="number"
                  required
                  min="0"
                  max={project.total_cost}
                  step="0.01"
                  value={costAmount}
                  onChange={(e) => onChangeAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {(parseFloat(costPercentage) || 0).toFixed(1)}% — {(parseFloat(costAmount) || 0 / 1000000).toFixed(2)}M
                </p>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCostPercentage('50')}
              className="px-3 py-2 bg-secondary hover:bg-border rounded-lg text-sm text-foreground transition-colors"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setCostPercentage('33.3')}
              className="px-3 py-2 bg-secondary hover:bg-border rounded-lg text-sm text-foreground transition-colors"
            >
              33%
            </button>
            <button
              type="button"
              onClick={() => setCostPercentage('100')}
              className="px-3 py-2 bg-secondary hover:bg-border rounded-lg text-sm text-foreground transition-colors"
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => setCostPercentage('0')}
              className="px-3 py-2 bg-secondary hover:bg-border rounded-lg text-sm text-foreground transition-colors"
            >
              0%
            </button>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Legger til...' : 'Legg til Kunde'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
