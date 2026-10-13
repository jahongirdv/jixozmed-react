nano ~/jixozmed-new/client/src/main.jsximport { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('jixozmed_user') || '{}');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a1628', color: '#e6edf5',
      padding: '40px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#4d94e8', marginBottom: '8px' }}>JixozMed — Dashboard</h1>
        <p style={{ color: '#94a9c2', marginBottom: '32px' }}>
          Добро пожаловать, <b style={{ color: '#e6edf5' }}>{user.name || 'пользователь'}</b>
        </p>

        <div style={{
          background: '#0f1e33', padding: '24px', borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><span style={{ color: '#7d92ab' }}>Логин:</span> {user.login}</div>
            <div><span style={{ color: '#7d92ab' }}>Роль:</span> {user.role}</div>
            <div><span style={{ color: '#7d92ab' }}>Регион:</span> {user.region}</div>
          </div>
        </div>

        <button onClick={handleLogout} style={{
          background: '#1e5ec9', color: '#fff', border: 'none',
          padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontSize: '15px',
        }}>
          <i className="fas fa-sign-out-alt"></i> Выйти
        </button>
      </div>
    </div>
  );
}
