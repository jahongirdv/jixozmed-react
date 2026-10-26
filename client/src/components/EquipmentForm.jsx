import { useState, useEffect } from 'react';
import { searchClassifier, searchModels, fetchOrganizations } from '../api/equipment';
import PhotoUploader from './PhotoUploader';

const EMPTY_FORM = {
  name: '',
  classification: '',
  classification_section: '',
  classification_point: '',
  model: '',
  manufacturer: '',
  firm_country: '',
  country: '',
  serial_number: '',
  inventory_number: '',
  uzasbo_number: '',
  uzasbo_name: '',
  organization_id: '',
  organization_name: '',
  condition: 'Исправен (в рабочем состоянии)',
  price: '',
  responsible_person: '',
  photos: [],
};

export default function EquipmentForm({ equipment, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [organizations, setOrganizations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [modelSuggestions, setModelSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTimer, setSearchTimer] = useState(null);

  useEffect(() => {
    fetchOrganizations().then(setOrganizations).catch(() => {});
  }, []);

  useEffect(() => {
    if (equipment) {
      setForm({
        name: equipment.name || '',
        classification: equipment.classification || '',
        classification_section: equipment.classification_section || '',
        classification_point: equipment.classification_point || '',
        model: equipment.model || '',
        manufacturer: equipment.manufacturer || '',
        firm_country: equipment.firm_country || '',
        country: equipment.country || '',
        serial_number: equipment.serial_number || '',
        inventory_number: equipment.inventory_number || '',
        uzasbo_number: equipment.uzasbo_number || '',
        uzasbo_name: equipment.uzasbo_name || '',
        organization_id: equipment.organization_id || '',
        organization_name: equipment.organization_name || '',
        condition: equipment.condition || 'Исправен (в рабочем состоянии)',
        price: equipment.price || '',
        responsible_person: equipment.responsible_person || '',
        photos: Array.isArray(equipment.photos) ? equipment.photos : [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [equipment]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(value) {
    setField('name', value);
    if (searchTimer) clearTimeout(searchTimer);

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const results = await searchClassifier(value);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    setSearchTimer(t);
  }

  function applyClassifier(item) {
    setForm((f) => ({
      ...f,
      name: item.keyword,
      classification: item.section,
      classification_section: item.point,
      classification_point: item.keyword,
    }));
    setSuggestions([]);
  }

  function handleModelChange(value) {
    setField('model', value);
    if (value.length < 2) {
      setModelSuggestions([]);
      return;
    }
    setTimeout(async () => {
      try {
        const results = await searchModels(value);
        setModelSuggestions(results);
      } catch {
        setModelSuggestions([]);
      }
    }, 300);
  }

  function applyModel(item) {
    setForm((f) => ({
      ...f,
      model: item.model,
      manufacturer: item.manufacturer || f.manufacturer,
      firm_country: item.country || f.firm_country,
      country: item.country || f.country,
      name: f.name || item.equipment || '',
    }));
    setModelSuggestions([]);
  }

  function handleOrgChange(orgId) {
    const org = organizations.find((o) => String(o.id) === String(orgId));
    setForm((f) => ({
      ...f,
      organization_id: orgId,
      organization_name: org?.name || '',
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() && !form.inventory_number.trim()) {
      return setError('Введите наименование или инвентарный номер');
    }

    setLoading(true);
    try {
      await onSave({
        name: form.name.trim(),
        classification: form.classification || null,
        classification_section: form.classification_section || null,
        classification_point: form.classification_point || null,
        model: form.model || null,
        manufacturer: form.manufacturer || null,
        firm_country: form.firm_country || null,
        country: form.country || null,
        serial_number: form.serial_number || null,
        inventory_number: form.inventory_number || null,
        uzasbo_number: form.uzasbo_number || null,
        uzasbo_name: form.uzasbo_name || null,
        organization_id: form.organization_id || null,
        organization_name: form.organization_name || null,
        condition: form.condition,
        price: form.price ? Number(form.price) : null,
        responsible_person: form.responsible_person || null,
        photos: form.photos || [],
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="eq-modal" onClick={(e) => e.target.className === 'eq-modal' && onCancel()}>
      <form className="eq-modal-box" onSubmit={handleSubmit}>
        <div className="eq-modal-header">
          <h2>{equipment ? 'Редактирование оборудования' : 'Новое оборудование'}</h2>
          <button type="button" className="eq-modal-close" onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Наименование + Модель */}
        <div className="eq-form-grid cols-2">
          <div className="eq-form-group">
            <label>Наименование оборудования *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Например: небулайзер"
              autoComplete="off"
              autoFocus
            />
            {suggestions.length > 0 && (
              <div className="eq-suggestions">
                <div className="eq-suggestions-header">
                  🔍 Найдено {suggestions.length}. Выберите:
                </div>
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="eq-suggestion-item"
                    onClick={() => applyClassifier(s)}
                  >
                    <div className="eq-suggestion-name">{s.keyword}</div>
                    <div className="eq-suggestion-meta">
                      <span className="eq-suggestion-tag">{s.section}</span>
                      <span className="eq-suggestion-tag">{s.point}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="eq-form-group">
            <label>Модель</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => handleModelChange(e.target.value)}
              placeholder="Например: С856"
              autoComplete="off"
            />
            {modelSuggestions.length > 0 && (
              <div className="eq-suggestions">
                <div className="eq-suggestions-header">
                  🔍 Найдено {modelSuggestions.length} моделей:
                </div>
                {modelSuggestions.map((m) => (
                  <div
                    key={m.id}
                    className="eq-suggestion-item"
                    onClick={() => applyModel(m)}
                  >
                    <div className="eq-suggestion-name">{m.model}</div>
                    <div className="eq-suggestion-meta">
                      <span className="eq-suggestion-tag">{m.manufacturer}</span>
                      <span className="eq-suggestion-tag">{m.country}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Классификация */}
        <div className="eq-form-grid cols-3">
          <div className="eq-form-group">
            <label>Классификация</label>
            <input type="text" value={form.classification} readOnly placeholder="Автоматически" />
          </div>
          <div className="eq-form-group">
            <label>Раздел</label>
            <input type="text" value={form.classification_section} readOnly placeholder="Автоматически" />
          </div>
          <div className="eq-form-group">
            <label>Пункт</label>
            <input type="text" value={form.classification_point} readOnly placeholder="Автоматически" />
          </div>
        </div>

        {/* Фирма и страна */}
        <div className="eq-form-grid cols-2">
          <div className="eq-form-group">
            <label>Фирма-производитель</label>
            <input
              type="text"
              value={form.manufacturer}
              onChange={(e) => setField('manufacturer', e.target.value)}
              placeholder="Например: United Products"
            />
          </div>
          <div className="eq-form-group">
            <label>Страна фирмы</label>
            <input
              type="text"
              value={form.firm_country}
              onChange={(e) => setField('firm_country', e.target.value)}
              placeholder="Например: США"
            />
          </div>
        </div>

        {/* Серийный и инвентарный */}
        <div className="eq-form-grid cols-2">
          <div className="eq-form-group">
            <label>Серийный / Заводской №</label>
            <input
              type="text"
              value={form.serial_number}
              onChange={(e) => setField('serial_number', e.target.value)}
              placeholder="Введите серийный номер"
            />
          </div>
          <div className="eq-form-group">
            <label>Инвентарный №</label>
            <input
              type="text"
              value={form.inventory_number}
              onChange={(e) => setField('inventory_number', e.target.value)}
              placeholder="Например: 10023520"
            />
          </div>
        </div>

        {/* UzASBO */}
        <div className="eq-form-grid cols-2">
          <div className="eq-form-group">
            <label>UzASBO №</label>
            <input
              type="text"
              value={form.uzasbo_number}
              onChange={(e) => setField('uzasbo_number', e.target.value)}
              placeholder="Номер в системе UzASBO"
            />
          </div>
          <div className="eq-form-group">
            <label>Наименование в UzASBO</label>
            <input
              type="text"
              value={form.uzasbo_name}
              onChange={(e) => setField('uzasbo_name', e.target.value)}
              placeholder="Наименование из UzASBO"
            />
          </div>
        </div>

        {/* Организация + состояние */}
        <div className="eq-form-grid cols-2">
          <div className="eq-form-group">
            <label>Организация</label>
            <select value={form.organization_id} onChange={(e) => handleOrgChange(e.target.value)}>
              <option value="">— выберите организацию —</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div className="eq-form-group">
            <label>Состояние</label>
            <select value={form.condition} onChange={(e) => setField('condition', e.target.value)}>
              <option value="Исправен (в рабочем состоянии)">Исправен (в рабочем состоянии)</option>
              <option value="Неисправен (требует ремонта)">Неисправен (требует ремонта)</option>
              <option value="Неисправен или непригоден для использования">Неисправен или непригоден</option>
            </select>
          </div>
        </div>

        {/* Цена и ответственный */}
        <div className="eq-form-grid cols-2">
          <div className="eq-form-group">
            <label>Стоимость (сум)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              placeholder="Например: 19600000"
            />
          </div>
          <div className="eq-form-group">
            <label>Ответственное лицо</label>
            <input
              type="text"
              value={form.responsible_person}
              onChange={(e) => setField('responsible_person', e.target.value)}
              placeholder="Ф.И.О."
            />
          </div>
        </div>

        <PhotoUploader
          photos={form.photos || []}
          onChange={(newPhotos) => setForm((f) => ({ ...f, photos: newPhotos }))}
        />

        {error && <div className="eq-form-error">❌ {error}</div>}

        <div className="eq-form-actions">
          <button type="button" className="eq-btn" onClick={onCancel} disabled={loading}>
            Отмена
          </button>
          <button type="submit" className="eq-btn primary" disabled={loading}>
            <i className="fas fa-save"></i> {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}
