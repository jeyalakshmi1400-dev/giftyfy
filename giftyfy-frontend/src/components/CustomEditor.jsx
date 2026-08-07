import { useEffect, useRef } from "react";
import { Canvas, FabricImage, Textbox } from "fabric";

export default function CustomEditor({
  image,
  customName,
  message,
}) {
  const canvasRef = useRef(null);
  const canvasInstance = useRef(null);

  useEffect(() => {
    const canvas = new Canvas(canvasRef.current, {
      width: 500,
      height: 500,
    });

    canvasInstance.current = canvas;

    loadCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (canvasInstance.current) {
      loadCanvas(canvasInstance.current);
    }
  }, [image, customName, message]);

  async function loadCanvas(canvas) {
    canvas.clear();

    // Product Image
    if (image) {
      try {
        const img = await FabricImage.fromURL(
          `http://localhost:4000/uploads/${image}`
        );

        img.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
        });

        img.scaleToWidth(500);
        img.scaleToHeight(500);

        canvas.add(img);
      } catch (err) {
        console.log(err);
      }
    }

    // Name
    const name = new Textbox(
      customName || "Your Name",
      {
        left: 130,
        top: 380,
        width: 250,
        fontSize: 26,
        fontWeight: "bold",
        fill: "#000",
        selectable: false,
      }
    );

    canvas.add(name);

    // Message
    const msg = new Textbox(
      message || "Your Message",
      {
        left: 80,
        top: 420,
        width: 340,
        fontSize: 18,
        fill: "#444",
        textAlign: "center",
        selectable: false,
      }
    );

    canvas.add(msg);

    canvas.requestRenderAll();
  }

  return (
    <div className="custom-editor">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{
          border: "2px solid #ddd",
          borderRadius: "10px",
        }}
      />
    </div>
  );
}