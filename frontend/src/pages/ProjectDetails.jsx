import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, CheckSquare, Calendar, User, ChevronDown, CornerDownLeft, MoreHorizontal, Search, History, X, Trash2, Edit2, MoreVertical } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const COLUMNS = [
  { id: 'ToDo', title: 'TO DO', color: 'bg-slate-500/20 text-slate-500 dark:text-slate-400' },
  { id: 'In Progress', title: 'IN PROGRESS', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  { id: 'Review', title: 'IN REVIEW', color: 'bg-primary/20 text-primary dark:text-purple-400' },
  { id: 'Done', title: 'DONE', color: 'bg-green-500/20 text-green-600 dark:text-green-400' }
];

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { tasks, fetchTasks, createTask, updateTaskStatus, updateTask, fetchTaskTimeline, deleteTask, isLoading } = useTaskStore();
  const { users, fetchUsers } = useUserStore();
  const { currentProject, fetchProjectById, deleteProject, updateProject } = useProjectStore();
  const { user } = useAuthStore();
  
  const canAssign = currentProject?.owner_id === user?.id || user?.role_name === 'Admin' || user?.role_name === 'Manager';

  // Quick Add State
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddActive, setQuickAddActive] = useState(false);
  const [quickAddAssignee, setQuickAddAssignee] = useState(null);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownMode, setDropdownMode] = useState('main');
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [timelineTaskId, setTimelineTaskId] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  
  // Edit Project State
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editProjectForm, setEditProjectForm] = useState({ name: '', description: '', department: '', project_type: '' });
  
  // Edit Task State
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editTaskForm, setEditTaskForm] = useState({ id: null, title: '', description: '', priority: 'Medium' });

  // Confirmation Modals State
  const [deleteProjectConfirmOpen, setDeleteProjectConfirmOpen] = useState(false);
  const [deleteTaskConfirmData, setDeleteTaskConfirmData] = useState({ isOpen: false, taskId: null });

  const inputRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(COLUMNS[0].id);

  useEffect(() => {
    fetchTasks(projectId);
    fetchProjectById(projectId);
    fetchUsers();
  }, [projectId]);

  useEffect(() => {
    if (quickAddActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [quickAddActive]);

  const handleQuickAdd = async (e) => {
    if (e.key === 'Enter' && quickAddTitle.trim()) {
      e.preventDefault();
      await createTask({ 
        title: quickAddTitle, 
        description: '', 
        priority: 'Medium', 
        project_id: projectId,
        assigned_to: quickAddAssignee 
      });
      setQuickAddTitle('');
      setQuickAddAssignee(null);
      setIsQuickAssignOpen(false);
      setQuickAddActive(false);
      fetchTasks(projectId);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus(parseInt(taskId, 10), columnId);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      setActiveDropdown(null);
      setAssignSearchTerm('');
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const openTimeline = async (taskId) => {
    setTimelineTaskId(taskId);
    const events = await fetchTaskTimeline(taskId);
    setTimelineEvents(events);
  };

  const handleEditProjectClick = () => {
    if (currentProject) {
      setEditProjectForm({
        name: currentProject.name,
        description: currentProject.description,
        department: currentProject.department || '',
        project_type: currentProject.project_type || ''
      });
      setIsEditProjectModalOpen(true);
    }
  };

  const handleEditProjectSubmit = async (e) => {
    e.preventDefault();
    await updateProject(projectId, editProjectForm);
    setIsEditProjectModalOpen(false);
  };

  const handleEditTaskClick = (task) => {
    setEditTaskForm({
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'Medium'
    });
    setIsEditTaskModalOpen(true);
    setActiveDropdown(null);
  };

  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    await updateTask(editTaskForm.id, {
      title: editTaskForm.title,
      description: editTaskForm.description,
      priority: editTaskForm.priority
    });
    setIsEditTaskModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 pb-2 border-b border-border bg-surface/50 relative">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="p-2 mt-1 sm:mt-0 bg-background border border-border rounded-lg hover:bg-surface transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground/70" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {currentProject ? currentProject.name : 'Sprint Board'}
              </h1>
              {currentProject && (
                <div className="flex gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                    {currentProject.department || 'Development'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    {currentProject.project_type || 'Web'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-foreground/60">
              {currentProject ? currentProject.description : 'Drag or click to move issues'}
            </p>
          </div>
        </div>
        
        {/* Project Actions */}
        {currentProject && (currentProject.owner_id === user?.id || user?.role_name === 'Admin') && (
          <div className="absolute top-4 right-4 sm:static flex items-center gap-2 z-20" ref={mobileMenuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="sm:hidden p-1 text-foreground/50 hover:text-foreground transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-foreground/70" />
            </button>
            
            <div className={`
              ${isMobileMenuOpen ? 'absolute top-full right-0 mt-2 p-2 bg-surface border border-border rounded-xl shadow-xl z-50 flex flex-col gap-1 w-48' : 'hidden'}
              sm:flex sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:shadow-none sm:flex-row sm:items-center gap-2 sm:gap-2 sm:w-auto
            `}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleEditProjectClick(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 w-full sm:w-auto px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 sm:border border-primary/20 rounded-lg transition-colors text-sm font-medium"
                title="Edit Project"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setDeleteProjectConfirmOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 w-full sm:w-auto px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 sm:border border-red-500/20 rounded-lg transition-colors text-sm font-medium"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Tabs */}
      <div className="sm:hidden flex items-center overflow-x-auto border-b border-border bg-background scrollbar-hide shrink-0">
        {COLUMNS.map(column => {
          const count = tasks.filter(t => t.status === column.id).length;
          return (
            <button
              key={column.id}
              onClick={() => setActiveTab(column.id)}
              className={`flex items-center gap-2 px-4 py-3 text-[11px] font-bold tracking-wider uppercase whitespace-nowrap transition-colors border-b-2 ${activeTab === column.id ? 'border-primary text-primary' : 'border-transparent text-foreground/50 hover:text-foreground/80'}`}
            >
              {column.title}
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === column.id ? 'bg-primary/10 text-primary' : 'bg-surface text-foreground/60'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 flex gap-4 overflow-x-auto p-4 sm:p-6 scrollbar-hide items-start">
        {COLUMNS.map(column => {
          const columnTasks = tasks.filter(t => t.status === column.id);
          const hasActiveDropdown = columnTasks.some(t => t.id === activeDropdown);
          
          return (
            <div 
              key={column.id} 
              className={`${activeTab === column.id ? 'flex' : 'hidden'} sm:flex flex-col w-full min-w-full sm:w-[320px] sm:min-w-[320px] bg-surface border border-border rounded-xl p-2.5 transition-all ${hasActiveDropdown ? 'z-50' : 'z-10'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center gap-2 mb-3 px-1.5 pt-1">
                <span className="text-[11px] font-bold tracking-wider text-foreground/50">{column.title}</span>
                <span className="bg-background px-1.5 py-0.5 rounded text-[11px] font-bold text-foreground/60 border border-border">
                  {columnTasks.length}
                </span>
              </div>
              
              <div className={`flex-1 space-y-2 scrollbar-hide min-h-[50px] pb-2 ${hasActiveDropdown ? 'overflow-visible' : 'overflow-y-auto'}`}>
                <AnimatePresence>
                  {columnTasks.map(task => {
                    const isMyTask = task.assigned_to === user?.id;
                    const isTaskCreator = task.created_by === user?.id;
                    const canEditTask = canAssign || isMyTask || isTaskCreator;
                    
                    return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={task.id}
                      draggable={canEditTask}
                      onDragStart={(e) => {
                        if (canEditTask) e.dataTransfer.setData('taskId', task.id);
                      }}
                      className={`bg-background border p-2.5 rounded-lg shadow-sm hover:shadow-md hover:border-primary/40 transition-all group relative ${canEditTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${activeDropdown === task.id ? 'z-50' : 'z-10'} ${isMyTask ? 'border-primary/50 border-l-[3px] border-l-primary' : 'border-border'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-[13px] text-foreground leading-snug pr-6">{task.title}</h3>
                        
                        {/* Three dots menu */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openTimeline(task.id); }}
                            className="p-1 rounded hover:bg-surface text-foreground/50 hover:text-primary transition-colors"
                            title="View Timeline"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          
                          {canEditTask && (
                          <div className="relative">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (activeDropdown === task.id) {
                                  setActiveDropdown(null);
                                  setAssignSearchTerm('');
                                } else {
                                  setActiveDropdown(task.id);
                                  setDropdownMode('main');
                                  setAssignSearchTerm('');
                                }
                              }}
                              className="p-1 rounded hover:bg-surface text-foreground/50 hover:text-foreground transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          
                          {activeDropdown === task.id && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-[#1C2028] border border-slate-700/50 rounded-lg shadow-xl z-50 py-1 max-h-80 overflow-y-auto scrollbar-hide origin-top-right animate-in fade-in zoom-in-95 duration-100">
                              
                              {dropdownMode === 'main' && (
                                <>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setDropdownMode('status'); }}
                                    className="w-full text-left px-3 py-2 text-[12px] font-medium text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between"
                                  >
                                    Change Status
                                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                                  </button>
                                  {canAssign && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDropdownMode('assign'); }}
                                      className="w-full text-left px-3 py-2 text-[12px] font-medium text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between border-t border-slate-700/30"
                                    >
                                      Assign To
                                      <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                                    </button>
                                  )}
                                  
                                  {(canAssign || isTaskCreator) && (
                                    <>
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          handleEditTaskClick(task);
                                        }}
                                        className="w-full text-left px-3 py-2 text-[12px] font-medium text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between border-t border-slate-700/30"
                                      >
                                        Edit Task
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setDeleteTaskConfirmData({ isOpen: true, taskId: task.id });
                                        }}
                                        className="w-full text-left px-3 py-2 text-[12px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center justify-between border-t border-slate-700/30"
                                      >
                                        Delete Task
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}

                              {dropdownMode === 'status' && (
                                <>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setDropdownMode('main'); }}
                                    className="w-full text-left px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-700/50 mb-1 flex items-center gap-1 hover:text-slate-300 transition-colors"
                                  >
                                    <ArrowLeft className="w-3 h-3" /> Back
                                  </button>
                                  {COLUMNS.map(col => {
                                    if (col.id === column.id) return null;
                                    return (
                                      <button 
                                        key={col.id}
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          updateTaskStatus(task.id, col.id);
                                          setActiveDropdown(null);
                                        }} 
                                        className="w-full text-left px-3 py-2 text-[12px] font-medium text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors"
                                      >
                                        {col.title}
                                      </button>
                                    );
                                  })}
                                </>
                              )}

                              {dropdownMode === 'assign' && (
                                <>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setDropdownMode('main'); setAssignSearchTerm(''); }}
                                    className="w-full text-left px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-700/50 mb-1 flex items-center gap-1 hover:text-slate-300 transition-colors"
                                  >
                                    <ArrowLeft className="w-3 h-3" /> Back
                                  </button>
                                  
                                  <div className="px-3 pb-2 pt-1 border-b border-slate-700/30">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-500" />
                                      <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="Search users..." 
                                        value={assignSearchTerm}
                                        onChange={(e) => setAssignSearchTerm(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-[#2A2F3A] text-slate-200 text-[11px] rounded px-6 py-1 outline-none border border-slate-700/50 focus:border-primary/50 transition-colors"
                                      />
                                    </div>
                                  </div>

                                  <button 
                                    onClick={(e) => { e.stopPropagation(); updateTask(task.id, { assigned_to: null }); setActiveDropdown(null); }}
                                    className="w-full text-left px-3 py-2 text-[12px] font-medium text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2 border-b border-slate-700/30"
                                  >
                                    <User className="w-3.5 h-3.5" /> Unassigned
                                  </button>
                                  {users
                                    .filter(u => 
                                      u.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) || 
                                      u.email.toLowerCase().includes(assignSearchTerm.toLowerCase())
                                    )
                                    .slice(0, 3)
                                    .map(u => (
                                    <button 
                                      key={u.id}
                                      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { assigned_to: u.id }); setActiveDropdown(null); }}
                                      className={`w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors flex flex-col gap-0.5 border-b border-slate-700/30 last:border-0 ${task.assigned_to === u.id ? 'bg-primary/10' : ''}`}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-[12px] font-medium text-slate-200 truncate">{u.name}</span>
                                        <span className="text-[9px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">{u.role_name}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 truncate w-full">{u.email}</span>
                                      <span className="text-[10px] text-slate-500 font-medium">Dept: {u.organization_name || 'Default'}</span>
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        )}
                        </div>
                      </div>
                      
                      {/* Tags & Dates */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {task.priority === 'High' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 uppercase">High</span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] font-medium text-foreground/60 border border-border px-1.5 py-0.5 rounded">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {isMyTask && (
                        <div className="text-[10px] text-primary/80 font-medium mb-1.5 px-0.5 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-primary inline-block"></span>
                          Assigned by {users.find(u => u.id === task.created_by)?.name.split(' ')[0] || 'Admin'} to You
                        </div>
                      )}
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between text-foreground/50 mt-1">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>TSK-{task.id}</span>
                        </div>
                        {task.assigned_to ? (
                          <div className="flex items-center gap-1.5 bg-surface border border-border px-1.5 py-0.5 rounded-full cursor-help" title={users.find(u => u.id === task.assigned_to)?.email}>
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold">
                              {users.find(u => u.id === task.assigned_to)?.name.charAt(0) || 'U'}
                            </div>
                            <span className="text-[10px] font-medium text-foreground/70 truncate max-w-[70px]">
                              {users.find(u => u.id === task.assigned_to)?.name.split(' ')[0] || 'Unknown'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-foreground/40 italic flex items-center gap-1">
                            <User className="w-3 h-3" /> Unassigned
                          </span>
                        )}
                      </div>


                    </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Inline Quick Add Task for ToDo Column */}
                {column.id === 'ToDo' && (
                  <>
                    {quickAddActive ? (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-background border-2 border-primary rounded-lg p-3 shadow-md"
                      >
                        <input 
                          ref={inputRef}
                          type="text" 
                          value={quickAddTitle}
                          onChange={(e) => setQuickAddTitle(e.target.value)}
                          onKeyDown={handleQuickAdd}
                          placeholder="What needs to be done?"
                          className="w-full bg-transparent outline-none text-[14px] text-foreground mb-3 placeholder:text-foreground/40"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-foreground/40 relative">
                            <button type="button" className="p-1 hover:bg-surface rounded"><CheckSquare className="w-4 h-4" /></button>
                            <button type="button" className="p-1 hover:bg-surface rounded"><Calendar className="w-4 h-4" /></button>
                            <button 
                              type="button" 
                              onClick={() => setIsQuickAssignOpen(!isQuickAssignOpen)}
                              className={`p-1 rounded flex items-center gap-1 ${quickAddAssignee ? 'bg-primary/20 text-primary' : 'hover:bg-surface'}`}
                              title="Assign User"
                            >
                              <User className="w-4 h-4" />
                            </button>

                            {isQuickAssignOpen && (
                              <div className="absolute top-8 left-16 bg-[#181B21] border border-slate-700 rounded-lg shadow-xl w-48 z-50 overflow-hidden">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                  <button
                                    onClick={() => { setQuickAddAssignee(null); setIsQuickAssignOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-[12px] font-medium text-slate-300 hover:bg-white/5 transition-colors border-b border-slate-700/50"
                                  >
                                    Unassigned
                                  </button>
                                  {users.map(u => (
                                    <button
                                      key={`qa-${u.id}`}
                                      onClick={() => { setQuickAddAssignee(u.id); setIsQuickAssignOpen(false); }}
                                      className={`w-full text-left px-3 py-2 text-[12px] font-medium transition-colors flex items-center justify-between ${quickAddAssignee === u.id ? 'bg-primary/10 text-primary' : 'text-slate-300 hover:bg-white/5'}`}
                                    >
                                      {u.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={() => handleQuickAdd({ key: 'Enter', preventDefault: () => {} })}
                            className="p-1.5 bg-surface border border-border rounded hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => setQuickAddActive(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-[#2A2F3A] hover:bg-[#343A46] text-white border border-slate-700/50 transition-all font-medium mt-1 shadow-sm group"
                      >
                        <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[13px]">Create task</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Modal */}
      {timelineTaskId && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setTimelineTaskId(null)}>
          <div className="bg-[#1C2028] border border-slate-700/50 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm tracking-wide">Task Timeline</h3>
              </div>
              <button onClick={() => setTimelineTaskId(null)} className="p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto scrollbar-hide flex-1">
              {timelineEvents.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-sm">No activity recorded for this task.</div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700/50 before:to-transparent">
                  {timelineEvents.map((event, index) => (
                    <div key={index} className="relative flex items-start gap-4 group is-active">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-700/50 bg-[#2A2F3A] text-slate-400 group-[.is-active]:text-primary group-[.is-active]:border-primary/30 shrink-0 shadow-sm z-10 mt-1">
                        {event.action === 'created' ? <Plus className="w-3 h-3" /> : <CheckSquare className="w-3 h-3" />}
                      </div>
                      
                      <div className="flex-1 p-3 rounded-lg border border-slate-700/50 bg-[#2A2F3A] shadow-sm">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="font-bold text-slate-200 text-xs truncate">{event.user_name || 'System'}</span>
                          <time className="text-[9px] font-medium text-slate-500 whitespace-nowrap">{new Date(event.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed break-words">{event.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsEditProjectModalOpen(false)}>
          <div className="bg-[#1C2028] border border-slate-700/50 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground tracking-wide">Edit Project</h3>
              </div>
              <button onClick={() => setIsEditProjectModalOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditProjectSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Name</label>
                <input 
                  type="text" 
                  required
                  value={editProjectForm.name}
                  onChange={(e) => setEditProjectForm({...editProjectForm, name: e.target.value})}
                  className="w-full bg-[#2A2F3A] text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea 
                  rows={3}
                  value={editProjectForm.description}
                  onChange={(e) => setEditProjectForm({...editProjectForm, description: e.target.value})}
                  className="w-full bg-[#2A2F3A] text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700/50 focus:border-primary/50 transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Department</label>
                  <input 
                    type="text" 
                    value={editProjectForm.department}
                    onChange={(e) => setEditProjectForm({...editProjectForm, department: e.target.value})}
                    className="w-full bg-[#2A2F3A] text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700/50 focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Type</label>
                  <input 
                    type="text" 
                    value={editProjectForm.project_type}
                    onChange={(e) => setEditProjectForm({...editProjectForm, project_type: e.target.value})}
                    className="w-full bg-[#2A2F3A] text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700/50 focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsEditProjectModalOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsEditTaskModalOpen(false)}>
          <div className="bg-[#1C2028] border border-slate-700/50 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground tracking-wide">Edit Task</h3>
              </div>
              <button onClick={() => setIsEditTaskModalOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditTaskSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Task Title</label>
                <input 
                  type="text" 
                  required
                  value={editTaskForm.title}
                  onChange={(e) => setEditTaskForm({...editTaskForm, title: e.target.value})}
                  className="w-full bg-[#2A2F3A] text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea 
                  rows={3}
                  value={editTaskForm.description}
                  onChange={(e) => setEditTaskForm({...editTaskForm, description: e.target.value})}
                  className="w-full bg-[#2A2F3A] text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700/50 focus:border-primary/50 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
                <select
                  value={editTaskForm.priority}
                  onChange={(e) => setEditTaskForm({...editTaskForm, priority: e.target.value})}
                  className="w-full bg-[#2A2F3A] text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700/50 focus:border-primary/50 transition-colors"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsEditTaskModalOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteProjectConfirmOpen}
        onClose={() => setDeleteProjectConfirmOpen(false)}
        onConfirm={async () => {
          await deleteProject(projectId);
          navigate('/projects');
        }}
        title="Delete Project"
        message="Are you sure you want to completely delete this project? This action cannot be undone."
      />

      <ConfirmModal
        isOpen={deleteTaskConfirmData.isOpen}
        onClose={() => setDeleteTaskConfirmData({ isOpen: false, taskId: null })}
        onConfirm={async () => {
          if (deleteTaskConfirmData.taskId) {
            await deleteTask(deleteTaskConfirmData.taskId);
          }
        }}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
};

export default ProjectDetails;
