import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../api/auth';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Получаем данные пользователя из localStorage
  const user = JSON.parse(localStorage.getItem('jixozmed_user') || '{}');

  // Генерируем инициалы (например, "Иван Иванов" -> "ИИ")
  const initials = (user.name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-panel">
        <button
          className="sidebar-user"
          data-tooltip="Личный кабинет"
          onClick={() => navigate('/profile')}
        >
          <span>{initials}</span>
        </button>

        <button 
          className="sidebar-toggle" 
          data-tooltip={isCollapsed ? "Развернуть" : "Свернуть"} 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <i className={`fas fa-chevron-${isCollapsed ? 'left' : 'right'}`}></i>
        </button>

        <div className="sidebar-divider"></div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-btn ${isActive('/dashboard') ? 'active' : ''}`}
            data-tooltip="Главная"
            onClick={() => navigate('/dashboard')}
          >
            <i className="fas fa-th-large"></i>
          </button>
          
          <button
            className={`sidebar-btn ${isActive('/create') ? 'active' : ''}`}
            data-tooltip="Форма создания"
            onClick={() => navigate('/create')}
          >
            <i className="fas fa-list"></i>
          </button>
          
          <button
            className={`sidebar-btn ${isActive('/users') ? 'active' : ''}`}
            data-tooltip="Пользователи"
            onClick={() => navigate('/users')}
          >
            <i className="fas fa-users"></i>
          </button>
          
          <button
            className={`sidebar-btn ${isActive('/equipment') ? 'active' : ''}`}
            data-tooltip="Оборудование"
            onClick={() => navigate('/equipment')}
          >
            <i className="fas fa-tools"></i>
          </button>

          <button
            className={`sidebar-btn ${isActive('/map') ? 'active' : ''}`}
            data-tooltip="Карта"
            onClick={() => navigate('/map')}
          >
            <i className="fas fa-map-marked-alt"></i>
          </button>
        </nav>

        {/* Кнопка админки показывается только если роль admin */}
        {user.role === 'admin' && (
          <button
            className={`sidebar-admin ${isActive('/admin') ? 'active' : ''}`}
            data-tooltip="Админ-панель"
            onClick={() => navigate('/admin')}
          >
            <i className="fas fa-user-shield"></i>
          </button>
        )}

        <button className="sidebar-logout" data-tooltip="Выход" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </aside>
  );
}