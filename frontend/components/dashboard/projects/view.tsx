'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  DollarSign,
} from 'lucide-react';
import { getProjects } from '@/lib/api-client';
import { CreateProjectModal } from './create-modal';
import { EditProjectModal } from './edit-modal';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  total_cost: number;
  customers: number;
}

export function ProjectsView() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data: any = await getProjects();
      setProjects(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('[Projects] Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm('Er du sikker på at du vil slette dette prosjektet?')) {
      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setProjects(projects.filter((p) => p.id !== id));
        }
      } catch (error) {
        console.error('[Projects] Error deleting project:', error);
      }
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-foreground">Laster inn prosjekter...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prosjekter</h1>
          <p className="text-muted-foreground mt-1">
            Administrer og oversikt over alle prosjekter
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nytt Prosjekt
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="bg-card border border-border">
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Søk etter prosjektnavn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="p-6">
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
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

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Stats */}
                <div className="space-y-3 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Involvert kunder</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {project.customers ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Total kostnad</span>
                    </div>
                    <span className="font-semibold text-primary">
                      {(project.total_cost / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProject(project);
                    }}
                    className="flex-1 text-primary hover:bg-primary/10"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Rediger
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="flex-1 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Ingen prosjekter funnet</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchProjects();
          }}
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null);
            fetchProjects();
          }}
        />
      )}

    </div>
  );
}
