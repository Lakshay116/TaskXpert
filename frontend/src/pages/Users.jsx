import React, { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { Shield, User as UserIcon, Loader2, Plus, X, Mail, Lock, User as UserOutline, Trash2, Edit2, Search } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

const Users = () => {
  const { user } = useAuthStore();
  const { users, fetchUsers, updateUserRole, createUser, deleteUser, isLoading } = useUserStore();
  const [loadingId, setLoadingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: '', email: '', password: '', role: 'Employee', department: 'Technical' });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editUser, setEditUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');
  
  const [deleteUserConfirmData, setDeleteUserConfirmData] = useState({ isOpen: false, userId: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  if (user?.role_name !== 'Admin') {
    return <Navigate to="/dashboard" />;
  }

  const handleRoleChange = async (userId, newRole) => {
    setLoadingId(userId);
    try {
      await updateUserRole(userId, newRole);
      await fetchUsers(); // Refresh the list to show updated role
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setLoadingId(userId);
    try {
      await deleteUser(userId);
      await fetchUsers(); // Refresh
    } catch (error) {
      console.error(error);
      alert('Failed to delete user');
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    setAddError('');
    try {
      await createUser(addFormData);
      setShowAddModal(false);
      setAddFormData({ name: '', email: '', password: '', role: 'Employee', department: 'Technical' });
      await fetchUsers(); // Refresh
    } catch (error) {
      setAddError(error.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    setEditError('');
    try {
      await useUserStore.getState().updateUserDetails(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        department: editUser.department
      });
      setEditUser(null);
    } catch (error) {
      setEditError(error.response?.data?.error?.message || 'Failed to update user');
    } finally {
      setIsEditing(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-border bg-surface/50 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2 sm:gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            User Management
          </h1>
          <p className="hidden sm:block text-foreground/60 mt-2 max-w-2xl text-base">
            Manage your team members and configure their access levels. Only Administrators can view and modify these settings.
          </p>
        </div>
        <div className="flex flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm font-medium"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 p-2.5 sm:px-5 sm:py-2.5 bg-[#181B21] border border-slate-700/50 text-white font-semibold rounded-xl hover:bg-[#2A2F3A] transition-colors shadow-sm whitespace-nowrap shrink-0"
            title="Add User"
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-primary" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          {isLoading && users.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-0 sm:bg-surface sm:border sm:border-border sm:rounded-2xl sm:overflow-hidden sm:shadow-sm sm:overflow-x-auto">
              <div className="sm:min-w-[800px] flex flex-col gap-3 sm:gap-0">
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-border bg-background/50 font-bold text-xs uppercase tracking-wider text-foreground/50">
                  <div className="col-span-4 pl-2">Employee</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Department</div>
                  <div className="col-span-3">Role Access</div>
                </div>
                <div className="flex flex-col gap-3 sm:gap-0 sm:divide-y sm:divide-border">
                {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                  <div key={u.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 sm:p-4 bg-surface border border-border rounded-xl sm:rounded-none sm:border-0 sm:bg-transparent items-start sm:items-center hover:bg-background/50 transition-colors shadow-sm sm:shadow-none">
                    <div className="w-full sm:col-span-4 flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-border shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
                            <UserIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-foreground text-sm sm:text-base">{u.name}</div>
                          <div className="text-xs text-foreground/50 font-medium">ID: {u.id}</div>
                        </div>
                      </div>
                      
                      <div className="sm:hidden">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-background border border-border text-foreground/60 uppercase tracking-wider shadow-sm">
                          {u.department || 'Technical'}
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:col-span-3 text-sm text-foreground/80 truncate sm:pr-4 flex items-center gap-2 px-1 sm:px-0">
                      <Mail className="w-3.5 h-3.5 text-foreground/40 sm:hidden" />
                      {u.email}
                    </div>

                    <div className="hidden sm:block col-span-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-background border border-border text-foreground/70 shadow-sm">
                        {u.department || 'Technical'}
                      </span>
                    </div>

                    <div className="w-full sm:col-span-3 flex items-center justify-between sm:justify-start gap-3 pt-3 sm:pt-0 border-t border-border/50 sm:border-0">
                      <div className="flex items-center gap-2">
                        <select
                          disabled={loadingId === u.id || u.id === user.id} // Don't let admin demote themselves
                          value={u.role_name || 'Employee'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`text-sm font-semibold bg-background border border-border rounded-lg px-3 py-1.5 outline-none hover:border-primary focus:border-primary transition-colors cursor-pointer w-[120px] sm:w-[140px] shadow-sm ${loadingId === u.id ? 'opacity-50' : ''}`}
                        >
                          <option value="Employee">Employee</option>
                          <option value="Agent">Agent</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                        {loadingId === u.id && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        {u.id === user.id && <span className="text-[10px] sm:text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded shadow-sm">You</span>}
                      </div>

                      {u.id !== user.id && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => setEditUser({ ...u })}
                            disabled={loadingId === u.id}
                            className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteUserConfirmData({ isOpen: true, userId: u.id })}
                            disabled={loadingId === u.id}
                            className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-foreground/50 font-medium bg-surface rounded-xl border border-border">
                    No users found matching "{searchQuery}"
                  </div>
                )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-foreground/50 hover:bg-background rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {addError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm text-center font-medium">
                  {addError}
                </div>
              )}
              
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1">Full Name</label>
                  <div className="relative">
                    <UserOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input 
                      type="text" required
                      value={addFormData.name} onChange={(e) => setAddFormData({...addFormData, name: e.target.value})}
                      placeholder="Jane Doe"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input 
                      type="email" required
                      value={addFormData.email} onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                      placeholder="jane@company.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1">Temporary Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input 
                      type="text" required
                      value={addFormData.password} onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                      placeholder="securepassword123"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1">Role Assignment</label>
                  <select 
                    value={addFormData.role} onChange={(e) => setAddFormData({...addFormData, role: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="Employee">Employee (Can view their own tickets)</option>
                    <option value="Agent">Agent (Can view and reply to tickets)</option>
                    <option value="Manager">Manager (Can assign tickets & view all)</option>
                    <option value="Admin">Admin (Full Access & User Management)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1">Department</label>
                  <select 
                    value={addFormData.department} onChange={(e) => setAddFormData({...addFormData, department: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Support">Support</option>
                    <option value="Accounts">Accounts</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-surface border border-border font-semibold rounded-xl hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 py-3 bg-[#181B21] border border-slate-700/50 text-white font-bold rounded-xl hover:bg-[#2A2F3A] transition-colors flex items-center justify-center disabled:opacity-70 shadow-sm"
                  >
                    {isAdding ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <span className="flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Create User</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {editUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button 
                onClick={() => setEditUser(null)}
                className="p-2 text-foreground/50 hover:bg-background rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {editError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm text-center font-medium">
                  {editError}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1">Full Name</label>
                  <div className="relative">
                    <UserOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input 
                      type="text" required
                      value={editUser.name} onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input 
                      type="email" required
                      value={editUser.email} onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1">Department</label>
                  <select 
                    value={editUser.department || 'Support'} onChange={(e) => setEditUser({...editUser, department: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Support">Support</option>
                    <option value="Accounts">Accounts</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditUser(null)}
                    className="flex-1 py-3 bg-surface border border-border font-semibold rounded-xl hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isEditing}
                    className="flex-1 py-3 bg-[#181B21] border border-slate-700/50 text-white font-bold rounded-xl hover:bg-[#2A2F3A] transition-colors flex items-center justify-center disabled:opacity-70 shadow-sm"
                  >
                    {isEditing ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteUserConfirmData.isOpen}
        onClose={() => setDeleteUserConfirmData({ isOpen: false, userId: null })}
        onConfirm={async () => {
          if (deleteUserConfirmData.userId) {
            await handleDeleteUser(deleteUserConfirmData.userId);
          }
        }}
        title="Delete User"
        message="Are you sure you want to completely delete this user? This action cannot be undone."
      />
    </div>
  );
};

export default Users;
