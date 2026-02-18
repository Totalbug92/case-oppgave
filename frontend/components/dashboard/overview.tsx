'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCustomers, getProjects } from '@/lib/api-client';
import {
  Building2,
  Briefcase,
  TrendingUp,
  Plus,
  ArrowRight,
  Users,
  DollarSign,
} from 'lucide-react';

interface StatsCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

interface Customer {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  total_cost: number;
  customers: number;
}

export function DashboardOverview() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<StatsCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch customers and projects
        const [customersList, projectsList] = await Promise.all([
          getCustomers(),
          getProjects(),
        ]);

        setCustomers(
          Array.isArray(customersList)
            ? customersList.slice(0, 5)
            : customersList.data?.slice(0, 5) || []
        );
        setProjects(
          Array.isArray(projectsList)
            ? projectsList.slice(0, 5)
            : projectsList.data?.slice(0, 5) || []
        );

        // Calculate stats
        const projects = Array.isArray(projectsList)
          ? projectsList
          : projectsList.data || [];
        const customers = Array.isArray(customersList)
          ? customersList
          : customersList.data || [];

        const totalCost = projects.reduce(
          (sum: number, p: any) => sum + (p.total_cost || 0),
          0
        );

        const newStats: StatsCard[] = [
          {
            label: 'Totale Kunder',
            value: customers.length.toString(),
            icon: <Building2 className="w-8 h-8" />,
            color: 'bg-blue-500/20 text-blue-400',
          },
          {
            label: 'Aktive Prosjekter',
            value: projects.length.toString(),
            icon: <Briefcase className="w-8 h-8" />,
            color: 'bg-cyan-500/20 text-cyan-400',
          },
          {
            label: 'Total Kostnad',
            value: `${(totalCost / 1000000).toFixed(1)}M`,
            icon: <DollarSign className="w-8 h-8" />,
            color: 'bg-green-500/20 text-green-400',
          },
          {
            label: 'Gjennomsnittlig Kostnad',
            value: projects.length
              ? `${(totalCost / projects.length / 1000000).toFixed(1)}M`
              : '0M',
            icon: <TrendingUp className="w-8 h-8" />,
            color: 'bg-amber-500/20 text-amber-400',
          },
        ];
        setStats(newStats);
      } catch (error) {
        console.error('[Dashboard] Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Laster inn data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-card border border-border p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Customers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Nylige Kunder
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/customers">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-border">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 hover:bg-secondary transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {customer.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customer.contact_person}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {customer.email}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Ingen kunder ennå</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <Button asChild className="w-full" variant="outline">
              <Link href="/customers">
                <Plus className="w-4 h-4 mr-2" />
                Ny Kunde
              </Link>
            </Button>
          </div>
        </Card>

        {/* Recent Projects Section */}
        <Card className="bg-card border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Briefcase className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Nylige Prosjekter
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-border">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 hover:bg-secondary transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
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
                  <p className="text-sm text-muted-foreground mb-2">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {project.customers} kunde(r)
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {(project.total_cost / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Ingen prosjekter ennå</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <Button asChild className="w-full" variant="outline">
              <Link href="/projects">
                <Plus className="w-4 h-4 mr-2" />
                Nytt Prosjekt
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
