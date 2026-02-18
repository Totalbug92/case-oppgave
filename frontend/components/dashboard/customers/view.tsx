'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { getCustomers } from '@/lib/api-client';
import { CreateCustomerModal } from './create-modal';
import { EditCustomerModal } from './edit-modal';

interface Customer {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
}

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('[Customers] Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (confirm('Er du sikker på at du vil slette denne kunden?')) {
      try {
        const res = await fetch(`/api/customers/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomers(customers.filter((c) => c.id !== id));
        }
      } catch (error) {
        console.error('[Customers] Error deleting customer:', error);
      }
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-foreground">Laster inn kunder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kunder</h1>
          <p className="text-muted-foreground mt-1">
            Administrer og oversikt over alle kunder
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ny Kunde
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="bg-card border border-border">
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Søk etter kundenavn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-secondary">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Kundenavn
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Kontaktperson
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Kontakt
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-secondary transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">
                        {customer.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-foreground">{customer.contact_person}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCustomer(customer)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <p className="text-muted-foreground">Ingen kunder funnet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {showCreateModal && (
        <CreateCustomerModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCustomers();
          }}
        />
      )}

      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          isOpen={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={() => {
            setEditingCustomer(null);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}
