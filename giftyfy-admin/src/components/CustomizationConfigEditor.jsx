import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Text,
  Group,
  Image as KonvaImage,
  Transformer,
} from "react-konva";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_UPLOADS_URL = "http://localhost:4000/uploads/";

const SHAPE_OPTIONS = [
  { value: "rect", label: "Rectangle" },
  { value: "roundedRect", label: "Rounded Rectangle" },
  { value: "circle", label: "Circle" },
  { value: "custom", label: "Custom Mask" },
  { value: "perspective", label: "Perspective" },
];

const FONT_OPTIONS = [
  "Poppins",
  "Arial",
  "Times New Roman",
  "Georgia",
  "Roboto",
  "Montserrat",
];

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const DEFAULT_DATE_SETTINGS = {
  format: "DD MMMM YYYY",
  fontFamily: "Poppins",
  fontSize: 18,
  color: "#000000",

  // Position on the canvas (logical design coordinates)
  x: 100,
  y: 480,
  width: 300,
  height: 40,
  rotation: 0,
  align: "center",
  zIndex: 3,
  drawAboveTemplate: false,
};

const DEFAULT_CONFIG = {
  designWidth: 600,
  designHeight: 600,

  templateImage: "",
  previewBackground: "",

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
  allowMultipleImages: false,

  imageAreas: [],
  textAreas: [],

  frameColors: [],

  allowDate: false,

  dateSettings: { ...DEFAULT_DATE_SETTINGS },

  allowBackMessage: false,
  backMessageMaxCharacters: 120,

  textSettings: {
    maxCharacters: 30,
    defaultFont: "Poppins",
    defaultColor: "#000000",
    defaultFontSize: 24,
  },

  enableName: false,
  enableMessage: false,
  enableImage: false,
};

const DATE_ID = "date";
const BACK_ID = "back-message";
const TEMPLATE_TOKEN = "__template__";

/* =========================================================
   HELPERS
========================================================= */

const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const posNum = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(value, Math.max(min, max)));

const round = (value) => Math.round(value * 10) / 10;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatDate = (format = "DD MMMM YYYY", date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");

  return format.replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D/g, (token) => {
    switch (token) {
      case "YYYY":
        return String(date.getFullYear());
      case "YY":
        return String(date.getFullYear()).slice(-2);
      case "MMMM":
        return MONTHS[date.getMonth()];
      case "MMM":
        return MONTHS[date.getMonth()].slice(0, 3);
      case "MM":
        return pad(date.getMonth() + 1);
      case "M":
        return String(date.getMonth() + 1);
      case "DD":
        return pad(date.getDate());
      default:
        return String(date.getDate());
    }
  });
};

/**
 * Template images are stored as a filename in MongoDB.
 * Build the URL from the uploads base. Absolute / blob / data URLs pass through.
 */
const resolveImageUrl = (value, uploadsBaseUrl) => {
  if (!value) return "";
  if (/^(https?:|blob:|data:)/i.test(value)) return value;

  const base = uploadsBaseUrl.endsWith("/")
    ? uploadsBaseUrl
    : `${uploadsBaseUrl}/`;

  return `${base}${String(value).replace(/^\/+/, "")}`;
};

const useLoadedImage = (src) => {
  const [state, setState] = useState({ image: null, status: "idle" });

  useEffect(() => {
    if (!src) {
      setState({ image: null, status: "idle" });
      return undefined;
    }

    let cancelled = false;
    const img = new window.Image();

    setState({ image: null, status: "loading" });

    img.onload = () => {
      if (!cancelled) setState({ image: img, status: "loaded" });
    };
    img.onerror = () => {
      if (!cancelled) setState({ image: null, status: "error" });
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return state;
};

/* =========================================================
   NORMALIZATION (backward compatible, no DB migration)
========================================================= */

const normalizeImageArea = (area, index, config) => {
  const a = area || {};

  return {
    ...a,
    id: a.id ? String(a.id) : `legacy-image-${index}`,
    type: "image",
    name: a.name || `Photo ${index + 1}`,

    x: num(a.x, 0),
    y: num(a.y, 0),
    width: posNum(a.width, 250),
    height: posNum(a.height, 250),
    rotation: num(a.rotation, 0),

    shape: a.shape || "rect",
    borderRadius: num(a.borderRadius, 0),
    maskImage: a.maskImage || "",

    allowMove: a.allowMove ?? config.allowMove,
    allowZoom: a.allowZoom ?? config.allowZoom,
    allowRotate: a.allowRotate ?? config.allowRotate,

    required: a.required ?? true,
    zIndex: num(a.zIndex, 1),
    drawAboveTemplate: !!a.drawAboveTemplate,
  };
};

const normalizeTextArea = (area, index) => {
  const a = area || {};

  return {
    ...a,
    id: a.id ? String(a.id) : `legacy-text-${index}`,
    type: "text",
    name: a.name || `Text ${index + 1}`,

    x: num(a.x, 0),
    y: num(a.y, 0),
    width: posNum(a.width, 300),
    height: posNum(a.height, 60),
    rotation: num(a.rotation, 0),

    fontFamily: a.fontFamily || "Poppins",
    fontSize: posNum(a.fontSize, 24),
    color: a.color || "#000000",
    align: a.align || "center",

    maxCharacters: posNum(a.maxCharacters, 30),

    zIndex: num(a.zIndex, 2),
    drawAboveTemplate: !!a.drawAboveTemplate,
    required: !!a.required,
  };
};

const normalizeConfig = (value) => {
  const config = value || {};

  const base = {
    ...DEFAULT_CONFIG,
    ...config,
    designWidth: posNum(config.designWidth, DEFAULT_CONFIG.designWidth),
    designHeight: posNum(config.designHeight, DEFAULT_CONFIG.designHeight),
  };

  return {
    ...base,

    printableArea: {
      ...DEFAULT_CONFIG.printableArea,
      ...(config.printableArea || {}),
    },

    dateSettings: {
      ...DEFAULT_DATE_SETTINGS,
      ...(config.dateSettings || {}),
    },

    textSettings: {
      ...DEFAULT_CONFIG.textSettings,
      ...(config.textSettings || {}),
    },

    imageAreas: Array.isArray(config.imageAreas)
      ? config.imageAreas.map((a, i) => normalizeImageArea(a, i, base))
      : [],

    textAreas: Array.isArray(config.textAreas)
      ? config.textAreas.map((a, i) => normalizeTextArea(a, i))
      : [],

    frameColors: Array.isArray(config.frameColors) ? config.frameColors : [],
  };
};

/* =========================================================
   UNIFIED ELEMENT MODEL (derived, never stored separately)
========================================================= */

const buildElements = (config) => {
  const elements = [];

  config.imageAreas.forEach((a, i) =>
    elements.push({ ...a, kind: "image", _order: i })
  );

  config.textAreas.forEach((a, i) =>
    elements.push({ ...a, kind: "text", _order: 1000 + i })
  );

  if (config.allowDate) {
    const d = config.dateSettings;
    elements.push({
      ...d,
      id: DATE_ID,
      kind: "date",
      name: "Date",
      _order: 2000,
    });
  }

  return elements;
};

const byZ = (a, b) => a.zIndex - b.zIndex || a._order - b._order;

const patchElement = (config, id, patch) => {
  if (id === DATE_ID) {
    return {
      ...config,
      dateSettings: { ...config.dateSettings, ...patch },
    };
  }

  return {
    ...config,
    imageAreas: config.imageAreas.map((a) =>
      a.id === id ? { ...a, ...patch } : a
    ),
    textAreas: config.textAreas.map((a) =>
      a.id === id ? { ...a, ...patch } : a
    ),
  };
};

const applyLayerMap = (config, map) => ({
  ...config,
  imageAreas: config.imageAreas.map((a) =>
    map[a.id] ? { ...a, ...map[a.id] } : a
  ),
  textAreas: config.textAreas.map((a) =>
    map[a.id] ? { ...a, ...map[a.id] } : a
  ),
  dateSettings: map[DATE_ID]
    ? { ...config.dateSettings, ...map[DATE_ID] }
    : config.dateSettings,
});

/* =========================================================
   SMALL FORM CONTROLS
========================================================= */

const NumberField = ({ label, value, onChange, min, max, step = 1 }) => {
  // Keep a draft so users can type "-" or clear the field without it snapping back.
  const [draft, setDraft] = useState(null);

  return (
    <label className="pve-field">
      <span>{label}</span>
      <input
        type="number"
        value={draft ?? (value ?? "")}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const n = Number(raw);
          if (raw !== "" && Number.isFinite(n)) onChange(n);
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
};

const TextField = ({ label, value, onChange, placeholder = "" }) => (
  <label className="pve-field">
    <span>{label}</span>
    <input
      type="text"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

const SelectField = ({ label, value, onChange, options }) => (
  <label className="pve-field">
    <span>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  </label>
);

const ColorField = ({ label, value, onChange }) => (
  <label className="pve-field">
    <span>{label}</span>
    <input
      type="color"
      value={value || "#000000"}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

const CheckField = ({ label, checked, onChange }) => (
  <label className="pve-check">
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span>{label}</span>
  </label>
);

const GeometryFields = ({ el, patch }) => (
  <div className="pve-grid-2">
    <NumberField label="X" value={el.x} onChange={(v) => patch({ x: v })} />
    <NumberField label="Y" value={el.y} onChange={(v) => patch({ y: v })} />
    <NumberField
      label="Width"
      value={el.width}
      min={1}
      onChange={(v) => patch({ width: v })}
    />
    <NumberField
      label="Height"
      value={el.height}
      min={1}
      onChange={(v) => patch({ height: v })}
    />
    <NumberField
      label="Rotation"
      value={el.rotation}
      onChange={(v) => patch({ rotation: v })}
    />
    <NumberField
      label="Z Index"
      value={el.zIndex}
      min={0}
      onChange={(v) => patch({ zIndex: v })}
    />
  </div>
);

/* =========================================================
   CANVAS (react-konva)
   All Stage children use LOGICAL design coordinates.
   The Stage itself is scaled for display, so values read from
   Konva nodes (x, y, width, height, rotation) are already
   logical and are saved as-is.
========================================================= */

const EditorCanvas = ({
  config,
  elements,
  configElements,
  selectedId,
  onSelect,
  onLive,
  onCommit,
  previewMode,
  zoom,
  templateImage,
  fontTick,
  onFocusRequest,
}) => {
  const areaRef = useRef(null);
  const trRef = useRef(null);
  const nodeRefs = useRef({});
  const [box, setBox] = useState({ w: 800, h: 600 });

  const W = config.designWidth;
  const H = config.designHeight;

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;

    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = Math.max(0.05, Math.min(2, (box.w - 48) / W, (box.h - 48) / H));
  const scale = fit * zoom;

  // Attach the transformer to the selected guide
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;

    const node =
      !previewMode && selectedId ? nodeRefs.current[selectedId] : null;

    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, previewMode, configElements.length, W, H]);

  const sorted = [...elements].sort(byZ);
  const below = sorted.filter((e) => !e.drawAboveTemplate);
  const above = sorted.filter((e) => e.drawAboveTemplate);

  const bgColor = /^(#|rgb|hsl)/i.test(config.previewBackground || "")
    ? config.previewBackground
    : "#ffffff";

  // Keep a node fully inside the design canvas (when it fits)
  const clampNode = (node) => {
    const layer = node.getParent();
    if (!layer) return;

    const r = node.getClientRect({ relativeTo: layer });
    let dx = 0;
    let dy = 0;

    if (r.width <= W) {
      if (r.x < 0) dx = -r.x;
      else if (r.x + r.width > W) dx = W - (r.x + r.width);
    }
    if (r.height <= H) {
      if (r.y < 0) dy = -r.y;
      else if (r.y + r.height > H) dy = H - (r.y + r.height);
    }

    if (dx || dy) {
      node.x(node.x() + dx);
      node.y(node.y() + dy);
    }
  };

  const moveReadout = (node) => ({
    x: Math.round(node.x()),
    y: Math.round(node.y()),
    rotation: round(node.rotation()),
  });

  const sizeReadout = (node) => ({
    ...moveReadout(node),
    width: Math.max(10, Math.round(node.width() * node.scaleX())),
    height: Math.max(10, Math.round(node.height() * node.scaleY())),
  });

  /* ---------- content (what the customer will see) ---------- */

  const renderPhoto = (el) => {
    const common = {
      fill: "#94a3b8",
      opacity: previewMode ? 0.35 : 0.3,
    };

    let shape;

    if (el.shape === "circle") {
      shape = (
        <Ellipse
          x={el.width / 2}
          y={el.height / 2}
          radiusX={el.width / 2}
          radiusY={el.height / 2}
          {...common}
        />
      );
    } else if (el.shape === "roundedRect") {
      shape = (
        <Rect
          width={el.width}
          height={el.height}
          cornerRadius={clamp(
            num(el.borderRadius, 0),
            0,
            Math.min(el.width, el.height) / 2
          )}
          {...common}
        />
      );
    } else {
      shape = <Rect width={el.width} height={el.height} {...common} />;
    }

    const label =
      el.shape === "custom"
        ? `${el.name} (custom mask)`
        : el.shape === "perspective"
        ? `${el.name} (perspective)`
        : el.name;

    return (
      <>
        {shape}
        <Text
          text={label}
          width={el.width}
          height={el.height}
          align="center"
          verticalAlign="middle"
          fontSize={clamp(Math.min(el.width, el.height) / 9, 12, 28)}
          fontFamily="Arial"
          fill="#334155"
        />
      </>
    );
  };

  const renderContent = (el) => (
    <Group
      key={el.id}
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      listening={false}
    >
      {el.kind === "image" && renderPhoto(el)}

      {(el.kind === "text" || el.kind === "date") && (
        <Text
          text={
            el.kind === "date" ? formatDate(el.format) : "Your Text Here"
          }
          width={el.width}
          height={el.height}
          align={el.align || "center"}
          verticalAlign="middle"
          fontFamily={el.fontFamily}
          fontSize={el.fontSize}
          fill={el.color}
          wrap="none"
          ellipsis
        />
      )}
    </Group>
  );

  /* ---------- guides (editor only: hit area + outline) ---------- */

  const renderGuide = (el) => {
    const isSelected = el.id === selectedId;

    return (
      <Rect
        key={el.id}
        ref={(node) => {
          if (node) nodeRefs.current[el.id] = node;
          else delete nodeRefs.current[el.id];
        }}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        rotation={el.rotation}
        fill="rgba(37, 99, 235, 0.001)"
        stroke={isSelected ? "#2563eb" : "#64748b"}
        strokeWidth={isSelected ? 2 : 1}
        strokeScaleEnabled={false}
        dash={isSelected ? undefined : [6, 4]}
        draggable
        onMouseDown={() => onSelect(el.id)}
        onTouchStart={() => onSelect(el.id)}
        onDragMove={(e) => {
          clampNode(e.target);
          onLive(el.id, moveReadout(e.target));
        }}
        onDragEnd={(e) => {
          clampNode(e.target);
          onCommit(el.id, moveReadout(e.target));
        }}
        onTransform={(e) => onLive(el.id, sizeReadout(e.target))}
        onTransformEnd={(e) => {
          const node = e.target;
          const size = sizeReadout(node);

          // Bake the scale into width/height so saved data stays logical
          node.scaleX(1);
          node.scaleY(1);
          node.width(size.width);
          node.height(size.height);
          clampNode(node);

          onCommit(el.id, {
            ...size,
            x: Math.round(node.x()),
            y: Math.round(node.y()),
          });
        }}
      />
    );
  };

  const guideOrder = [...configElements].sort(byZ);

  return (
    <div className="pve-canvas-area" ref={areaRef}>
      <div className="pve-canvas-scroll">
        <div
          className="pve-stage-box"
          style={{ width: W * scale, height: H * scale }}
        >
          <Stage
            width={W * scale}
            height={H * scale}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={(e) => {
              onFocusRequest();
              if (
                e.target === e.target.getStage() ||
                e.target.name() === "bg"
              ) {
                onSelect(null);
              }
            }}
            onTouchStart={(e) => {
              if (
                e.target === e.target.getStage() ||
                e.target.name() === "bg"
              ) {
                onSelect(null);
              }
            }}
          >
            <Layer key={`content-${fontTick}`}>
              <Rect name="bg" x={0} y={0} width={W} height={H} fill={bgColor} />

              {below.map(renderContent)}

              {templateImage && (
                <KonvaImage
                  image={templateImage}
                  x={0}
                  y={0}
                  width={W}
                  height={H}
                  listening={false}
                />
              )}

              {above.map(renderContent)}
            </Layer>

            {!previewMode && (
              <Layer>
                {guideOrder.map(renderGuide)}

                <Transformer
                  ref={trRef}
                  rotateEnabled
                  keepRatio={false}
                  rotationSnaps={[0, 90, 180, 270]}
                  rotationSnapTolerance={4}
                  borderStroke="#2563eb"
                  anchorStroke="#2563eb"
                  anchorFill="#ffffff"
                  anchorSize={9}
                  boundBoxFunc={(oldBox, newBox) =>
                    newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
                  }
                />
              </Layer>
            )}
          </Stage>
        </div>
      </div>

      <div className="pve-scale-badge">
        {Math.round(scale * 100)}% · {W} × {H}
      </div>
    </div>
  );
};

/* =========================================================
   MAIN EDITOR
========================================================= */

const CustomizationConfigEditor = ({
  value,
  onChange,
  onSave,
  onTemplateFileSelect,
  uploadsBaseUrl = DEFAULT_UPLOADS_URL,
}) => {
  const config = useMemo(() => normalizeConfig(value), [value]);

  const configRef = useRef(config);
  configRef.current = config;

  const wrapperRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const [live, setLive] = useState(null); // { id, patch } while dragging/transforming
  const [zoom, setZoom] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [localTemplate, setLocalTemplate] = useState("");
  const [fontTick, setFontTick] = useState(0);
  const [, forceRender] = useState(0);

  /* ---------- history (undo / redo) ---------- */

  const historyRef = useRef({ past: [], future: [], lastKey: null, lastTime: 0 });

  const commit = useCallback(
    (next, key = null) => {
      const h = historyRef.current;
      const now = Date.now();

      const coalesce = key && key === h.lastKey && now - h.lastTime < 800;

      if (!coalesce) {
        h.past.push(configRef.current);
        if (h.past.length > 60) h.past.shift();
      }

      h.future = [];
      h.lastKey = key;
      h.lastTime = now;

      configRef.current = next;
      onChange(next);
      forceRender((n) => n + 1);
    },
    [onChange]
  );

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;

    const prev = h.past.pop();
    h.future.push(configRef.current);
    h.lastKey = null;

    configRef.current = prev;
    onChange(prev);
    forceRender((n) => n + 1);
  }, [onChange]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;

    const next = h.future.pop();
    h.past.push(configRef.current);
    h.lastKey = null;

    configRef.current = next;
    onChange(next);
    forceRender((n) => n + 1);
  }, [onChange]);

  /* ---------- updates ---------- */

  const updateConfig = (field, fieldValue) =>
    commit({ ...configRef.current, [field]: fieldValue }, `field:${field}`);

  const patchById = useCallback(
    (id, patch, key) => {
      setLive(null);
      commit(
        patchElement(configRef.current, id, patch),
        key || `patch:${id}:${Object.keys(patch).join(",")}`
      );
    },
    [commit]
  );

  const elements = useMemo(() => buildElements(config), [config]);

  const effectiveElements = useMemo(
    () =>
      live
        ? elements.map((e) => (e.id === live.id ? { ...e, ...live.patch } : e))
        : elements,
    [elements, live]
  );

  const selectedBase =
    selectedId === BACK_ID
      ? null
      : effectiveElements.find((e) => e.id === selectedId) || null;

  const selectedIsBack = selectedId === BACK_ID && config.allowBackMessage;

  // Drop selection if the element disappeared
  useEffect(() => {
    if (!selectedId) return;
    if (selectedId === BACK_ID) {
      if (!config.allowBackMessage) setSelectedId(null);
      return;
    }
    if (!elements.some((e) => e.id === selectedId)) setSelectedId(null);
  }, [elements, selectedId, config.allowBackMessage]);

  /* ---------- add / delete / rename ---------- */

  const addPhoto = () => {
    const cfg = configRef.current;
    const index = cfg.imageAreas.length;
    const offset = (index % 6) * 24;

    const width = Math.min(250, cfg.designWidth);
    const height = Math.min(250, cfg.designHeight);

    const area = {
      id: `image-${Date.now()}`,
      type: "image",
      name: `Photo ${index + 1}`,
      x: clamp(100 + offset, 0, cfg.designWidth - width),
      y: clamp(100 + offset, 0, cfg.designHeight - height),
      width,
      height,
      rotation: 0,
      shape: "rect",
      borderRadius: 0,
      maskImage: "",
      allowMove: true,
      allowZoom: true,
      allowRotate: true,
      required: true,
      zIndex: 1,
      drawAboveTemplate: false,
    };

    commit({ ...cfg, imageAreas: [...cfg.imageAreas, area] });
    setSelectedId(area.id);
  };

  const addText = () => {
    const cfg = configRef.current;
    const index = cfg.textAreas.length;
    const offset = (index % 6) * 24;

    const width = Math.min(300, cfg.designWidth);
    const height = 60;

    const area = {
      id: `text-${Date.now()}`,
      type: "text",
      name: `Text ${index + 1}`,
      x: clamp(100 + offset, 0, cfg.designWidth - width),
      y: clamp(400 + offset, 0, cfg.designHeight - height),
      width,
      height,
      rotation: 0,
      fontFamily: "Poppins",
      fontSize: 24,
      color: "#000000",
      align: "center",
      maxCharacters: 30,
      zIndex: 2,
      drawAboveTemplate: false,
      required: false,
    };

    commit({ ...cfg, textAreas: [...cfg.textAreas, area] });
    setSelectedId(area.id);
  };

  const addDate = () => {
    const cfg = configRef.current;
    if (cfg.allowDate) return;

    const d = cfg.dateSettings;
    const width = Math.min(num(d.width, 300), cfg.designWidth);
    const height = num(d.height, 40);

    commit({
      ...cfg,
      allowDate: true,
      dateSettings: {
        ...d,
        width,
        height,
        x: clamp(num(d.x, 100), 0, cfg.designWidth - width),
        y: clamp(num(d.y, 480), 0, cfg.designHeight - height),
      },
    });
    setSelectedId(DATE_ID);
  };

  const addBackMessage = () => {
    if (configRef.current.allowBackMessage) return;
    commit({ ...configRef.current, allowBackMessage: true });
    setSelectedId(BACK_ID);
  };

  const deleteElement = useCallback(
    (id) => {
      const cfg = configRef.current;

      if (id === DATE_ID) {
        commit({ ...cfg, allowDate: false });
      } else if (id === BACK_ID) {
        commit({ ...cfg, allowBackMessage: false });
      } else {
        commit({
          ...cfg,
          imageAreas: cfg.imageAreas.filter((a) => a.id !== id),
          textAreas: cfg.textAreas.filter((a) => a.id !== id),
        });
      }

      setSelectedId(null);
    },
    [commit]
  );

  const renameElement = (id) => {
    const el = elements.find((e) => e.id === id);
    if (!el || el.kind === "date") return;

    const next = window.prompt("Rename layer", el.name);
    if (next && next.trim()) patchById(id, { name: next.trim() }, `rename:${id}`);
  };

  /* ---------- layer order ---------- */

  const visualOrder = useMemo(() => {
    const sorted = [...elements].sort(byZ);
    return [
      ...sorted.filter((e) => !e.drawAboveTemplate).map((e) => e.id),
      TEMPLATE_TOKEN,
      ...sorted.filter((e) => e.drawAboveTemplate).map((e) => e.id),
    ]; // bottom -> top
  }, [elements]);

  const moveLayer = (id, direction) => {
    const cfg = configRef.current;
    const sorted = [...buildElements(cfg)].sort(byZ);

    const order = [
      ...sorted.filter((e) => !e.drawAboveTemplate).map((e) => e.id),
      TEMPLATE_TOKEN,
      ...sorted.filter((e) => e.drawAboveTemplate).map((e) => e.id),
    ];

    const i = order.indexOf(id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= order.length) return;

    [order[i], order[j]] = [order[j], order[i]];

    // Passing the template flips drawAboveTemplate for that element
    const map = {};
    let above = false;
    let z = 0;

    order.forEach((entry) => {
      if (entry === TEMPLATE_TOKEN) {
        above = true;
        return;
      }
      z += 1;
      map[entry] = { zIndex: z, drawAboveTemplate: above };
    });

    commit(applyLayerMap(cfg, map));
  };

  /* ---------- template ---------- */

  const templateSrc =
    localTemplate || resolveImageUrl(config.templateImage, uploadsBaseUrl);

  const { image: templateImage, status: templateStatus } =
    useLoadedImage(templateSrc);

  useEffect(
    () => () => {
      if (localTemplate) URL.revokeObjectURL(localTemplate);
    },
    [localTemplate]
  );

  const handleTemplateFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setLocalTemplate(URL.createObjectURL(file));
    if (onTemplateFileSelect) onTemplateFileSelect(file);

    e.target.value = "";
  };

  /* ---------- fonts (Konva needs a redraw once a webfont loads) ---------- */

  const fontsKey = useMemo(
    () =>
      [
        ...config.textAreas.map((a) => a.fontFamily),
        config.dateSettings.fontFamily,
      ].join("|"),
    [config.textAreas, config.dateSettings.fontFamily]
  );

  useEffect(() => {
    if (!document.fonts || !document.fonts.load) return;

    const families = Array.from(new Set(fontsKey.split("|").filter(Boolean)));

    Promise.all(families.map((f) => document.fonts.load(`16px "${f}"`)))
      .then(() => setFontTick((t) => t + 1))
      .catch(() => {});
  }, [fontsKey]);

  /* ---------- keyboard ---------- */

  const handleKeyDown = (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "select" || tag === "textarea") return;

    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }

    if (mod && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
      return;
    }

    if (!selectedId) return;

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteElement(selectedId);
      return;
    }

    const el = selectedBase;
    if (!el) return;

    const step = e.shiftKey ? 10 : 1;
    const moves = {
      ArrowLeft: { x: el.x - step },
      ArrowRight: { x: el.x + step },
      ArrowUp: { y: el.y - step },
      ArrowDown: { y: el.y + step },
    };

    if (moves[e.key]) {
      e.preventDefault();
      patchById(selectedId, moves[e.key], `nudge:${selectedId}`);
    }
  };

  /* ---------- frame colors (unchanged behaviour) ---------- */

  const addFrameColor = () =>
    updateConfig("frameColors", [
      ...config.frameColors,
      {
        name: `Color ${config.frameColors.length + 1}`,
        hex: "#000000",
        templateImage: "",
        extraPrice: 0,
      },
    ]);

  const updateFrameColor = (index, field, fieldValue) => {
    const updated = [...config.frameColors];
    updated[index] = { ...updated[index], [field]: fieldValue };
    updateConfig("frameColors", updated);
  };

  const removeFrameColor = (index) =>
    updateConfig(
      "frameColors",
      config.frameColors.filter((_, i) => i !== index)
    );

  /* ---------- reset / legacy conversion ---------- */

  const resetConfig = () => {
    if (!window.confirm("Reset all personalization configuration?")) return;

    setSelectedId(null);
    setLocalTemplate("");
    commit({
      ...DEFAULT_CONFIG,
      printableArea: { ...DEFAULT_CONFIG.printableArea },
      dateSettings: { ...DEFAULT_DATE_SETTINGS },
      textSettings: { ...DEFAULT_CONFIG.textSettings },
      imageAreas: [],
      textAreas: [],
      frameColors: [],
    });
  };

  const hasLegacyPrintable =
    config.imageAreas.length === 0 &&
    num(config.printableArea.width) > 0 &&
    num(config.printableArea.height) > 0;

  const convertLegacyPrintable = () => {
    const p = config.printableArea;

    const area = normalizeImageArea(
      {
        id: `image-${Date.now()}`,
        name: "Photo 1",
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        rotation: p.rotation,
      },
      0,
      config
    );

    commit({ ...configRef.current, imageAreas: [area] });
    setSelectedId(area.id);
  };

  /* =======================================================
     PROPERTY PANELS
  ======================================================= */

  const renderCanvasProperties = () => (
    <>
      <h4>Canvas &amp; Template</h4>

      <p className="pve-hint">
        Select a layer on the canvas or in the Layers list to edit it.
      </p>

      <div className="pve-grid-2">
        <NumberField
          label="Design Width"
          value={config.designWidth}
          min={1}
          onChange={(v) => updateConfig("designWidth", v)}
        />
        <NumberField
          label="Design Height"
          value={config.designHeight}
          min={1}
          onChange={(v) => updateConfig("designHeight", v)}
        />
      </div>

      <TextField
        label="Template Image"
        value={config.templateImage}
        placeholder="e.g. frame-template.png"
        onChange={(v) => {
          setLocalTemplate("");
          updateConfig("templateImage", v);
        }}
      />

      {onTemplateFileSelect && (
        <label className="pve-btn pve-btn-sm pve-file-btn">
          Upload template
          <input type="file" accept="image/*" onChange={handleTemplateFile} />
        </label>
      )}

      {templateStatus === "loading" && (
        <p className="pve-hint">Loading template…</p>
      )}

      {templateStatus === "error" && (
        <p className="pve-error">
          Template could not be loaded from {templateSrc}
        </p>
      )}

      {templateStatus === "loaded" && templateImage && (
        <>
          <p className="pve-hint">
            Template size: {templateImage.naturalWidth} ×{" "}
            {templateImage.naturalHeight}px
          </p>

          {(templateImage.naturalWidth !== config.designWidth ||
            templateImage.naturalHeight !== config.designHeight) && (
            <button
              type="button"
              className="pve-btn pve-btn-sm"
              onClick={() =>
                commit({
                  ...configRef.current,
                  designWidth: templateImage.naturalWidth,
                  designHeight: templateImage.naturalHeight,
                })
              }
            >
              Set canvas to template size
            </button>
          )}
        </>
      )}

      <TextField
        label="Preview Background"
        value={config.previewBackground}
        placeholder="e.g. #ffffff"
        onChange={(v) => updateConfig("previewBackground", v)}
      />
    </>
  );

  const renderImageProperties = (el) => {
    const patch = (p) => patchById(el.id, p);

    return (
      <>
        <h4>Photo Properties</h4>

        <TextField
          label="Name"
          value={el.name}
          onChange={(v) => patch({ name: v })}
        />

        <GeometryFields el={el} patch={patch} />

        <SelectField
          label="Shape"
          value={el.shape}
          options={SHAPE_OPTIONS}
          onChange={(v) => patch({ shape: v })}
        />

        {el.shape === "roundedRect" && (
          <NumberField
            label="Border Radius"
            value={el.borderRadius}
            min={0}
            onChange={(v) => patch({ borderRadius: v })}
          />
        )}

        {el.shape === "perspective" && (
          <p className="pve-hint">
            Perspective corner points are not editable yet. The area is stored
            as a normal box for now.
          </p>
        )}

        <TextField
          label="Mask Image (optional)"
          value={el.maskImage}
          placeholder="Optional mask filename"
          onChange={(v) => patch({ maskImage: v })}
        />

        <div className="pve-checks">
          <CheckField
            label="Required"
            checked={el.required}
            onChange={(v) => patch({ required: v })}
          />
          <CheckField
            label="Allow Move"
            checked={el.allowMove}
            onChange={(v) => patch({ allowMove: v })}
          />
          <CheckField
            label="Allow Zoom"
            checked={el.allowZoom}
            onChange={(v) => patch({ allowZoom: v })}
          />
          <CheckField
            label="Allow Rotate"
            checked={el.allowRotate}
            onChange={(v) => patch({ allowRotate: v })}
          />
          <CheckField
            label="Draw Above Template"
            checked={el.drawAboveTemplate}
            onChange={(v) => patch({ drawAboveTemplate: v })}
          />
        </div>
      </>
    );
  };

  const renderTextProperties = (el) => {
    const patch = (p) => patchById(el.id, p);

    return (
      <>
        <h4>Text Properties</h4>

        <TextField
          label="Name"
          value={el.name}
          onChange={(v) => patch({ name: v })}
        />

        <GeometryFields el={el} patch={patch} />

        <SelectField
          label="Font Family"
          value={el.fontFamily}
          options={FONT_OPTIONS}
          onChange={(v) => patch({ fontFamily: v })}
        />

        <div className="pve-grid-2">
          <NumberField
            label="Font Size"
            value={el.fontSize}
            min={1}
            onChange={(v) => patch({ fontSize: v })}
          />
          <NumberField
            label="Max Characters"
            value={el.maxCharacters}
            min={1}
            onChange={(v) => patch({ maxCharacters: v })}
          />
          <ColorField
            label="Color"
            value={el.color}
            onChange={(v) => patch({ color: v })}
          />
          <SelectField
            label="Alignment"
            value={el.align}
            options={ALIGN_OPTIONS}
            onChange={(v) => patch({ align: v })}
          />
        </div>

        <div className="pve-checks">
          <CheckField
            label="Required"
            checked={el.required}
            onChange={(v) => patch({ required: v })}
          />
          <CheckField
            label="Draw Above Template"
            checked={el.drawAboveTemplate}
            onChange={(v) => patch({ drawAboveTemplate: v })}
          />
        </div>
      </>
    );
  };

  const renderDateProperties = (el) => {
    const patch = (p) => patchById(DATE_ID, p);

    return (
      <>
        <h4>Date Properties</h4>

        <TextField
          label="Date Format"
          value={el.format}
          onChange={(v) => patch({ format: v })}
        />

        <GeometryFields el={el} patch={patch} />

        <SelectField
          label="Font Family"
          value={el.fontFamily}
          options={FONT_OPTIONS}
          onChange={(v) => patch({ fontFamily: v })}
        />

        <div className="pve-grid-2">
          <NumberField
            label="Font Size"
            value={el.fontSize}
            min={1}
            onChange={(v) => patch({ fontSize: v })}
          />
          <ColorField
            label="Color"
            value={el.color}
            onChange={(v) => patch({ color: v })}
          />
          <SelectField
            label="Alignment"
            value={el.align}
            options={ALIGN_OPTIONS}
            onChange={(v) => patch({ align: v })}
          />
        </div>

        <div className="pve-checks">
          <CheckField
            label="Draw Above Template"
            checked={el.drawAboveTemplate}
            onChange={(v) => patch({ drawAboveTemplate: v })}
          />
        </div>
      </>
    );
  };

  const renderBackMessageProperties = () => (
    <>
      <h4>Back Message</h4>

      <p className="pve-hint">
        The back message is entered by the customer but is not drawn on the
        front canvas.
      </p>

      <NumberField
        label="Maximum Characters"
        value={config.backMessageMaxCharacters}
        min={1}
        onChange={(v) => updateConfig("backMessageMaxCharacters", v)}
      />
    </>
  );

  const renderProperties = () => {
    if (selectedIsBack) return renderBackMessageProperties();
    if (!selectedBase) return renderCanvasProperties();
    if (selectedBase.kind === "image") return renderImageProperties(selectedBase);
    if (selectedBase.kind === "text") return renderTextProperties(selectedBase);
    return renderDateProperties(selectedBase);
  };

  /* =======================================================
     LAYERS
  ======================================================= */

  const topToBottom = [...visualOrder].reverse();

  const layerBadge = (el) =>
    el.kind === "image" ? "Photo" : el.kind === "text" ? "Text" : "Date";

  const renderLayerRow = (id) => {
    if (id === TEMPLATE_TOKEN) {
      return (
        <div key={id} className="pve-layer pve-layer-template">
          <span>Product template (frame)</span>
        </div>
      );
    }

    const el = elements.find((e) => e.id === id);
    if (!el) return null;

    const selected = id === selectedId;
    const pos = visualOrder.indexOf(id);

    return (
      <div
        key={id}
        className={`pve-layer ${selected ? "is-selected" : ""}`}
        onClick={() => setSelectedId(id)}
      >
        <div className="pve-layer-main">
          <span className="pve-layer-name">{el.name}</span>
          <span className="pve-layer-type">{layerBadge(el)}</span>
        </div>

        {selected && (
          <div className="pve-layer-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              title="Bring forward"
              disabled={pos >= visualOrder.length - 1}
              onClick={() => moveLayer(id, 1)}
            >
              ▲
            </button>
            <button
              type="button"
              title="Send backward"
              disabled={pos <= 0}
              onClick={() => moveLayer(id, -1)}
            >
              ▼
            </button>
            {el.kind !== "date" && (
              <button
                type="button"
                title="Rename"
                onClick={() => renameElement(id)}
              >
                ✎
              </button>
            )}
            <button
              type="button"
              title="Delete"
              className="is-danger"
              onClick={() => deleteElement(id)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  return (
    <div className="pve-root">
      <style>{STYLES}</style>

      <div
        className="pve-editor"
        ref={wrapperRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* ---------- TOP BAR ---------- */}
        <div className="pve-topbar">
          <div className="pve-title">
            <strong>Personalization Editor</strong>
            <span>This is what the customer will personalize.</span>
          </div>

          <div className="pve-topbar-actions">
            <button
              type="button"
              className="pve-btn pve-btn-sm"
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </button>
            <button
              type="button"
              className="pve-btn pve-btn-sm"
              onClick={redo}
              disabled={!canRedo}
            >
              Redo
            </button>

            <span className="pve-sep" />

            <button
              type="button"
              className="pve-btn pve-btn-sm"
              onClick={() => setZoom((z) => Math.max(0.25, round(z - 0.25)))}
            >
              −
            </button>
            <button
              type="button"
              className="pve-btn pve-btn-sm"
              onClick={() => setZoom(1)}
              title="Fit to screen"
            >
              Fit
            </button>
            <button
              type="button"
              className="pve-btn pve-btn-sm"
              onClick={() => setZoom((z) => Math.min(3, round(z + 0.25)))}
            >
              +
            </button>

            <span className="pve-sep" />

            <button
              type="button"
              className={`pve-btn pve-btn-sm ${previewMode ? "pve-btn-primary" : ""}`}
              onClick={() => setPreviewMode((p) => !p)}
            >
              {previewMode ? "Back to editing" : "Preview"}
            </button>

            {onSave && (
              <button
                type="button"
                className="pve-btn pve-btn-sm pve-btn-primary"
                onClick={onSave}
              >
                Save
              </button>
            )}
          </div>
        </div>

        {hasLegacyPrintable && (
          <div className="pve-banner">
            <span>
              This product uses the legacy printable area (
              {config.printableArea.width} × {config.printableArea.height}).
            </span>
            <button
              type="button"
              className="pve-btn pve-btn-sm"
              onClick={convertLegacyPrintable}
            >
              Convert to a photo area
            </button>
          </div>
        )}

        <div className="pve-body">
          {/* ---------- LEFT: TOOLS + LAYERS ---------- */}
          <aside className="pve-left">
            <h4>Add elements</h4>

            <div className="pve-tools">
              <button type="button" className="pve-btn" onClick={addPhoto}>
                + Photo
              </button>
              <button type="button" className="pve-btn" onClick={addText}>
                + Text
              </button>
              <button
                type="button"
                className="pve-btn"
                onClick={addDate}
                disabled={config.allowDate}
              >
                + Date
              </button>
              <button
                type="button"
                className="pve-btn"
                onClick={addBackMessage}
                disabled={config.allowBackMessage}
              >
                + Back Message
              </button>
            </div>

            <h4>Layers</h4>

            <div className="pve-layers">
              {topToBottom.map(renderLayerRow)}

              {elements.length === 0 && (
                <p className="pve-hint">
                  No elements yet. Add a photo or text area to start.
                </p>
              )}

              {config.allowBackMessage && (
                <div
                  className={`pve-layer ${selectedIsBack ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(BACK_ID)}
                >
                  <div className="pve-layer-main">
                    <span className="pve-layer-name">Back Message</span>
                    <span className="pve-layer-type">Back side</span>
                  </div>

                  {selectedIsBack && (
                    <div
                      className="pve-layer-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        title="Delete"
                        className="is-danger"
                        onClick={() => deleteElement(BACK_ID)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ---------- CENTER: LIVE CANVAS ---------- */}
          <EditorCanvas
            config={config}
            elements={effectiveElements}
            configElements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onLive={(id, patch) => setLive({ id, patch })}
            onCommit={(id, patch) => patchById(id, patch, `drag:${id}`)}
            previewMode={previewMode}
            zoom={zoom}
            templateImage={templateImage}
            fontTick={fontTick}
            onFocusRequest={() => wrapperRef.current && wrapperRef.current.focus()}
          />

          {/* ---------- RIGHT: PROPERTIES ---------- */}
          <aside className="pve-right">{renderProperties()}</aside>
        </div>
      </div>

      {/* ---------- BELOW THE EDITOR ---------- */}

      <details className="pve-details">
        <summary>Image Controls (apply to all photo areas by default)</summary>

        <div className="pve-checks pve-checks-row">
          <CheckField
            label="Allow Move"
            checked={config.allowMove}
            onChange={(v) => updateConfig("allowMove", v)}
          />
          <CheckField
            label="Allow Zoom"
            checked={config.allowZoom}
            onChange={(v) => updateConfig("allowZoom", v)}
          />
          <CheckField
            label="Allow Rotate"
            checked={config.allowRotate}
            onChange={(v) => updateConfig("allowRotate", v)}
          />
          <CheckField
            label="Allow Multiple Images"
            checked={config.allowMultipleImages}
            onChange={(v) => updateConfig("allowMultipleImages", v)}
          />
        </div>
      </details>

      <details className="pve-details">
        <summary>Frame Colors ({config.frameColors.length})</summary>

        <div className="pve-details-body">
          <button type="button" className="pve-btn" onClick={addFrameColor}>
            + Add Frame Color
          </button>

          {config.frameColors.length === 0 && (
            <p className="pve-hint">No frame colors configured.</p>
          )}

          {config.frameColors.map((color, index) => (
            <div className="pve-card" key={index}>
              <div className="pve-card-header">
                <strong>{color.name || `Color ${index + 1}`}</strong>
                <button
                  type="button"
                  className="pve-btn pve-btn-sm pve-btn-danger"
                  onClick={() => removeFrameColor(index)}
                >
                  Remove
                </button>
              </div>

              <div className="pve-grid-4">
                <TextField
                  label="Color Name"
                  value={color.name}
                  onChange={(v) => updateFrameColor(index, "name", v)}
                />
                <ColorField
                  label="Color"
                  value={color.hex}
                  onChange={(v) => updateFrameColor(index, "hex", v)}
                />
                <NumberField
                  label="Extra Price"
                  value={color.extraPrice}
                  min={0}
                  onChange={(v) => updateFrameColor(index, "extraPrice", v)}
                />
                <TextField
                  label="Template Image"
                  value={color.templateImage}
                  placeholder="Optional"
                  onChange={(v) => updateFrameColor(index, "templateImage", v)}
                />
              </div>
            </div>
          ))}
        </div>
      </details>

      <details className="pve-details">
        <summary>Advanced / Legacy</summary>

        <div className="pve-details-body">
          <h4>Legacy Printable Area</h4>
          <p className="pve-hint">
            Used by existing products that do not have photo areas.
          </p>

          <div className="pve-grid-5">
            {["x", "y", "width", "height", "rotation"].map((field) => (
              <NumberField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                value={config.printableArea[field]}
                min={field === "width" || field === "height" ? 0 : undefined}
                onChange={(v) =>
                  updateConfig("printableArea", {
                    ...config.printableArea,
                    [field]: v,
                  })
                }
              />
            ))}
          </div>

          <h4>Legacy Text Settings</h4>

          <div className="pve-grid-4">
            <NumberField
              label="Max Characters"
              value={config.textSettings.maxCharacters}
              min={1}
              onChange={(v) =>
                updateConfig("textSettings", {
                  ...config.textSettings,
                  maxCharacters: v,
                })
              }
            />
            <SelectField
              label="Default Font"
              value={config.textSettings.defaultFont || "Poppins"}
              options={FONT_OPTIONS}
              onChange={(v) =>
                updateConfig("textSettings", {
                  ...config.textSettings,
                  defaultFont: v,
                })
              }
            />
            <NumberField
              label="Default Font Size"
              value={config.textSettings.defaultFontSize}
              min={1}
              onChange={(v) =>
                updateConfig("textSettings", {
                  ...config.textSettings,
                  defaultFontSize: v,
                })
              }
            />
            <ColorField
              label="Default Color"
              value={config.textSettings.defaultColor}
              onChange={(v) =>
                updateConfig("textSettings", {
                  ...config.textSettings,
                  defaultColor: v,
                })
              }
            />
          </div>

          <h4>Legacy Personalization Options</h4>
          <p className="pve-hint">Keep these enabled for existing products.</p>

          <div className="pve-checks pve-checks-row">
            <CheckField
              label="Enable Name"
              checked={config.enableName}
              onChange={(v) => updateConfig("enableName", v)}
            />
            <CheckField
              label="Enable Message"
              checked={config.enableMessage}
              onChange={(v) => updateConfig("enableMessage", v)}
            />
            <CheckField
              label="Enable Image"
              checked={config.enableImage}
              onChange={(v) => updateConfig("enableImage", v)}
            />
          </div>

          <button
            type="button"
            className="pve-btn pve-btn-danger"
            onClick={resetConfig}
          >
            Reset all personalization configuration
          </button>
        </div>
      </details>

      <details className="pve-details">
        <summary>Configuration Preview (JSON saved with the product)</summary>

        <pre className="pve-json">{JSON.stringify(config, null, 2)}</pre>
      </details>
    </div>
  );
};

/* =========================================================
   STYLES (self-contained, prefixed with pve- to avoid clashes)
========================================================= */

const STYLES = `
.pve-root { color: #0f172a; font-size: 14px; }
.pve-root * { box-sizing: border-box; }
.pve-root h4 { margin: 14px 0 8px; font-size: 13px; font-weight: 600; color: #334155; }
.pve-root h4:first-child { margin-top: 0; }

.pve-editor { border: 1px solid #d5dbe5; border-radius: 10px; overflow: hidden; background: #fff; outline: none; }

.pve-topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 10px 14px; background: #f6f8fb; border-bottom: 1px solid #d5dbe5; }
.pve-title { display: flex; flex-direction: column; gap: 2px; }
.pve-title strong { font-size: 15px; }
.pve-title span { font-size: 12px; color: #64748b; }
.pve-topbar-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pve-sep { width: 1px; height: 20px; background: #d5dbe5; margin: 0 4px; }

.pve-banner { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 14px; background: #fff7e0; border-bottom: 1px solid #f1dc9a; font-size: 13px; }

.pve-body { display: grid; grid-template-columns: 240px minmax(0, 1fr) 300px; height: 680px; }
.pve-left, .pve-right { overflow-y: auto; padding: 14px; background: #fff; }
.pve-left { border-right: 1px solid #d5dbe5; }
.pve-right { border-left: 1px solid #d5dbe5; }

.pve-canvas-area { position: relative; background: #e9edf3; min-width: 0; }
.pve-canvas-scroll { position: absolute; inset: 0; overflow: auto; display: flex; padding: 24px; }
.pve-stage-box { margin: auto; flex: none; box-shadow: 0 2px 14px rgba(15, 23, 42, 0.22); background-color: #fff;
  background-image: linear-gradient(45deg, #dfe4ec 25%, transparent 25%), linear-gradient(-45deg, #dfe4ec 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #dfe4ec 75%), linear-gradient(-45deg, transparent 75%, #dfe4ec 75%);
  background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0; }
.pve-scale-badge { position: absolute; left: 10px; bottom: 8px; padding: 2px 8px; border-radius: 4px; background: rgba(15, 23, 42, 0.7); color: #fff; font-size: 11px; pointer-events: none; }

.pve-btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 7px 12px; border: 1px solid #c3ccd9; border-radius: 6px; background: #fff; color: #0f172a; font-size: 13px; cursor: pointer; }
.pve-btn:hover:not(:disabled) { background: #eef2f7; }
.pve-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.pve-btn:focus-visible, .pve-layer-actions button:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
.pve-btn-sm { padding: 5px 10px; font-size: 12px; }
.pve-btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.pve-btn-primary:hover:not(:disabled) { background: #1d4fd0; }
.pve-btn-danger { color: #b42318; border-color: #f0b8b3; }
.pve-btn-danger:hover:not(:disabled) { background: #fdecea; }

.pve-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

.pve-layers { display: flex; flex-direction: column; gap: 4px; }
.pve-layer { padding: 7px 9px; border: 1px solid #e1e6ee; border-radius: 6px; cursor: pointer; background: #fff; }
.pve-layer:hover { background: #f3f6fa; }
.pve-layer.is-selected { border-color: #2563eb; background: #eaf1ff; }
.pve-layer-template { cursor: default; background: #f1f3f6; border-style: dashed; color: #64748b; font-size: 12px; text-align: center; }
.pve-layer-template:hover { background: #f1f3f6; }
.pve-layer-main { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.pve-layer-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pve-layer-type { font-size: 11px; color: #64748b; flex: none; }
.pve-layer-actions { display: flex; gap: 4px; margin-top: 6px; }
.pve-layer-actions button { flex: 1; padding: 3px 0; border: 1px solid #c3ccd9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; }
.pve-layer-actions button:hover:not(:disabled) { background: #eef2f7; }
.pve-layer-actions button:disabled { opacity: 0.4; cursor: not-allowed; }
.pve-layer-actions button.is-danger { color: #b42318; }

.pve-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; min-width: 0; }
.pve-field span { font-size: 12px; color: #475569; }
.pve-field input[type="text"], .pve-field input[type="number"], .pve-field select { width: 100%; padding: 6px 8px; border: 1px solid #c3ccd9; border-radius: 6px; font-size: 13px; background: #fff; color: #0f172a; }
.pve-field input[type="color"] { width: 100%; height: 32px; padding: 2px; border: 1px solid #c3ccd9; border-radius: 6px; background: #fff; }
.pve-field input:focus, .pve-field select:focus { outline: 2px solid #2563eb; outline-offset: -1px; }

.pve-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 10px; }
.pve-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0 10px; }
.pve-grid-5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0 10px; }

.pve-checks { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.pve-checks-row { flex-direction: row; flex-wrap: wrap; gap: 16px; }
.pve-check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }

.pve-hint { margin: 4px 0 10px; font-size: 12px; color: #64748b; }
.pve-error { margin: 4px 0 10px; font-size: 12px; color: #b42318; word-break: break-all; }

.pve-file-btn { margin-bottom: 10px; cursor: pointer; position: relative; }
.pve-file-btn input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

.pve-details { margin-top: 12px; border: 1px solid #d5dbe5; border-radius: 10px; background: #fff; }
.pve-details > summary { padding: 11px 14px; cursor: pointer; font-weight: 600; }
.pve-details > .pve-checks, .pve-details > .pve-details-body, .pve-details > .pve-json { margin: 0 14px 14px; }
.pve-details-body { display: flex; flex-direction: column; gap: 4px; }
.pve-card { margin-top: 10px; padding: 12px; border: 1px solid #e1e6ee; border-radius: 8px; background: #f8fafc; }
.pve-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.pve-json { max-height: 360px; overflow: auto; padding: 12px; border-radius: 8px; background: #0f172a; color: #e2e8f0; font-size: 12px; }

@media (max-width: 1000px) {
  .pve-body { grid-template-columns: 1fr; height: auto; }
  .pve-canvas-area { height: 520px; }
  .pve-left, .pve-right { border: 0; border-top: 1px solid #d5dbe5; }
  .pve-grid-4, .pve-grid-5 { grid-template-columns: 1fr 1fr; }
}
`;

export default CustomizationConfigEditor;