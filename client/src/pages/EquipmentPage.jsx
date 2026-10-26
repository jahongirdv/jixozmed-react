import { useState, useEffect, useMemo } from 'react';
import {
  fetchEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '../api/equipment';
import EquipmentForm from '../components/EquipmentForm';
import PhotoViewer from '../components/PhotoViewer';
import './EquipmentPage.css';

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ text: 'Загрузка...', type: '' });
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewer, setViewer] = useState({ open: false, photos: [], index: 0 });

  useEffect(() => { loadEquipment(); }, []);

  async function loadEquipment() {
    setLoading(true);
    try {
      const data = await fetchEquipment();
      setEquipment(data);
      setStatus({ text: `Всего устройств: ${data.length}`, type: 'active' });
    } catch (err) {
      console.error(err);
      setStatus({ text: 'Ошибка загрузки: ' + (err.response?.data?.error || err.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return equipment;
    const q = search.toLowerCase().trim();
    return equipment.filter((e) =>
      [e.name, e.model, e.inventory_number, e.serial_number, e.organization_name, e.classification]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [equipment, search]);

  async function handleSave(payload) {
    if (editing) {
      await updateEquipment(editing.id, payload);
      setStatus({ text: 'Устройство обновлено', type: 'active' });
    } else {
      await createEquipment(payload);
      setStatus({ text: 'Устройство создано', type: 'active' });
    }
    setFormOpen(false);
    setEditing(null);
    await loadEquipment();
  }

  async function handleDelete(item) {
    if (!confirm(`Удалить «${item.name || 'устройство'}»?`)) return;
    try {
      await deleteEquipment(item.id);
      setStatus({ text: 'Устройство удалено', type: 'active' });
      await loadEquipment();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setFormOpen(true);
  }

  function statusClass(condition) {
    const c = (condition || '').toLowerCase();
    if (c.includes('непригоден')) return 'eq-status-broken';
    if (c.includes('неисправен') || c.includes('ремонт')) return 'eq-status-repair';
    return 'eq-status-working';
  }

  function getPhotos(item) {
    if (!item.photos) return [];
    if (Array.isArray(item.photos)) return item.photos;
    try {
      const parsed = JSON.parse(item.photos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function openPhotoViewer(item) {
    const photos = getPhotos(item);
    if (!photos.length) return;
    setViewer({ open: true, photos, index: 0 });
  }

  return (
    <main>
      <header className="eq-page-header">
        <h1>Оборудование</h1>
        <p>Список медицинского оборудования и форма создания</p>
      </header>

      <div className="eq-toolbar">
        <div className="eq-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Поиск по названию, модели, инв. №..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="eq-btn primary" onClick={openCreate}>
          <i className="fas fa-plus"></i> Создать
        </button>

        <button className="eq-btn" onClick={loadEquipment} title="Обновить">
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      <div className={`eq-info ${status.type}`}>
        <i className={`fas ${
          status.type === 'active' ? 'fa-check-circle'
          : status.type === 'error' ? 'fa-exclamation-triangle'
          : 'fa-info-circle'
        }`}></i>
        <div>{status.text}</div>
      </div>

      {loading ? (
        <div className="eq-empty">
          <i className="fas fa-spinner fa-spin"></i>
          <h3>Загрузка...</h3>
        </div>
      ) : filtered.length === 0 ? (
        <div className="eq-empty">
          <i className="fas fa-box-open"></i>
          <h3>{equipment.length === 0 ? 'Оборудования пока нет' : 'Ничего не найдено'}</h3>
          <p>
            {equipment.length === 0
              ? 'Нажмите «Создать», чтобы добавить первое устройство'
              : 'Попробуйте изменить запрос поиска'}
          </p>
        </div>
      ) : (
        <div className="eq-table-wrap">
          <table className="eq-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Модель</th>
                <th>Инв. №</th>
                <th>Состояние</th>
                <th>Организация</th>
                <th>Классификация</th>
                <th style={{ textAlign: 'center' }}>Фото</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const photos = getPhotos(item);
                const hasPhoto = photos.length > 0;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name || '—'}</td>
                    <td>{item.model || '—'}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#4d94e8' }}>
                        {item.inventory_number || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`eq-status-badge ${statusClass(item.condition)}`}>
                        {item.condition || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#94a9c2' }}>
                      {item.organization_name || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: '#7d92ab' }}>
                      {item.classification || '—'}
                    </td>
                    <td className="eq-photo-cell">
                      <button
                        type="button"
                        className={`eq-photo-icon ${hasPhoto ? 'has-photo' : 'no-photo'}`}
                        onClick={() => hasPhoto && openPhotoViewer(item)}
                        disabled={!hasPhoto}
                        title={hasPhoto ? `Фото: ${photos.length} шт. (нажмите)` : 'Нет фото'}
                      >
                        <i className={`fas ${hasPhoto ? 'fa-camera' : 'fa-image'}`}></i>
                      </button>
                    </td>
                    <td>
                      <div className="eq-row-actions">
                        <button
                          className="eq-icon-btn"
                          title="Редактировать"
                          onClick={() => openEdit(item)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="eq-icon-btn danger"
                          title="Удалить"
                          onClick={() => handleDelete(item)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <EquipmentForm
          equipment={editing}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditing(null); }}
        />
      )}

      {viewer.open && (
        <PhotoViewer
          photos={viewer.photos}
          startIndex={viewer.index}
          onClose={() => setViewer({ open: false, photos: [], index: 0 })}
        />
      )}
    </main>
  );
}
