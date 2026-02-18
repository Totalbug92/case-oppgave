'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { createProject } from '@/lib/api-client';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'pending',
    total_cost: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await createProject({
        ...formData,
        total_cost: parseInt(formData.total_cost) || 0,
      });
      onSuccess();
      setFormData({
        name: '',
        description: '',
        status: 'pending',
        total_cost: '',
      });
    } catch (error) {
      console.error('[CreateProject] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-card border border-border w-full max-w-md">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Nytt Prosjekt</h2>
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
              placeholder="Eks: Veibygging Storgaten"
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
              placeholder="Beskriv prosjektet..."
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
              placeholder="Eks: 5000000"
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
              {isLoading ? 'Opprett...' : 'Opprett Prosjekt'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
