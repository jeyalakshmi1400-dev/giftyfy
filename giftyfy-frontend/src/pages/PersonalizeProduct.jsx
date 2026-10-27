import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Text,
  Transformer,
  Group,
  Shape,
} from "react-konva";
import useImage from "use-image";

import "../styles/productCustomizer.css";
// All photo editing lives in the modal. The page imports only the shape
// outline helper (for empty slots) and the modal itself.
import PhotoCropModal, { drawShapePath } from "../components/Photocropmodal";

const API = "http://localhost:4000";
const BASE_URL = `${API}/uploads/`;
const DESIGN_WIDTH = 800;
const MAX_STAGE_WIDTH = 800;
const MAX_EXPORT_WIDTH = 2000;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Supports current and legacy admin shape names.
const mapShape = (shape) => {
  const s = String(shape || "rectangle")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (s.includes("heart")) return "heart";
  if (s === "circle") return "circle";
  if (s === "square") return "square";
  if (s === "oval" || s === "ellipse") return "oval";

  if (
    s === "rounded" ||
    s === "roundedrect" ||
    s === "roundedrectangle"
  ) {
    return "roundedRect";
  }

  if (
    s.includes("custom") ||
    s === "polygon" ||
    s === "perspective"
  ) {
    return "custom";
  }

  return "rect";
};

// Clip used only to draw the empty-slot placeholder.
const buildClip = (shape, w, h, points = []) => (ctx) => {
  drawShapePath(ctx, shape, w, h, points);
};

const loadImg = (src) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();

    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
const urlToDataURL = async (url) => {
  if (!url) return "";

  // Already stored as a permanent data URL
  if (url.startsWith("data:")) return url;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not restore the saved photo.");
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
};


const dataURLToFile = async (dataURL, fileName) => {
  if (!dataURL) {
    throw new Error("Saved photo is missing.");
  }

  if (dataURL.startsWith("blob:")) {
    throw new Error(
      "Cannot restore an expired blob URL. Save the image data before navigating."
    );
  }

  const response = await fetch(dataURL);

  if (!response.ok) {
    throw new Error("Failed to read the saved photo.");
  }

  const blob = await response.blob();

  return new File(
    [blob],
    fileName || "personalized-photo.png",
    { type: blob.type || "image/png" }
  );
};

const defaultTextProps = (area) => ({
  x: area.cx,
  y: area.cy,
  width: area.width,
  height: area.height,
  rotation: area.rotation,
  fontSize: area.fontSize,
  fill: area.fill,
  fontFamily: area.fontFamily,
  fontStyle: "normal",
});

// =====================================================
// NAME HELPERS (NAME FIX)
// Fit-to-width, colour shading and the printed / debossed /
// foil-stamped look. Used only by the Name text node.
// =====================================================

let nameMeasureCtx = null;

const nameLetterSpacing = (effect, fontSize) =>
  effect === "print" ? 0 : fontSize * 0.04;

// Width of a single line of text at a given font size.
const measureNameWidth = (text, fontSize, fontFamily, effect) => {
  if (!nameMeasureCtx) {
    nameMeasureCtx = document.createElement("canvas").getContext("2d");
  }

  nameMeasureCtx.font = `normal ${fontSize}px ${fontFamily}`;

  return (
    nameMeasureCtx.measureText(text).width +
    String(text).length * nameLetterSpacing(effect, fontSize)
  );
};

// Shrinks the font so the whole name stays on one line inside its box.
const fitNameFontSize = (text, baseSize, maxWidth, fontFamily, effect) => {
  if (!text) return baseSize;

  const width = measureNameWidth(text, baseSize, fontFamily, effect);
  const limit = maxWidth * 0.96;

  if (!width || width <= limit) return baseSize;

  return Math.max(8, baseSize * (limit / width));
};

const hexToRgb = (hex) => {
  const raw = String(hex || "#000000").replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);

  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };

  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

// amount: -1 (black) ... 0 (same) ... +1 (white)
const shadeColor = (hex, amount) => {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);

  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
};

// Konva props that make the name look pressed / stamped / printed.
const nameEffectProps = (effect, color, fontSize, boxHeight) => {
  const d = Math.max(0.6, fontSize * 0.03);

  if (effect === "foil") {
    const top = (boxHeight - fontSize) / 2;
    const bottom = (boxHeight + fontSize) / 2;

    return {
      fill: color,
      fillPriority: "linear-gradient",
      fillLinearGradientStartPoint: { x: 0, y: top },
      fillLinearGradientEndPoint: { x: 0, y: bottom },
      fillLinearGradientColorStops: [
        0,
        shadeColor(color, 0.5),
        0.45,
        color,
        0.55,
        shadeColor(color, -0.15),
        1,
        shadeColor(color, -0.45),
      ],
      shadowColor: "rgba(0,0,0,0.55)",
      shadowOffsetX: d * 0.6,
      shadowOffsetY: d,
      shadowBlur: d * 1.2,
      shadowOpacity: 1,
    };
  }

  if (effect === "print") {
    return {
      fill: color,
      opacity: 0.92,
      globalCompositeOperation: "multiply",
    };
  }

  // "deboss" (default)
  return {
    fill: shadeColor(color, -0.2),
    shadowColor: "rgba(255,255,255,0.4)",
    shadowOffsetX: d,
    shadowOffsetY: d,
    shadowBlur: 0,
    shadowOpacity: 1,
  };
};

// =====================================================
// EDITED PHOTO (display only)
// Draws the finished cut-out returned by the crop modal.
// The PNG is already shaped, panned, zoomed and rotated, so there is
// no clipping or transform math here.
// =====================================================

function EditedPhoto({ area, editedURL, onOpen }) {
  const [image] = useImage(editedURL || "");

  if (!editedURL || !image) return null;

  return (
    <KonvaImage
      image={image}
      x={area.cx}
      y={area.cy}
      offsetX={area.width / 2}
      offsetY={area.height / 2}
      width={area.width}
      height={area.height}
      rotation={area.rotation}
      onClick={onOpen}
      onTap={onOpen}
      onMouseEnter={(event) => {
        const c = event.target.getStage()?.container();
        if (c) c.style.cursor = "pointer";
      }}
      onMouseLeave={(event) => {
        const c = event.target.getStage()?.container();
        if (c) c.style.cursor = "default";
      }}
    />
  );
}

// =====================================================
// EMPTY PHOTO SLOT
// =====================================================

function EmptyPhotoSlot({ area, onSelect }) {
  return (
    <Group
      name="ui-only"
      x={area.cx}
      y={area.cy}
      offsetX={area.width / 2}
      offsetY={area.height / 2}
      rotation={area.rotation}
      onClick={onSelect}
      onTap={onSelect}
    >
      <Group
        clipFunc={buildClip(
          area.shape,
          area.width,
          area.height,
          area.points
        )}
      >
        <Rect
          width={area.width}
          height={area.height}
          fill="#eceef2"
          listening={false}
        />
      </Group>

      <Shape
        width={area.width}
        height={area.height}
        fillEnabled={false}
        stroke="#aeb5c1"
        strokeWidth={1.5}
        dash={[6, 6]}
        sceneFunc={(ctx, shape) => {
          drawShapePath(
            ctx,
            area.shape,
            area.width,
            area.height,
            area.points
          );
          ctx.fillStrokeShape(shape);
        }}
        listening={false}
      />

      <Text
        width={area.width}
        height={area.height}
        text={`+ ${area.name}`}
        align="center"
        verticalAlign="middle"
        fontSize={Math.max(
          12,
          Math.min(area.width, area.height) * 0.08
        )}
        fill="#555e6d"
        listening={false}
      />
    </Group>
  );
}

// =====================================================
// NAME COVER PATCH (NAME FIX)
// =====================================================

function NameCoverPatch({ area, baseImage, designWidth }) {
  if (!baseImage || !area.coverSample) return null;

  const ratio = baseImage.naturalWidth / designWidth;
  const designHeight = baseImage.naturalHeight / ratio;
  const gap = area.height * 0.15;
  const left = area.cx - area.width / 2;
  const top = area.cy - area.height / 2;

  let sx = left;
  let sy = top;

  if (area.coverFrom === "below") {
    sy = top + area.height + gap;
  } else if (area.coverFrom === "left") {
    sx = left - area.width - gap;
  } else if (area.coverFrom === "right") {
    sx = left + area.width + gap;
  } else {
    sy = top - area.height - gap;
  }

  sx = clamp(sx, 0, Math.max(0, designWidth - area.width));
  sy = clamp(sy, 0, Math.max(0, designHeight - area.height));

  return (
    <KonvaImage
      image={baseImage}
      x={area.cx}
      y={area.cy}
      offsetX={area.width / 2}
      offsetY={area.height / 2}
      width={area.width}
      height={area.height}
      rotation={area.rotation}
      crop={{
        x: sx * ratio,
        y: sy * ratio,
        width: area.width * ratio,
        height: area.height * ratio,
      }}
      listening={false}
    />
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function PersonalizeProduct() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);

  // One entry per photo area, written only from the crop modal's result:
  // { file, url, dims, crop, editedURL }
  //   file/url/dims -> the original upload (re-opened by the modal)
  //   crop          -> saved zoom/pan/rotation (restored on re-open, sent to cart)
  //   editedURL     -> shaped PNG returned by the modal (what the page displays)
  const [photos, setPhotos] = useState({});

  const [textValues, setTextValues] = useState({});
  const [textProperties, setTextProperties] = useState({});
  const restoredCustomizationRef = useRef(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [displayW, setDisplayW] = useState(MAX_STAGE_WIDTH);
  const [showPreview, setShowPreview] = useState(false);
  const [previewURI, setPreviewURI] = useState("");

  // Active modal session: { areaId, file, url, dims, fresh, initial }
  // fresh = true  -> newly picked photo, not committed yet
  // fresh = false -> re-editing a photo already shown in the preview
  const [cropSession, setCropSession] = useState(null);

  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const wrapRef = useRef(null);
  const fileRef = useRef(null);
  const pendingRef = useRef(null);
  const photosRef = useRef({});

  photosRef.current = photos;

  // LOAD PRODUCT
  useEffect(() => {
    let active = true;

    axios
      .get(`${API}/api/product/${id}`)
      .then((res) => {
        if (active) setProduct(res.data);
      })
      .catch((err) => console.log("PRODUCT LOAD ERROR", err));

    return () => {
      active = false;
    };
  }, [id]);

  // Free blob URLs when leaving the page.
  useEffect(
    () => () => {
      Object.values(photosRef.current).forEach((photo) => {
        if (photo.url) URL.revokeObjectURL(photo.url);
        if (photo.editedURL) URL.revokeObjectURL(photo.editedURL);
      });
    },
    []
  );

  // CONFIG
  const customization = useMemo(() => {
    let config = product?.customization || {};

    if (typeof config === "string") {
      try {
        config = JSON.parse(config);
      } catch {
        config = {};
      }
    }

    return config;
  }, [product]);

  // Passed through to the modal, which enforces them.
  const allowMove = customization.allowMove !== false;
  const allowZoom = customization.allowZoom !== false;
  const allowRotate = customization.allowRotate !== false;

  // NAME FIX: the name stays at the admin-configured position unless the
  // admin explicitly allows the customer to move it.
  const nameDraggable = customization.nameDraggable === true;

  const useTemplate =
    customization.backgroundSource === "template" &&
    !!customization.templateImage;

  const baseFile = useTemplate
    ? customization.templateImage
    : state?.variant?.images?.[0] || product?.image?.[0] || "";

  const baseURL = baseFile
    ? /^https?:\/\//i.test(baseFile)
      ? baseFile
      : `${BASE_URL}${baseFile}`
    : "";

  const [baseImage, baseStatus] = useImage(baseURL, "anonymous");

  const natW =
    baseImage?.naturalWidth || customization.canvasWidth || 800;
  const natH =
    baseImage?.naturalHeight || customization.canvasHeight || 600;

  const DESIGN_HEIGHT = (DESIGN_WIDTH * natH) / natW;
  const k = displayW / DESIGN_WIDTH;

  // RESPONSIVE STAGE
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    const update = () => {
      setDisplayW(
        Math.max(280, Math.min(el.clientWidth, MAX_STAGE_WIDTH))
      );
    };

    update();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => observer.disconnect();
  }, [product, baseImage]);

  // IMAGE AREAS: percentage config -> design pixels.
  const imageAreas = useMemo(() => {
    const list = Array.isArray(customization.imageAreas)
      ? customization.imageAreas
      : [];

    return list.map((item, index) => {
      const shape = mapShape(item.shape);

      let width = Math.max(
        20,
        (safeNumber(item.width, 40) / 100) * DESIGN_WIDTH
      );

      let height = Math.max(
        20,
        (safeNumber(item.height, 30) / 100) * DESIGN_HEIGHT
      );

      if (shape === "square" || shape === "circle") {
        const side = Math.min(width, height);
        width = side;
        height = side;
      }

      const x = (safeNumber(item.x, 30) / 100) * DESIGN_WIDTH;
      const y = (safeNumber(item.y, 30) / 100) * DESIGN_HEIGHT;

      return {
        id: item.id || `image-area-${index + 1}`,
        name: item.name || `Photo ${index + 1}`,
        width,
        height,
        cx: x + width / 2,
        cy: y + height / 2,
        rotation: safeNumber(item.rotation, 0),
        shape,
        points: Array.isArray(item.points) ? item.points : [],
      };
    });
  }, [customization.imageAreas, DESIGN_HEIGHT]);

  // Check whether a template has transparent photo openings.
  const templateHasHoles = useMemo(() => {
    if (!useTemplate || !baseImage) return false;

    const areas = Array.isArray(customization.imageAreas)
      ? customization.imageAreas
      : [];

    if (!areas.length) return false;

    try {
      const width = 300;
      const height = Math.max(
        1,
        Math.round(
          (width * baseImage.naturalHeight) / baseImage.naturalWidth
        )
      );

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", {
        willReadFrequently: true,
      });

      ctx.drawImage(baseImage, 0, 0, width, height);

      let total = 0;
      let clear = 0;

      areas.forEach((area) => {
        for (let i = 0; i < 6; i++) {
          for (let j = 0; j < 6; j++) {
            const px = Math.floor(
              ((safeNumber(area.x, 0) + ((i + 0.5) / 6) * area.width) /
                100) *
                width
            );

            const py = Math.floor(
              ((safeNumber(area.y, 0) + ((j + 0.5) / 6) * area.height) /
                100) *
                height
            );

            const pixel = ctx.getImageData(
              clamp(px, 0, width - 1),
              clamp(py, 0, height - 1),
              1,
              1
            ).data;

            total++;

            if (pixel[3] < 200) clear++;
          }
        }
      });

      return total > 0 && clear / total > 0.3;
    } catch {
      return true;
    }
  }, [useTemplate, baseImage, customization.imageAreas]);

  const overlayMode = useTemplate && templateHasHoles;

  // NAME AREAS (stored in the existing customization.textAreas structure).
  const textAreas = useMemo(() => {
    if (customization.nameEnabled === false) return [];

    const list = Array.isArray(customization.textAreas)
      ? customization.textAreas
      : [];

    return list.map((item, index) => {
      const width = Math.max(
        40,
        (safeNumber(item.width, 40) / 100) * DESIGN_WIDTH
      );

      const height = Math.max(
        20,
        (safeNumber(item.height, 10) / 100) * DESIGN_HEIGHT
      );

      return {
        id: item.id || `text-area-${index + 1}`,
        // legacy "Text 1" labels display as "Name 1"
        name: /^Text \d+$/.test(item.name || "")
          ? item.name.replace("Text", "Name")
          : item.name || `Name ${index + 1}`,
        width,
        height,
        cx: (safeNumber(item.x, 30) / 100) * DESIGN_WIDTH + width / 2,
        cy: (safeNumber(item.y, 45) / 100) * DESIGN_HEIGHT + height / 2,
        rotation: safeNumber(item.rotation, 0),
        fontFamily: item.fontFamily || "Arial",
        fontSize: Math.max(
          8,
          (safeNumber(item.fontSize, 28) * DESIGN_WIDTH) / natW
        ),
        fill: item.color || item.fill || "#000000",
        maxCharacters: Math.max(
          1,
          safeNumber(item.maxCharacters, 30)
        ),
        textAlign: item.textAlign || "center",
        // legacy default placeholder becomes a name hint
        placeholder:
          item.placeholder && item.placeholder !== "Your text here"
            ? item.placeholder
            : "Enter your name",
        // NAME FIX: printed / debossed / foil look + sample-name cover
        effect: item.effect || "deboss",
        coverSample: !!item.coverSample,
        coverFrom: item.coverFrom || "above",
      };
    });
  }, [
    customization.textAreas,
    customization.nameEnabled,
    DESIGN_HEIGHT,
    natW,
  ]);

  // INITIALIZE TEXT
  useEffect(() => {
    if (!baseImage || !textAreas.length) return;

    setTextValues((previous) => {
      const next = { ...previous };

      textAreas.forEach((area) => {
        if (next[area.id] === undefined) next[area.id] = "";
      });

      return next;
    });

    setTextProperties((previous) => {
      const next = { ...previous };

      textAreas.forEach((area) => {
        if (!next[area.id]) {
          next[area.id] = defaultTextProps(area);
        }
      });

      return next;
    });
  }, [textAreas, baseImage]);

  // RESTORE PREVIOUSLY SAVED PERSONALIZATION
useEffect(() => {
  const saved = state?.savedCustomization;

  if (
    !product ||
    !saved ||
    restoredCustomizationRef.current
  ) {
    return;
  }

  restoredCustomizationRef.current = true;

  let cancelled = false;
  const createdURLs = [];

  const restore = async () => {
    try {
      const restoredPhotos = {};

      for (const [areaId, savedPhoto] of Object.entries(
        saved.photos || {}
      )) {
        if (!savedPhoto.originalImage || !savedPhoto.editedImage) {
          continue;
        }

        const originalFile = await dataURLToFile(
          savedPhoto.originalImage,
          savedPhoto.fileName
        );

        const originalURL = URL.createObjectURL(originalFile);
        createdURLs.push(originalURL);

        const editedBlob = await (
          await fetch(savedPhoto.editedImage)
        ).blob();

        const editedURL = URL.createObjectURL(editedBlob);
        createdURLs.push(editedURL);

        const img = await loadImg(originalURL);

        restoredPhotos[areaId] = {
          file: originalFile,
          url: originalURL,
          dims: savedPhoto.dims || {
            w: img.naturalWidth,
            h: img.naturalHeight,
          },
          crop: savedPhoto.crop || null,
          editedURL,
        };
      }

      if (cancelled) {
        createdURLs.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      setPhotos(restoredPhotos);
      setTextValues(saved.textValues || {});
      setTextProperties(saved.textProperties || {});
    } catch (error) {
      console.error("RESTORE CUSTOMIZATION ERROR", error);
      toast.error(
        "Could not restore your saved photos. Please customize again."
      );
    }
  };

  restore();

  return () => {
    cancelled = true;
  };
}, [product, state?.savedCustomization]);

  // =====================================================
  // PHOTO: upload -> modal -> result  (no editing logic here)
  // =====================================================

  const openPicker = (areaId) => {
    pendingRef.current = areaId;
    fileRef.current?.click();
  };

  const uploadImage = async (areaId, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !areaId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image size must be below 15MB.");
      return;
    }

    const url = URL.createObjectURL(file);

    try {
      const img = await loadImg(url);

      if (Math.min(img.naturalWidth, img.naturalHeight) < 600) {
        toast.warn(
          "This photo is low resolution. The print may look blurry."
        );
      }

      // "Change" inside the modal: free the previous pending (uncommitted) blob.
      if (cropSession?.fresh) {
        URL.revokeObjectURL(cropSession.url);
      }

      // Hand the photo to the modal. It is committed on "Use this".
      setCropSession({
        areaId,
        file,
        url,
        dims: { w: img.naturalWidth, h: img.naturalHeight },
        fresh: true,
        initial: null,
      });
    } catch {
      URL.revokeObjectURL(url);
      toast.error("Could not read this image.");
    }
  };

  // Re-open the modal for a photo that is already placed (restores its crop).
  const openCropEditor = (areaId) => {
    const photo = photosRef.current[areaId];
    if (!photo) return;

    setCropSession({
      areaId,
      file: photo.file,
      url: photo.url,
      dims: photo.dims,
      fresh: false,
      initial: photo.crop,
    });
  };

  // X / Esc. A cancelled new upload is discarded; a cancelled edit keeps
  // the previously applied crop untouched.
  const closeCrop = () => {
    if (cropSession?.fresh) {
      URL.revokeObjectURL(cropSession.url);
    }

    setCropSession(null);
  };

  // "Use this": the modal returns { crop, blob }. Store it and display it.
  const applyCrop = ({ crop, blob }) => {
    if (!cropSession) return;

    const { areaId, file, url, dims } = cropSession;
    const old = photosRef.current[areaId];

    if (old) {
      if (old.editedURL) URL.revokeObjectURL(old.editedURL);
      if (old.url && old.url !== url) URL.revokeObjectURL(old.url);
    }

    const editedURL = URL.createObjectURL(blob);

    setPhotos((previous) => ({
      ...previous,
      [areaId]: { file, url, dims, crop, editedURL },
    }));

    setCropSession(null);
  };

  const removePhoto = (areaId) => {
    const old = photosRef.current[areaId];

    if (old) {
      if (old.url) URL.revokeObjectURL(old.url);
      if (old.editedURL) URL.revokeObjectURL(old.editedURL);
    }

    setPhotos((previous) => {
      const next = { ...previous };
      delete next[areaId];
      return next;
    });
  };

  // =====================================================
  // NAME
  // =====================================================

  const changeText = (area, value) => {
    setTextValues((previous) => ({
      ...previous,
      [area.id]: value.slice(0, area.maxCharacters || 30),
    }));

    setSelected(`text:${area.id}`);
  };

  const textDragEnd = (area, event) => {
    const node = event.target;

    setTextProperties((previous) => ({
      ...previous,
      [area.id]: {
        ...(previous[area.id] || defaultTextProps(area)),
        x: node.x(),
        y: node.y(),
      },
    }));
  };

  const textTransformEnd = (area, event) => {
    const node = event.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    setTextProperties((previous) => {
      const current = previous[area.id] || defaultTextProps(area);

      return {
        ...previous,
        [area.id]: {
          ...current,
          x: node.x(),
          y: node.y(),
          width: Math.max(40, node.width() * scaleX),
          height: Math.max(30, node.height() * scaleY),
          rotation: node.rotation(),
          // NAME FIX: scale the configured size, not the auto-shrunk one
          fontSize: Math.max(8, current.fontSize * scaleX),
        },
      };
    });

    node.scaleX(1);
    node.scaleY(1);
  };

  const selectedTextId = selected?.startsWith("text:")
    ? selected.split(":")[1]
    : null;

  // TRANSFORMER: NAME TEXT ONLY (only when the admin lets customers move it)
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage) return;

    if (!selectedTextId || !nameDraggable) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = stage.findOne(`#text-${selectedTextId}`);

    if (node) {
      transformer.nodes([node]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedTextId, textValues, textProperties, nameDraggable]);

  // RESET (name fields only; photo reset is the modal's own "Reset")
  const resetEditor = () => {
    setTextValues({});

    setTextProperties(() => {
      const next = {};

      textAreas.forEach((area) => {
        next[area.id] = defaultTextProps(area);
      });

      return next;
    });

    setSelected(null);
  };

  // CLEAN EXPORT
  const exportStage = () => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;

    if (!stage) return null;

    const uiElements = stage.find(".ui-only");

    uiElements.forEach((node) => node.hide());
    transformer?.hide();
    stage.batchDraw();

    try {
      const outW = Math.min(natW, MAX_EXPORT_WIDTH);

      return stage.toDataURL({
        pixelRatio: outW / displayW,
        mimeType: "image/png",
      });
    } finally {
      uiElements.forEach((node) => node.show());
      transformer?.show();
      stage.batchDraw();
    }
  };

  const downloadPreview = () => {
    const uri = exportStage();
    if (!uri) return;

    const link = document.createElement("a");
    link.download = "customized-product.png";
    link.href = uri;
    link.click();
  };

  // PRICE
  const calcPrice = () => {
    const base =
      state?.frameSize?.price ||
      state?.size?.price ||
      state?.variant?.sizes?.[0]?.price ||
      product?.price ||
      0;

    const withGst = base + (base * (product?.gst || 0)) / 100;
    const discountValue = Number(product?.discountValue || 0);
    const discountType = (product?.discountType || "").toLowerCase();

    let final = withGst;

    if (discountType === "percentage") {
      final = withGst - (withGst * discountValue) / 100;
    } else if (
      ["flat", "amount", "fixed"].includes(discountType)
    ) {
      final = withGst - discountValue;
    }

    return {
      original: base,
      final: Math.max(0, Math.round(final)),
    };
  };

  // VALIDATE
  const validateAll = () => {
    for (const area of imageAreas) {
      if (!photos[area.id]?.file || !photos[area.id]?.editedURL) {
        toast.error(`Please add: ${area.name}`);
        return false;
      }
    }

    for (const area of textAreas) {
      if (!(textValues[area.id] || "").trim()) {
        toast.error(`Please enter: ${area.name}`);
        return false;
      }
    }

    return true;
  };

  // SAVE & PREVIEW

const handleSavePreview = async () => {
  if (!validateAll()) return;

  try {
    setSelected(null);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const uri = exportStage();

    if (!uri) {
      toast.error("Could not create the preview. Please try again.");
      return;
    }

    // Convert temporary blob URLs to persistent image data
    const savedPhotos = {};

    for (const [areaId, photo] of Object.entries(photos)) {
      const originalImage = await urlToDataURL(photo.url);

      const editedImage = photo.editedURL
        ? await urlToDataURL(photo.editedURL)
        : originalImage;

      savedPhotos[areaId] = {
        fileName: photo.file?.name || "personalized-photo.png",
        crop: photo.crop,
        dims: photo.dims,
        originalImage,
        editedImage,
      };
    }

    const savedCustomization = {
      textValues,
      textProperties,
      photos: savedPhotos,
      frameSize: state?.frameSize || null,
      size: state?.size || null,
      variant: state?.variant || null,
      quantity: state?.quantity || 1,
    };

    navigate(`/product/${id}`, {
      state: {
        customizedPreview: uri,
        savedCustomization,
        frameSize: state?.frameSize,
        quantity: state?.quantity || 1,
        variant: state?.variant,
        size: state?.size,
      },
    });
  } catch (error) {
    console.error("SAVE CUSTOMIZATION ERROR:", error);
    toast.error("Unable to save the customization. Please try again.");
  }
};


  // ADD TO CART
  const handleAddToCart = async () => {
    if (!validateAll()) return;

    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Login required ❌");
      return;
    }

    setSaving(true);

    try {
      setSelected(null);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const uri = exportStage();
      if (!uri) throw new Error("Preview export failed");

      const blob = await (await fetch(uri)).blob();
      const { original, final } = calcPrice();

      const formData = new FormData();

      formData.append("productId", product._id);
      formData.append("quantity", state?.quantity || 1);
      formData.append("name", product.name);
      formData.append("image", product.image?.[0] || "");
      formData.append("price", final);
      formData.append("originalPrice", original);
      formData.append("discountType", product.discountType || "flat");
      formData.append("discountValue", product.discountValue || 0);
      formData.append("gst", product.gst || 0);

      if (state?.size?.size) {
        formData.append("size", state.size.size);
      }

      if (state?.frameSize?.size) {
        formData.append("frameSize", state.frameSize.size);
      }

      if (state?.variant?.color) {
        formData.append("variant", state.variant.color);
      }

      // Keep existing cart/order compatibility fields.
      formData.append("isCustomized", true);

      formData.append(
        "customName",
        (textValues[textAreas[0]?.id] || "").trim()
      );

      formData.append(
        "message",
        textAreas
          .map(
            (area) =>
              `${area.name}: ${(textValues[area.id] || "").trim()}`
          )
          .join(" | ")
      );

      const customData = {
        canvasWidth: natW,
        canvasHeight: natH,
        previewIndex: 0,
        // Design-space reference so pan values can be converted to
        // natural-image pixels (natural px = design px * designScale).
        cropVersion: 2,
        designWidth: DESIGN_WIDTH,
        designHeight: DESIGN_HEIGHT,
        designScale: natW / DESIGN_WIDTH,
        areas: [],
      };

      // First extra image = final preview. Remaining images = originals.
      formData.append("extraImages", blob, "preview.png");

      let fileIndex = 1;

      imageAreas.forEach((area) => {
        const photo = photos[area.id];
        // Saved crop exactly as returned by the modal.
        const crop = photo.crop;

        formData.append("extraImages", photo.file);

        customData.areas.push({
          id: area.id,
          name: area.name,
          type: "image",
          shape: area.shape,
          points: area.points,
          fileIndex: fileIndex++,
          // Legacy fields (unchanged meaning).
          zoom: crop.zoom,
          offsetX: crop.panX / area.width,
          offsetY: crop.panY / area.height,
          rotation: crop.rotation,
          // Exact state, enough to rebuild the same crop.
          panX: crop.panX,
          panY: crop.panY,
          areaWidth: area.width,
          areaHeight: area.height,
          areaRotation: area.rotation,
          imageWidth: photo.dims?.w || 0,
          imageHeight: photo.dims?.h || 0,
          drawWidth: crop.drawWidth,
          drawHeight: crop.drawHeight,
          fit: "cover",
        });
      });

      textAreas.forEach((area) => {
        const properties =
          textProperties[area.id] || defaultTextProps(area);

        const nameValue = (textValues[area.id] || "").trim();

        // NAME FIX: size actually used on the canvas after fit-to-width
        const fittedSize = fitNameFontSize(
          nameValue,
          properties.fontSize,
          properties.width,
          properties.fontFamily,
          area.effect
        );

        customData.areas.push({
          id: area.id,
          name: area.name,
          type: "text",
          field: "name",
          value: nameValue,
          fontFamily: properties.fontFamily,
          color: properties.fill,
          fontSize: (properties.fontSize * natW) / DESIGN_WIDTH,
          fittedFontSize: (fittedSize * natW) / DESIGN_WIDTH, // NAME FIX
          effect: area.effect, // NAME FIX: deboss | foil | print
          textAlign: area.textAlign,
          x: ((properties.x - properties.width / 2) / DESIGN_WIDTH) * 100,
          y: ((properties.y - properties.height / 2) / DESIGN_HEIGHT) * 100,
          width: (properties.width / DESIGN_WIDTH) * 100,
          height: (properties.height / DESIGN_HEIGHT) * 100,
          rotation: properties.rotation,
        });
      });

      formData.append("customData", JSON.stringify(customData));

      await axios.post(`${API}/api/cart/add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Added to cart ✅");
      navigate("/cart");
    } catch (error) {
      console.log("ADD TO CART ERROR", error);
      toast.error("Could not add to cart. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // GUARDS
  if (!product) {
    return <div className="pc-loading">Loading...</div>;
  }

  if (baseStatus === "failed" || !baseFile) {
    return (
      <div className="pc-loading">
        Template image could not be loaded. Please check the product setup.
      </div>
    );
  }

  if (!baseImage) {
    return <div className="pc-loading">Loading...</div>;
  }

  if (
    !customization.enabled ||
    (!imageAreas.length && !textAreas.length)
  ) {
    return (
      <div className="pc-loading">
        Personalization is not set up for this product yet.
      </div>
    );
  }

  const rightProductImage =
  product?.category?.trim()?.toLowerCase() === "dress"
    ? (
        state?.variant?.images?.[0] ||
        product?.variants?.find((v) => v.images?.length > 0)?.images?.[0] ||
        product?.image?.[0]
      )
    : product?.image?.[0];

const rightProductImageUrl = rightProductImage
  ? /^https?:\/\//i.test(rightProductImage)
    ? rightProductImage
    : `${BASE_URL}${rightProductImage}`
  : "";


  const finalPrice = calcPrice().final;

  // RENDER (presentation only)
  return (
    <div className="pc-root">
      <div className="pc-left">
        <header className="pc-heading">
          <h1>Personalize your {product.name}</h1>
          <p>Add your photo and name, then preview before you save.</p>
        </header>

        {/* PHOTOS: upload / open editor / remove only */}
        <section className="pc-panel">
          <div className="pc-panel-head">
            <h2>Your photos</h2>
            <button
              type="button"
              className="pc-tool-btn pc-reset-btn"
              onClick={resetEditor}
            >
              <span aria-hidden="true">↺</span> Reset
            </button>
          </div>

          <div className="pc-toolbar">
            {imageAreas.map((area) => (
              <div
                key={area.id}
                className={`pc-photo-row${
                  photos[area.id] ? " has-photo" : ""
                }`}
              >
                <button
                  type="button"
                  className="pc-upload-btn"
                  onClick={() => openPicker(area.id)}
                >
                  <span aria-hidden="true">📷</span>{" "}
                  {photos[area.id]
                    ? `Change ${area.name}`
                    : `Upload ${area.name}`}
                </button>

                {photos[area.id] && (
                  <React.Fragment key={`tools-${area.id}`}>
                    <button
                      type="button"
                      className="pc-tool-btn"
                      onClick={() => openCropEditor(area.id)}
                    >
                      <span aria-hidden="true">✂</span> Edit {area.name}
                    </button>

                    <button
                      type="button"
                      className="pc-tool-btn pc-tool-danger"
                      onClick={() => removePhoto(area.id)}
                    >
                      <span aria-hidden="true">🗑</span> Remove {area.name}
                    </button>
                  </React.Fragment>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* NAME INPUTS */}
        {textAreas.length > 0 && (
          <section className="pc-panel">
            <div className="pc-panel-head">
              <h2>Your text</h2>
            </div>

            <div className="pc-text-fields">
              {textAreas.map((area) => (
                <div key={area.id} className="pc-text-field">
                  <div className="pc-text-field-top">
                    <label htmlFor={`pc-input-${area.id}`}>
                      {area.name}
                    </label>

                    <small>
                      {(textValues[area.id] || "").length}/
                      {area.maxCharacters}
                    </small>
                  </div>

                  <input
                    id={`pc-input-${area.id}`}
                    type="text"
                    placeholder={area.placeholder}
                    maxLength={area.maxCharacters}
                    value={textValues[area.id] || ""}
                    onChange={(event) =>
                      changeText(area, event.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CANVAS */}
        <section className="pc-panel pc-preview-panel">
          <div className="pc-panel-head">
            <h2>Live preview</h2>
          </div>

          <div
            className="pc-stage-wrap"
            ref={wrapRef}
            style={{ width: "100%", maxWidth: MAX_STAGE_WIDTH }}
          >
            <Stage
              ref={stageRef}
              width={displayW}
              height={DESIGN_HEIGHT * k}
              scale={{ x: k, y: k }}
              onMouseDown={(event) => {
                if (event.target === event.target.getStage()) {
                  setSelected(null);
                }
              }}
              onTouchStart={(event) => {
                if (event.target === event.target.getStage()) {
                  setSelected(null);
                }
              }}
            >
              <Layer>
                {/* PRODUCT BACKGROUND */}
                {!overlayMode && (
                  <KonvaImage
                    image={baseImage}
                    x={0}
                    y={0}
                    width={DESIGN_WIDTH}
                    height={DESIGN_HEIGHT}
                    listening={false}
                  />
                )}

                {/* PHOTO AREAS: edited result from the modal, or empty slot */}
                {imageAreas.map((area) =>
                  photos[area.id]?.editedURL ? (
                    <EditedPhoto
                      key={area.id}
                      area={area}
                      editedURL={photos[area.id].editedURL}
                      onOpen={() => openCropEditor(area.id)}
                    />
                  ) : (
                    <EmptyPhotoSlot
                      key={area.id}
                      area={area}
                      onSelect={() => openPicker(area.id)}
                    />
                  )
                )}

                {/* TRANSPARENT FRAME TEMPLATE ON TOP */}
                {overlayMode && (
                  <KonvaImage
                    image={baseImage}
                    x={0}
                    y={0}
                    width={DESIGN_WIDTH}
                    height={DESIGN_HEIGHT}
                    listening={false}
                  />
                )}

                {/* NAME FIX: clean-leather patches that hide a sample name
                    already printed in the product image (admin option) */}
                {textAreas.map((area) => (
                  <NameCoverPatch
                    key={`cover-${area.id}`}
                    area={area}
                    baseImage={baseImage}
                    designWidth={DESIGN_WIDTH}
                  />
                ))}

                {/* NAME AREAS (live preview of the entered name) */}
                {textAreas.map((area) => {
                  const properties =
                    textProperties[area.id] || defaultTextProps(area);

                  const value = textValues[area.id] || "";
                  const shownText = value || area.placeholder;

                  // NAME FIX: keep the name on one line inside its box
                  const fontSize = fitNameFontSize(
                    shownText,
                    properties.fontSize,
                    properties.width,
                    properties.fontFamily,
                    value ? area.effect : "print"
                  );

                  // NAME FIX: printed / debossed / foil-stamped look
                  const effectProps = value
                    ? nameEffectProps(
                        area.effect,
                        properties.fill,
                        fontSize,
                        properties.height
                      )
                    : {};

                  return (
                    <Text
                      key={area.id}
                      id={`text-${area.id}`}
                      name={value ? "" : "ui-only"}
                      text={shownText}
                      x={properties.x}
                      y={properties.y}
                      offsetX={properties.width / 2}
                      offsetY={properties.height / 2}
                      width={properties.width}
                      height={properties.height}
                      rotation={properties.rotation}
                      fontSize={fontSize}
                      fill={value ? properties.fill : "#999999"}
                      fontFamily={properties.fontFamily}
                      fontStyle={properties.fontStyle || "normal"}
                      align={area.textAlign}
                      verticalAlign="middle"
                      wrap="none"
                      letterSpacing={nameLetterSpacing(
                        value ? area.effect : "print",
                        fontSize
                      )}
                      draggable={nameDraggable}
                      listening={nameDraggable}
                      opacity={value ? 1 : 0.7}
                      {...effectProps}
                      onClick={() => setSelected(`text:${area.id}`)}
                      onTap={() => setSelected(`text:${area.id}`)}
                      onDragEnd={(event) => textDragEnd(area, event)}
                      onTransformEnd={(event) =>
                        textTransformEnd(area, event)
                      }
                    />
                  );
                })}

                <Transformer
                  ref={transformerRef}
                  rotateEnabled={allowRotate}
                  keepRatio={false}
                  enabledAnchors={[
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                  ]}
                  anchorSize={10}
                />
              </Layer>
            </Stage>
          </div>

          <p className="pc-hint">
            Tip: tap a photo area on the preview to add or adjust your photo.
          </p>
        </section>

        {/* ACTIONS */}
        <div className="pc-actions">
          <button
            type="button"
            className="pc-download-btn"
            onClick={downloadPreview}
          >
            ↓ Download HD Preview
          </button>

          <button
            type="button"
            className="pc-save-btn"
            onClick={handleSavePreview}
            disabled={saving}
          >
            ✓ Save &amp; Preview
          </button>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <aside className="pc-right">
        <div className="pc-product-card">
          {rightProductImageUrl && (
            <img
              src={rightProductImageUrl}
              alt={product.name}
              className="pc-product-image"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          <div className="pc-product-body">
            <h2>{product.name}</h2>
            <h3>₹{finalPrice}</h3>

            <p>
              Create your personalized version of this product with your own
              photo and message.
            </p>
          </div>
        </div>

        <div className="pc-info-card">
          <h3>How it works</h3>

          <div className="pc-step">
            <b>1</b>
            <div>
              <strong>Add your photo</strong>
              <small>Upload an image and adjust it to fit the frame.</small>
            </div>
          </div>

          <div className="pc-step">
            <b>2</b>
            <div>
              <strong>Enter your text</strong>
              <small>Check the spelling in the live preview.</small>
            </div>
          </div>

          <div className="pc-step">
            <b>3</b>
            <div>
              <strong>Save &amp; preview</strong>
              <small>Review everything, then continue to your cart.</small>
            </div>
          </div>
        </div>
      </aside>

      {/* SAVE & PREVIEW MODAL */}
      {showPreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="pc-preview-backdrop"
          onClick={() => !saving && setShowPreview(false)}
        >
          <div
            className="pc-preview-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Your personalized {product.name}</h3>

            <p>
              Check the spelling and photo placement before adding to cart.
            </p>

            <img src={previewURI} alt="Final preview" />

            <div className="pc-preview-actions">
              <button
                type="button"
                className="pc-tool-btn"
                disabled={saving}
                onClick={() => setShowPreview(false)}
              >
                Edit design
              </button>

              <button
                type="button"
                className="pc-save-btn"
                disabled={saving}
                onClick={handleAddToCart}
              >
                {saving ? "Adding..." : `Add to Cart · ₹${finalPrice}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CROP MODAL: owns ALL photo editing */}
      {cropSession &&
        (() => {
          const cropArea = imageAreas.find(
            (area) => area.id === cropSession.areaId
          );

          if (!cropArea) return null;

          return (
            <PhotoCropModal
              key={cropSession.url}
              area={cropArea}
              imageURL={cropSession.url}
              dims={cropSession.dims}
              initialTransform={cropSession.initial}
              allowMove={allowMove}
              allowZoom={allowZoom}
              allowRotate={allowRotate}
              onApply={applyCrop}
              onChangePhoto={() => openPicker(cropSession.areaId)}
              onClose={closeCrop}
            />
          );
        })()}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => uploadImage(pendingRef.current, event)}
      />
    </div>
  );
}