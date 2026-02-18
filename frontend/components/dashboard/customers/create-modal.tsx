'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { createCustomer } from '@/lib/api-client';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await createCustomer(formData);
      onSuccess();
      setFormData({ name: '', contact_person: '', phone: '', email: '' });
    } catch (error) {
      console.error('[CreateCustomer] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-card border border-border w-full max-w-md">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Ny Kunde</h2>
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
              Kundenavn *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              placeholder="Eks: Oslokommune"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Kontaktperson *
            </label>
            <input
              type="text"
              required
              value={formData.contact_person}
              onChange={(e) =>
                setFormData({ ...formData, contact_person: e.target.value })
              }
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              placeholder="Eks: Jon Andersson"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Telefon *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              placeholder="Eks: +47 12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              E-post *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              placeholder="Eks: jon@oslokommune.no"
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
              {isLoading ? 'Opprett...' : 'Opprett Kunde'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
