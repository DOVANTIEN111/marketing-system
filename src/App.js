import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from './supabaseClient';

export default function SimpleMarketingSystem() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [allUsers, setAllUsers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [templates] = useState([
    { id: 1, name: 'Facebook Ads Campaign', tasks: ['Thiết kế creative', 'Viết copy', 'Setup ads', 'Launch'], team: 'Performance' },
    { id: 2, name: 'Blog Weekly', tasks: ['Research', 'Viết bài', 'Thiết kế ảnh', 'SEO', 'Đăng bài'], team: 'Content' },
    { id: 3, name: 'Social Daily', tasks: ['Tạo content', 'Thiết kế', 'Lên lịch'], team: 'Content' }
  ]);

  const [automations, setAutomations] = useState([
    { id: 1, name: 'Auto-approve', trigger: 'Task hoàn thành', action: 'Chuyển Chờ Duyệt', active: true },
    { id: 2, name: 'Nhắc deadline', trigger: 'Trước 24h', action: 'Gửi Slack', active: true },
    { id: 3, name: 'Task quá hạn', trigger: 'Quá deadline', action: 'Email Manager', active: false }
  ]);

  const [integrations, setIntegrations] = useState({
    calendar: { on: false, email: '' },
    facebook: { on: false, page: '' },
    slack: { on: false, channel: '' }
  });

  // ===================
  // SUPABASE FUNCTIONS
  // ===================

  // Load data from Supabase on mount
  useEffect(() => {
    loadUsers();
    loadTasks();
    
    // Subscribe to realtime task changes
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        () => loadTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedTasks = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        assignee: task.assignee,
        team: task.team,
        status: task.status,
        dueDate: task.due_date,
        platform: task.platform,
        isOverdue: task.is_overdue,
        comments: task.comments || [],
        postLinks: task.post_links || [],
        priority: task.priority,
        description: task.description
      }));
      
      setTasks(formattedTasks);
      setLoading(false);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setLoading(false);
    }
  };

  const changeStatus = async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      
      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('❌ Lỗi khi cập nhật trạng thái!');
    }
  };

  const createNewTask = async (title, platform, priority, dueDate, description) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title,
          assignee: currentUser.name,
          team: currentUser.team,
          status: 'Nháp',
          due_date: dueDate,
          platform,
          priority,
          description,
          is_overdue: false,
          comments: [],
          post_links: []
        }]);
      
      if (error) throw error;
      
      alert('✅ Đã tạo task mới!');
      setShowCreateTaskModal(false);
      await loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('❌ Lỗi khi tạo task!');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (taskId, commentText) => {
    if (!commentText.trim()) return;
    
    try {
      const task = tasks.find(t => t.id === taskId);
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 16).replace('T', ' ');
      
      const newComments = [...(task.comments || []), { 
        user: currentUser.name, 
        text: commentText, 
        time: timeStr 
      }];
      
      const { error } = await supabase
        .from('tasks')
        .update({ comments: newComments })
        .eq('id', taskId);
      
      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, comments: newComments } : t));
      
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, comments: newComments });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('❌ Lỗi khi thêm comment!');
    }
  };

  const addPostLink = async (taskId, url, type) => {
    if (!url.trim()) return;
    
    try {
      const task = tasks.find(t => t.id === taskId);
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 16).replace('T', ' ');
      
      const newLink = {
        url,
        type: type || 'Other',
        addedBy: currentUser.name,
        addedAt: timeStr
      };
      
      const newPostLinks = [...(task.postLinks || []), newLink];
      
      const { error } = await supabase
        .from('tasks')
        .update({ post_links: newPostLinks })
        .eq('id', taskId);
      
      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, postLinks: newPostLinks } : t));
      
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, postLinks: newPostLinks });
      }
    } catch (error) {
      console.error('Error adding post link:', error);
      alert('❌ Lỗi khi thêm link!');
    }
  };

  const removePostLink = async (taskId, linkIndex) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const newPostLinks = (task.postLinks || []).filter((_, i) => i !== linkIndex);
      
      const { error } = await supabase
        .from('tasks')
        .update({ post_links: newPostLinks })
        .eq('id', taskId);
      
      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, postLinks: newPostLinks } : t));
      
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, postLinks: newPostLinks });
      }
    } catch (error) {
      console.error('Error removing post link:', error);
      alert('❌ Lỗi khi xóa link!');
    }
  };

  const createFromTemplate = async (template) => {
    try {
      setLoading(true);
      const assignee = allUsers.find(u => u.team === template.team)?.name || currentUser.name;
      
      const newTasks = template.tasks.map((title, i) => ({
        title,
        assignee,
        team: template.team,
        status: 'Nháp',
        due_date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
        platform: 'Campaign',
        is_overdue: false,
        comments: [],
        post_links: []
      }));
      
      const { error } = await supabase
        .from('tasks')
        .insert(newTasks);
      
      if (error) throw error;
      
      alert(`✅ Tạo ${newTasks.length} tasks từ "${template.name}"`);
      await loadTasks();
    } catch (error) {
      console.error('Error creating from template:', error);
      alert('❌ Lỗi khi tạo từ template!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
      
      if (error || !data) {
        alert('❌ Sai email hoặc mật khẩu!');
        return;
      }
      
      setCurrentUser(data);
      setIsLoggedIn(true);
      setShowLoginModal(false);
    } catch (error) {
      console.error('Error logging in:', error);
      alert('❌ Lỗi khi đăng nhập!');
    }
  };

  const handleRegister = async (name, email, password, team, role) => {
    if (!name || !email || !password || !team || !role) {
      alert('❌ Vui lòng điền đầy đủ thông tin!');
      return;
    }
    
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();
      
      if (existing) {
        alert('❌ Email đã tồn tại!');
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .insert([{ name, email, password, team, role }]);
      
      if (error) throw error;
      
      alert('✅ Đăng ký thành công! Vui lòng đăng nhập.');
      setShowRegisterModal(false);
      setShowLoginModal(true);
      await loadUsers();
    } catch (error) {
      console.error('Error registering:', error);
      alert('❌ Lỗi khi đăng ký!');
    }
  };

  // PHÂN QUYỀN: Lọc tasks theo role
  const visibleTasks = useMemo(() => {
    if (!currentUser) return tasks;
    
    if (currentUser.role === 'Manager') {
      return tasks;
    } else if (currentUser.role === 'Team Lead') {
      return tasks.filter(t => t.team === currentUser.team);
    } else {
      return tasks.filter(t => t.assignee === currentUser.name);
    }
  }, [currentUser, tasks]);

  const reportData = useMemo(() => {
    const tasksToUse = visibleTasks;
    const statusStats = [
      { name: 'Nháp', value: tasksToUse.filter(t => t.status === 'Nháp').length, color: '#9ca3af' },
      { name: 'Chờ Duyệt', value: tasksToUse.filter(t => t.status === 'Chờ Duyệt').length, color: '#f59e0b' },
      { name: 'Đã Duyệt', value: tasksToUse.filter(t => t.status === 'Đã Duyệt').length, color: '#10b981' },
      { name: 'Đang Làm', value: tasksToUse.filter(t => t.status === 'Đang Làm').length, color: '#3b82f6' },
      { name: 'Hoàn Thành', value: tasksToUse.filter(t => t.status === 'Hoàn Thành').length, color: '#6b7280' }
    ].filter(s => s.value > 0);

    const teamStats = ['Content', 'Design', 'Performance'].map(t => ({
      name: t,
      completed: tasksToUse.filter(x => x.team === t && x.status === 'Hoàn Thành').length,
      inProgress: tasksToUse.filter(x => x.team === t && x.status === 'Đang Làm').length
    }));

    return { statusStats, teamStats };
  }, [visibleTasks]);

  const getStatusColor = (s) => {
    const c = { 'Nháp': 'bg-gray-200 text-gray-700', 'Chờ Duyệt': 'bg-yellow-200 text-yellow-800', 'Đã Duyệt': 'bg-green-200 text-green-800', 'Đang Làm': 'bg-blue-200 text-blue-800', 'Hoàn Thành': 'bg-gray-300 text-gray-600' };
    return c[s] || 'bg-gray-200';
  };

  const getTeamColor = (t) => {
    const c = { 'Content': 'bg-blue-100 text-blue-700', 'Design': 'bg-purple-100 text-purple-700', 'Performance': 'bg-green-100 text-green-700' };
    return c[t] || 'bg-gray-100';
  };

  const LoginModal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6">🔐 Đăng Nhập</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="******"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <div className="font-medium mb-1">💡 Tài khoản demo:</div>
              <div className="text-xs text-gray-600">
                Manager: a@company.com / 123456<br />
                Team Lead: b@company.com / 123456<br />
                Member: c@company.com / 123456
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => handleLogin(email, password)}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Đăng Nhập
              </button>
            </div>
            <div className="text-center text-sm">
              Chưa có tài khoản?{' '}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setShowRegisterModal(true);
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RegisterModal = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [team, setTeam] = useState('');
    const [role, setRole] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6">📝 Đăng Ký Tài Khoản</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Họ tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="******"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Team</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn team</option>
                <option value="Content">Content</option>
                <option value="Design">Design</option>
                <option value="Performance">Performance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vai trò</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn vai trò</option>
                <option value="Member">Member</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => handleRegister(name, email, password, team, role)}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Đăng Ký
              </button>
            </div>
            <div className="text-center text-sm">
              Đã có tài khoản?{' '}
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setShowLoginModal(true);
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MyTasksView = () => {
    const myTasks = tasks.filter(t => t.assignee === currentUser.name);
    
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">📝 Công việc của tôi</h2>
          <p className="text-gray-600">
            {myTasks.length} task • {myTasks.filter(t => t.status === 'Hoàn Thành').length} hoàn thành
          </p>
        </div>

        <div className="grid gap-4">
          {myTasks.map(task => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setShowModal(true);
              }}
              className={`bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all cursor-pointer border-l-4 ${
                task.isOverdue ? 'border-red-500' : 'border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{task.title}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTeamColor(task.team)}`}>
                      {task.team}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      📅 {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>
              
              {task.isOverdue && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <span className="text-red-700 font-medium">⚠️ Quá hạn!</span>
                </div>
              )}
            </div>
          ))}

          {myTasks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-gray-600">Bạn chưa có task nào được giao!</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DashboardView = () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Xin chào, {currentUser.name}! 👋</h2>
        <p className="text-gray-600">{currentUser.role} • {currentUser.team} Team</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { l: 'Tổng Tasks', v: visibleTasks.length, i: '📊', c: 'blue' },
          { l: 'Hoàn Thành', v: visibleTasks.filter(t => t.status === 'Hoàn Thành').length, i: '✅', c: 'green' },
          { l: 'Đang Làm', v: visibleTasks.filter(t => t.status === 'Đang Làm').length, i: '⏳', c: 'yellow' },
          { l: 'Quá Hạn', v: visibleTasks.filter(t => t.isOverdue).length, i: '⚠️', c: 'red' }
        ].map((s, i) => (
          <div key={i} className={`bg-${s.c}-50 p-6 rounded-xl border-2 border-${s.c}-200`}>
            <div className="text-3xl mb-2">{s.i}</div>
            <div className="text-3xl font-bold mb-1">{s.v}</div>
            <div className="text-sm text-gray-600">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Chi tiết các trạng thái */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-bold mb-4">📋 Chi Tiết Trạng Thái</h3>
        <div className="grid md:grid-cols-5 gap-4">
          {[
            { status: 'Nháp', icon: '📝', color: 'bg-gray-100 text-gray-700' },
            { status: 'Chờ Duyệt', icon: '⏳', color: 'bg-yellow-100 text-yellow-700' },
            { status: 'Đã Duyệt', icon: '👍', color: 'bg-green-100 text-green-700' },
            { status: 'Đang Làm', icon: '🔨', color: 'bg-blue-100 text-blue-700' },
            { status: 'Hoàn Thành', icon: '✅', color: 'bg-purple-100 text-purple-700' }
          ].map(item => {
            const count = visibleTasks.filter(t => t.status === item.status).length;
            const percentage = visibleTasks.length > 0 ? Math.round((count / visibleTasks.length) * 100) : 0;
            
            return (
              <div key={item.status} className={`${item.color} p-4 rounded-lg`}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-2xl font-bold mb-1">{count}</div>
                <div className="text-xs font-medium mb-1">{item.status}</div>
                <div className="text-xs opacity-75">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4">📊 Trạng thái Tasks</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportData.statusStats} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {reportData.statusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4">👥 Hiệu suất Team</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.teamStats}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Hoàn thành" />
                <Bar dataKey="inProgress" fill="#3b82f6" name="Đang làm" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-bold mb-4">🎯 Tasks Gần Nhất</h3>
        <div className="space-y-3">
          {visibleTasks.slice(0, 5).map(task => (
            <div 
              key={task.id} 
              onClick={() => {
                setSelectedTask(task);
                setShowModal(true);
              }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-gray-600">{task.assignee} • {task.team}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                <span className="text-sm text-gray-500">{task.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TasksView = () => {
    const [filterTeam, setFilterTeam] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredTasks = visibleTasks.filter(t => {
      if (filterTeam !== 'all' && t.team !== filterTeam) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">📋 Quản Lý Tasks</h2>
          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            ➕ Tạo Task Mới
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-sm font-medium mb-2 block">Team</label>
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="Content">Content</option>
                <option value="Design">Design</option>
                <option value="Performance">Performance</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="Nháp">Nháp</option>
                <option value="Chờ Duyệt">Chờ Duyệt</option>
                <option value="Đã Duyệt">Đã Duyệt</option>
                <option value="Đang Làm">Đang Làm</option>
                <option value="Hoàn Thành">Hoàn Thành</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setShowModal(true);
              }}
              className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{task.title}</h3>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTeamColor(task.team)}`}>
                      {task.team}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      👤 {task.assignee}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      📅 {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>
              {task.isOverdue && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <span className="text-red-700 font-medium">⚠️ Quá hạn!</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CalendarView = () => {
    const today = new Date();
    const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">📅 Lịch Tasks</h2>
        
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">{monthNames[today.getMonth()]} {today.getFullYear()}</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">◀ Trước</button>
              <button className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Sau ▶</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center font-bold py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 2;
              const date = new Date(today.getFullYear(), today.getMonth(), day);
              const dateStr = date.toISOString().split('T')[0];
              const dayTasks = visibleTasks.filter(t => t.dueDate === dateStr);
              
              return (
                <div
                  key={i}
                  className={`min-h-24 p-2 border rounded-lg ${
                    day === today.getDate() ? 'bg-blue-50 border-blue-500' : 'bg-white'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{day > 0 && day <= 31 ? day : ''}</div>
                  {dayTasks.slice(0, 2).map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowModal(true);
                      }}
                      className={`text-xs p-1 rounded mb-1 cursor-pointer ${getStatusColor(task.status)}`}
                    >
                      {task.title.substring(0, 15)}...
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayTasks.length - 2} nữa</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4">📌 Tasks Sắp Tới</h3>
          <div className="space-y-3">
            {visibleTasks
              .filter(t => new Date(t.dueDate) >= today)
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
              .slice(0, 5)
              .map(task => (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowModal(true);
                  }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-600">{task.assignee}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className="text-sm">{task.dueDate}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };


  const ReportView = () => {
    // State cho filter thời gian
    const [dateRange, setDateRange] = useState('30days'); // '7days', '30days', 'custom'
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Hàm tính toán khoảng thời gian
    const getDateRange = () => {
      const today = new Date();
      let startDate, endDate;

      if (dateRange === 'today') {
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
      } else if (dateRange === '7days') {
        endDate = new Date();
        startDate = new Date(today.setDate(today.getDate() - 7));
      } else if (dateRange === '30days') {
        endDate = new Date();
        startDate = new Date(today.setDate(today.getDate() - 30));
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Mặc định 30 ngày
        endDate = new Date();
        startDate = new Date(today.setDate(today.getDate() - 30));
      }

      return { startDate, endDate };
    };

    // Lọc tasks theo khoảng thời gian
    const filteredTasks = useMemo(() => {
      const { startDate, endDate } = getDateRange();
      
      return visibleTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= startDate && taskDate <= endDate;
      });
    }, [visibleTasks, dateRange, customStartDate, customEndDate]);

    // Tính toán stats từ filtered tasks
    const filteredReportData = useMemo(() => {
      const statusStats = [
        { name: 'Nháp', value: filteredTasks.filter(t => t.status === 'Nháp').length, color: '#9ca3af' },
        { name: 'Chờ Duyệt', value: filteredTasks.filter(t => t.status === 'Chờ Duyệt').length, color: '#f59e0b' },
        { name: 'Đã Duyệt', value: filteredTasks.filter(t => t.status === 'Đã Duyệt').length, color: '#10b981' },
        { name: 'Đang Làm', value: filteredTasks.filter(t => t.status === 'Đang Làm').length, color: '#3b82f6' },
        { name: 'Hoàn Thành', value: filteredTasks.filter(t => t.status === 'Hoàn Thành').length, color: '#6b7280' }
      ].filter(s => s.value > 0);

      const teamStats = ['Content', 'Design', 'Performance'].map(t => ({
        name: t,
        completed: filteredTasks.filter(x => x.team === t && x.status === 'Hoàn Thành').length,
        inProgress: filteredTasks.filter(x => x.team === t && x.status === 'Đang Làm').length
      }));

      return { statusStats, teamStats };
    }, [filteredTasks]);

    // Tính toán % so với kỳ trước
    const compareWithPrevious = useMemo(() => {
      const { startDate, endDate } = getDateRange();
      const duration = endDate - startDate;
      const prevStartDate = new Date(startDate.getTime() - duration);
      const prevEndDate = new Date(startDate.getTime() - 1);

      const currentCompleted = filteredTasks.filter(t => t.status === 'Hoàn Thành').length;
      const prevCompleted = visibleTasks.filter(t => {
        const taskDate = new Date(t.dueDate);
        return taskDate >= prevStartDate && taskDate <= prevEndDate && t.status === 'Hoàn Thành';
      }).length;

      const change = prevCompleted === 0 ? 100 : ((currentCompleted - prevCompleted) / prevCompleted) * 100;
      
      return {
        current: currentCompleted,
        previous: prevCompleted,
        change: Math.round(change)
      };
    }, [filteredTasks, visibleTasks, dateRange, customStartDate, customEndDate]);

    return (
      <div className="p-6 space-y-6">
        {/* Header với Date Range Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">📈 Báo Cáo & Phân Tích</h2>
            <p className="text-sm text-gray-600 mt-1">
              Dữ liệu từ {filteredTasks.length} tasks trong khoảng thời gian đã chọn
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateRange('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📅 Hôm nay
            </button>
            <button
              onClick={() => setDateRange('7days')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === '7days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📅 7 ngày
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === '30days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📅 30 ngày
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              🔧 Tùy chỉnh
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {dateRange === 'custom' && (
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Từ ngày:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Đến ngày:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards với So sánh */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">✅</div>
              {compareWithPrevious.change !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  compareWithPrevious.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {compareWithPrevious.change > 0 ? '↑' : '↓'} {Math.abs(compareWithPrevious.change)}%
                </div>
              )}
            </div>
            <div className="text-3xl font-bold mb-1">
              {filteredTasks.filter(t => t.status === 'Hoàn Thành').length}
            </div>
            <div className="text-sm text-gray-600">Tasks Hoàn Thành</div>
            <div className="text-xs text-gray-400 mt-1">
              Kỳ trước: {compareWithPrevious.previous}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-3xl font-bold mb-1">
              {filteredTasks.length > 0 
                ? Math.round((filteredTasks.filter(t => t.status === 'Hoàn Thành').length / filteredTasks.length) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Tỷ Lệ Hoàn Thành</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-3xl font-bold mb-1">
              {filteredTasks.filter(t => t.isOverdue).length}
            </div>
            <div className="text-sm text-gray-600">Tasks Quá Hạn</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold mb-4">📊 Phân Bố Trạng Thái</h3>
            {filteredReportData.statusStats.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={filteredReportData.statusStats} 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={100} 
                      dataKey="value" 
                      label
                    >
                      {filteredReportData.statusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                Không có dữ liệu trong khoảng thời gian này
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold mb-4">👥 Hiệu Suất Theo Team</h3>
            {filteredTasks.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredReportData.teamStats}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#10b981" name="Hoàn thành" />
                    <Bar dataKey="inProgress" fill="#3b82f6" name="Đang làm" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                Không có dữ liệu trong khoảng thời gian này
              </div>
            )}
          </div>
        </div>

        {/* Top Performers trong khoảng thời gian */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4">🏆 Top Performers (Trong Kỳ)</h3>
          <div className="space-y-3">
            {Object.entries(
              filteredTasks
                .filter(t => t.status === 'Hoàn Thành')
                .reduce((acc, t) => {
                  acc[t.assignee] = (acc[t.assignee] || 0) + 1;
                  return acc;
                }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count], i) => (
                <div key={name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}</div>
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-gray-600">
                        {allUsers.find(u => u.name === name)?.team}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              ))}
            {filteredTasks.filter(t => t.status === 'Hoàn Thành').length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Chưa có task nào hoàn thành trong khoảng thời gian này
              </div>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-lg font-bold mb-4">📋 Tổng Quan Theo Thời Gian</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Tổng Tasks</div>
              <div className="text-2xl font-bold">{filteredTasks.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Hoàn Thành</div>
              <div className="text-2xl font-bold text-green-600">
                {filteredTasks.filter(t => t.status === 'Hoàn Thành').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Đang Làm</div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredTasks.filter(t => t.status === 'Đang Làm').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Tỷ Lệ Thành Công</div>
              <div className="text-2xl font-bold text-purple-600">
                {filteredTasks.length > 0 
                  ? Math.round((filteredTasks.filter(t => t.status === 'Hoàn Thành').length / filteredTasks.length) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const IntegrationsView = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">🔗 Tích Hợp</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { name: 'Google Calendar', key: 'calendar', icon: '📅', desc: 'Đồng bộ deadline lên Calendar' },
          { name: 'Facebook Pages', key: 'facebook', icon: '📘', desc: 'Quản lý đăng bài Facebook' },
          { name: 'Slack', key: 'slack', icon: '💬', desc: 'Nhận thông báo qua Slack' }
        ].map(int => (
          <div key={int.key} className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{int.icon}</div>
                <div>
                  <h3 className="font-bold">{int.name}</h3>
                  <p className="text-sm text-gray-600">{int.desc}</p>
                </div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={integrations[int.key].on}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      [int.key]: { ...integrations[int.key], on: e.target.checked }
                    })
                  }
                  className="sr-only peer"
                />
                <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors" />
                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6" />
              </label>
            </div>
            {integrations[int.key].on && (
              <input
                type="text"
                placeholder={`Nhập ${int.key === 'calendar' ? 'email' : int.key === 'facebook' ? 'Page ID' : 'Slack channel'}`}
                value={integrations[int.key][int.key === 'calendar' ? 'email' : int.key === 'facebook' ? 'page' : 'channel']}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    [int.key]: { ...integrations[int.key], [int.key === 'calendar' ? 'email' : int.key === 'facebook' ? 'page' : 'channel']: e.target.value }
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const AutomationView = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">⚙️ Automation</h2>
      
      <div className="space-y-4">
        {automations.map(auto => (
          <div key={auto.id} className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{auto.name}</h3>
                <div className="text-sm text-gray-600 mt-1">
                  Khi: <span className="font-medium">{auto.trigger}</span> → 
                  Thực hiện: <span className="font-medium">{auto.action}</span>
                </div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={auto.active}
                  onChange={(e) =>
                    setAutomations(
                      automations.map(a =>
                        a.id === auto.id ? { ...a, active: e.target.checked } : a
                      )
                    )
                  }
                  className="sr-only peer"
                />
                <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full peer-checked:bg-green-600 transition-colors" />
                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6" />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white p-6 rounded-xl shadow">
        <h3 className="font-bold text-lg mb-4">📋 Templates</h3>
        <div className="space-y-3">
          {templates.map(template => (
            <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-gray-600">{template.tasks.length} tasks • {template.team}</div>
              </div>
              <button
                onClick={() => createFromTemplate(template)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sử dụng
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Data - Chỉ Manager mới thấy */}
      {currentUser && currentUser.role === 'Manager' && (
        <div className="mt-6 bg-red-50 border-2 border-red-200 p-6 rounded-xl">
          <h3 className="font-bold text-lg mb-2 text-red-700">⚠️ Khu Vực Nguy Hiểm</h3>
          <p className="text-sm text-gray-700 mb-4">
            Xóa toàn bộ dữ liệu và khôi phục về mặc định. Hành động này KHÔNG THỂ hoàn tác!
          </p>
          <button
            onClick={() => {
              // eslint-disable-next-line no-restricted-globals
              if (confirm('⚠️ BẠN CÓ CHẮC CHẮN?\n\nĐiều này sẽ:\n- Xóa TẤT CẢ tasks\n- Xóa TẤT CẢ tài khoản đã tạo\n- Khôi phục về dữ liệu mặc định\n\nHành động này KHÔNG THỂ hoàn tác!')) {
                // eslint-disable-next-line no-restricted-globals
                if (confirm('⚠️ XÁC NHẬN LẦN CUỐI!\n\nBạn THỰC SỰ muốn xóa toàn bộ dữ liệu?')) {
                  // Reset về default
                  setAllUsers(defaultUsers);
                  setTasks(defaultTasks);
                  localStorage.removeItem('allUsers');
                  localStorage.removeItem('tasks');
                  alert('✅ Đã khôi phục dữ liệu về mặc định!');
                  window.location.reload();
                }
              }
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            🗑️ Reset Toàn Bộ Dữ Liệu
          </button>
        </div>
      )}
    </div>
  );

  const CreateTaskModal = () => {
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState('');
    const [priority, setPriority] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-6 border-b">
            <h2 className="text-2xl font-bold">➕ Tạo Task Mới</h2>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tiêu đề *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Viết bài blog về sản phẩm mới"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform *</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn platform</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Blog">Blog</option>
                  <option value="Ads">Ads</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Độ ưu tiên *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn độ ưu tiên</option>
                  <option value="Thấp">Thấp</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Cao">Cao</option>
                  <option value="Khẩn cấp">Khẩn cấp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deadline *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết công việc..."
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 sticky bottom-0">
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!title || !platform || !priority || !dueDate) {
                    alert('⚠️ Vui lòng điền đầy đủ thông tin bắt buộc!');
                    return;
                  }
                  createNewTask(title, platform, priority, dueDate, description);
                }}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                ✅ Tạo Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TaskModal = () => {
    // Di chuyển tất cả hooks lên đầu component, TRƯỚC bất kỳ early return nào
    const [newComment, setNewComment] = useState('');
    const [newPostLink, setNewPostLink] = useState('');
    const [linkType, setLinkType] = useState('');
    const [showAddLink, setShowAddLink] = useState(false);

    // Sau khi đã khai báo hooks, mới kiểm tra điều kiện
    if (!selectedTask) return null;

    const getPlatformIcon = (type) => {
      const icons = {
        'Facebook': '📘',
        'Instagram': '📸',
        'TikTok': '🎵',
        'YouTube': '📺',
        'Blog': '📝',
        'Other': '🔗'
      };
      return icons[type] || '🔗';
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white sticky top-0 z-10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{selectedTask.title}</h2>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                    👤 {selectedTask.assignee}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                    🏢 {selectedTask.team}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                    📅 {selectedTask.dueDate}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                    📱 {selectedTask.platform}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-2xl ml-4"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                🔗 Links Đã Đăng
                {selectedTask.postLinks && selectedTask.postLinks.length > 0 && (
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {selectedTask.postLinks.length}
                  </span>
                )}
              </h4>

              {selectedTask.postLinks && selectedTask.postLinks.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {selectedTask.postLinks.map((link, index) => (
                    <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getPlatformIcon(link.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm">{link.type}</span>
                            <span className="text-xs text-gray-500">
                              • Thêm bởi {link.addedBy} • {link.addedAt}
                            </span>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm break-all block mb-2"
                          >
                            {link.url}
                          </a>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(link.url);
                                alert('✅ Đã copy link!');
                              }}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                            >
                              📋 Copy Link
                            </button>
                            {(currentUser.name === link.addedBy || currentUser.role === 'Manager') && (
                              <button
                                onClick={() => {
                                  // eslint-disable-next-line no-restricted-globals
                                  if (confirm('Xóa link này?')) {
                                    removePostLink(selectedTask.id, index);
                                  }
                                }}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                              >
                                🗑️ Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg mb-4">
                  <div className="text-gray-400 text-sm">Chưa có link nào được thêm</div>
                </div>
              )}

              <button
                onClick={() => setShowAddLink(!showAddLink)}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                {showAddLink ? '❌ Hủy' : '➕ Thêm Link Mới'}
              </button>

              {showAddLink && (
                <div className="mt-4 bg-white border-2 border-green-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Loại Platform:</label>
                      <select
                        value={linkType}
                        onChange={(e) => setLinkType(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Chọn platform</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Blog">Blog</option>
                        <option value="Other">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">URL:</label>
                      <input
                        type="url"
                        value={newPostLink}
                        onChange={(e) => setNewPostLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (newPostLink.trim() && linkType) {
                          addPostLink(selectedTask.id, newPostLink, linkType);
                          setNewPostLink('');
                          setLinkType('');
                          setShowAddLink(false);
                        } else {
                          alert('⚠️ Vui lòng chọn platform và nhập URL!');
                        }
                      }}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                      ✅ Thêm Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-bold mb-3">🔄 Thay Đổi Trạng Thái</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['Nháp', 'Chờ Duyệt', 'Đã Duyệt', 'Đang Làm', 'Hoàn Thành'].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      changeStatus(selectedTask.id, s);
                      setSelectedTask({ ...selectedTask, status: s });
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedTask.status === s
                        ? `${getStatusColor(s)} ring-2 ring-offset-2 ring-blue-500 scale-105`
                        : `${getStatusColor(s)} opacity-50 hover:opacity-100`
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-bold">💬 Nhận Xét & Feedback</h5>
                <span className="text-sm text-gray-500">
                  {selectedTask.comments?.length || 0} nhận xét
                </span>
              </div>

              {selectedTask.comments && selectedTask.comments.length > 0 ? (
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {selectedTask.comments.map((comment, index) => (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {comment.user === currentUser.name ? '👤' : '👨‍💼'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm">
                              {comment.user}
                              {comment.user === currentUser.name && ' (Bạn)'}
                            </span>
                            <span className="text-xs text-gray-500">• {comment.time}</span>
                          </div>
                          <div className="text-sm text-gray-700 bg-white p-3 rounded-lg">
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg mb-4">
                  <div className="text-gray-400 text-sm">Chưa có nhận xét nào</div>
                </div>
              )}

              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <div className="font-medium text-sm mb-2">✍️ Thêm nhận xét:</div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`${currentUser.role === 'Manager' ? 'Nhận xét của bạn về task này...' : 'Cập nhật tiến độ, ghi chú...'}`}
                  rows="3"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs text-gray-500">
                    💡 {currentUser.role === 'Manager' ? 'Admin/Manager có thể để lại feedback chi tiết' : 'Cập nhật tiến độ công việc của bạn'}
                  </div>
                  <button
                    onClick={() => {
                      if (newComment.trim()) {
                        addComment(selectedTask.id, newComment);
                        setNewComment('');
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    💬 Gửi
                  </button>
                </div>
              </div>

              {currentUser.role === 'Manager' && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-800 mb-2">⚡ Phê duyệt nhanh:</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        changeStatus(selectedTask.id, 'Đã Duyệt');
                        setSelectedTask({ ...selectedTask, status: 'Đã Duyệt' });
                        addComment(selectedTask.id, '✅ Đã duyệt! Công việc làm tốt.');
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      ✅ Phê Duyệt
                    </button>
                    <button
                      onClick={() => {
                        changeStatus(selectedTask.id, 'Cần Sửa');
                        setSelectedTask({ ...selectedTask, status: 'Cần Sửa' });
                        if (newComment.trim()) {
                          addComment(selectedTask.id, newComment);
                          setNewComment('');
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                    >
                      🔄 Yêu Cầu Sửa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 sticky bottom-0">
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  alert('✅ Đã lưu thay đổi!');
                  setShowModal(false);
                }}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                💾 Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">🎯 Marketing System</h1>
            <p className="text-gray-600">Quản lý team marketing hiệu quả</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-lg"
            >
              🔐 Đăng Nhập
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="w-full px-6 py-4 bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 rounded-xl font-medium text-lg"
            >
              📝 Đăng Ký
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium mb-2">✨ Tính năng:</div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Quản lý tasks & deadline</li>
              <li>✅ Theo dõi tiến độ team</li>
              <li>✅ Báo cáo & phân tích</li>
              <li>✅ Automation & templates</li>
            </ul>
          </div>
        </div>

        {showLoginModal && <LoginModal />}
        {showRegisterModal && <RegisterModal />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🎯 Marketing Management</h1>
            <p className="text-gray-600">Quản lý team hiệu quả</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-sm text-gray-600">{currentUser.role} • {currentUser.team}</div>
            </div>
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setCurrentUser(null);
                setActiveTab('dashboard');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm"
            >
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 flex gap-2 overflow-x-auto">
          {[
            { id: 'mytasks', l: '📝 Của Tôi' },
            { id: 'dashboard', l: '📊 Dashboard' },
            { id: 'tasks', l: '📋 Tasks' },
            { id: 'calendar', l: '📅 Lịch' },
            { id: 'report', l: '📈 Báo Cáo' },
            { id: 'integrations', l: '🔗 Tích Hợp' },
            { id: 'automation', l: '⚙️ Automation' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-6 py-3 font-medium border-b-4 whitespace-nowrap ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'mytasks' && <MyTasksView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'report' && <ReportView />}
        {activeTab === 'integrations' && <IntegrationsView />}
        {activeTab === 'automation' && <AutomationView />}
      </div>

      {showModal && <TaskModal />}
      {showCreateTaskModal && <CreateTaskModal />}
    </div>
  );
}
