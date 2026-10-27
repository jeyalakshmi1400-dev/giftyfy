import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../styles/addproduct.css";
import AdminSidebar from "../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { components } from "react-select";
import { useParams } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import TipTapEditor from "../components/TipTapEditor";
import DOMPurify from "dompurify";
/* =====================================================================
   PERSONALIZATION TEMPLATE EDITOR
   ---------------------------------------------------------------------
   Generic, product-independent visual editor. No external dependency.
   Stored inside the existing `customization` object:
     customization.enabled            -> boolean
     customization.nameEnabled        -> boolean (Name on/off)
     customization.nameDraggable      -> boolean (NAME FIX: customer may move name)
     customization.backgroundSource   -> "template" | "product"
     customization.canvasWidth/Height -> natural pixel size of background
     customization.imageAreas[]       -> photo placeholders
     customization.textAreas[]        -> NAME placeholders (same structure
                                         as before, kept for compatibility)
        extra NAME keys: effect ("deboss" | "foil" | "print"),
                         coverSample (boolean), coverFrom (above|below|left|right)
   Area geometry is stored in PERCENT of the background image:
     x, y, width, height  -> 0..100 (relative to image width / height)
     rotation             -> degrees (around the area's centre)
     fontSize             -> px at the natural canvasWidth
   so the customer page can render it at any size.
   SHAPES (must stay identical to PersonalizeProduct.jsx drawShapePath):
     rectangle / square -> full box
     rounded            -> border-radius 18% (per axis)
     circle / oval      -> border-radius 50%
     heart              -> HEART_CLIP polygon below
===================================================================== */

const FONT_OPTIONS = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Trebuchet MS",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Brush Script MT",
  "Comic Sans MS",
  "Impact",
  "cursive",
  "fantasy",
];

// NAME FIX: how the name looks on the product (customer page renders these).
const NAME_EFFECTS = [
  { value: "deboss", label: "Debossed (pressed into leather)" },
  { value: "foil", label: "Foil stamped" },
  { value: "print", label: "Printed (flat)" },
];

// NAME FIX: where to copy clean leather from when hiding a sample name.
const COVER_SOURCES = [
  { value: "above", label: "Above the name box" },
  { value: "below", label: "Below the name box" },
  { value: "left", label: "Left of the name box" },
  { value: "right", label: "Right of the name box" },
];

// NAME FIX: CSS approximation of each effect for the admin canvas preview.
const previewTextShadow = (a) => {
  if (a.effect === "foil") return "0 1px 1px rgba(0,0,0,0.55)";
  if (a.effect === "print") return "none";
  return "1px 1px 0 rgba(255,255,255,0.4)";
};

const SHAPE_OPTIONS = [
  { value: "rectangle", label: "Rectangle" },
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded Rectangle" },
  { value: "circle", label: "Circle" },
  { value: "heart", label: "Heart" },
  { value: "oval", label: "Oval" },
  { value: "custom", label: "Custom 12-Point Mask" },
];
const PROPORTIONAL_SHAPES = ["circle", "square", "heart"];
const HEART_CLIP =
  "polygon(50% 95%, 10% 58%, 2% 42%, 2% 30%, 8% 17%, 20% 10%, 32% 12%, 50% 30%, 68% 12%, 80% 10%, 92% 17%, 98% 30%, 98% 42%, 90% 58%)";
const HANDLES = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
];
const MIN_PX = 16;
const DEFAULT_PERSPECTIVE_POINTS = [
  { x: 18, y: 20 },
  { x: 82, y: 18 },
  { x: 84, y: 90 },
  { x: 16, y: 92 },
];
// A–L: 12 independently editable points
const DEFAULT_CUSTOM_POINTS = [
  { x: 25, y: 0, label: "A" },
  { x: 50, y: 0, label: "B" },
  { x: 75, y: 0, label: "C" },
  { x: 100, y: 25, label: "D" },
  { x: 100, y: 50, label: "E" },
  { x: 100, y: 75, label: "F" },
  { x: 75, y: 100, label: "G" },
  { x: 50, y: 100, label: "H" },
  { x: 25, y: 100, label: "I" },
  { x: 0, y: 75, label: "J" },
  { x: 0, y: 50, label: "K" },
  { x: 0, y: 25, label: "L" },
];

const DEFAULT_ROUNDED_POINTS = [
  { x: 18, y: 0, label: "A" }, { x: 50, y: 0, label: "B" },
  { x: 82, y: 0, label: "C" }, { x: 100, y: 18, label: "D" },
  { x: 100, y: 50, label: "E" }, { x: 100, y: 82, label: "F" },
  { x: 82, y: 100, label: "G" }, { x: 50, y: 100, label: "H" },
  { x: 18, y: 100, label: "I" }, { x: 0, y: 82, label: "J" },
  { x: 0, y: 50, label: "K" }, { x: 0, y: 18, label: "L" },
];
const POINT_EDITABLE_SHAPES = ["rectangle", "square", "rounded", "heart", "custom"];
const defaultPointsForShape = (shape) => {
  if (shape === "heart") return DEFAULT_HEART_POINTS;
  if (shape === "rounded") return DEFAULT_ROUNDED_POINTS;
  return DEFAULT_CUSTOM_POINTS;
};
const normalizePointsForShape = (shape, points) => {
  const defaults = defaultPointsForShape(shape);
  if (!Array.isArray(points) || points.length !== 12) return defaults.map((p) => ({ ...p }));
  return points.map((point, index) => ({
    label: defaults[index].label,
    x: Math.max(0, Math.min(100, num(point?.x, defaults[index].x))),
    y: Math.max(0, Math.min(100, num(point?.y, defaults[index].y))),
  }));
};

const DEFAULT_HEART_POINTS = [
  { x: 50, y: 96, label: "A" }, // Bottom tip
  { x: 35, y: 83, label: "B" }, // Lower left
  { x: 20, y: 69, label: "C" }, // Left lower curve
  { x: 7, y: 52, label: "D" }, // Left edge
  { x: 3, y: 36, label: "E" }, // Upper left edge
  { x: 9, y: 20, label: "F" }, // Left lobe
  { x: 23, y: 9, label: "G" }, // Top-left lobe
  { x: 38, y: 10, label: "H" }, // Toward center notch
  { x: 50, y: 25, label: "I" }, // Center notch
  { x: 62, y: 10, label: "J" }, // Toward right lobe
  { x: 77, y: 9, label: "K" }, // Top-right lobe
  { x: 91, y: 20, label: "L" }, // Right lobe
];

const num = (v, fallback) => {
  const n = Number(v);
  return v === undefined || v === null || v === "" || Number.isNaN(n)
    ? fallback
    : n;
};
const round2 = (v) => Math.round(v * 100) / 100;
const uid = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
const normalizePerspectivePoints = (points) => {
  if (!Array.isArray(points) || points.length !== 4) {
    return DEFAULT_PERSPECTIVE_POINTS.map((p) => ({ ...p }));
  }
  return points.map((point, index) => ({
    x: Math.max(
       0,
      Math.min(
        100,
        num(point?.x, DEFAULT_PERSPECTIVE_POINTS[index].x)
      )
    ),
    y: Math.max(
      0,
      Math.min(
        100,
        num(point?.y, DEFAULT_PERSPECTIVE_POINTS[index].y)
      )
    ),
  }));
};

const normalizeCustomPoints = (points) => {
  if (!Array.isArray(points) || points.length !== 12) {
    return DEFAULT_CUSTOM_POINTS.map((p) => ({ ...p }));
  }
  return points.map((point, index) => ({
    label: DEFAULT_CUSTOM_POINTS[index].label,
    x: num(point?.x, DEFAULT_CUSTOM_POINTS[index].x),
    y: num(point?.y, DEFAULT_CUSTOM_POINTS[index].y),
  }));
};
const normalizeHeartPoints = (points) => {
if (!Array.isArray(points) || points.length !== 12) {
    return DEFAULT_HEART_POINTS.map((p) => ({ ...p }));
}
  return points.map((point, index) => ({
   label: DEFAULT_HEART_POINTS[index].label,
    x: Math.max(0, Math.min(100,
            num(point?.x, DEFAULT_HEART_POINTS[index].x)
  )),
    y: Math.max(0, Math.min(100,
      num(point?.y, DEFAULT_HEART_POINTS[index].y)
    )),
  }));
};

const isPhotoFrameCategory = (category) =>
  String(category || "").trim().toLowerCase() === "photo frame";

const toPolygonPoints = (points) =>
  (Array.isArray(points) ? points : [])
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

const cursorFor = (sx, sy) =>
  sx === 0
    ? "ns-resize"
    : sy === 0
      ? "ew-resize"
      : sx === sy
        ? "nwse-resize"
        : "nesw-resize";

const normImage = (a, i) => ({
  ...a,
  id: a.id || uid("img"),
  type: "image",
  name: a.name || `Photo ${i + 1}`,
  x: num(a.x, 30),
  y: num(a.y, 30),
  width: num(a.width, 40),
  height: num(a.height, 30),
  rotation: num(a.rotation, 0),
  shape: a.shape || "rectangle",
  // Preserve previously saved points; initialize them when needed.
  points: Array.isArray(a.points)
    ? a.points
    : undefined,
  fit: a.fit || "cover",
  photoZoom: num(a.photoZoom, 1),
  photoX: num(a.photoX, 0),
  photoY: num(a.photoY, 0),
  photoRotation: num(a.photoRotation, 0),
});

// Name areas reuse the existing textAreas structure.
// Saved values still win, so old products keep their data.
// NAME FIX: adds effect / coverSample / coverFrom defaults.
const normText = (a, i, cw) => ({
  ...a,
  id: a.id || uid("txt"),
  type: "text",
  name: a.name || `Name ${i + 1}`,
  x: num(a.x, 30),
  y: num(a.y, 45),
  width: num(a.width, 40),
  height: num(a.height, 10),
  rotation: num(a.rotation, 0),
  fontFamily: a.fontFamily || "Arial",
  fontSize: num(a.fontSize, Math.round(cw * 0.04)),
  color: a.color || "#000000",
  maxCharacters: num(a.maxCharacters, 20),
  textAlign: a.textAlign || "center",
  placeholder: a.placeholder || "Your name",
  effect: a.effect || "deboss", // NAME FIX
  coverSample: !!a.coverSample, // NAME FIX
  coverFrom: a.coverFrom || "above", // NAME FIX
});

const patchArea = (setCustomization, id, changes) => {
  setCustomization((prev) => {
    const upd = (list) =>
      (Array.isArray(list) ? list : []).map((a) =>
        a.id === id ? { ...a, ...changes } : a
      );
    return {
      ...prev,
      imageAreas: upd(prev.imageAreas),
      textAreas: upd(prev.textAreas),
    };
  });
};

function EditorField({ label, children }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "12px",
        fontWeight: 600,
        marginTop: "10px",
      }}
    >
      {label}
      <div style={{ marginTop: "4px" }}>{children}</div>
    </label>
  );
}

function PersonalizationEditor({
  customization,
  setCustomization,
  bgOptions = [],
}) {
  const enabled = !!customization.enabled;
  const imageAreas = Array.isArray(customization.imageAreas)
    ? customization.imageAreas
    : [];
  const textAreas = Array.isArray(customization.textAreas)
    ? customization.textAreas
    : [];
  const cw = customization.canvasWidth || 800;
  const ch = customization.canvasHeight || 600;
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [boxW, setBoxW] = useState(0);
  const canvasRef = useRef(null);
  const areaRefs = useRef({});
  const dragRef = useRef(null);
  const activeBg =
    bgOptions.find(
      (o) => o.key === customization.backgroundSource
    ) ||
    bgOptions[0] ||
    null;
  const bgUrl = activeBg ? activeBg.url : "";
  // Load actual background dimensions.
  useEffect(() => {
    if (!bgUrl || !enabled) return undefined;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;
      setCustomization((prev) =>
        prev.canvasWidth === w &&
          prev.canvasHeight === h &&
          prev.backgroundSource === activeBg.key
          ? prev
          : {
            ...prev,
            canvasWidth: w,
            canvasHeight: h,
            backgroundSource: activeBg.key,
          }
      );
    };
    img.src = bgUrl;
    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [bgUrl, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  // Normalize saved areas without removing existing custom data.
  useEffect(() => {
    if (!enabled) return;
    const ni = imageAreas.map((a, i) => normImage(a, i));
    const nt = textAreas.map((a, i) => normText(a, i, cw));
    if (
      JSON.stringify(ni) !== JSON.stringify(imageAreas) ||
      JSON.stringify(nt) !== JSON.stringify(textAreas)
    ) {
      setCustomization((prev) => ({
        ...prev,
        imageAreas: ni,
        textAreas: nt,
      }));
    }
  }, [
    customization.imageAreas,
    customization.textAreas,
    cw,
    enabled,
  ]); // eslint-disable-line react-hooks/exhaustive-deps
  // Measure canvas width for text scaling.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    setBoxW(el.clientWidth);
    return () => ro.disconnect();
  }, [enabled]);
  // Move, resize, rotate, and independent polygon-point drag.
  useEffect(() => {
    const move = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const { rect, start } = d;
      const W = rect.width;
      const H = rect.height;
      if (W <= 0 || H <= 0) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      // CUSTOM POINT: move only the selected A–L point for supported shapes.
      if (d.mode === "point") {
        const points = normalizePointsForShape(start.shape, start.points);
        const index = d.pointIndex;
        if (!points[index]) return;
        const areaW = d.areaWidth;
        const areaH = d.areaHeight;
        if (!areaW || !areaH) return;
        // Convert pointer movement into the selected area's local coordinates.
        const angle = -((start.rotation || 0) * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const localDX = dx * cos - dy * sin;
        const localDY = dx * sin + dy * cos;
        const nextPoints = points.map((point, pointIndex) => {
          if (pointIndex !== index) return point;
          return {
            ...point,
            x: round2(Math.max(0, Math.min(100, point.x + (localDX / areaW) * 100))),
            y: round2(Math.max(0, Math.min(100, point.y + (localDY / areaH) * 100))),
          };
        });
        patchArea(d.setCustomization, d.id, { points: nextPoints, shape: start.shape });
        return;
      }
      // MOVE AREA.
      if (d.mode === "move") {
        const x = start.x + (dx / W) * 100;
        const y = start.y + (dy / H) * 100;
        patchArea(d.setCustomization, d.id, {
          x: round2(
            Math.max(0, Math.min(100 - start.width, x))
          ),
          y: round2(
            Math.max(0, Math.min(100 - start.height, y))
          ),
        });
        return;
      }
      // ROTATE AREA.
      if (d.mode === "rotate") {
        const centerX =
          rect.left + ((start.x + start.width / 2) / 100) * W;
        const centerY =
          rect.top + ((start.y + start.height / 2) / 100) * H;
        let angle =
          (Math.atan2(
            e.clientY - centerY,
            e.clientX - centerX
          ) *
            180) /
          Math.PI +
          90;
        if (e.shiftKey) {
          angle = Math.round(angle / 15) * 15;
        }
        patchArea(d.setCustomization, d.id, {
          rotation: ((Math.round(angle) % 360) + 360) % 360,
        });
        return;
      }
      // RESIZE AREA.
      if (d.mode === "resize") {
        const [sx, sy] = d.handle;
        const angle = ((start.rotation || 0) * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const w0 = (start.width / 100) * W;
        const h0 = (start.height / 100) * H;
        if (w0 <= 0 || h0 <= 0) return;
        const centerX =
          ((start.x + start.width / 2) / 100) * W;
        const centerY =
          ((start.y + start.height / 2) / 100) * H;
        const localDX = dx * cos + dy * sin;
        const localDY = -dx * sin + dy * cos;
        let w1 = w0;
        let h1 = h0;
        if (sx !== 0) w1 = w0 + sx * localDX;
        if (sy !== 0) h1 = h0 + sy * localDY;
        w1 = Math.max(MIN_PX, w1);
        h1 = Math.max(MIN_PX, h1);
        if (
          start.type === "image" &&
          PROPORTIONAL_SHAPES.includes(start.shape) &&
          sx !== 0 &&
          sy !== 0
        ) {
          const ratio = w0 / h0;
          const widthChange = Math.abs(w1 - w0);
          const heightChange = Math.abs(h1 - h0);
          if (widthChange >= heightChange * ratio) {
            h1 = w1 / ratio;
          } else {
            w1 = h1 * ratio;
          }
          if (w1 < MIN_PX) {
            w1 = MIN_PX;
            h1 = w1 / ratio;
          }
          if (h1 < MIN_PX) {
            h1 = MIN_PX;
            w1 = h1 * ratio;
          }
        }
        const anchorLocalX = sx !== 0 ? (-sx * w0) / 2 : 0;
        const anchorLocalY = sy !== 0 ? (-sy * h0) / 2 : 0;
        const anchorX =
          centerX +
          anchorLocalX * cos -
          anchorLocalY * sin;
        const anchorY =
          centerY +
          anchorLocalX * sin +
          anchorLocalY * cos;
        const offsetX =
          (sx !== 0 ? (sx * w1) / 2 : 0) * cos -
          (sy !== 0 ? (sy * h1) / 2 : 0) * sin;
        const offsetY =
          (sx !== 0 ? (sx * w1) / 2 : 0) * sin +
          (sy !== 0 ? (sy * h1) / 2 : 0) * cos;
        const newCenterX = anchorX + offsetX;
        const newCenterY = anchorY + offsetY;
        patchArea(d.setCustomization, d.id, {
          x: round2(((newCenterX - w1 / 2) / W) * 100),
          y: round2(((newCenterY - h1 / 2) / H) * 100),
          width: round2((w1 / W) * 100),
          height: round2((h1 / H) * 100),
        });
      }
    };
    const up = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);
  const startDrag = (e, area, mode, handle) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canvasRef.current) return;
    setSelectedId(area.id);
    setSelectedPoint(null);
    dragRef.current = {
      mode,
      handle,
      id: area.id,
      startX: e.clientX,
      startY: e.clientY,
      rect: canvasRef.current.getBoundingClientRect(),
      start: { ...area },
      setCustomization,
    };
  };
  // Start dragging a single polygon vertex.
  const startPointDrag = (e, area, pointIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const areaElement = areaRefs.current[area.id];
    if (!areaElement) return;
    const areaW = areaElement.offsetWidth;
    const areaH = areaElement.offsetHeight;
    if (!areaW || !areaH) return;
    setSelectedId(area.id);
    setSelectedPoint(pointIndex);
    dragRef.current = {
      mode: "point",
      id: area.id,
      pointIndex,
      startX: e.clientX,
      startY: e.clientY,
      areaWidth: areaW,
      areaHeight: areaH,
      rect: canvasRef.current.getBoundingClientRect(),
      start: {
        ...area,
        points: normalizePointsForShape(area.shape, area.points).map((p) => ({ ...p })),
      },
      setCustomization,
    };
  };
  const addImageArea = () => {
    const n = imageAreas.length;
    const w = 30;
    const h = round2((w * cw) / ch);
    const area = normImage(
      {
        id: uid("img"),
        name: `Photo ${n + 1}`,
        x: 20 + (n % 5) * 4,
        y: 20 + (n % 5) * 4,
        width: w,
        height: h,
        rotation: 0,
        shape: "rectangle",
        points: DEFAULT_CUSTOM_POINTS.map((p) => ({ ...p })),
      },
      n
    );
    setCustomization((prev) => ({
      ...prev,
      imageAreas: [...(prev.imageAreas || []), area],
    }));
    setSelectedId(area.id);
    setSelectedPoint(null);
  };
  // New areas are Name areas (same textAreas structure).
  const addTextArea = () => {
    const n = textAreas.length;
    const area = normText(
      {
        id: uid("txt"),
        name: `Name ${n + 1}`,
        x: 30 + (n % 5) * 3,
        y: 60 + (n % 5) * 3,
        placeholder: "Your name",
      },
      n,
      cw
    );
    setCustomization((prev) => ({
      ...prev,
      textAreas: [...(prev.textAreas || []), area],
    }));
    setSelectedId(area.id);
    setSelectedPoint(null);
  };
  const deleteArea = (id) => {
    setCustomization((prev) => ({
      ...prev,
      imageAreas: (prev.imageAreas || []).filter((a) => a.id !== id),
      textAreas: (prev.textAreas || []).filter((a) => a.id !== id),
    }));
    setSelectedId(null);
    setSelectedPoint(null);
  };
  const duplicateArea = (area) => {
    const copy = {
      ...area,
      id: uid(area.type === "text" ? "txt" : "img"),
      name: `${area.name} copy`,
      x: round2(area.x + 3),
      y: round2(area.y + 3),
      points:
        area.type === "image" && Array.isArray(area.points)
          ? area.points.map((p) => ({ ...p }))
          : area.points,
    };
    setCustomization((prev) =>
      area.type === "text"
        ? {
          ...prev,
          textAreas: [...(prev.textAreas || []), copy],
        }
        : {
          ...prev,
          imageAreas: [...(prev.imageAreas || []), copy],
        }
    );
    setSelectedId(copy.id);
    setSelectedPoint(null);
  };
  const setField = (id, changes) =>
    patchArea(setCustomization, id, changes);
  const allAreas = [...imageAreas, ...textAreas];
  const selected =
    allAreas.find((a) => a.id === selectedId) || null;
  const selectedPoints =
    selected && selected.type === "image" && POINT_EDITABLE_SHAPES.includes(selected.shape)
      ? normalizePointsForShape(selected.shape, selected.points)
      : [];
  const scale = boxW && cw ? boxW / cw : 1;
  const radiusFor = (a) => {
    if (a.type !== "image") return "2px";
    if (a.shape === "circle" || a.shape === "oval") {
      return "50%";
    }
    if (a.shape === "rounded") {
      return "18%";
    }
    return "0";
  };
  const clipFor = (a) => {
    if (a.type !== "image") return "none";
    if (POINT_EDITABLE_SHAPES.includes(a.shape)) {
      const points = normalizePointsForShape(a.shape, a.points);
      return `polygon(${points.map((p) => `${p.x}% ${p.y}%`).join(", ")})`;
    }
    return "none";
  };
  const renderArea = (a) => {
    const sel = a.id === selectedId;
    const isText = a.type === "text";
    const color = isText ? "#2563eb" : "#e11d48";
    const isPointEditable = !isText && POINT_EDITABLE_SHAPES.includes(a.shape);
    const points = isPointEditable ? normalizePointsForShape(a.shape, a.points) : [];
    return (
      <div
        key={a.id}
        ref={(el) => {
          areaRefs.current[a.id] = el;
        }}
        onPointerDown={(e) => startDrag(e, a, "move")}
        style={{
          position: "absolute",
          left: `${a.x}%`,
          top: `${a.y}%`,
          width: `${a.width}%`,
          height: `${a.height}%`,
          transform: `rotate(${a.rotation || 0}deg)`,
          transformOrigin: "center center",
          boxSizing: "border-box",
          border:
            (!isText && isPointEditable)
              ? "none"
              : `2px ${sel ? "solid" : "dashed"} ${color}`,
          background:
            !isText && isPointEditable
              ? "transparent"
              : isText
                ? "rgba(37,99,235,0.10)"
                : "rgba(225,29,72,0.14)",
          borderRadius: radiusFor(a),
          cursor: "move",
          touchAction: "none",
          userSelect: "none",
          zIndex: sel ? 5 : 2,
        }}
      >
        {/* Shape preview */}
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: "inherit",
            clipPath: clipFor(a),
            background:
              !isText && isPointEditable
                ? "rgba(225,29,72,0.14)"
                : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: isText
              ? a.textAlign === "left"
                ? "flex-start"
                : a.textAlign === "right"
                  ? "flex-end"
                  : "center"
              : "center",
            pointerEvents: "none",
            fontFamily: isText ? a.fontFamily : "inherit",
            fontSize: isText ? `${a.fontSize * scale}px` : "12px",
            color: isText ? a.color : color,
            textAlign: isText ? a.textAlign : "center",
            lineHeight: 1.15,
            wordBreak: "break-word",
            padding: "2px",
            fontWeight: isText ? "normal" : 600,
            // NAME FIX: approximate the chosen effect in the admin preview
            textShadow: isText ? previewTextShadow(a) : undefined,
          }}
        >
          {isText ? a.placeholder : `📷 ${a.name}`}
        </div>
        {/* Custom polygon outline */}
        {sel && isPointEditable && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 25,
            }}
          >
            <polygon
              points={toPolygonPoints(points)}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
        {/* Twelve individually draggable handles */}
        {sel &&
          isPointEditable &&
          points.map((point, index) => (
            <div
              key={point.label}
              title={`Drag point ${point.label}`}
              onPointerDown={(e) =>
                startPointDrag(e, a, index)
              }
              style={{
                position: "absolute",
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: 22,
                height: 22,
                boxSizing: "border-box",
                borderRadius: "50%",
                border: `2px solid ${color}`,
                background:
                  selectedPoint === index ? "#fbbf24" : "#ffffff",
                color: "#111827",
                fontSize: 10,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translate(-50%, -50%)",
                cursor: "grab",
                touchAction: "none",
                userSelect: "none",
                pointerEvents: "auto",
                zIndex: 40,
              }}
            >
              {point.label}
            </div>
          ))}
        {/* Rotate and resize handles */}
        {sel && (
          <>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "-24px",
                width: "2px",
                height: "22px",
                background: color,
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}
            />
            <div
              onPointerDown={(e) =>
                startDrag(e, a, "rotate")
              }
              title="Rotate (hold Shift to snap 15°)"
              style={{
                position: "absolute",
                left: "50%",
                top: "-32px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#fff",
                border: `2px solid ${color}`,
                transform: "translate(-50%, -50%)",
                cursor: "grab",
                touchAction: "none",
                zIndex: 30,
              }}
            />
            {HANDLES.map(([sx, sy]) => (
              <div
                key={`${sx}${sy}`}
                onPointerDown={(e) =>
                  startDrag(e, a, "resize", [sx, sy])
                }
                style={{
                  position: "absolute",
                  left: sx === -1 ? "0%" : sx === 0 ? "50%" : "100%",
                  top: sy === -1 ? "0%" : sy === 0 ? "50%" : "100%",
                  width: "12px",
                  height: "12px",
                  background: "#fff",
                  border: `2px solid ${color}`,
                  borderRadius: "2px",
                  transform: "translate(-50%, -50%)",
                  cursor: cursorFor(sx, sy),
                  touchAction: "none",
                  zIndex: 20,
                  pointerEvents: "auto",
                }}
              />
            ))}
          </>
        )}
      </div>
    );
  };
  const toggleEnabled = (checked) =>
    setCustomization((prev) => ({
      ...prev,
      enabled: checked,
    }));
  return (
    <div
      className="personalizationBox"
      style={{
        marginTop: "24px",
        padding: "16px",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        Personalization Template
      </h3>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => toggleEnabled(e.target.checked)}
        />
        Enable Personalization
      </label>
      {enabled && (
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <button
              type="button"
              className="ap-btn ap-btnLight"
              onClick={addImageArea}
            >
              + Add Photo Area
            </button>
            <button
              type="button"
              className="ap-btn ap-btnLight"
              onClick={addTextArea}
            >
              + Add Name Area
            </button>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={customization.nameEnabled !== false}
                onChange={(e) =>
                  setCustomization((prev) => ({
                    ...prev,
                    nameEnabled: e.target.checked,
                  }))
                }
              />
              Enable Name field
            </label>
            {/* NAME FIX: by default the name stays at the position set here */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={customization.nameDraggable === true}
                onChange={(e) =>
                  setCustomization((prev) => ({
                    ...prev,
                    nameDraggable: e.target.checked,
                  }))
                }
              />
              Customer can move name
            </label>
            {bgOptions.length > 1 && (
              <select
                className="ap-select"
                style={{ maxWidth: "240px" }}
                value={activeBg ? activeBg.key : ""}
                onChange={(e) =>
                  setCustomization((prev) => ({
                    ...prev,
                    backgroundSource: e.target.value,
                  }))
                }
              >
                {bgOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    Background: {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* NAME FIX: the customer page shows no name until a Name area exists */}
          {customization.nameEnabled !== false && textAreas.length === 0 && (
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #f59e0b",
                color: "#92400e",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              No Name area yet. Click "+ Add Name Area", then drag it to where
              the name should be printed on the product. Without it, customers
              will not see a name field.
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            {/* CANVAS */}
            <div style={{ flex: "1 1 420px", minWidth: 0 }}>
              <div
                ref={canvasRef}
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedId(null);
                    setSelectedPoint(null);
                  }
                }}
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "760px",
                  aspectRatio: `${cw} / ${ch}`,
                  background:
                    "repeating-conic-gradient(#f3f4f6 0% 25%, #ffffff 0% 50%) 50% / 20px 20px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  overflow: "hidden",
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                {bgUrl ? (
                  <img
                    src={bgUrl}
                    alt="Template background"
                    draggable={false}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "fill",
                      pointerEvents: "none",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "20px",
                      color: "#6b7280",
                      fontSize: "13px",
                      pointerEvents: "none",
                    }}
                  >
                    Upload a Frame Template or select a product image
                    to use it as the canvas background.
                  </div>
                )}
                {allAreas.map(renderArea)}
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginTop: "8px",
                }}
              >
                Drag an area to move it · squares to resize · round handle
                to rotate. For Rectangle, Square, Rounded Rectangle, Heart and Custom Mask, drag A–L to edit the shape.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  fontSize: "13px",
                  marginTop: "6px",
                }}
              >
                <strong>Customer can:</strong>
                {[
                  ["allowMove", "Move photo"],
                  ["allowZoom", "Zoom photo"],
                  ["allowRotate", "Rotate photo"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!customization[key]}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            {/* PROPERTIES PANEL */}
            <div
              style={{
                flex: "1 1 260px",
                minWidth: "240px",
                maxWidth: "340px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "12px",
                alignSelf: "flex-start",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Areas ({imageAreas.length} photo · {textAreas.length} name)
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginBottom: "10px",
                }}
              >
                {allAreas.length === 0 && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    No areas yet. Add a photo or name area.
                  </span>
                )}
                {allAreas.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(a.id);
                      setSelectedPoint(null);
                    }}
                    style={{
                      fontSize: "12px",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      cursor: "pointer",
                      border: `1px solid ${a.type === "text" ? "#2563eb" : "#e11d48"
                        }`,
                      background:
                        a.id === selectedId
                          ? a.type === "text"
                            ? "#dbeafe"
                            : "#ffe4e6"
                          : "#fff",
                    }}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
              {!selected && allAreas.length > 0 && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Select an area on the canvas to edit its properties.
                </div>
              )}
              {selected && (
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {selected.type === "text" ? "Name area" : "Photo area"}{" "}
                    properties
                  </div>
                  <EditorField label="Name">
                    <input
                      className="ap-input"
                      value={selected.name}
                      onChange={(e) =>
                        setField(selected.id, {
                          name: e.target.value,
                        })
                      }
                    />
                  </EditorField>
                  {selected.type === "image" && (
                    <EditorField label="Shape">
                      <select
                        className="ap-select"
                        value={selected.shape}
                        onChange={(e) => {
                          const shape = e.target.value;
                          const changes = { shape };
                          if (POINT_EDITABLE_SHAPES.includes(shape)) {
                            changes.points = normalizePointsForShape(
                              shape,
                              shape === selected.shape ? selected.points : undefined
                            );
                          }
                          if (PROPORTIONAL_SHAPES.includes(shape)) {
                            changes.height = round2(
                              (selected.width * cw) / ch
                            );
                          }
                          setField(selected.id, changes);
                          setSelectedPoint(null);
                        }}
                      >
                        {SHAPE_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </EditorField>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0 10px",
                    }}
                  >
                    {[
                      ["x", "X (%)"],
                      ["y", "Y (%)"],
                      ["width", "Width (%)"],
                      ["height", "Height (%)"],
                      ["rotation", "Rotation (°)"],
                    ].map(([key, label]) => (
                      <EditorField key={key} label={label}>
                        <input
                          type="number"
                          step="0.5"
                          className="ap-input"
                          value={selected[key]}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            const changes = { [key]: value };
                            if (
                              selected.type === "image" &&
                              PROPORTIONAL_SHAPES.includes(selected.shape)
                            ) {
                              if (key === "width") {
                                changes.height = round2(
                                  (value * cw) / ch
                                );
                              }
                              if (key === "height") {
                                changes.width = round2(
                                  (value * ch) / cw
                                );
                              }
                            }
                            setField(selected.id, changes);
                          }}
                        />
                      </EditorField>
                    ))}
                  </div>
                  {/* Point coordinates are also editable numerically. */}
                  {selected.type === "image" &&
                    POINT_EDITABLE_SHAPES.includes(selected.shape) && (
                      <div style={{ marginTop: "16px" }}>
                        <strong>{selected.shape === "custom" ? "Custom Mask Points (A–L)" : `${selected.shape[0].toUpperCase()}${selected.shape.slice(1)} Shape Points (A–L)`}</strong>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                          }}
                        >
                          Change one point's X or Y value. The other points
                          remain unchanged.
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(2, minmax(0, 1fr))",
                            gap: "8px",
                          }}
                        >
                          {selectedPoints.map((point, index) => (
                            <div
                              key={point.label}
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "8px",
                              }}
                            >
                              <strong>{point.label}</strong>
                              <EditorField label="X (%)">
                                <input
                                  type="number"
                                  className="ap-input"
                                  value={point.x}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    const next = selectedPoints.map(
                                      (p) => ({ ...p })
                                    );
                                    next[index].x = Number.isFinite(value)
                                      ? value
                                      : 0;
                                    setField(selected.id, {
                                      points: next,
                                    });
                                  }}
                                />
                              </EditorField>
                              <EditorField label="Y (%)">
                                <input
                                  type="number"
                                  className="ap-input"
                                  value={point.y}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    const next = selectedPoints.map(
                                      (p) => ({ ...p })
                                    );
                                    next[index].y = Number.isFinite(value)
                                     ? value
                                      : 0;
                                    setField(selected.id, {
                                      points: next,
                                    });
                                  }}
                                />
                              </EditorField>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="ap-btn ap-btnLight"
                          style={{ marginTop: "10px" }}
                          onClick={() =>
                            setField(selected.id, {
                              points: defaultPointsForShape(selected.shape).map((p) => ({ ...p })),
                            })
                          }
                        >
                          Reset A–L Points
                        </button>
                      </div>
                    )}
                  {selected.type === "text" && (
                    <>
                      <EditorField label="Font family">
                        <select
                          className="ap-select"
                          value={selected.fontFamily}
                          onChange={(e) =>
                            setField(selected.id, {
                              fontFamily: e.target.value,
                            })
                          }
                        >
                          {FONT_OPTIONS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </EditorField>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "0 10px",
                        }}
                      >
                        <EditorField label="Font size (px)">
                          <input
                            type="number"
                            min="1"
                            className="ap-input"
                            value={selected.fontSize}
                            onChange={(e) =>
                              setField(selected.id, {
                                fontSize: Number(e.target.value) || 1,
                              })
                            }
                          />
                        </EditorField>
                        <EditorField label="Max characters">
                          <input
                            type="number"
                            min="1"
                            className="ap-input"
                            value={selected.maxCharacters}
                            onChange={(e) =>
                              setField(selected.id, {
                                maxCharacters: Number(e.target.value) || 1,
                              })
                            }
                          />
                        </EditorField>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "0 10px",
                        }}
                      >
                        <EditorField label="Color">
                          <input
                            type="color"
                            value={selected.color}
                            onChange={(e) =>
                              setField(selected.id, {
                                color: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              height: "36px",
                            }}
                          />
                        </EditorField>
                        <EditorField label="Alignment">
                          <select
                            className="ap-select"
                            value={selected.textAlign}
                            onChange={(e) =>
                              setField(selected.id, {
                                textAlign: e.target.value,
                              })
                            }
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </EditorField>
                      </div>
                      <EditorField label="Sample name (shown in preview)">
                        <input
                          className="ap-input"
                          value={selected.placeholder}
                          onChange={(e) =>
                            setField(selected.id, {
                              placeholder: e.target.value,
                            })
                          }
                        />
                      </EditorField>
                      {/* NAME FIX: how the name looks on the product */}
                      <EditorField label="Name style">
                        <select
                          className="ap-select"
                          value={selected.effect || "deboss"}
                          onChange={(e) =>
                            setField(selected.id, {
                              effect: e.target.value,
                            })
                          }
                        >
                          {NAME_EFFECTS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </EditorField>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          margin: "4px 0 0",
                        }}
                      >
                        Tip: for foil, pick a gold (#d4af37) or silver color
                        above. For deboss, pick a dark tone of the leather.
                      </p>
                      {/* NAME FIX: hide a sample name that is baked into the image */}
                      <div style={{ marginTop: "12px" }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!selected.coverSample}
                            onChange={(e) =>
                              setField(selected.id, {
                                coverSample: e.target.checked,
                              })
                            }
                          />
                          Hide sample name already in the image
                        </label>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            margin: "4px 0 0",
                          }}
                        >
                          Covers the box with clean leather copied from next
                          to it. Resize this area so it fully covers the
                          sample name. A product image without a sample name
                          gives the best result.
                        </p>
                      </div>
                      {selected.coverSample && (
                        <EditorField label="Copy clean leather from">
                          <select
                            className="ap-select"
                            value={selected.coverFrom || "above"}
                            onChange={(e) =>
                              setField(selected.id, {
                                coverFrom: e.target.value,
                              })
                            }
                          >
                            {COVER_SOURCES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </EditorField>
                      )}
                    </>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "14px",
                    }}
                  >
                    <button
                      type="button"
                      className="ap-btn ap-btnLight"
                      disabled={!selected}
                      onClick={() => {
                        if (!selected) return;
                        duplicateArea(selected);
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="ap-removeBtn"
                      disabled={!selected}
                      onClick={() => {
                        if (!selected) return;
                        deleteArea(selected.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function AddProduct() {
  const [product, setProduct] = useState({
    name: "",
    category: "",
    subcategory: "",
    brand: "",
    price: "",
    purchasePrice: "",
    gst: "",
    discountType: "flat",
    discountValue: "",
    quantity: "",
    description: "",
    isCustomized: false,
    customizationFields: [],
  });
  const { id } = useParams();
  const [colors, setColors] = useState([]);
  const navigate = useNavigate();
  const [categories, setCategoryies] = useState([]);
  const [locations, setLocations] = useState([{ city: "", pincode: [] }]);
  const [pincodeOptions, setPincodeOptions] = useState({});
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [cities, setCities] = useState([]);
  const [showAllSelected, setShowAllSelected] = useState({});
  const fileInputRefs = useRef([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingVariantImages, setExistingVariantImages] = useState([]);
  const [aiPreview, setAiPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [descriptionMode, setDescriptionMode] = useState("manual");
  const [templateImage, setTemplateImage] = useState(null);
  const [templatePreview, setTemplatePreview] = useState("");
  const [deliveryType, setDeliveryType] = useState("all");
  const [frameSizes, setFrameSizes] = useState([]);
  // ✅ FINAL PRICE (NEW)
  const [maskImage, setMaskImage] = useState(null);
  const [maskPreview, setMaskPreview] = useState("");
  const [customization, setCustomization] = useState({
    templateImage: "",
    maskImage: "",
    printableArea: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
    },
    allowMove: true,
    allowZoom: true,
    allowRotate: true,
    // ✅ NEW: visual personalization template editor data
    enabled: false,
    nameEnabled: true, // Name field on/off (undefined on old products = on)
    nameDraggable: false, // NAME FIX: name stays at the admin position by default
    backgroundSource: "",
    canvasWidth: 0,
    canvasHeight: 0,
    imageAreas: [],
    textAreas: [],
  });
  const price = Number(product.price);
  const discount = Number(product.discountValue);
  const gst = Number(product.gst);
  const isDress = product.category?.trim() === "Dress";
  const isPhotoFrame = product.subcategory === "Photo Frame";
  const discountedPrice =
    product.discountType === "percentage"
      ? price - (price * discount) / 100
      : price - discount;
  const finalPrice = discountedPrice + (discountedPrice * gst) / 100;
  const estimatedProfit =
    finalPrice -
    Number(product.purchasePrice || 0);
  // ✅ NEW: backgrounds the personalization canvas can use (existing previews)
  const personalizationBgOptions = [
    templatePreview && {
      key: "template",
      label: "Frame Template",
      url: templatePreview,
    },
    preview[0] && {
      key: "product",
      label: "Main product image",
      url: preview[0],
    },
  ].filter(Boolean);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" && { subcategory: "" })
    }));
    if (name === "category") {
      if (value === "Dress") {
        setColors([
          {
            color: "",
            images: [],
            preview: [],
            sizes: [{ size: "", price: "", quantity: "", purchasePrice: "", }],
            showImages: true
          }
        ]);
      } else {
        setColors([]); // 🔥 reset
      }
    }
    if (name === "subcategory") {
      if (value === "Photo Frame") {
        setFrameSizes([
          {
            size: "",
            price: "",
            purchasePrice: "",
            quantity: "",
            width: "",
            height: "",
            isDefault: false
          }
        ]);
      } else {
        setFrameSizes([]);
      }
    }
  };
  const addLocation = () => {
    setLocations([...locations, { city: "", pincode: [] }]);
  };
  const removeLocation = (index) => {
    const values = locations.filter((_, i) => i !== index);
    setLocations(values);
  };
  // ✅ FIXED SUBMIT
  const submitHandler = async (e) => {
    e.preventDefault();
    console.log(product);
    // Convert numeric values
    const price = Number(product.price) || 0;
    const discount = Number(product.discountValue) || 0;
    const gst = Number(product.gst) || 0;
    const quantity = Number(product.quantity) || 0;
    // Validation
    if (product.discountType === "percentage" && discount > 100) {
      alert("Discount cannot be more than 100%");
      return;
    }
    if (product.discountType === "flat" && discount > price) {
      alert("Discount cannot be higher than price");
      return;
    }
    if (gst > 100) {
      alert("GST cannot be more than 100%");
      return;
    }
    // ✅ NEW: personalization needs a reference image, because every area is
    // stored as a percentage of that image.
    if (customization.enabled && personalizationBgOptions.length === 0) {
      alert(
        "Upload a Frame Template or a product image before enabling personalization."
      );
      return;
    }
    // ✅ NEW: always save the background that was actually shown in the editor,
    // so PersonalizeProduct.jsx uses the very same image as the reference.
    const savedBackgroundSource = personalizationBgOptions.some(
      (o) => o.key === customization.backgroundSource
    )
      ? customization.backgroundSource
      : personalizationBgOptions[0]?.key || customization.backgroundSource;
    const finalCustomization = {
      ...customization,
      backgroundSource: savedBackgroundSource,
    };
    const formData = new FormData();
    // Append basic product info
    formData.append("name", product.name);
    formData.append("category", product.category);
    formData.append("subcategory", product.subcategory);
    formData.append("brand", product.brand || "");
    formData.append("price", price);
    formData.append(
      "purchasePrice",
      Number(product.purchasePrice) || 0
    );
    formData.append("gst", gst);
    formData.append("discountType", product.discountType);
    formData.append("discountValue", discount);
    formData.append("quantity", quantity);
    formData.append("description", product.description || "");
    // ✅ CUSTOMIZATION
    formData.append("isCustomized", product.isCustomized || customization.enabled);
    formData.append(
      "customizationFields",
      JSON.stringify(product.customizationFields)
    );
    formData.append(
      "customization",
      JSON.stringify(finalCustomization)
    );
    if (templateImage) {
      formData.append("templateImage", templateImage);
    }
    if (maskImage) {
      formData.append("maskImage", maskImage);
    }
    // Locations → convert pincode to numbers
    const formattedLocations = locations.map((loc) => ({
      city: loc.city,
      pincode: loc.pincode.map((p) => Number(p) || 0),
    }));
    formData.append("deliveryType", deliveryType);
    formData.append("locations", JSON.stringify(formattedLocations));
    // 🔹 NORMAL IMAGES
    // Include existing images
    formData.set("existingImages", JSON.stringify(existingImages || []));
    // Append newly uploaded images
    if (images && images.length > 0) {
      images.forEach((img) => {
        formData.append("images", img);
      });
    }
    // 🔹 VARIANTS
    const formattedVariants = colors.map((col) => ({
      color: col.color || "",
      sizes: col.sizes.map((sz) => ({
        size: sz.size || "",
        price: Number(sz.price) || 0,
        purchasePrice:
          Number(sz.purchasePrice) || 0,
        quantity: Number(sz.quantity) || 0,
      })),
      images: col.existingImages || [] // 🔥🔥 THIS IS THE FIX
    }));
    formData.append("variants", JSON.stringify(formattedVariants));
    formData.append(
      "frameSizes",
      JSON.stringify(frameSizes)
    );
    // Variant images
    colors.forEach((col, cIndex) => {
      // Existing variant images first
      formData.append(
        `existingVariantImages[${cIndex}]`,
        JSON.stringify(col.existingImages || [])
      );
      // Append newly uploaded variant images
      col.images.forEach((img) =>
        formData.append(`variantImages[${cIndex}]`, img)
      );
    });
    const token = localStorage.getItem("token");
    try {
      if (id) {
        // UPDATE PRODUCT
        await axios.put(`http://localhost:4000/api/product/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Product updated successfully ✅");
      } else {
        // CREATE PRODUCT
        await axios.post("http://localhost:4000/api/product", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Product added successfully ✅");
      }
      navigate("/admin/product");
    } catch (err) {
      console.error("Submit Error:", err);
      console.log("Existing Images:", existingImages);
      console.log("New Images:", images);
      alert(
        "Something went wrong! ❌ Check console for details or verify backend expects correct data types."
      );
    }
  };
  const handleImage = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert("Only 5 images allowed");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...previews]);
  };
  const removeImage = (index) => {
    if (index < existingImages.length) {
      // Remove from existingImages if index is in existing
      const updatedExisting = [...existingImages];
      updatedExisting.splice(index, 1);
      setExistingImages(updatedExisting);
    } else {
      // Remove from newly uploaded images
      const newIndex = index - existingImages.length;
      setImages(prev => prev.filter((_, i) => i !== newIndex));
    }
    // Remove from preview
    setPreview(prev => prev.filter((_, i) => i !== index));
  };
  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/categories");
      setCategoryies(res.data);
    } catch (error) {
      console.log(error);
    }
  }
  const fetchCities = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/product/cities");
      setCities(res.data);
    } catch (error) {
      console.log(error);
    }
  };
  const fetchPincodes = async (city, index) => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/product/pincodes/${city}`
      );
      const pins = res.data;
      const options = [
        { label: "Select All", value: "ALL" },
        ...pins.map((pin) => ({
          label: pin,
          value: String(pin) // 🔥 MUST STRING
        }))
      ];
      setPincodeOptions((prev) => ({
        ...prev,
        [index]: options // 🔥 index based store
      }));
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchCategories();
    fetchCities();
    if (id) {
      fetchProduct(); // 👈 call only in edit mode
    }
  }, [id]);
  useEffect(() => {
    if (customization.enabled) {
      setProduct((p) => ({ ...p, isCustomized: true }));
    }
  }, [customization.enabled]);
  const cityOptions = cities.map((city) => ({
    label: city,
    value: city
  }));
  const CustomValueContainer = ({ children, ...props }) => {
    const selected = props.getValue();
    return (
      <components.ValueContainer {...props}>
        {selected.length > 0 ? (
          <span style={{ marginLeft: "8px", fontWeight: "500" }}>
            Selected ({selected.length})
          </span>
        ) : (
          children
        )}
      </components.ValueContainer>
    );
  };
  const uniqueCategories = [
    ...new Set(categories.map(cat => cat.category))
  ];
  const addColor = () => {
    setColors([
      ...colors,
      {
        color: "",
        images: [],
        preview: [],
        sizes: [{ size: "", price: "", quantity: "", purchasePrice: "", }],
        showImages: true   // ✅ every new color opens image
      }
    ]);
  };
  const handleColorChange = (index, value) => {
    const updated = [...colors];
    updated[index].color = value;
    setColors(updated);
  };
  const handleColorImages = (e, index) => {
    const files = Array.from(e.target.files);
    const updated = [...colors];
    if (updated[index].images.length + files.length > 5) {
      alert("Only 5 images allowed");
      return;
    }
    updated[index].images.push(...files);
    updated[index].preview.push(
      ...files.map(file => URL.createObjectURL(file))
    );
    setColors(updated);
  };
  const removeColorImage = (cIndex, imgIndex) => {
    const updated = [...colors];
    const col = updated[cIndex];
    const existingLength = col.existingImages?.length || 0;
    if (imgIndex < existingLength) {
      // 🔥 remove from existing
      col.existingImages = col.existingImages.filter((_, i) => i !== imgIndex);
    } else {
      // 🔥 remove from new images
      const newIndex = imgIndex - existingLength;
      col.images = col.images.filter((_, i) => i !== newIndex);
    }
    // 🔥 rebuild FULL preview (IMPORTANT)
    const existingPreview = (col.existingImages || []).map(
      img => `http://localhost:4000/uploads/${img}`
    );
    const newPreview = (col.images || []).map(
      file => URL.createObjectURL(file)
    );
    col.preview = [...existingPreview, ...newPreview];
    setColors(updated);
  };
  const addSize = (colorIndex) => {
    const updated = [...colors];
    updated[colorIndex].sizes.push({
      size: "",
      price: "",
      purchasePrice: "",
      quantity: ""
    });
    setColors(updated);
  };
  const handleSizeChange = (colorIndex, sizeIndex, field, value) => {
    setColors((prev) => {
      const updated = [...prev];
      const sizes = [...updated[colorIndex].sizes];
      sizes[sizeIndex] = {
        ...sizes[sizeIndex],
        [field]: value,
      };
      updated[colorIndex] = {
        ...updated[colorIndex],
        sizes,
      };
      return updated;
    });
  };
  const fetchProduct = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/product/${id}`);
      const data = res.data;
      // Set product basic info
      setProduct({
        ...data,
        isCustomized:
          data.isCustomized || false,
        customizationFields:
          data.customizationFields || [],
        price: data.price || "",
        purchasePrice:
          data.purchasePrice || "",
        gst: data.gst || "",
        discountValue: data.discountValue || "",
        quantity: data.quantity || "",
      });
      if (data.customization) {
        // ✅ MERGE (instead of replace) so the new editor keys always exist
        const savedCustomization =
          typeof data.customization === "string"
            ? JSON.parse(data.customization)
            : data.customization;
        setCustomization((prev) => ({
          ...prev,
          ...savedCustomization,
          imageAreas: Array.isArray(savedCustomization.imageAreas)
            ? savedCustomization.imageAreas
            : [],
          textAreas: Array.isArray(savedCustomization.textAreas)
            ? savedCustomization.textAreas
            : [],
        }));
      }
      // 🔹 NORMAL IMAGES (for non-Dress products)
      if (data.image && data.image.length > 0) {
        const uniqueImages = [...new Set(data.image)]; // remove duplicates
        setExistingImages(uniqueImages); // backend files
        setPreview(uniqueImages.map(img => `http://localhost:4000/uploads/${img}`)); // frontend preview
      } else {
        setExistingImages([]);
        setPreview([]);
      }
      // 🔹 LOCATIONS
      if (data.locations) {
        const parsed = typeof data.locations === "string" ? JSON.parse(data.locations) : data.locations;
        const formattedLocations = parsed.map(loc => ({
          city: loc.city,
          pincode: loc.pincode.map(p => String(p)),
        }));
        setDeliveryType(data.deliveryType || "all");
        setLocations(formattedLocations);
        // Fetch pincodes for each city
        formattedLocations.forEach((loc, index) => {
          if (loc.city) fetchPincodes(loc.city, index);
        });
      } else {
        setLocations([{ city: "", pincode: [] }]);
      }
      // 🔹 DRESS VARIANTS
      if (data.category === "Dress" && data.variants) {
        const updatedColors = data.variants.map(col => ({
          ...col,
          images: [], // new uploads by user
          existingImages: col.images || [], // backend images
          preview: col.images
            ? col.images.map(img => `http://localhost:4000/uploads/${img}`)
            : [],
          showImages: true,
          sizes: col.sizes.map((sz) => ({
            size: sz.size || "",
            price: Number(sz.price) || 0,
            purchasePrice:
              Number(sz.purchasePrice) || 0,
            quantity: Number(sz.quantity) || 0,
          })),
        }));
        setColors(updatedColors);
      } else {
        setColors([]);
      }
      if (data.subcategory === "Photo Frame") {
        setFrameSizes(data.frameSizes || []);
      }
      if (data.customization?.templateImage) {
        setTemplatePreview(
          `http://localhost:4000/uploads/${data.customization.templateImage}`
        );
      }
      if (data.customization?.maskImage) {
        setMaskPreview(
          `http://localhost:4000/uploads/${data.customization.maskImage}`
        );
      }
    } catch (err) {
      console.log("Fetch Product Error:", err);
    }
  };
  const generateAIDescription = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/ai/generate-description",
        {
          productName: product.name,
        }
      );
      setAiPreview(res.data.description);
      setShowPreview(true); // 👈 open preview box
    } catch (err) {
      console.log(err);
      alert("AI failed ❌");
    }
  };
  const addFrameSize = () => {
    setFrameSizes([
      ...frameSizes,
      {
        size: "",
        price: "",
        purchasePrice: "",
        quantity: ""
      }
    ]);
  };
  const removeFrameSize = (index) => {
    setFrameSizes(frameSizes.filter((_, i) => i !== index));
  };
  const handleFrameSizeChange = (index, field, value) => {
    const updated = [...frameSizes];
    updated[index][field] = value;
    setFrameSizes(updated);
  };
  return (
    <div>
      <AdminLayout>
        <div className="ap-page">
          <div className="ap-header">
            <div>
              <div className="ap-sectionTitle">
                Product Details
              </div>
              <h2>
                {id ? "Edit Product" : "Add Product"}
              </h2>
              <p>
                Manage your product inventory
              </p>
            </div>
            <button
              type="submit"
              form="productForm"
              className="ap-topPublish"
            >
              Publish Product
            </button>
          </div>
          <form
            id="productForm"
            onSubmit={submitHandler}
          >
            {/* DETAILS SECTION */}
            <div className="ap-layout">
              <div className="ap-card">
                <input
                  name="name"
                  value={product.name}
                  placeholder="Product Name"
                  onChange={handleChange}
                  className="ap-input"
                />
                {/* DELIVERY TYPE */}
                <span className="ap-fieldLabel">Delivery Coverage</span>
                <div className="ap-deliveryType">
                  <label>
                    <input
                      type="radio"
                      value="all"
                      checked={deliveryType === "all"}
                      onChange={() => setDeliveryType("all")}
                    />
                    All India
                  </label>
                  <label style={{ marginLeft: "20px" }}>
                    <input
                      type="radio"
                      value="pincode"
                      checked={deliveryType === "pincode"}
                      onChange={() => setDeliveryType("pincode")}
                    />
                    Selected Pincodes
                  </label>
                </div>
                {/* SHOW ONLY WHEN PINCODE DELIVERY IS SELECTED */}
                {deliveryType === "pincode" && (
                  <>
                    <span className="ap-fieldLabel">Delivery Locations</span>
                    {locations.map((loc, index) => (
                      <div className="ap-locationCard" key={index}>
                        <div className="ap-row">
                          <Select
                            options={cityOptions}
                            value={cityOptions.find(
                              (opt) => opt.value === locations[index].city
                            )}
                            placeholder="Select City"
                            className="citySelect"
                            classNamePrefix="select"
                            onChange={(selected) => {
                              const values = [...locations];
                              values[index].city = selected.value;
                              values[index].pincode = [];
                              setLocations(values);
                              fetchPincodes(selected.value, index);
                            }}
                          />
                          <Select
                            options={pincodeOptions[index] || []}
                            isMulti
                            placeholder="Select Pincodes"
                            className="citySelect"
                            classNamePrefix="select"
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={{
                              ValueContainer: CustomValueContainer,
                            }}
                            value={(pincodeOptions[index] || []).filter((opt) =>
                              locations[index]?.pincode?.includes(opt.value)
                            )}
                            onChange={(selected, actionMeta) => {
                              const values = [...locations];
                              const allPins = (pincodeOptions[index] || [])
                                .filter((opt) => opt.value !== "ALL")
                                .map((opt) => opt.value);
                              if (!selected || selected.length === 0) {
                                values[index].pincode = [];
                              } else if (actionMeta.option?.value === "ALL") {
                                if (actionMeta.action === "select-option") {
                                  values[index].pincode = allPins;
                                } else {
                                  values[index].pincode = [];
                                }
                              } else {
                                values[index].pincode = selected
                                  .filter((item) => item.value !== "ALL")
                                  .map((item) => item.value);
                              }
                              setLocations(values);
                            }}
                          />
                        </div>
                        <div className="ap-locationBottom">
                          <span className="ap-selected">
                            Selected : {locations[index]?.pincode?.length || 0}
                          </span>
                          {index !== 0 && (
                            <button
                              type="button"
                              className="ap-removeBtn"
                              onClick={() => removeLocation(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="ap-btn ap-btnLight"
                      style={{ marginTop: "14px" }}
                      onClick={addLocation}
                    >
                      + Add More City
                    </button>
                  </>
                )}
                {/* CATEGORY */}
                <span className="ap-fieldLabel">Category</span>
                <div className="ap-row">
                  <select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    className="ap-select"
                  >
                    <option value="">Select Category</option>
                    {uniqueCategories.map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <select name="subcategory" value={product.subcategory} onChange={handleChange} className="ap-select">
                    <option value="">Select Subcategory</option>
                    {categories
                      .filter(cat => cat.category === product.category)
                      .map(cat => (
                        <option key={cat._id} value={cat.subcategory}>
                          {cat.subcategory}
                        </option>
                      ))}
                  </select>
                </div>
                {/* PRICE (ONLY NON-DRESS) */}
                {/* PRICE (ONLY NON-DRESS) */}
                {!isDress && !isPhotoFrame && (
                  <>
                    <span className="ap-fieldLabel">Pricing</span>
                    <div className="ap-row">
                      <input
                        name="price"
                        value={product.price}
                        onChange={handleChange}
                        placeholder="Selling Price"
                        className="ap-input"
                      />
                      <input
                        name="purchasePrice"
                        value={product.purchasePrice}
                        onChange={handleChange}
                        placeholder="Purchase Price"
                        className="ap-input"
                      />
                    </div>
                  </>
                )}
                <h3>Frame Template</h3>
                {/* ✅ CHANGED: guards against cancelled file dialog, and a newly uploaded
    template immediately becomes the reference background for the editor */}
                <input
                  type="file"
                  accept="image/png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setTemplateImage(file);
                    setTemplatePreview(URL.createObjectURL(file));
                    setCustomization((prev) => ({
                      ...prev,
                      backgroundSource: "template"
                    }));
                  }}
                />
                {templatePreview && (
                  <img
                    src={templatePreview}
                    style={{
                      width: "220px",
                      marginTop: "10px"
                    }}
                  />
                )}
                <hr />
                {/* <h3>Mask Image</h3>
                <input
                  type="file"
                  accept="image/png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setMaskImage(file);
                    setMaskPreview(URL.createObjectURL(file));
                  }}
                />
                {maskPreview && (
                  <img
                    src={maskPreview}
                    style={{
                      width: "220px",
                      marginTop: "10px"
                    }}
                  />
                )} */}
                {isPhotoFrame && (
                  <div className="variantSection">
                    <h3>🖼️ Frame Sizes</h3>
                    {frameSizes.map((item, index) => (
                      <div key={index} className="frameCard">
                        <div className="frameGrid">
                          <select
                            className="ap-select"
                            value={item.size}
                            onChange={(e) =>
                              handleFrameSizeChange(index, "size", e.target.value)
                            }
                          >
                            <option value="">Select Size</option>
                            <option value="4x6">4 × 6</option>
                            <option value="5x7">5 × 7</option>
                            <option value="6x8">6 × 8</option>
                            <option value="8x10">8 × 10</option>
                            <option value="A4">A4</option>
                            <option value="A3">A3</option>
                          </select>
                          <input
                            type="number"
                            className="ap-input"
                            placeholder="Selling Price"
                            value={item.price}
                            onChange={(e) =>
                              handleFrameSizeChange(index, "price", e.target.value)
                            }
                          />
                          <input
                            type="number"
                            className="ap-input"
                            placeholder="Purchase Price"
                            value={item.purchasePrice}
                            onChange={(e) =>
                              handleFrameSizeChange(index, "purchasePrice", e.target.value)
                            }
                          />
                          <input
                            type="number"
                            className="ap-input"
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) =>
                              handleFrameSizeChange(index, "quantity", e.target.value)
                            }
                          />
                          <input
                            type="number"
                            className="ap-input"
                            placeholder="Width"
                            value={item.width}
                            onChange={(e) =>
                              handleFrameSizeChange(
                                index,
                                "width",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="number"
                            className="ap-input"
                            placeholder="Height"
                            value={item.height}
                            onChange={(e) =>
                              handleFrameSizeChange(
                                index,
                                "height",
                                e.target.value
                              )
                            }
                          />
                          {frameSizes.length > 1 && (
                            <button
                              type="button"
                              className="removeFrameBtn"
                              onClick={() => removeFrameSize(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="addFrameBtn"
                      onClick={addFrameSize}
                    >
                      + Add Size
                    </button>
                  </div>
                )}
                {/* QTY + BRAND */}
                {product.category !== "Dress" && !isPhotoFrame && (
                  <>
                    <span className="ap-fieldLabel">Inventory</span>
                    <div className="ap-row">
                      <input
                        name="quantity"
                        value={product.quantity}
                        onChange={handleChange}
                        placeholder="Quantity"
                        className="ap-input"
                      />
                      <input
                        name="brand"
                        value={product.brand}
                        onChange={handleChange}
                        placeholder="Brand"
                        className="ap-input"
                      />
                    </div>
                  </>
                )}
                {/* DISCOUNT */}
                <span className="ap-fieldLabel">Tax &amp; Discount</span>
                <div className="ap-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <input
                    name="gst"
                    value={product.gst}
                    onChange={handleChange}
                    placeholder="GST"
                    className="ap-input"
                  />
                  <select name="discountType" value={product.discountType} onChange={handleChange} className="ap-select">
                    <option value="flat">Flat (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                  <input
                    type="number"
                    name="discountValue"
                    value={product.discountValue}
                    placeholder={product.discountType === "flat" ? "Enter Amount ₹" : "Enter %"}
                    onChange={handleChange}
                    className="ap-input"
                  />
                </div>
                {product.category !== "Dress" && !isPhotoFrame && (
                  <div className="ap-profit">
                    <p
                      style={{
                        marginTop: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      Estimated Profit
                      <br />
                      <span style={{
                        fontFamily: "var(--ap-font-mono)",
                        fontSize: "28px",
                        fontWeight: "600",
                        color: "#ffffff",
                        letterSpacing: "-0.01em"
                      }}>
                        ₹ {estimatedProfit > 0
                          ? estimatedProfit
                          : 0}
                      </span>
                    </p>
                  </div>
                )}
                {/* =========================
   DESCRIPTION
========================= */}
                <div className="descriptionSection">
                  <h3>Description</h3>
                  <div className="descriptionMode">
                    <label className="radioBox">
                      <input
                        type="radio"
                        name="descriptionMode"
                        value="manual"
                        checked={descriptionMode === "manual"}
                        onChange={() => setDescriptionMode("manual")}
                      />
                      Write Manually
                    </label>
                    <label className="radioBox">
                      <input
                        type="radio"
                        name="descriptionMode"
                        value="ai"
                        checked={descriptionMode === "ai"}
                        onChange={() => setDescriptionMode("ai")}
                      />
                      Generate with AI
                    </label>
                  </div>
                  {/* Manual Editor */}
                  {descriptionMode === "manual" && (
                    <TipTapEditor
                      value={product.description}
                      onChange={(value) =>
                        setProduct((prev) => ({
                          ...prev,
                          description: value,
                        }))
                      }
                    />
                  )}
                  {/* AI Generator */}
                  {descriptionMode === "ai" && (
                    <>
                      <button
                        type="button"
                        className="ai-btn"
                        onClick={generateAIDescription}
                      >
                        ✨ Generate AI Description
                      </button>
                      {showPreview && (
                        <div className="ai-preview-box">
                          <h3>✨ AI Generated Description Preview</h3>
                          <div
                            className="ai-preview-content"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(aiPreview),
                            }}
                          />
                          <div className="ai-preview-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setProduct((prev) => ({
                                  ...prev,
                                  description: DOMPurify.sanitize(aiPreview),
                                }));
                                setDescriptionMode("manual");
                                setShowPreview(false);
                              }}
                            >
                              ✅ Use This
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowPreview(false)}
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* =========================
   CUSTOMIZATION SECTION
========================= */}
                <div
                  className="customizationBox"
                  style={{ display: customization.enabled ? "none" : "block" }}
                >
                  <label className="customizationToggle">
                    <input
                      type="checkbox"
                      checked={product.isCustomized}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          isCustomized: e.target.checked
                        })
                      }
                    />
                    This Product Supports Customization
                  </label>
                  {product.isCustomized && (
                    <div className="customFieldsBox">
                      <h4>Customization Fields</h4>
                      <div className="customFieldButtons">
                        <button
                          type="button"
                          onClick={() =>
                            setProduct({
                              ...product,
                              customizationFields: [
                                ...product.customizationFields,
                                "message"
                              ]
                            })
                          }
                        >
                          + Message
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setProduct({
                              ...product,
                              customizationFields: [
                                ...product.customizationFields,
                                "image"
                              ]
                            })
                          }
                        >
                          + Image Upload
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setProduct({
                              ...product,
                              customizationFields: [
                                ...product.customizationFields,
                                "name"
                              ]
                            })
                          }
                        >
                          + Name
                        </button>
                      </div>
                      <div className="selectedFields">
                        {[...new Set(product.customizationFields)]
                          .map((field, index) => (
                            <div
                              key={index}
                              className="selectedField"
                            >
                              {field}
                              <span
                                onClick={() => {
                                  setProduct({
                                    ...product,
                                    customizationFields:
                                      product.customizationFields
                                        .filter((f) => f !== field)
                                  })
                                }}
                              >
                                ✖
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  <hr />
                </div>
                {/* =========================
   ✅ PERSONALIZATION TEMPLATE EDITOR
========================= */}
                <PersonalizationEditor
                  customization={customization}
                  setCustomization={setCustomization}
                  bgOptions={personalizationBgOptions}
                />
                {/* ✅ DRESS VARIANTS */}
                {product.category === "Dress" && (
                  <div className="variantSection">
                    <h3>Color Variants</h3>
                    <button type="button" onClick={addColor}>
                      + Add Color
                    </button>
                    {colors.map((col, cIndex) => (
                      <div key={cIndex} className="productLayout">
                        <div className="detailsSection">
                          <input
                            placeholder="Enter Color"
                            value={col.color}
                            onChange={(e) =>
                              handleColorChange(cIndex, e.target.value)
                            }
                            className="ap-input"
                          />
                          <h4>Sizes</h4>
                          {col.sizes.map((sz, sIndex) => (
                            <div key={sIndex} className="sizeCard">
                              {/* TOP ROW - SIZE ONLY */}
                              <div className="sizeTop">
                                <select
                                  value={sz.size || ""}
                                  onChange={(e) =>
                                    handleSizeChange(cIndex, sIndex, "size", e.target.value)
                                  }
                                  className="ap-select"
                                >
                                  <option value="">Size</option>
                                  <option value="S">S</option>
                                  <option value="M">M</option>
                                  <option value="L">L</option>
                                  <option value="XL">XL</option>
                                </select>
                              </div>
                              {/* BOTTOM ROW - PRICES */}
                              <div className="sizeBottom">
                                <input
                                  type="number"
                                  value={sz.price || ""}
                                  placeholder="Selling Price"
                                  onChange={(e) =>
                                    handleSizeChange(cIndex, sIndex, "price", e.target.value)
                                  }
                                  className="ap-input"
                                />
                                <input
                                  type="number"
                                  value={sz.purchasePrice || ""}
                                  placeholder="Purchase Price"
                                  onChange={(e) =>
                                    handleSizeChange(cIndex, sIndex, "purchasePrice", e.target.value)
                                  }
                                  className="ap-input"
                                />
                                <input
                                  type="number"
                                  value={sz.quantity || ""}
                                  placeholder="Qty"
                                  onChange={(e) =>
                                    handleSizeChange(cIndex, sIndex, "quantity", e.target.value)
                                  }
                                  className="ap-input"
                                />
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={() => addSize(cIndex)}>
                            + Add Size
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button type="submit" className="ap-submit">Publish Product</button>
              </div>
              <div className="ap-imageCard">
                {/* ✅ NORMAL IMAGE ONLY FOR NON-DRESS */}
                {product.category !== "Dress" && (
                  <>
                    <span className="ap-fieldLabel" style={{ marginTop: 0 }}>Product Images</span>
                    {preview.length > 0 ? (
                      <div className="ap-mainImage">
                        <img
                          src={preview[0]}
                          alt=""
                        />      <button type="button" className="ap-removeMain" onClick={() => removeImage(0)}>✕</button>
                      </div>
                    ) : (
                      <label className="ap-mainImage" style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexDirection: "column", gap: "8px", color: "var(--ap-text-faint)", fontSize: "13px", fontWeight: 600 }}>
                        <input type="file" multiple accept="image/*" onChange={handleImage} hidden className="ap-input" />
                        <span style={{ fontSize: "30px", color: "var(--ap-accent)" }}>+</span>
                        Drag &amp; drop or click to upload
                      </label>
                    )}
                    <div className="ap-thumbGrid">
                      {preview.slice(1).map((img, index) => (
                        <div className="ap-thumb" key={index}>
                          <img src={img} className="subImg" />
                          <button type="button" className="closeIcon" onClick={() => removeImage(index + 1)}>✕</button>
                        </div>
                      ))}
                      {preview.length < 5 && preview.length > 0 && (
                        <label className="ap-addImage">
                          <input type="file" multiple accept="image/*" onChange={handleImage} hidden className="ap-input" />
                          +
                        </label>
                      )}
                    </div>
                  </>
                )}
                {/* ✅ COLOR IMAGE ONLY FOR DRESS */}
                {product.category === "Dress" && colors.length > 0 && (
                  <div className="imageSection">
                    <h4>Color Images</h4>
                    {colors.map((col, cIndex) => (
                      <div key={cIndex} className="colorImageBlock">
                        <p><b>{col.color || `Color ${cIndex + 1}`}</b></p>
                        {/* MAIN IMAGE */}
                        {col.preview.length > 0 ? (
                          <div className="mainImageWrapper">
                            <img src={col.preview[0]} className="mainImg" />
                            <button
                              type="button"
                              className="mainClose"
                              onClick={() => removeColorImage(cIndex, 0)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="mainImageWrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ap-text-faint)", fontSize: "13px", fontWeight: 600 }}>
                            <input
                              type="file"
                              multiple
                              onChange={(e) => handleColorImages(e, cIndex)}
                              hidden
                              className="ap-input"
                            />
                            + Upload images
                          </label>
                        )}
                        {/* SUB IMAGES */}
                        <div className="smallImages">
                          {col.preview.slice(1).map((img, i) => (
                            <div key={i} className="imgWrapper">
                              <img src={img} className="subImg" />
                              <button
                                type="button"
                                className="closeIcon"
                                onClick={() => removeColorImage(cIndex, i + 1)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {col.preview.length > 0 && (
                            <label className="imgBox">
                              <input
                                type="file"
                                multiple
                                onChange={(e) => handleColorImages(e, cIndex)}
                                hidden
                                className="ap-input"
                              />
                              +
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </AdminLayout>
    </div>
  );
}