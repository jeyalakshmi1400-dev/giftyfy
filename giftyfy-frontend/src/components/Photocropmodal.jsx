import React, { useEffect, useRef, useState } from "react";


import "../styles/PhotoCropModal.css"
const PAD = 14;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const MAX_OUTPUT_SIDE = 2400;

const clampNum = (v, min, max) => Math.min(Math.max(v, min), max);

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const BASE_TRANSFORM = {
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
};

// Fallback polygon when a custom shape has no saved points.
const DEFAULT_CUSTOM_POINTS = [
  { x: 25, y: 0 },
  { x: 50, y: 0 },
  { x: 75, y: 0 },
  { x: 100, y: 25 },
  { x: 100, y: 50 },
  { x: 100, y: 75 },
  { x: 75, y: 100 },
  { x: 50, y: 100 },
  { x: 25, y: 100 },
  { x: 0, y: 75 },
  { x: 0, y: 50 },
  { x: 0, y: 25 },
];

// =====================================================
// SHAPE PATH (exported: the page uses it only to outline empty slots)
// =====================================================

export const drawShapePath = (ctx, shape, w, h, points = []) => {
  ctx.beginPath();

  if (shape === "circle") {
    const radius = Math.min(w, h) / 2;
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
  } else if (shape === "square") {
    const side = Math.min(w, h);
    ctx.rect((w - side) / 2, (h - side) / 2, side, side);
  } else if (shape === "oval") {
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shape === "roundedRect") {
    const r = Math.min(w, h) * 0.18;

    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
  } else if (shape === "heart") {
    const validPoints =
      Array.isArray(points) &&
      points.length >= 3 &&
      points.every(
        (p) =>
          Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))
      );

    if (validPoints) {
      // Keep admin-saved A-L points in their original order.
      const pts = points.map((p) => ({
        x: (safeNumber(p.x) / 100) * w,
        y: (safeNumber(p.y) / 100) * h,
      }));

      // Bottom tip.
      const tipIndex = pts.reduce(
        (best, p, i) => (p.y > pts[best].y ? i : best),
        0
      );

      // Top-center notch: closest to the horizontal center among
      // the points in the upper 40% of the shape.
      const upperPoints = pts
        .map((p, i) => ({ ...p, index: i }))
        .filter((p) => p.y <= h * 0.4);

      const notchIndex = upperPoints.length
        ? upperPoints.reduce(
            (best, p) =>
              Math.abs(p.x - w / 2) < Math.abs(pts[best].x - w / 2)
                ? p.index
                : best,
            upperPoints[0].index
          )
        : pts.reduce(
            (best, p, i) =>
              Math.abs(p.x - w / 2) < Math.abs(pts[best].x - w / 2)
                ? i
                : best,
            0
          );

      const midpoint = (a, b) => ({
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      });

      const firstMid = midpoint(pts[pts.length - 1], pts[0]);

      ctx.moveTo(firstMid.x, firstMid.y);

      pts.forEach((p, i) => {
        const next = pts[(i + 1) % pts.length];
        const mid = midpoint(p, next);

        if (i === tipIndex || i === notchIndex) {
          // Preserve the sharp tip and center notch.
          ctx.lineTo(p.x, p.y);
          ctx.lineTo(mid.x, mid.y);
        } else {
          ctx.quadraticCurveTo(p.x, p.y, mid.x, mid.y);
        }
      });

      ctx.closePath();
    } else {
      // Classic symmetrical heart.
      ctx.moveTo(w * 0.5, h * 0.96);

      ctx.bezierCurveTo(
        w * 0.42, h * 0.84,
        w * 0.04, h * 0.59,
        w * 0.04, h * 0.32
      );

      ctx.bezierCurveTo(
        w * 0.04, h * 0.08,
        w * 0.36, h * 0.0,
        w * 0.5, h * 0.25
      );

      ctx.bezierCurveTo(
        w * 0.64, h * 0.0,
        w * 0.96, h * 0.08,
        w * 0.96, h * 0.32
      );

      ctx.bezierCurveTo(
        w * 0.96, h * 0.59,
        w * 0.58, h * 0.84,
        w * 0.5, h * 0.96
      );

      ctx.closePath();
    }
  } else if (shape === "custom") {
    const customPoints =
      Array.isArray(points) && points.length >= 3
        ? points
        : DEFAULT_CUSTOM_POINTS;

    customPoints.forEach((point, index) => {
      const px = (safeNumber(point.x) / 100) * w;
      const py = (safeNumber(point.y) / 100) * h;

      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });

    ctx.closePath();
  } else {
    ctx.rect(0, 0, w, h);
  }

  ctx.closePath();
};

// =====================================================
// CROP MATH (internal to the editor)
// =====================================================

// Photo size that exactly covers the area at zoom = 1, then scaled by zoom.
const coverSize = (dims, area, zoom) => {
  const base = Math.max(area.width / dims.w, area.height / dims.h) * zoom;

  return {
    drawW: dims.w * base,
    drawH: dims.h * base,
  };
};

// Keeps the rotated, zoomed photo fully covering the crop area's bounding box.
// Works in the photo's own rotated frame, giving a minimum zoom for the
// current rotation and exact pan limits, so no empty gaps can appear.
const clampTransform = (transform, area, dims) => {
  if (!dims?.w || !dims?.h || !area?.width || !area?.height) {
    return transform;
  }

  const radians = (safeNumber(transform.rotation, 0) * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const absCos = Math.abs(cos);
  const absSin = Math.abs(sin);

  const needW = area.width * absCos + area.height * absSin;
  const needH = area.width * absSin + area.height * absCos;

  const baseScale = Math.max(area.width / dims.w, area.height / dims.h);

  const minZoom = Math.max(
    MIN_ZOOM,
    needW / (dims.w * baseScale),
    needH / (dims.h * baseScale)
  );

  const zoom = Math.max(
    minZoom,
    Math.min(safeNumber(transform.zoom, 1), MAX_ZOOM)
  );

  const drawW = dims.w * baseScale * zoom;
  const drawH = dims.h * baseScale * zoom;

  const slackX = Math.max(0, (drawW - needW) / 2);
  const slackY = Math.max(0, (drawH - needH) / 2);

  const panX = safeNumber(transform.panX);
  const panY = safeNumber(transform.panY);

  const qx = clampNum(panX * cos + panY * sin, -slackX, slackX);
  const qy = clampNum(-panX * sin + panY * cos, -slackY, slackY);

  return {
    ...transform,
    zoom,
    panX: qx * cos - qy * sin,
    panY: qx * sin + qy * cos,
  };
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Renders the final cut-out with the same mask, pan, zoom and rotation
// as the editor view. Output is a transparent PNG in the area's aspect ratio.
const renderCrop = async ({ imageURL, dims, area, transform }) => {
  const img = await loadImage(imageURL);
  const { drawW, drawH } = coverSize(dims, area, transform.zoom);

  // Output pixels per design pixel: match the photo's own resolution.
  let outScale = clampNum(dims.w / drawW, 1, 4);
  const maxSide = Math.max(area.width, area.height) * outScale;

  if (maxSide > MAX_OUTPUT_SIDE) {
    outScale *= MAX_OUTPUT_SIDE / maxSide;
  }

  const W = Math.max(1, Math.round(area.width * outScale));
  const H = Math.max(1, Math.round(area.height * outScale));
  const sx = W / area.width;
  const sy = H / area.height;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.save();
  drawShapePath(ctx, area.shape, W, H, area.points);
  ctx.clip();

  ctx.translate(W / 2 + transform.panX * sx, H / 2 + transform.panY * sy);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.drawImage(
    img,
    (-drawW * sx) / 2,
    (-drawH * sy) / 2,
    drawW * sx,
    drawH * sy
  );

  ctx.restore();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );

  if (!blob) throw new Error("Could not render the cropped photo");

  return { blob, drawW, drawH };
};

// =====================================================
// MODAL
// =====================================================

export default function PhotoCropModal({
  area,
  imageURL,
  dims,
  initialTransform,
  allowMove = true,
  allowZoom = true,
  allowRotate = true,
  onApply,
  onChangePhoto,
  onClose,
}) {
  const [transform, setTransform] = useState(() =>
    clampTransform({ ...BASE_TRANSFORM, ...initialTransform }, area, dims)
  );

  const [busy, setBusy] = useState(false);
  const [bodyW, setBodyW] = useState(0);
  const [viewH, setViewH] = useState(
    typeof window !== "undefined" ? window.innerHeight : 700
  );

  const bodyRef = useRef(null);
  const stageElRef = useRef(null);
  const canvasRef = useRef(null);
  const transformRef = useRef(transform);
  const commitRef = useRef(null);
  const busyRef = useRef(false);
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  transformRef.current = transform;
  busyRef.current = busy;

  // Measure modal width and screen height.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;

    const measure = () => {
      setBodyW(el.clientWidth);
      setViewH(window.innerHeight);
    };

    measure();

    window.addEventListener("resize", measure);

    let observer;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(el);
    }

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, []);

  // Lock page scrolling and support Escape (cancel).
  useEffect(() => {
    const previous = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const onKey = (event) => {
      if (event.key === "Escape" && !busyRef.current) onClose?.();
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // The mask keeps its configured aspect ratio and stays fixed in the
  // middle; only the photo moves underneath it.
const availW = Math.max(0, (bodyW || 320) - PAD * 2);

const availH = Math.max(
  160,
  Math.min(viewH * 0.5, 500)
);
  const scale = availW
    ? Math.min(availW / area.width, availH / area.height)
    : 0;

  const cw = area.width * scale;
  const ch = area.height * scale;
  const ready = scale > 0;

  const { drawW, drawH } = coverSize(dims, area, transform.zoom);

  // Dim overlay with the fixed crop cut-out.
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !scale) return;

    const dpr = window.devicePixelRatio || 1;
    const W = cw + PAD * 2;
    const H = ch + PAD * 2;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "rgba(30, 30, 28, 0.58)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(PAD, PAD);

    ctx.globalCompositeOperation = "destination-out";
    drawShapePath(ctx, area.shape, cw, ch, area.points);
    ctx.fillStyle = "#000";
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    drawShapePath(ctx, area.shape, cw, ch, area.points);
    ctx.strokeStyle = "#2b8cff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }, [scale, cw, ch, area.shape, area.points]);

  // Single entry point for every change: always clamped.
  const commit = (next) => {
    const clamped = clampTransform(next, area, dims);
    transformRef.current = clamped;
    setTransform(clamped);
  };

  commitRef.current = commit;

  const startGesture = () => {
    const pts = [...pointers.current.values()];

    gesture.current = {
      zoom: transformRef.current.zoom,
      last: pts[0],
      dist:
        pts.length === 2
          ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
          : 0,
    };
  };

  const onPointerDown = (event) => {
    if (busyRef.current) return;

    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    startGesture();
  };

  const onPointerMove = (event) => {
    if (
      !scale ||
      !gesture.current ||
      !pointers.current.has(event.pointerId)
    ) {
      return;
    }

    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const pts = [...pointers.current.values()];
    const g = gesture.current;
    const current = transformRef.current;

    if (pts.length === 2 && g.dist) {
      // Two-finger pinch zoom.
      if (allowZoom) {
        const dist = Math.hypot(
          pts[0].x - pts[1].x,
          pts[0].y - pts[1].y
        );

        commit({
          ...current,
          zoom: clampNum(g.zoom * (dist / g.dist), MIN_ZOOM, MAX_ZOOM),
        });
      }
    } else if (allowMove && pts.length === 1) {
      // Incremental drag: apply the pointer delta to the current
      // (already clamped) pan so the photo never desyncs from the
      // cursor/finger after it reaches an edge.
      const dx = (pts[0].x - g.last.x) / scale;
      const dy = (pts[0].y - g.last.y) / scale;

      g.last = pts[0];

      commit({
        ...current,
        panX: current.panX + dx,
        panY: current.panY + dy,
      });
    }
  };

  const onPointerUp = (event) => {
    pointers.current.delete(event.pointerId);

    if (pointers.current.size > 0) {
      startGesture();
    } else {
      gesture.current = null;
    }
  };

  // Wheel zoom needs a non-passive native listener so preventDefault works.
  useEffect(() => {
    const el = stageElRef.current;
    if (!el || !allowZoom) return undefined;

    const handler = (event) => {
      event.preventDefault();

      if (busyRef.current) return;

      const current = transformRef.current;

      commitRef.current?.({
        ...current,
        zoom: clampNum(
          current.zoom + (event.deltaY < 0 ? 0.05 : -0.05),
          MIN_ZOOM,
          MAX_ZOOM
        ),
      });
    };

    el.addEventListener("wheel", handler, { passive: false });

    return () => el.removeEventListener("wheel", handler);
  }, [allowZoom, ready]);

  // "Use this": render the final cut-out and hand it back with the crop state.
  const apply = async () => {
    if (busy) return;

    setBusy(true);

    try {
      const final = clampTransform(transformRef.current, area, dims);

      const { blob, drawW: dW, drawH: dH } = await renderCrop({
        imageURL,
        dims,
        area,
        transform: final,
      });

      onApply?.({
        blob,
        crop: {
          zoom: final.zoom,
          panX: final.panX,
          panY: final.panY,
          rotation: final.rotation,
          drawWidth: dW,
          drawHeight: dH,
        },
      });
    } catch (error) {
      console.log("CROP RENDER ERROR", error);
      setBusy(false);
    }
  };

  const zoomPct =
    ((transform.zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;

  const rotPct = ((transform.rotation + 180) / 360) * 100;

  return (
    <div
      className="pcm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Crop your photo"
    >
      <div className="pcm-modal">
        <div className="pcm-header">
          <div>
            <h3>Crop Your Photo</h3>
            <p>{area.name}</p>
          </div>

          <button
            type="button"
            className="pcm-close"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
            >
              <path
                d="M5 5l14 14M19 5L5 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="pcm-body" ref={bodyRef}>
          {ready && (
            <div
              className="pcm-stage"
              ref={stageElRef}
              style={{
                width: cw + PAD * 2,
                height: ch + PAD * 2,
                position: "relative",
                touchAction: "none",
                overflow: "visible",
                cursor: allowMove ? "grab" : "default",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                className="pcm-img"
                src={imageURL}
                alt=""
                draggable={false}
                style={{
                  left: PAD + cw / 2 + transform.panX * scale,
                  top: PAD + ch / 2 + transform.panY * scale,
                  width: drawW * scale,
                  height: drawH * scale,
                  transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
                  position: "absolute",
                  maxWidth: "none",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />

              <canvas
                ref={canvasRef}
                className="pcm-overlay"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  pointerEvents: "none",
                }}
              />
            </div>
          )}
        </div>

        {(allowRotate || allowZoom) && (
          <div className="pcm-controls">
            {allowRotate && (
              <label className="pcm-slider-group">
                <span>Rotate</span>

                <input
                  type="range"
                  className="pcm-slider"
                  aria-label="Rotate"
                  min="-180"
                  max="180"
                  step="1"
                  disabled={busy}
                  value={transform.rotation}
                  style={{ "--pct": `${rotPct}%` }}
                  onChange={(event) =>
                    commit({
                      ...transformRef.current,
                      rotation: Number(event.target.value),
                    })
                  }
                />

                <span className="pcm-value">{transform.rotation}°</span>
              </label>
            )}

            {allowZoom && (
              <label className="pcm-slider-group">
                <span>Zoom</span>

                <input
                  type="range"
                  className="pcm-slider"
                  aria-label="Zoom"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step="0.01"
                  disabled={busy}
                  value={transform.zoom}
                  style={{ "--pct": `${zoomPct}%` }}
                  onChange={(event) =>
                    commit({
                      ...transformRef.current,
                      zoom: Number(event.target.value),
                    })
                  }
                />

                <span className="pcm-value">
                  {Math.round(transform.zoom * 100)}%
                </span>
              </label>
            )}
          </div>
        )}

        <div className="pcm-footer">
          <button
            type="button"
            className="pcm-btn pcm-btn-ghost"
            disabled={busy}
            onClick={onChangePhoto}
          >
            Change
          </button>

          <button
            type="button"
            className="pcm-btn pcm-btn-ghost"
            disabled={busy}
            onClick={() => commit({ ...BASE_TRANSFORM })}
          >
            Reset
          </button>

          <span className="pcm-spacer" />

          <button
            type="button"
            className="pcm-btn pcm-btn-primary"
            disabled={busy}
            onClick={apply}
          >
            {busy ? "Applying..." : "Use this"}
          </button>
        </div>
      </div>
    </div>
  );
}