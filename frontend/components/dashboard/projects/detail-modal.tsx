'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Users, DollarSign } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  total_cost: number;
  customers: number;
}

interface ProjectCustomer {
  id: number;
  name: string;
  cost_share: number;
}

interface ProjectDetailModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailModal({
  project,
  isOpen,
  onClose,
}: ProjectDetailModalProps) {
  const [projectCustomers, setProjectCustomers] = useState<ProjectCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjectCustomers();
    }
  }, [isOpen, project.id]);

  const fetchProjectCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${project.id}/customers`);
      if (res.ok) {
        const data = await res.json();
        setProjectCustomers(data);
      }
    } catch (error) {
      console.error('[ProjectDetail] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const averageCost = projectCustomers.length
    ? project.total_cost / projectCustomers.length
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-card border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {project.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {project.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Cost Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-muted-foreground text-sm mb-2">Status</p>
              <span
                className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${
                  project.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : project.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {project.status}
              </span>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-muted-foreground text-sm mb-2">Total kostnad</p>
              <p className="text-2xl font-bold text-primary">
                {(project.total_cost / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>

          {/* Customers and Cost Distribution */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Involvert Kunder ({projectCustomers.length})
              </h3>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : projectCustomers.length > 0 ? (
              <div className="space-y-3">
                {projectCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 bg-secondary rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {customer.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Kostnadsandel
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {(customer.cost_share / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(
                            (customer.cost_share / project.total_cost) *
                            100
                          ).toFixed(1)}
                          % av totalt
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-secondary rounded-lg border border-border">
                <p className="text-muted-foreground">
                  Ingen kunder tilknyttet dette prosjektet
                </p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {projectCustomers.length > 0 && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg border border-border">
              <div>
                <p className="text-muted-foreground text-sm">
                  Gjennomsnittlig kostnad
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {(averageCost / 1000000).toFixed(1)}M
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  Antall kunder
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {projectCustomers.length}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border">
          <Button onClick={onClose} className="w-full">
            Lukk
          </Button>
        </div>
      </Card>
    </div>
  );
}
