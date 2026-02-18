'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { getProjects, getCustomers } from '@/lib/api-client';

interface Project {
  id: number;
  name: string;
  status: string;
  total_cost: number;
  customers: number;
}

interface Customer {
  id: number;
  name: string;
}

interface ChartData {
  name: string;
  value: number;
  projects?: number;
}

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function ReportsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [costByProject, setCostByProject] = useState<ChartData[]>([]);
  const [projectsByStatus, setProjectsByStatus] = useState<ChartData[]>([]);
  const [topCustomers, setTopCustomers] = useState<ChartData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

      // Calculate chart data
      const costData = projects.map((p: Project) => ({
        name: p.name,
        value: p.total_cost / 1000000,
      }));
      setCostByProject(costData);

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      projects.forEach((p: Project) => {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name:
          status === 'active'
            ? 'Aktiv'
            : status === 'pending'
              ? 'Venter'
              : 'Fullført',
        value: count,
      }));
      setProjectsByStatus(statusData);

      // Top customers by project count
      const customerCounts: Record<string, number> = {};
      projects.forEach((p: Project) => {
        customers.forEach((c: Customer) => {
          customerCounts[c.name] = (customerCounts[c.name] || 0) + 1;
        });
      });
        const topCustData = Object.entries(customerCounts)
          .map(([name, count]) => ({ name, value: count }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        setTopCustomers(topCustData);
    } catch (error) {
      console.error('[Reports] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-foreground">Laster inn rapporter...</p>
      </div>
    );
  }

  const totalCost = projects.reduce((sum, p) => sum + p.total_cost, 0);
  const activeProjects = projects.filter(
    (p) => p.status === 'active'
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === 'completed'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rapporter & Analyse</h1>
        <p className="text-muted-foreground mt-1">
          Oversikt over prosjekter og kostnader
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Kostnad</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {(totalCost / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-card border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Totale Prosjekter</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {projects.length}
              </p>
            </div>
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <PieChartIcon className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-card border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Aktive Prosjekter</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {activeProjects}
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-card border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Fullførte Prosjekter</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {completedProjects}
              </p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Project */}
        <Card className="bg-card border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Kostnad per Prosjekt
          </h2>
          {costByProject.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costByProject}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151b24',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#e4e7eb',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Ingen data tilgjengelig</p>
            </div>
          )}
        </Card>

        {/* Status Distribution */}
        <Card className="bg-card border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Prosjekter etter Status
          </h2>
          {projectsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectsByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151b24',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#e4e7eb',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Ingen data tilgjengelig</p>
            </div>
          )}
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card className="bg-card border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Detaljert Prosjektoversikt
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Prosjekt
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Kostnad
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Kunder
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Prosent av Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-secondary transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{project.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        project.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : project.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {project.status === 'active'
                        ? 'Aktiv'
                        : project.status === 'pending'
                          ? 'Venter'
                          : 'Fullført'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-primary">
                      {(project.total_cost / 1000000).toFixed(1)}M
                    </p>
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {project.customers}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{
                            width: `${(project.total_cost / totalCost) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {((project.total_cost / totalCost) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
