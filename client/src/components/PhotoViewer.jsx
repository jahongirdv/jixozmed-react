import { useState, useEffect, useRef } from 'react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

export default function PhotoViewer({ photos = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0); // сдвиг по X
  const [ty, setTy] = useState(0); // сдвиг по Y

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const lastTap = useRef(0);
  const pinchStart = useRef({ dist: 0, scale: 1 });
  const touchStart = useRef({ x: 0, y: 0, time: 0 });

  const current = photos[index];
  const url = typeof current === 'string' ? current : current?.url;

  // ============================================================
  // Сброс зума при смене фото
  // ============================================================
  useEffect(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, [index]);

  // ============================================================
  // Клавиатура
  // ============================================================
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line
  }, [photos.length, index]);

  // ============================================================
  // Зум
  // ============================================================
  function applyZoom(newScale, clientX, clientY) {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    // Масштабирование относительно курсора/точки касания
    if (clientX != null && clientY != null && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const cx = clientX - rect.left - rect.width / 2;
      const cy = clientY - rect.top - rect.height / 2;

      const ratio = clamped / scale;
      setTx((prev) => prev - cx * (ratio - 1));
      setTy((prev) => prev - cy * (ratio - 1));
    }

    setScale(clamped);

    // Если вернулись к 1 — сбрасываем сдвиг
    if (clamped === 1) {
      setTx(0);
      setTy(0);
    }
  }

  function zoomIn(e) {
    const ev = e?.clientX != null ? e : null;
    applyZoom(scale * 1.25, ev?.clientX, ev?.clientY);
  }

  function zoomOut(e) {
    const ev = e?.clientX != null ? e : null;
    applyZoom(scale / 1.25, ev?.clientX, ev?.clientY);
  }

  function resetZoom() {
    setScale(1);
    setTx(0);
    setTy(0);
  }

  // ============================================================
  // Колёсико
  // ============================================================
  function onWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.15 : 1 / 1.15;
    applyZoom(scale * factor, e.clientX, e.clientY);
  }

  // ============================================================
  // Мышь — перетаскивание
  // ============================================================
  function onMouseDown(e) {
    if (scale <= 1) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, tx, ty };
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTx(dragStart.current.tx + dx);
    setTy(dragStart.current.ty + dy);
  }

  function onMouseUp() {
    dragging.current = false;
  }

  // ============================================================
  // Двойной клик
  // ============================================================
  function onDoubleClick(e) {
    e.stopPropagation();
    if (scale > 1) {
      resetZoom();
    } else {
      applyZoom(2, e.clientX, e.clientY);
    }
  }

  // ============================================================
  // Тач — pinch + свайп + тап
  // ============================================================
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStart.current = { dist, scale };
    } else if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      if (scale > 1) {
        dragging.current = true;
        dragStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          tx, ty,
        };
      }
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 2 && pinchStart.current.dist > 0) {
      e.preventDefault();
      const [a, b] = e.touches;
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const newScale = pinchStart.current.scale * (dist / pinchStart.current.dist);
      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      applyZoom(newScale, cx, cy);
    } else if (e.touches.length === 1 && dragging.current && scale > 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setTx(dragStart.current.tx + dx);
      setTy(dragStart.current.ty + dy);
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length > 0) return;

    const time = Date.now() - touchStart.current.time;
    const dx = (e.changedTouches[0]?.clientX || 0) - touchStart.current.x;
    const dy = (e.changedTouches[0]?.clientY || 0) - touchStart.current.y;
    const dist = Math.hypot(dx, dy);

    // Двойной тап
    if (scale === 1 && time < 300 && dist < 10) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        applyZoom(2, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        lastTap.current = 0;
        dragging.current = false;
        pinchStart.current = { dist: 0, scale: 1 };
        return;
      }
      lastTap.current = now;
    }

    // Свайп (только когда масштаб = 1)
    if (scale === 1 && time < 500 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }

    // Одинарный тап по фону — закрыть (только если фокус был на img, а не на фоне)
    dragging.current = false;
    pinchStart.current = { dist: 0, scale: 1 };
  }

  // ============================================================
  // Навигация
  // ============================================================
  function goPrev() {
    if (photos.length < 2) return;
    setIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  }

  function goNext() {
    if (photos.length < 2) return;
    setIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  }

  if (!photos.length) return null;

  return (
    <div
      className="photo-viewer"
      ref={containerRef}
      onClick={(e) => {
        // Клик по фону (не по img и не по кнопкам)
        if (e.target === containerRef.current) onClose();
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Закрыть */}
      <button className="photo-viewer-close" onClick={onClose} title="Закрыть (Esc)">
        <i className="fas fa-times"></i>
      </button>

      {/* Счётчик */}
      <div className="photo-viewer-counter">
        {index + 1} / {photos.length}
      </div>

      {/* Индикатор зума */}
      {scale > 1 && (
        <div className="photo-viewer-zoom-badge">
          {(scale * 100).toFixed(0)}%
        </div>
      )}

      {/* Навигация */}
      {photos.length > 1 && (
        <>
          <button
            className="photo-viewer-nav prev"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            title="Назад (←)"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button
            className="photo-viewer-nav next"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            title="Вперёд (→)"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </>
      )}

      {/* Панель зума */}
      <div className="photo-viewer-zoom-panel" onClick={(e) => e.stopPropagation()}>
        <button onClick={zoomOut} title="Уменьшить (−)" disabled={scale <= MIN_ZOOM}>
          <i className="fas fa-minus"></i>
        </button>
        <button onClick={resetZoom} title="Сброс (0)" disabled={scale === 1}>
          <i className="fas fa-compress"></i>
        </button>
        <button onClick={zoomIn} title="Увеличить (+)" disabled={scale >= MAX_ZOOM}>
          <i className="fas fa-plus"></i>
        </button>
      </div>

      {/* Фото */}
      <img
        ref={imgRef}
        src={url}
        alt={`Фото ${index + 1}`}
        className="photo-viewer-img"
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          cursor: scale > 1 ? (dragging.current ? 'grabbing' : 'grab') : 'zoom-in',
          transition: dragging.current ? 'none' : 'transform 0.15s ease-out',
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
