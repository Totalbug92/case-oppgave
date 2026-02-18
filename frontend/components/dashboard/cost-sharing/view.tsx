'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { getProjects, getCustomers } from '@/lib/api-client';
import { LinkCustomerModal } from './link-customer-modal';

interface Project {
  id: number;
  name: string;
  total_cost: number;
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
  customer_name?: string;
}

export function CostSharingView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projectCustomers, setProjectCustomers] = useState<
    Map<number, ProjectCustomer[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [projectsList, customersList] = await Promise.all([
        getProjects(),
        getCustomers(),
      ]);

      const projects = Array.isArray(projectsList) ? projectsList : projectsList.data || [];
      const customers = Array.isArray(customersList) ? customersList : customersList.data || [];

      setProjects(projects);
      setCustomers(customers);
      setSelectedProject(projects[0] || null);

      // Fetch project-customer relationships
      for (const project of projects) {
        const res = await fetch(`/api/projects/${project.id}/customers`);
        if (res.ok) {
          const data = await res.json();
          setProjectCustomers((prev) => new Map(prev).set(project.id, data));
        }
      }
    } catch (error) {
      console.error('[CostSharing] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMillion = (value: number | undefined) => {
    const n = Number(value ?? 0);
    if (!isFinite(n)) return '0.0';
    return (n / 1000000).toFixed(1);
  };

  const calcPercentage = (share: number | undefined, total: number | undefined) => {
    const s = Number(share ?? 0);
    const t = Number(total ?? 0);
    if (!isFinite(s) || !isFinite(t) || t === 0) return '0.0';
    return ((s / t) * 100).toFixed(1);
  };

  const handleRemoveCustomer = async (projectId: number, customerId: number) => {
    if (
      confirm(
        'Er du sikker på at du vil fjerne denne kunden fra prosjektet?'
      )
    ) {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/customers/${customerId}`,
          { method: 'DELETE' }
        );

        if (res.ok) {
          const updated = projectCustomers.get(projectId)?.filter(
            (pc) => pc.customer_id !== customerId
          );
          if (updated !== undefined) {
            setProjectCustomers((prev) =>
              new Map(prev).set(projectId, updated)
            );
          }
        }
      } catch (error) {
        console.error('[CostSharing] Error removing customer:', error);
      }
    }
  };

  const currentProjectCustomers = selectedProject
    ? projectCustomers.get(selectedProject.id) || []
    : [];

  const availableCustomers = customers.filter(
    (c) => !currentProjectCustomers.some((pc) => pc.customer_id === c.id)
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-foreground">Laster inn data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Kostnadsdeling
        </h1>
        <p className="text-muted-foreground mt-1">
          Administrer kunders andel av prosjektkostnader
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Projects List */}
        <div>
          <Card className="bg-card border border-border">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Prosjekter</h2>
            </div>
            <div className="divide-y divide-border">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedProject?.id === project.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {formatMillion(project.total_cost)}M
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Cost Sharing Details */}
        <div className="lg:col-span-3">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Info */}
              <Card className="bg-card border border-border">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {selectedProject.name}
                  </h2>
                  <div className="flex items-center gap-2 text-lg">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="text-foreground">
                      Total kostnad:{' '}
                      <span className="font-bold">
                        {formatMillion(selectedProject.total_cost)}M
                      </span>
                    </span>
                  </div>
                </div>
              </Card>

              {/* Customers in Project */}
              <Card className="bg-card border border-border">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Involvert Kunder ({currentProjectCustomers.length})
                  </h3>
                  {availableCustomers.length > 0 && (
                    <Button
                      onClick={() => setShowLinkModal(true)}
                      className="bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Legg til kunde
                    </Button>
                  )}
                </div>

                <div className="divide-y divide-border">
                  {currentProjectCustomers.length > 0 ? (
                    currentProjectCustomers.map((projectCustomer) => {
                      const percentage = calcPercentage(
                        projectCustomer.cost_share,
                        selectedProject.total_cost
                      );
                      return (
                        <div
                          key={projectCustomer.id}
                          className="p-4 hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {projectCustomer.customer_name ||
                                  `Kunde ${projectCustomer.customer_id}`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveCustomer(
                                  selectedProject.id,
                                  projectCustomer.customer_id
                                )
                              }
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Cost Share Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Kostnadsandel
                              </span>
                              <span className="font-semibold text-primary">
                                {formatMillion(projectCustomer.cost_share)}M ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all"
                                style={{ width: `${Math.max(0, Math.min(100, parseFloat(percentage) || 0))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        Ingen kunder tilknyttet dette prosjektet
                      </p>
                      {availableCustomers.length > 0 && (
                        <Button
                          onClick={() => setShowLinkModal(true)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Legg til første kunde
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Summary */}
              {currentProjectCustomers.length > 0 && (
                <Card className="bg-card border border-border p-6">
                  <h4 className="font-semibold text-foreground mb-4">
                    Oppsummering
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Antall kunder
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {currentProjectCustomers.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Gjennomsnittlig andel
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {formatMillion(
                          selectedProject.total_cost / currentProjectCustomers.length
                        )}
                        M
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="bg-card border border-border p-8 text-center">
              <p className="text-muted-foreground">
                Ingen prosjekter tilgjengelig
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal */}
      {showLinkModal && selectedProject && (
        <LinkCustomerModal
          project={selectedProject}
          availableCustomers={availableCustomers}
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => {
            setShowLinkModal(false);
            fetchAllData();
          }}
        />
      )}
    </div>
  );
}
