import { useEffect, useRef } from "react";
import * as fabric from "fabric";

export default function CustomPreview({ mainImage, customImage }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);

  // 🎯 CREATE CANVAS ONLY ONCE
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 350,
      height: 420,
    });

    fabricRef.current = canvas;

    return () => canvas.dispose();
  }, []);

  // 🧥 SET BACKGROUND IMAGE
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !mainImage) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `http://localhost:4000/uploads/${mainImage}`;

   img.onload = () => {
  const bg = new fabric.Image(img);

  bg.scaleToWidth(350);

  bg.set({
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
  });

  canvas.add(bg);
  canvas.sendToBack(bg); // 👈 must
  canvas.renderAll();
};
  }, [mainImage]);

  // 🎨 ADD USER IMAGE
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !customImage) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const design = new fabric.Image(img);

        design.set({
          left: 100,
          top: 120,
          cornerColor: "blue",
          cornerSize: 8,
        });

        design.scaleToWidth(120);

        canvas.add(design);
        canvas.setActiveObject(design);
        canvas.renderAll();
      };
    };

    reader.readAsDataURL(customImage);
  }, [customImage]);

  return (
    <div style={{ marginTop: "20px" }}>
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
        }}
      />
    </div>
  );
}