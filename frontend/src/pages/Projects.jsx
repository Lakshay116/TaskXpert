import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useProjectStore } from '../store/projectStore';
import { FolderKanban, Plus, Loader2, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const GLOW_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 
  'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-indigo-500'
];

const Projects = () => {
  const navigate = useNavigate();
  const { projects, fetchProjects, createProject, isLoading } = useProjectStore();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', department: 'Development', project_type: 'Web' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createProject(newProject.name, newProject.description, newProject.department, newProject.project_type);
    setShowModal(false);
    setNewProject({ name: '', description: '', department: 'Development', project_type: 'Web' });
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 border-b sm:border-0 border-border pb-4 sm:pb-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2 flex items-center gap-2">
              <FolderKanban className="w-6 h-6 sm:hidden text-primary" />
              Projects
            </h1>
            <p className="hidden sm:block text-foreground/60 text-sm sm:text-base">Manage all your active projects and boards.</p>
          </div>
          
          <div className="flex flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2.5 rounded-xl bg-surface sm:bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm font-medium"
              />
            </div>
            {['Admin', 'Manager'].includes(user?.role_name) && (
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 p-2.5 sm:px-5 sm:py-2.5 bg-[#181B21] border border-slate-700/50 text-white font-semibold rounded-xl hover:bg-[#2A2F3A] transition-colors shadow-sm shrink-0"
                title="New Project"
              >
                <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-primary" /> 
                <span className="hidden sm:inline">New Project</span>
              </button>
            )}
          </div>
        </div>

        {isLoading && projects.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProjects.map((project, idx) => (
              <motion.div 
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.02, translateY: -4 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="bg-surface border border-border p-5 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden flex flex-col min-h-[160px]"
              >
                {/* Radiant Random Glow */}
                <div className={`absolute -top-16 -right-16 w-48 h-48 ${GLOW_COLORS[project.id % GLOW_COLORS.length]} opacity-[0.07] rounded-full blur-3xl group-hover:opacity-[0.15] transition-opacity duration-500`} />
                <div className={`absolute -bottom-16 -left-16 w-48 h-48 ${GLOW_COLORS[(project.id + 1) % GLOW_COLORS.length]} opacity-[0.04] rounded-full blur-3xl group-hover:opacity-[0.1] transition-opacity duration-500`} />
                
                {/* Active Task Badge in Top Right */}
                <div className="absolute top-4 right-4 z-20">
                  {parseInt(project.active_task_count || 0, 10) > 0 && (
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                      {project.active_task_count} Task{project.active_task_count !== '1' ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3 mb-3 relative z-10 pr-16">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:bg-blue-500/20 transition-all shadow-sm shrink-0 mt-0.5">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[17px] font-bold break-words whitespace-normal leading-tight text-foreground">{project.name}</h3>
                    
                    {/* Pills moved under title */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[9px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {project.department || 'Development'}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded">
                        {project.project_type || 'Web'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-foreground/50 text-[13px] line-clamp-2 mb-4 flex-1 relative z-10 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex items-center justify-between text-[10px] text-foreground/40 font-medium pt-3 border-t border-border mt-auto relative z-10">
                  <span className="truncate max-w-[65%]">Owner: {project.owner_name}</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}

            {filteredProjects.length === 0 && (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-3xl bg-surface/30">
                <FolderKanban className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground/60">No projects found</h3>
                <p className="text-foreground/40 text-sm">
                  {searchQuery ? `No projects match "${searchQuery}"` : "Create a new project to get started."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
          >
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium pl-1 mb-1 block">Project Name</label>
                <input 
                  type="text" required
                  value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})}
                  className="w-full p-3.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="e.g. Website Redesign"
                />
              </div>
              <div>
                <label className="text-sm font-medium pl-1 mb-1 block">Description</label>
                <textarea 
                  value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})}
                  className="w-full p-3.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all min-h-[80px] resize-none"
                  placeholder="Brief description of the goals..."
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium pl-1 mb-1 block">Department</label>
                  <select 
                    value={newProject.department} onChange={e => setNewProject({...newProject, department: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  >
                    <option value="Development">Development</option>
                    <option value="QA">QA</option>
                    <option value="Support">Support</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium pl-1 mb-1 block">Project Type</label>
                  <select 
                    value={newProject.project_type} onChange={e => setNewProject({...newProject, project_type: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  >
                    <option value="Web">Web</option>
                    <option value="Android">Android</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 mt-2">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-xl bg-background border border-border font-semibold hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isLoading}
                  className="flex-1 py-3.5 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Projects;
