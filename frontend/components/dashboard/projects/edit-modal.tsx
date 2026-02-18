'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  total_cost: number;
  customers: number;
}

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProjectModal({
  project,
  isOpen,
  onClose,
  onSuccess,
}: EditProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
    total_cost: project.total_cost.toString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_cost: parseInt(formData.total_cost) || 0,
        }),
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('[EditProject] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-card border border-border w-full max-w-md">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Rediger Prosjekt</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Prosjektnavn *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Beskrivelse *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="pending">Venter</option>
              <option value="active">Aktiv</option>
              <option value="completed">Fullført</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Total Kostnad (NOK) *
            </label>
            <input
              type="number"
              required
              value={formData.total_cost}
              onChange={(e) =>
                setFormData({ ...formData, total_cost: e.target.value })
              }
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
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
              {isLoading ? 'Lagrer...' : 'Lagre Endringer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
