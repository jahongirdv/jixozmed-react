import { useState, useRef } from 'react';
import { uploadPhoto, deletePhoto } from '../api/upload';

export default function PhotoUploader({ photos = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  async function handleFiles(files) {
    setError('');
    setUploading(true);

    try {
      const uploaded = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError('Можно загружать только изображения');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Файл слишком большой (макс. 10 МБ)');
          continue;
        }

        const res = await uploadPhoto(file);
        if (res.success) {
          uploaded.push({ url: res.url, filename: res.filename });
        } else {
          setError(res.error || 'Ошибка загрузки');
        }
      }

      if (uploaded.length > 0) {
        onChange([...photos, ...uploaded]);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function handleSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFiles(files);
  }

  async function handleRemove(index) {
    const photo = photos[index];
    if (!photo) return;
    if (!confirm('Удалить фото?')) return;

    try {
      if (photo.filename) await deletePhoto(photo.filename);
    } catch (err) {
      console.error('Ошибка удаления файла:', err);
    }
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="photo-uploader">
      <label className="photo-uploader-label">Фотографии</label>

      <div className="photo-uploader-row">
        <button
          type="button"
          className="photo-add-btn"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
          {uploading ? ' Загрузка...' : ' Добавить фото'}
        </button>

        <div className="photo-thumbs">
          {photos.map((p, i) => (
            <div key={p.url || i} className="photo-thumb">
              <img src={p.url} alt={`Фото ${i + 1}`} />
              <button
                type="button"
                className="photo-thumb-remove"
                onClick={() => handleRemove(i)}
                title="Удалить"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}

          {photos.length === 0 && !uploading && (
            <span className="photo-empty">Нет фотографий</span>
          )}
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleSelect}
      />

      {error && <div className="photo-error">❌ {error}</div>}
    </div>
  );
}
