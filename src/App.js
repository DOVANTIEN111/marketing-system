import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SimpleMarketingSystem() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const users = [
    { id: 1, name: 'Nguyễn Văn A', team: 'Content', email: 'a@company.com', password: '123456', role: 'Manager' },
    { id: 2, name: 'Trần Thị B', team: 'Content', email: 'b@company.com', password: '123456', role: 'Team Lead' },
    { id: 3, name: 'Lê Văn C', team: 'Design', email: 'c@company.com', password: '123456', role: 'Member' },
    { id: 4, name: 'Phạm Thị D', team: 'Performance', email: 'd@company.com', password: '123456', role: 'Member' }
  ];

  const [allUsers, setAllUsers] = useState(users);

  const [tasks, setTasks] = useState([
    { id: 1, title: 'Viết bài blog sản phẩm', assignee: 'Nguyễn Văn A', team: 'Content', status: 'Chờ Duyệt', dueDate: '2026-01-05', platform: 'Blog', isOverdue: false, comments: [], postLinks: [] },
    { id: 2, title: 'Banner Facebook Tết', assignee: 'Lê Văn C', team: 'Design', status: 'Hoàn Thành', dueDate: '2026-01-03', platform: 'Facebook', isOverdue: false, comments: [{ user: 'Nguyễn Văn A', text: 'Đẹp lắm, approved!', time: '2026-01-02 14:30' }], postLinks: [{ url: 'https://facebook.com/post/123456', type: 'Facebook', addedBy: 'Lê Văn C', addedAt: '2026-01-03 10:00' }] },
    { id: 3, title: 'Ads Q1', assignee: 'Phạm Thị D', team: 'Performance', status: 'Đang Làm', dueDate: '2026-01-10', platform: 'Ads', isOverdue: false, comments: [], postLinks: [] },
    { id: 4, title: 'Video TikTok', assignee: 'Trần Thị B', team: 'Content', status: 'Nháp', dueDate: '2025-12-30', platform: 'TikTok', isOverdue: true, comments: [], postLinks: [] },
    { id: 5, title: 'Instagram story', assignee: 'Trần Thị B', team: 'Content', status: 'Hoàn Thành', dueDate: '2025-12-28', platform: 'Instagram', isOverdue: false, comments: [], postLinks: [{ url: 'https://instagram.com/p/abc123', type: 'Instagram', addedBy: 'Trần Thị B', addedAt: '2025-12-28 15:30' }] }
  ]);

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

  const changeStatus = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const createNewTask = (title, platform, priority, dueDate, description) => {
    const newTask = {
      id: tasks.length + 1,
      title,
      assignee: currentUser.name,
      team: currentUser.team,
      status: 'Nháp',
      dueDate,
      platform,
      priority,
      description,
      isOverdue: false,
      comments: []
    };
    setTasks([...tasks, newTask]);
    alert('✅ Đã tạo task mới!');
    setShowCreateTaskModal(false);
  };

  const addComment = (taskId, commentText) => {
    if (!commentText.trim()) return;
    
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, comments: [...(t.comments || []), { user: currentUser.name, text: commentText, time: timeStr }] }
        : t
    ));
    
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        comments: [...(selectedTask.comments || []), { user: currentUser.name, text: commentText, time: timeStr }]
      });
    }
  };

  const addPostLink = (taskId, url, type) => {
    if (!url.trim()) return;
    
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newLink = {
      url,
      type: type || 'Other',
      addedBy: currentUser.name,
      addedAt: timeStr
    };
    
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, postLinks: [...(t.postLinks || []), newLink] }
        : t
    ));
    
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        postLinks: [...(selectedTask.postLinks || []), newLink]
      });
    }
  };

  const removePostLink = (taskId, linkIndex) => {
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, postLinks: (t.postLinks || []).filter((_, i) => i !== linkIndex) }
        : t
    ));
    
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        postLinks: (selectedTask.postLinks || []).filter((_, i) => i !== linkIndex)
      });
    }
  };

  const createFromTemplate = (template) => {
    const newTasks = template.tasks.map((title, i) => ({
      id: tasks.length + i + 1,
      title,
      assignee: allUsers.find(u => u.team === template.team)?.name,
      team: template.team,
      status: 'Nháp',
      dueDate: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
      platform: 'Campaign',
      isOverdue: false
    }));
    setTasks([...tasks, ...newTasks]);
    alert(`✅ Tạo ${newTasks.length} tasks từ "${template.name}"`);
  };

  const reportData = useMemo(() => {
    const statusStats = [
      { name: 'Nháp', value: tasks.filter(t => t.status === 'Nháp').length, color: '#9ca3af' },
      { name: 'Chờ Duyệt', value: tasks.filter(t => t.status === 'Chờ Duyệt').length, color: '#f59e0b' },
      { name: 'Đã Duyệt', value: tasks.filter(t => t.status === 'Đã Duyệt').length, color: '#10b981' },
      { name: 'Đang Làm', value: tasks.filter(t => t.status === 'Đang Làm').length, color: '#3b82f6' },
      { name: 'Hoàn Thành', value: tasks.filter(t => t.status === 'Hoàn Thành').length, color: '#6b7280' }
    ].filter(s => s.value > 0);

    const teamStats = ['Content', 'Design', 'Performance'].map(t => ({
      name: t,
      completed: tasks.filter(x => x.team === t && x.status === 'Hoàn Thành').length,
      inProgress: tasks.filter(x => x.team === t && x.status === 'Đang Làm').length
    }));

    return { statusStats, teamStats };
  }, [tasks]);

  const getStatusColor = (s) => {
    const c = { 'Nháp': 'bg-gray-200 text-gray-700', 'Chờ Duyệt': 'bg-yellow-200 text-yellow-800', 'Đã Duyệt': 'bg-green-200 text-green-800', 'Đang Làm': 'bg-blue-200 text-blue-800', 'Hoàn Thành': 'bg-gray-300 text-gray-600' };
    return c[s] || 'bg-gray-200';
  };

  const getTeamColor = (t) => {
    const c = { 'Content': 'bg-blue-100 text-blue-700', 'Design': 'bg-purple-100 text-purple-700', 'Performance': 'bg-green-100 text-green-700' };
    return c[t] || 'bg-gray-100';
  };

  const handleLogin = (email, password) => {
    const user = allUsers.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setShowLoginModal(false);
      alert(`✅ Đăng nhập thành công! Chào mừng ${user.name}`);
    } else {
      alert('❌ Email hoặc mật khẩu không đúng!');
    }
  };

  const handleRegister = (name, email, password, team) => {
    if (!name || !email || !password || !team) {
      alert('❌ Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (allUsers.find(u => u.email === email)) {
      alert('❌ Email đã tồn tại!');
      return;
    }
    const newUser = {
      id: allUsers.length + 1,
      name,
      email,
      password,
      team,
      role: 'Member'
    };
    setAllUsers([...allUsers, newUser]);
    alert(`✅ Đăng ký thành công! Bạn có thể đăng nhập với email: ${email}`);
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  const LoginModal = () => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6 text-center">🔐 Đăng Nhập</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mật khẩu</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="******"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => handleLogin(email, pass)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium text-lg"
            >
              Đăng Nhập
            </button>
            <div className="text-center">
              <button
                onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
                className="text-blue-600 hover:underline text-sm"
              >
                Chưa có tài khoản? Đăng ký ngay
              </button>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 font-medium mb-2">💡 Tài khoản demo:</div>
            <div className="text-xs text-gray-600">Email: a@company.com</div>
            <div className="text-xs text-gray-600">Pass: 123456</div>
          </div>
        </div>
      </div>
    );
  };

  const RegisterModal = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [team, setTeam] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6 text-center">📝 Đăng Ký Tài Khoản</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mật khẩu</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="******"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chọn Team</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn team --</option>
                <option value="Content">Content</option>
                <option value="Design">Design</option>
                <option value="Performance">Performance</option>
              </select>
            </div>
            <button
              onClick={() => handleRegister(name, email, pass, team)}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium text-lg"
            >
              Đăng Ký
            </button>
            <div className="text-center">
              <button
                onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                className="text-blue-600 hover:underline text-sm"
              >
                Đã có tài khoản? Đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const WelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <div className="text-6xl mb-6">🎯</div>
        <h1 className="text-4xl font-bold mb-4">Marketing Management System</h1>
        <p className="text-gray-600 text-lg mb-8">Quản lý team marketing hiệu quả, phê duyệt nhanh chóng</p>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-3xl mb-2">📊</div>
            <div className="font-medium text-sm">Dashboard</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-medium text-sm">Automation</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-3xl mb-2">📈</div>
            <div className="font-medium text-sm">Báo cáo</div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 font-bold text-lg"
          >
            🔐 Đăng Nhập
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 font-bold text-lg"
          >
            📝 Đăng Ký Tài Khoản
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-sm font-medium text-yellow-800 mb-2">💡 Dùng thử ngay với tài khoản demo:</div>
          <div className="text-sm text-yellow-700">Email: <strong>a@company.com</strong> | Pass: <strong>123456</strong></div>
        </div>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <>
        <WelcomeScreen />
        {showLoginModal && <LoginModal />}
        {showRegisterModal && <RegisterModal />}
      </>
    );
  }


  const DashboardView = () => (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Xin chào, <strong>{currentUser.name}</strong>! 👋</div>
            <div className="text-xs text-gray-500">Role: {currentUser.role} | Team: {currentUser.team}</div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm">
            🚪 Đăng xuất
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Tổng Task', v: tasks.length, c: 'blue' },
          { l: 'Chờ Duyệt', v: tasks.filter(t => t.status === 'Chờ Duyệt').length, c: 'yellow' },
          { l: 'Quá Hạn', v: tasks.filter(t => t.isOverdue).length, c: 'red' },
          { l: 'Hoàn Thành', v: tasks.filter(t => t.status === 'Hoàn Thành').length, c: 'green' }
        ].map((item, i) => (
          <div key={i} className={`bg-white p-6 rounded-lg shadow border-l-4 border-${item.c}-500`}>
            <div className="text-gray-600 text-sm">{item.l}</div>
            <div className={`text-3xl font-bold text-${item.c}-600`}>{item.v}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">📊 Tải Công Việc</h3>
        {allUsers.map(u => {
          const count = tasks.filter(t => t.assignee === u.name && t.status !== 'Hoàn Thành').length;
          return (
            <div key={u.id} className="flex items-center gap-4 mb-4">
              <div className="w-40 font-medium">{u.name}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-10 relative">
                <div className={`h-full rounded-full ${count > 3 ? 'bg-red-500' : count > 1 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(count * 20, 100)}%` }} />
                <div className="absolute inset-0 flex items-center justify-center font-medium">{count} task</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">⚠️ Cần Xử Lý Gấp</h3>
        {tasks.filter(t => t.status === 'Chờ Duyệt' || t.isOverdue).map(task => (
          <div key={task.id} onClick={() => { setSelectedTask(task); setShowModal(true); }} className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow mb-3 ${task.isOverdue ? 'bg-red-50 border-red-300' : 'border-gray-200'}`}>
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{task.title}</div>
                <div className="text-sm text-gray-600">👤 {task.assignee} • 📅 {task.dueDate}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TasksView = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b"><h3 className="text-xl font-bold">📋 Danh Sách Tasks</h3></div>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Task</th>
              <th className="px-6 py-3 text-left">Người</th>
              <th className="px-6 py-3 text-left">Nhóm</th>
              <th className="px-6 py-3 text-left">Trạng Thái</th>
              <th className="px-6 py-3 text-left">Hạn</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><div className="font-medium">{t.title}</div><div className="text-sm text-gray-500">{t.platform}</div></td>
                <td className="px-6 py-4">{t.assignee}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-sm ${getTeamColor(t.team)}`}>{t.team}</span></td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(t.status)}`}>{t.status}</span></td>
                <td className="px-6 py-4">{t.isOverdue && '⚠️ '}{t.dueDate}</td>
                <td className="px-6 py-4"><button onClick={() => { setSelectedTask(t); setShowModal(true); }} className="text-blue-600 font-medium">Chi tiết</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const CalendarView = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-2xl font-bold text-center mb-6">📅 Lịch Tháng 1/2026</h3>
        <div className="grid grid-cols-7 gap-2">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => <div key={d} className="text-center font-bold p-2 bg-gray-100">{d}</div>)}
          {[1, 2].map(i => <div key={i} className="border rounded p-2 bg-gray-50 min-h-24" />)}
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <div key={day} className={`border rounded p-2 min-h-24 ${day === 2 ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="font-bold">{day}</div>
              {tasks.filter(t => t.dueDate === `2026-01-${day.toString().padStart(2, '0')}`).map(t => (
                <div key={t.id} onClick={() => { setSelectedTask(t); setShowModal(true); }} className={`text-xs p-1 rounded cursor-pointer mt-1 ${getTeamColor(t.team)}`}>{t.title}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ReportView = () => {
    const [reportMode, setReportMode] = useState('day'); // day, week, month, custom
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    const getDateRange = () => {
      const today = new Date(selectedDate);
      
      if (reportMode === 'day') {
        return { start: selectedDate, end: selectedDate };
      } else if (reportMode === 'week') {
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
          start: monday.toISOString().split('T')[0],
          end: sunday.toISOString().split('T')[0]
        };
      } else if (reportMode === 'month') {
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
        const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
        return { start: firstDay, end: lastDay };
      } else {
        return { start: startDate, end: endDate };
      }
    };

    const dateRange = getDateRange();
    
    const tasksInRange = tasks.filter(t => {
      return t.dueDate >= dateRange.start && t.dueDate <= dateRange.end;
    });
    
    const userTasksInRange = allUsers.map(user => {
      const userTasks = tasksInRange.filter(t => t.assignee === user.name);
      return {
        ...user,
        tasks: userTasks,
        total: userTasks.length,
        completed: userTasks.filter(t => t.status === 'Hoàn Thành').length,
        inProgress: userTasks.filter(t => !['Hoàn Thành', 'Nháp'].includes(t.status)).length,
        draft: userTasks.filter(t => t.status === 'Nháp').length,
        overdue: userTasks.filter(t => t.isOverdue).length
      };
    }).filter(u => u.total > 0);

    const getModeName = () => {
      if (reportMode === 'day') return '📅 Ngày';
      if (reportMode === 'week') return '📆 Tuần';
      if (reportMode === 'month') return '🗓️ Tháng';
      return '📊 Tùy Chỉnh';
    };

    return (
      <div className="p-6 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between mb-4">
            <h3 className="text-2xl font-bold">📊 Báo Cáo Chi Tiết</h3>
            <div className="flex gap-3">
              <button onClick={() => alert('Xuất Excel')} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">📥 Excel</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">📄 PDF</button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-lg border-2 border-blue-200">
          <h4 className="text-xl font-bold mb-4">🎯 Chọn Kỳ Báo Cáo</h4>
          
          <div className="flex gap-2 mb-6">
            {[
              { value: 'day', label: '📅 Ngày', icon: '📅' },
              { value: 'week', label: '📆 Tuần', icon: '📆' },
              { value: 'month', label: '🗓️ Tháng', icon: '🗓️' },
              { value: 'custom', label: '📊 Tùy Chỉnh', icon: '📊' }
            ].map(mode => (
              <button
                key={mode.value}
                onClick={() => setReportMode(mode.value)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  reportMode === mode.value
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
            {reportMode === 'day' && (
              <div className="flex gap-4 items-center">
                <label className="font-bold text-gray-700">Chọn ngày:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            )}

            {reportMode === 'week' && (
              <div className="flex gap-4 items-center">
                <label className="font-bold text-gray-700">Chọn tuần (chọn 1 ngày bất kỳ trong tuần):</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            )}

            {reportMode === 'month' && (
              <div className="flex gap-4 items-center">
                <label className="font-bold text-gray-700">Chọn tháng:</label>
                <input
                  type="month"
                  value={selectedDate.substring(0, 7)}
                  onChange={(e) => setSelectedDate(e.target.value + '-01')}
                  className="px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            )}

            {reportMode === 'custom' && (
              <div className="space-y-3">
                <div className="flex gap-4 items-center">
                  <label className="font-bold text-gray-700 w-24">Từ ngày:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="flex gap-4 items-center">
                  <label className="font-bold text-gray-700 w-24">Đến ngày:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-bold text-blue-800">
                {getModeName()} • Từ <span className="text-blue-600">{dateRange.start}</span> đến <span className="text-blue-600">{dateRange.end}</span>
              </div>
              <div className="text-sm text-blue-700 mt-1">
                📌 Tổng <strong>{tasksInRange.length}</strong> tasks • 
                ✅ <strong>{tasksInRange.filter(t => t.status === 'Hoàn Thành').length}</strong> hoàn thành • 
                🔄 <strong>{tasksInRange.filter(t => !['Hoàn Thành', 'Nháp'].includes(t.status)).length}</strong> đang làm • 
                ⚠️ <strong>{tasksInRange.filter(t => t.isOverdue).length}</strong> quá hạn
              </div>
            </div>
          </div>
        </div>

        {userTasksInRange.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-xl font-bold text-gray-700 mb-2">Không có task nào trong khoảng thời gian này</div>
            <div className="text-gray-500">Thử chọn khoảng thời gian khác</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                <div className="text-gray-600 text-sm mb-1">Tổng Tasks</div>
                <div className="text-3xl font-bold text-blue-600">{tasksInRange.length}</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                <div className="text-gray-600 text-sm mb-1">Hoàn Thành</div>
                <div className="text-3xl font-bold text-green-600">{tasksInRange.filter(t => t.status === 'Hoàn Thành').length}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((tasksInRange.filter(t => t.status === 'Hoàn Thành').length / tasksInRange.length) * 100)}% tỷ lệ
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
                <div className="text-gray-600 text-sm mb-1">Đang Xử Lý</div>
                <div className="text-3xl font-bold text-orange-600">{tasksInRange.filter(t => !['Hoàn Thành', 'Nháp'].includes(t.status)).length}</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                <div className="text-gray-600 text-sm mb-1">Quá Hạn</div>
                <div className="text-3xl font-bold text-red-600">{tasksInRange.filter(t => t.isOverdue).length}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="text-xl font-bold mb-4">👥 Báo Cáo Chi Tiết Từng Nhân Viên</h4>
              <div className="space-y-4">
                {userTasksInRange.map(user => (
                  <div key={user.id} className="border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-2xl">👤</div>
                          <div>
                            <div className="text-lg font-bold">{user.name}</div>
                            <div className="text-sm text-gray-600">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTeamColor(user.team)}`}>
                                {user.team}
                              </span>
                              <span className="ml-2 text-gray-500">{user.role}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{user.total}</div>
                        <div className="text-sm text-gray-600">Tasks</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="text-xs text-gray-600 mb-1">✅ Hoàn Thành</div>
                        <div className="text-2xl font-bold text-green-600">{user.completed}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1">🔄 Đang Làm</div>
                        <div className="text-2xl font-bold text-blue-600">{user.inProgress}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">📝 Nháp</div>
                        <div className="text-2xl font-bold text-gray-600">{user.draft}</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <div className="text-xs text-gray-600 mb-1">⚠️ Quá Hạn</div>
                        <div className="text-2xl font-bold text-red-600">{user.overdue}</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-600">Tiến độ:</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6">
                          <div 
                            className="bg-green-500 h-full rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ width: `${user.total > 0 ? (user.completed / user.total * 100) : 0}%` }}
                          >
                            {user.total > 0 ? Math.round(user.completed / user.total * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <details className="bg-gray-50 rounded-lg p-4">
                      <summary className="font-medium cursor-pointer text-sm text-gray-700 hover:text-blue-600">
                        📋 Xem {user.tasks.length} tasks chi tiết
                      </summary>
                      <div className="space-y-2 mt-3">
                        {user.tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between bg-white p-3 rounded border hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setSelectedTask(task); setShowModal(true); }}>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{task.title}</div>
                              <div className="text-xs text-gray-500 mt-1">📅 {task.dueDate} • {task.platform}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="font-bold mb-4">🎯 Phân Bổ Theo Trạng Thái</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={reportData.statusStats} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {reportData.statusStats.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="font-bold mb-4">📈 So Sánh Team</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.teamStats}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Hoàn thành" fill="#10b981" />
                <Bar dataKey="inProgress" name="Đang làm" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const IntegrationsView = () => (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-2xl font-bold mb-2">🔗 Tích Hợp</h3>
        <p className="text-gray-600">Kết nối với các công cụ khác</p>
      </div>

      {[
        { key: 'calendar', icon: '📅', name: 'Google Calendar', desc: 'Tự động sync deadline' },
        { key: 'facebook', icon: '📘', name: 'Facebook Business', desc: 'Đăng bài trực tiếp' },
        { key: 'slack', icon: '💬', name: 'Slack', desc: 'Thông báo tự động' }
      ].map(item => (
        <div key={item.key} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{item.icon}</div>
              <div>
                <h4 className="text-xl font-bold">{item.name}</h4>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full font-medium ${integrations[item.key].on ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
              {integrations[item.key].on ? '✅ Đã kết nối' : '⚪ Chưa kết nối'}
            </span>
          </div>
          {!integrations[item.key].on && (
            <button onClick={() => setIntegrations({ ...integrations, [item.key]: { on: true, email: 'test@mail.com' } })} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              🔗 Kết nối {item.name}
            </button>
          )}
          {integrations[item.key].on && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="font-medium text-green-800">✅ Đang hoạt động</div>
              <button onClick={() => setIntegrations({ ...integrations, [item.key]: { on: false } })} className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">❌ Ngắt kết nối</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const AutomationView = () => (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-2xl font-bold">⚙️ Template & Automation</h3>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-xl font-bold mb-4">📋 Templates</h4>
          {templates.map(tmp => (
            <div key={tmp.id} className="border-2 rounded-lg p-4 mb-4">
              <div className="font-bold text-lg mb-2">{tmp.name}</div>
              <div className="text-sm text-gray-600 mb-3">{tmp.tasks.length} bước • Team: {tmp.team}</div>
              <button onClick={() => createFromTemplate(tmp)} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                ✨ Tạo tasks
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-xl font-bold mb-4">🤖 Automation</h4>
          {automations.map(auto => (
            <div key={auto.id} className={`border-2 rounded-lg p-4 mb-4 ${auto.active ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex justify-between mb-2">
                <div className="font-bold">{auto.name}</div>
                <button onClick={() => setAutomations(automations.map(a => a.id === auto.id ? { ...a, active: !a.active } : a))} className={`px-3 py-1 rounded-full text-xs font-bold ${auto.active ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                  {auto.active ? '✅ BẬT' : '⚪ TẮT'}
                </button>
              </div>
              <div className="text-sm text-gray-600">⚡ {auto.trigger}</div>
              <div className="text-sm text-gray-600">🎯 {auto.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const MyTasksView = () => {
    const myTasks = tasks.filter(t => t.assignee === currentUser.name);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = myTasks.filter(t => t.dueDate === todayStr);
    const upcomingTasks = myTasks.filter(t => t.dueDate > todayStr && !t.isOverdue);
    const overdueTasks = myTasks.filter(t => t.isOverdue);

    return (
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-bold mb-2">👋 Xin chào, {currentUser.name}!</h3>
              <p className="text-blue-100">Đây là công việc của bạn hôm nay và sắp tới</p>
            </div>
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-bold text-lg shadow-lg"
            >
              ➕ Tạo Task Mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-gray-600 text-sm mb-1">Hôm Nay</div>
            <div className="text-3xl font-bold text-blue-600">{todayTasks.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-gray-600 text-sm mb-1">Hoàn Thành</div>
            <div className="text-3xl font-bold text-green-600">{myTasks.filter(t => t.status === 'Hoàn Thành').length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
            <div className="text-gray-600 text-sm mb-1">Sắp Tới</div>
            <div className="text-3xl font-bold text-orange-600">{upcomingTasks.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
            <div className="text-gray-600 text-sm mb-1">Quá Hạn</div>
            <div className="text-3xl font-bold text-red-600">{overdueTasks.length}</div>
          </div>
        </div>

        {overdueTasks.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <h4 className="text-xl font-bold text-red-800 mb-4">⚠️ Công Việc Quá Hạn ({overdueTasks.length})</h4>
            <div className="space-y-3">
              {overdueTasks.map(task => (
                <div key={task.id} onClick={() => { setSelectedTask(task); setShowModal(true); }} className="bg-white p-4 rounded-lg border-2 border-red-200 cursor-pointer hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-lg">{task.title}</div>
                      <div className="text-sm text-gray-600 mt-1">📅 Hạn: {task.dueDate} • 📱 {task.platform}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-xl font-bold mb-4">📅 Công Việc Hôm Nay ({todayStr})</h4>
          {todayTasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">🎉</div>
              <div className="text-gray-600 font-medium mb-4">Chưa có công việc nào hôm nay!</div>
              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                ➕ Lên kế hoạch công việc ngay
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map(task => (
                <div key={task.id} onClick={() => { setSelectedTask(task); setShowModal(true); }} className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-blue-200 cursor-pointer hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-bold text-lg">{task.title}</div>
                      <div className="text-sm text-gray-600 mt-1">📱 {task.platform} • 🏆 {task.priority || 'Trung Bình'}</div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(task.status)}`}>{task.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); changeStatus(task.id, 'Đang Làm'); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                      ▶️ Bắt Đầu
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); changeStatus(task.id, 'Hoàn Thành'); }} className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
                      ✅ Hoàn Thành
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-xl font-bold mb-4">📆 Công Việc Sắp Tới</h4>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-gray-600">Không có công việc sắp tới</div>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 5).map(task => (
                <div key={task.id} onClick={() => { setSelectedTask(task); setShowModal(true); }} className="bg-gray-50 p-4 rounded-lg border cursor-pointer hover:shadow transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold">{task.title}</div>
                      <div className="text-sm text-gray-600 mt-1">📅 {task.dueDate} • 📱 {task.platform}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-xl font-bold mb-4">📊 Tất Cả Tasks Của Tôi</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Task</th>
                  <th className="px-4 py-3 text-left">Platform</th>
                  <th className="px-4 py-3 text-left">Trạng Thái</th>
                  <th className="px-4 py-3 text-left">Deadline</th>
                  <th className="px-4 py-3 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {myTasks.map(task => (
                  <tr key={task.id} className={`hover:bg-gray-50 ${task.isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{task.title}</td>
                    <td className="px-4 py-3">{task.platform}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={task.isOverdue ? 'text-red-600 font-bold' : ''}>
                        {task.isOverdue && '⚠️ '}
                        {task.dueDate}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedTask(task); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 font-medium">
                        Chi tiết →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const CreateTaskModal = () => {
    const [title, setTitle] = useState('');
    const [platforms, setPlatforms] = useState([]);
    const [priority, setPriority] = useState('Trung Bình');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    const platformOptions = [
      { value: 'Facebook', icon: '📘' },
      { value: 'Instagram', icon: '📸' },
      { value: 'TikTok', icon: '🎵' },
      { value: 'YouTube', icon: '📹' },
      { value: 'Blog', icon: '📝' },
      { value: 'Email', icon: '📧' },
      { value: 'Ads', icon: '💰' },
      { value: 'Twitter', icon: '🐦' },
      { value: 'LinkedIn', icon: '💼' }
    ];

    const togglePlatform = (platform) => {
      if (platforms.includes(platform)) {
        setPlatforms(platforms.filter(p => p !== platform));
      } else {
        setPlatforms([...platforms, platform]);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-2xl font-bold">➕ Tạo Task Mới</h3>
            <button onClick={() => setShowCreateTaskModal(false)} className="text-2xl font-bold hover:text-red-600">×</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block font-medium mb-2">📝 Tên công việc *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Viết bài blog về sản phẩm mới"
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium mb-3">📱 Platform/Kênh (Chọn 1 hoặc nhiều)</label>
              <div className="grid grid-cols-3 gap-2">
                {platformOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => togglePlatform(opt.value)}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      platforms.includes(opt.value)
                        ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="text-xs">{opt.value}</div>
                  </button>
                ))}
              </div>
              {platforms.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">
                    ✅ Đã chọn: {platforms.join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">🏆 Độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Thấp">Thấp</option>
                  <option value="Trung Bình">Trung Bình</option>
                  <option value="Cao">Cao</option>
                  <option value="Khẩn Cấp">Khẩn Cấp</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">📅 Deadline</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">📄 Mô tả (không bắt buộc)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết về công việc..."
                rows="4"
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                💡 <strong>Lưu ý:</strong> Task sẽ được tạo với trạng thái "Nháp". Bạn có thể chuyển sang "Chờ Duyệt" khi hoàn thành.
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!title) {
                    alert('❌ Vui lòng nhập tên công việc!');
                    return;
                  }
                  if (platforms.length === 0) {
                    alert('❌ Vui lòng chọn ít nhất 1 platform!');
                    return;
                  }
                  createNewTask(title, platforms.join(', '), priority, dueDate, description);
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
    if (!selectedTask) return null;
    const [newComment, setNewComment] = useState('');
    const [newPostLink, setNewPostLink] = useState('');
    const [linkType, setLinkType] = useState('');
    const [showAddLink, setShowAddLink] = useState(false);

    const getPlatformIcon = (type) => {
      const icons = {
        'Facebook': '📘',
        'Instagram': '📸',
        'TikTok': '🎵',
        'YouTube': '📹',
        'Blog': '📝',
        'Twitter': '🐦',
        'LinkedIn': '💼',
        'Other': '🔗'
      };
      return icons[type] || '🔗';
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-4xl w-full my-8">
          <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0 z-10">
            <h3 className="text-xl font-bold">Chi Tiết Task</h3>
            <button onClick={() => setShowModal(false)} className="text-2xl font-bold hover:text-red-600">×</button>
          </div>
          
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div>
              <h4 className="text-2xl font-bold mb-4">{selectedTask.title}</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-gray-600">👤 Người làm:</span>
                  <div className="font-medium mt-1">{selectedTask.assignee}</div>
                </div>
                <div>
                  <span className="text-gray-600">🏢 Team:</span>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTeamColor(selectedTask.team)}`}>
                      {selectedTask.team}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">📅 Deadline:</span>
                  <div className={`font-medium mt-1 ${selectedTask.isOverdue ? 'text-red-600' : ''}`}>
                    {selectedTask.isOverdue && '⚠️ '}
                    {selectedTask.dueDate}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">📱 Platform:</span>
                  <div className="font-medium mt-1">{selectedTask.platform}</div>
                </div>
                {selectedTask.priority && (
                  <div>
                    <span className="text-gray-600">🏆 Ưu tiên:</span>
                    <div className="font-medium mt-1">{selectedTask.priority}</div>
                  </div>
                )}
              </div>

              {selectedTask.description && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-gray-600 mb-2">📄 Mô tả:</div>
                  <div className="text-sm text-gray-700">{selectedTask.description}</div>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-bold">🔗 Bài Đăng & Links</h5>
                <button
                  onClick={() => setShowAddLink(!showAddLink)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  {showAddLink ? '❌ Hủy' : '➕ Thêm Link'}
                </button>
              </div>

              {showAddLink && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200 mb-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Chọn nền tảng:</label>
                      <select
                        value={linkType}
                        onChange={(e) => setLinkType(e.target.value)}
                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn --</option>
                        <option value="Facebook">📘 Facebook</option>
                        <option value="Instagram">📸 Instagram</option>
                        <option value="TikTok">🎵 TikTok</option>
                        <option value="YouTube">📹 YouTube</option>
                        <option value="Blog">📝 Blog</option>
                        <option value="Twitter">🐦 Twitter</option>
                        <option value="LinkedIn">💼 LinkedIn</option>
                        <option value="Other">🔗 Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Link bài đăng:</label>
                      <input
                        type="url"
                        value={newPostLink}
                        onChange={(e) => setNewPostLink(e.target.value)}
                        placeholder="https://facebook.com/post/123456..."
                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          alert('❌ Vui lòng chọn nền tảng và nhập link!');
                        }
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      ✅ Thêm Link
                    </button>
                  </div>
                </div>
              )}

              {selectedTask.postLinks && selectedTask.postLinks.length > 0 ? (
                <div className="space-y-3">
                  {selectedTask.postLinks.map((link, index) => (
                    <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{getPlatformIcon(link.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm">{link.type}</span>
                            <span className="text-xs text-gray-500">• Thêm bởi {link.addedBy}</span>
                            <span className="text-xs text-gray-500">• {link.addedAt}</span>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm break-all underline"
                          >
                            {link.url}
                          </a>
                          <div className="mt-3 flex gap-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                            >
                              🔍 Xem Bài Đăng
                            </a>
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
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-4xl mb-2">🔗</div>
                  <div className="text-gray-500 text-sm">Chưa có link bài đăng nào</div>
                  <div className="text-gray-400 text-xs mt-1">Thêm link bài đăng trên Facebook, TikTok, Instagram...</div>
                </div>
              )}
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-3 font-semibold">🔄 Thay Đổi Trạng Thái:</div>
              <div className="grid grid-cols-3 gap-2">
                {['Nháp', 'Chờ Duyệt', 'Cần Sửa', 'Đã Duyệt', 'Đang Làm', 'Hoàn Thành'].map(s => (
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold">🎯 Marketing Management</h1>
          <p className="text-gray-600">Quản lý team hiệu quả</p>
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
