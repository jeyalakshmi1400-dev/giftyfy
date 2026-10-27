import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/adminOrders.css";
import AdminLayout from "../layout/AdminLayout";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import signature from "../assets/signature.jpg";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaTruck,
  FaPaintBrush,
  FaUserCheck,
  FaShippingFast,
  FaBoxOpen,
  FaFilePdf,
  FaEye,
  FaFileExcel,
  FaHourglassHalf,
  FaTimesCircle,
  FaRedoAlt,
  FaBoxes,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaDownload,
} from "react-icons/fa";

export default function AdminOrders() {

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
   const [currentPage, setCurrentPage] = useState(1);
  const [orderPerPage] = useState(10);
const [filter, setFilter] = useState({
  location: "",
  from: "",
  to: "",
  status: ""
});
const [showCancelModal, setShowCancelModal] = useState(false);
const [selectedOrderId, setSelectedOrderId] = useState("");
const [cancelReason, setCancelReason] = useState("");
  // =========================
// EXPORT EXCEL
// =========================
const exportToExcel = () => {

  try {

    // Page-la filter aana orders mattum
    let latestOrders = [...filteredOrders];

    // =========================
    // EXCEL DATA
    // =========================

    const excelData = latestOrders.map((order) => ({

      OrderID: order.orderId,

      Customer: order.name || "-",

      Email: order.user?.email || "-",

      Phone: order.phone || "-",

      Address: order.address || "-",

      Pincode: order.deliveryPincode || "-",

      Payment: order.paymentMethod || "COD",

      Status: order.status,

      Customized: order.items.some(item => item.isCustomized)
        ? "Yes"
        : "No",

      Items: order.items
        .map(item => `${item.name} x${item.quantity}`)
        .join(", "),

      Total: order.totalAmount,

      Date: new Date(order.createdAt).toLocaleString()

    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Orders"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const data = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
      }
    );

    saveAs(
      data,
      `orders_${Date.now()}.xlsx`
    );

  } catch (err) {

    console.log(err);

  }

};

  // =========================
  // FETCH ORDERS
  // =========================
  const fetchOrders = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:4000/api/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOrders(
  (res.data.orders || []).sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  )
);

    } catch (err) {

      console.log(err);

    }

  };

  // =========================
  // STATUS UPDATE
  // =========================
const updateOrderStatus = async (order) => {
  try {
    const token = localStorage.getItem("token");

    let nextStatus = "";
    let customizationStatus = "";

    const hasCustomized = order.items.some(
      (item) => item.isCustomized
    );

    if (order.status === "Pending") {

      nextStatus = "Confirmed";

    } else if (
      order.status === "Confirmed" &&
      hasCustomized
    ) {

      nextStatus = "Customization In Progress";
      customizationStatus = "In Progress";

    } else if (
      order.status === "Confirmed" &&
      !hasCustomized
    ) {

      nextStatus = "Shipped";

    } else if (
      order.status === "Customization In Progress"
    ) {

      nextStatus = "Shipped";
      customizationStatus = "Completed";

    } else {
      return;
    }

    console.log({
      status: nextStatus,
      customizationStatus,
    });

    await axios.put(
      `http://localhost:4000/api/orders/${order._id}/status`,
      {
        status: nextStatus,
        customizationStatus,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Toast Messages
switch (nextStatus) {
  case "Confirmed":
    toast.success("✅ Order Confirmed");
    break;

  case "Customization In Progress":
    toast.success("🎨 Customization Started");
    break;

  case "Shipped":
    toast.success("🚚 Order Shipped");
    break;

  case "Assigned":
    toast.success("👤 Delivery Partner Assigned");
    break;

  case "Out for Delivery":
    toast.success("📦 Out for Delivery");
    break;

  case "Delivered":
    toast.success("🎉 Order Delivered");
    break;

  default:
    toast.success(`Status Updated to ${nextStatus}`);
}

    fetchOrders();

  } catch (err) {
    console.log(err.response?.data || err.message);
  }
};


  // =========================
  // FILTERED ORDERS (STEP 1)
  // =========================
  const filteredOrders = orders.filter((order) => {

    if (
      filter.location &&
      order.deliveryPincode !== filter.location
    ) return false;

    if (filter.status) {

      if (filter.status === "Customized") {
        if (!order.items.some(i => i.isCustomized)) return false;
      } else if (order.status !== filter.status) {
        return false;
      }

    }

   if (filter.from && filter.to) {

  const fromDate = new Date(filter.from);

  const toDate = new Date(filter.to);
  toDate.setHours(23, 59, 59, 999);

  const orderDate = new Date(order.createdAt);

  if (orderDate < fromDate || orderDate > toDate) {
    return false;
  }

}

    return true;
  });

  // =========================
  // PAGINATION (STEP 2)
  // =========================
  const indexOfLastOrder = currentPage * orderPerPage;
  const indexOfFirstOrder = indexOfLastOrder - orderPerPage;

  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  // =========================
  // RESET PAGE ON FILTER CHANGE
  // =========================
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);




  // =========================
  // USE EFFECT
  // =========================
  useEffect(() => {

    fetchOrders();

    const interval = setInterval(() => {

      fetchOrders()

    }, 5000);

    return () => clearInterval(interval);

  }, []);

  const downloadImage = async (imageName) => {
  try {
    const response = await axios.get(
      `http://localhost:4000/uploads/${imageName}`,
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", imageName);

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.log(err);
    alert("Image download failed");
  }
};

const downloadImageAsDataURL = async (imageUrl) => {
  try {
    const response = await axios.get(
      imageUrl,
      {
        responseType: "blob"
      }
    );

    return await new Promise((resolve, reject) => {

      const blobUrl =
        URL.createObjectURL(response.data);

      const img =
        new Image();

      img.onload = () => {

        try {

          const canvas =
            document.createElement("canvas");

          canvas.width =
            img.naturalWidth;

          canvas.height =
            img.naturalHeight;

          const ctx =
            canvas.getContext("2d");

          ctx.drawImage(
            img,
            0,
            0
          );

          const pngData =
            canvas.toDataURL(
              "image/png"
            );

          URL.revokeObjectURL(
            blobUrl
          );

          resolve(pngData);

        } catch (error) {

          URL.revokeObjectURL(
            blobUrl
          );

          reject(error);
        }
      };

      img.onerror = (error) => {

        URL.revokeObjectURL(
          blobUrl
        );

        reject(error);
      };

      img.src = blobUrl;
    });

  } catch (error) {

    console.error(
      "Product image load failed:",
      error
    );

    return null;
  }
};

const loadLogoDataURL = async () => {
  try {

    const response = await axios.get(
      "http://localhost:4000/api/logo"
    );

    console.log(
      "========== PDF LOGO DEBUG =========="
    );

    console.log(
      "LOGO API RESPONSE:",
      response.data
    );

    const logo = response.data;

    if (!logo) {
      console.error(
        "❌ Logo response empty"
      );

      return null;
    }

    if (!logo.image) {
      console.error(
        "❌ logo.image not found:",
        logo
      );

      return null;
    }

    const logoUrl =
      `http://localhost:4000/uploads/${logo.image}`;

    console.log(
      "LOGO FILE:",
      logo.image
    );

    console.log(
      "LOGO URL:",
      logoUrl
    );

    const logoData =
      await downloadImageAsDataURL(
        logoUrl
      );

    if (!logoData) {

      console.error(
        "❌ Logo image download failed"
      );

      return null;
    }

    console.log(
      "✅ PDF LOGO LOADED"
    );

    return logoData;

  } catch (error) {

    console.error(
      "❌ LOGO LOAD ERROR:",
      error
    );

    return null;
  }
};

const getImageFormat = (dataURL) => {
  if (!dataURL) {
    return "PNG";
  }

  if (
    dataURL.startsWith("data:image/jpeg") ||
    dataURL.startsWith("data:image/jpg")
  ) {
    return "JPEG";
  }

  if (
    dataURL.startsWith("data:image/webp")
  ) {
    return "WEBP";
  }

  return "PNG";
};

// =========================================================
// STEP 7F — SIGNATURE LOADER
// =========================================================

const loadSignatureDataURL = async () => {
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");

          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext("2d");

          ctx.drawImage(
            img,
            0,
            0
          );

          const dataURL = canvas.toDataURL("image/jpeg");

          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = (error) => {
        reject(error);
      };

      img.src = signature;
    });
  } catch (error) {
    console.error(
      "❌ Signature load failed:",
      error
    );

    return null;
  }
};


// =========================================================
// STEP 7E — INR FORMATTER
// =========================================================

const formatINR = (value) => {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};


// =========================================================
// BARCODE GENERATOR
// =========================================================

const generateBarcodeDataURL = async (value) => {
  try {
    const canvas = document.createElement("canvas");

    JsBarcode(canvas, String(value), {
      format: "CODE128",
      width: 2,
      height: 45,
      displayValue: true,
      fontSize: 11,
      margin: 4,
      background: "#ffffff",
      lineColor: "#000000",
    });

    return canvas.toDataURL("image/png");

  } catch (error) {
    console.error(
      "Barcode generation failed:",
      error
    );

    return null;
  }
};
// =========================================================
// QR CODE GENERATOR
// =========================================================

const generateQRDataURL = async (value) => {
  try {

    return await QRCode.toDataURL(
      String(value),
      {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }
    );

  } catch (error) {

    console.error(
      "QR generation failed:",
      error
    );

    return null;
  }
};
// =====================================
// DOWNLOAD SHIPPING LABEL + INVOICE PDF
// =====================================


const downloadOrderPDF = async (order) => {
  try {
    // =====================================================
    // ORDER ITEMS
    // =====================================================

    const items = Array.isArray(order?.items)
      ? order.items
      : [];

    // =====================================================
    // BASIC HELPERS
    // =====================================================

    const isTrue = (value) =>
      value === true || value === "true";

    const safeText = (value, fallback = "-") => {
      if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
      ) {
        return fallback;
      }

      return String(value);
    };

    // =====================================================
    // IMAGE VALUE HELPER
    // =====================================================

    const getImageValue = (value) => {
      if (!value) return null;

      if (typeof value === "string") {
        return value;
      }

      if (typeof value === "object") {
        return (
          value.url ||
          value.imageUrl ||
          value.path ||
          value.filename ||
          value.fileName ||
          value.name ||
          null
        );
      }

      return null;
    };

    // =====================================================
    // IMAGE URL HELPER
    // =====================================================

    const buildUploadUrl = (value) => {
      if (!value) {
        return null;
      }

      const raw = String(value).trim();

      if (!raw) {
        return null;
      }

      // Data URL
      if (raw.startsWith("data:image/")) {
        return raw;
      }

      // Full URL
      if (
        raw.startsWith("http://") ||
        raw.startsWith("https://")
      ) {
        return raw;
      }

      // /uploads/file.jpg
      if (raw.startsWith("/uploads/")) {
        return `http://localhost:4000${raw}`;
      }

      // uploads/file.jpg
      if (raw.startsWith("uploads/")) {
        return `http://localhost:4000/${raw}`;
      }

      // /file.jpg
      const cleaned = raw.replace(/^\/+/, "");

      return `http://localhost:4000/uploads/${cleaned}`;
    };

    // =====================================================
    // CUSTOMIZATION
    // =====================================================

    /*
      UserInvoicePDF reference:

      item.customName
      item.message
      item.extraImages
    */

    const customizedItems = items.filter((item) => {
      const hasFlag =
        isTrue(item?.isCustomized) ||
        isTrue(item?.customized) ||
        isTrue(item?.isCustom);

      const hasCustomName =
        Boolean(
          String(item?.customName || "").trim()
        );

      const hasMessage =
        Boolean(
          String(item?.message || "").trim()
        );

      const hasExtraImages =
        Array.isArray(item?.extraImages) &&
        item.extraImages.length > 0;

      return (
        hasFlag ||
        hasCustomName ||
        hasMessage ||
        hasExtraImages
      );
    });

    const isCustomizedOrder =
      isTrue(order?.isCustomized) ||
      isTrue(order?.customized) ||
      isTrue(order?.isCustom) ||
      isTrue(order?.customization) ||
      customizedItems.length > 0;

    // =====================================================
    // LEGACY MAIN CUSTOM IMAGE
    // =====================================================

    const legacyCustomizedProduct =
      items.find(
        (item) =>
          isTrue(item?.isCustomized) ||
          isTrue(item?.customized) ||
          isTrue(item?.isCustom)
      );

    const legacyCustomImageUrl =
      getImageValue(
        legacyCustomizedProduct?.customizedImage
      ) ||
      getImageValue(
        legacyCustomizedProduct?.customImage
      ) ||
      getImageValue(
        legacyCustomizedProduct?.customizedImageUrl
      ) ||
      getImageValue(
        legacyCustomizedProduct?.customImageUrl
      ) ||
      getImageValue(
        legacyCustomizedProduct?.customization?.image
      ) ||
      getImageValue(
        legacyCustomizedProduct?.customization?.imageUrl
      ) ||
      getImageValue(
        legacyCustomizedProduct?.customizationData?.image
      ) ||
      getImageValue(
        legacyCustomizedProduct?.customizationData?.imageUrl
      ) ||
      getImageValue(order?.customizedImage) ||
      getImageValue(order?.customImage) ||
      getImageValue(order?.customizedImageUrl) ||
      getImageValue(order?.customImageUrl) ||
      getImageValue(order?.customization?.image) ||
      getImageValue(order?.customization?.imageUrl) ||
      null;

    // =====================================================
    // LEGACY CUSTOM TEXT
    // =====================================================

    const legacyCustomText =
      legacyCustomizedProduct?.customText ||
      legacyCustomizedProduct?.customMessage ||
      legacyCustomizedProduct?.customizationMessage ||
      legacyCustomizedProduct?.customization?.text ||
      legacyCustomizedProduct?.customization?.message ||
      legacyCustomizedProduct?.customizationData?.text ||
      legacyCustomizedProduct?.customizationData?.message ||
      order?.customText ||
      order?.customMessage ||
      order?.customization?.text ||
      order?.customization?.message ||
      "";

    // =====================================================
    // CUSTOMIZATION DEBUG
    // =====================================================

    console.log(
      "========== CUSTOMIZATION DEBUG =========="
    );

    console.log("ORDER:", order);
    console.log("ITEMS:", items);
    console.log(
      "CUSTOMIZED ITEMS:",
      customizedItems
    );
    console.log(
      "IS CUSTOMIZED ORDER:",
      isCustomizedOrder
    );

    customizedItems.forEach((item, index) => {
      console.log(
        `CUSTOM ITEM ${index + 1}:`,
        {
          name: item?.name,
          customName: item?.customName,
          message: item?.message,
          extraImages: item?.extraImages,
          isCustomized: item?.isCustomized
        }
      );
    });

    console.log(
      "LEGACY CUSTOM IMAGE:",
      legacyCustomImageUrl
    );

    console.log(
      "LEGACY CUSTOM TEXT:",
      legacyCustomText
    );

    console.log(
      "=========================================="
    );

    // =====================================================
    // ORDER CALCULATIONS
    // =====================================================

    const productPriceTotal =
      items.reduce(
        (sum, item) => {
          const originalPrice =
            Number(
              item?.originalPrice ??
              item?.price ??
              0
            );

          const quantity =
            Number(
              item?.quantity || 1
            );

          return (
            sum +
            originalPrice * quantity
          );
        },
        0
      );

    const productDiscountTotal =
      items.reduce(
        (sum, item) => {
          const originalPrice =
            Number(
              item?.originalPrice ??
              item?.price ??
              0
            );

          const price =
            Number(
              item?.price ?? 0
            );

          const quantity =
            Number(
              item?.quantity || 1
            );

          return (
            sum +
            Math.max(
              originalPrice - price,
              0
            ) * quantity
          );
        },
        0
      );

    const taxableValueTotal =
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            item?.taxablePrice || 0
          ),
        0
      );

    const gstAmountTotal =
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            item?.gstAmount || 0
          ),
        0
      );

    const grossAmountTotal =
      items.reduce(
        (sum, item) => {
          const price =
            Number(
              item?.price ?? 0
            );

          const quantity =
            Number(
              item?.quantity || 1
            );

          return (
            sum +
            price * quantity
          );
        },
        0
      );

    const additionalDiscount =
      Number(
        order?.discount || 0
      );

    const deliveryCharge =
      Number(
        order?.delivery ??
        order?.deliveryCharge ??
        order?.shippingCharge ??
        0
      );

    const finalTotal =
      Number(
        order?.totalAmount || 0
      );

    // =====================================================
    // GST RATE
    // =====================================================

    const gstRate =
      items.length > 0
        ? Number(
            items[0]?.gst || 0
          )
        : 0;

    // =====================================================
    // LOAD LOGO
    // =====================================================

    const logoImage =
      await loadLogoDataURL();

    const logoFormat =
      getImageFormat(
        logoImage
      );

    // =====================================================
    // LOAD SIGNATURE
    // =====================================================

    const signatureImage =
      await loadSignatureDataURL();

    // =====================================================
    // LOAD LEGACY CUSTOM IMAGE
    // =====================================================

    let legacyCustomImageData = null;

    if (
      isCustomizedOrder &&
      legacyCustomImageUrl
    ) {
      try {
        const finalCustomImageUrl =
          buildUploadUrl(
            legacyCustomImageUrl
          );

        if (
          finalCustomImageUrl?.startsWith(
            "data:image/"
          )
        ) {
          legacyCustomImageData =
            finalCustomImageUrl;
        } else {
          legacyCustomImageData =
            await downloadImageAsDataURL(
              finalCustomImageUrl
            );
        }

        console.log(
          "LEGACY CUSTOM IMAGE LOADED:",
          Boolean(
            legacyCustomImageData
          )
        );
      } catch (error) {
        console.error(
          "Custom image load failed:",
          error
        );

        legacyCustomImageData = null;
      }
    }

    // =====================================================
    // LOAD CUSTOM EXTRA IMAGES PER ITEM
    // =====================================================

    const customExtraImagesByItem = {};

    for (
      const item of customizedItems
    ) {
      const itemKey =
        item?._id ||
        item?.id ||
        item?.name ||
        `item-${items.indexOf(item)}`;

      customExtraImagesByItem[itemKey] = [];

      const extraImages =
        Array.isArray(
          item?.extraImages
        )
          ? item.extraImages
          : [];

      for (
        const extraImage of extraImages
      ) {
        try {
          const imageValue =
            getImageValue(
              extraImage
            );

          if (!imageValue) {
            continue;
          }

          const imageUrl =
            buildUploadUrl(
              imageValue
            );

          if (!imageUrl) {
            continue;
          }

          let imageData = null;

          if (
            imageUrl.startsWith(
              "data:image/"
            )
          ) {
            imageData = imageUrl;
          } else {
            imageData =
              await downloadImageAsDataURL(
                imageUrl
              );
          }

          if (imageData) {
            customExtraImagesByItem[
              itemKey
            ].push(imageData);
          }
        } catch (error) {
          console.error(
            "Extra custom image failed:",
            error
          );
        }
      }
    }

    console.log(
      "CUSTOM EXTRA IMAGE MAP:",
      customExtraImagesByItem
    );

    // =====================================================
    // LOAD PRODUCT IMAGES
    // =====================================================

    const productImages = {};

    for (
      const item of items
    ) {
      const imageName =
        item?.image ||
        item?.mainImage ||
        item?.productImage ||
        item?.imageUrl;

      if (!imageName) {
        continue;
      }

      const imageUrl =
        buildUploadUrl(
          imageName
        );

      try {
        productImages[
          item?._id ||
          item?.id ||
          item?.name
        ] =
          await downloadImageAsDataURL(
            imageUrl
          );

        console.log(
          "PDF PRODUCT IMAGE URL:",
          imageUrl
        );
      } catch (error) {
        console.error(
          "Product image load failed:",
          error
        );
      }
    }

    // =====================================================
    // BARCODE
    // =====================================================

    let barcodeImage = null;

    try {
      const barcodeCanvas =
        document.createElement(
          "canvas"
        );

      JsBarcode(
        barcodeCanvas,
        String(
          order?.orderNumber ||
          order?._id ||
          order?.id ||
          "ORDER"
        ),
        {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          height: 55,
          width: 2,
          margin: 5
        }
      );

      barcodeImage =
        barcodeCanvas.toDataURL(
          "image/png"
        );
    } catch (error) {
      console.error(
        "Barcode generation failed:",
        error
      );
    }

    // =====================================================
    // QR
    // =====================================================

    let qrImage = null;

    try {
      const qrCanvas =
        document.createElement(
          "canvas"
        );

      const qrValue =
        String(
          order?.orderNumber ||
          order?._id ||
          order?.id ||
          "ORDER"
        );

      await QRCode.toCanvas(
        qrCanvas,
        qrValue,
        {
          width: 120,
          margin: 2
        }
      );

      qrImage =
        qrCanvas.toDataURL(
          "image/png"
        );
    } catch (error) {
      console.error(
        "QR generation failed:",
        error
      );
    }

    // =====================================================
    // PDF SETUP
    // =====================================================

    const pdf =
      new jsPDF(
        "p",
        "mm",
        "a4"
      );

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;

    const contentWidth =
      pageWidth -
      margin * 2;

    // =====================================================
    // COLORS
    // =====================================================

    const navy = [
      15,
      39,
      71
    ];

    const lightNavy = [
      238,
      243,
      248
    ];

    const gray = [
      105,
      105,
      105
    ];

    const lightGray = [
      245,
      247,
      249
    ];

    const border = [
      215,
      220,
      226
    ];

    const black = [
      30,
      30,
      30
    ];

    const white = [
      255,
      255,
      255
    ];

    // =====================================================
    // HELPERS
    // =====================================================

    const money = (value) => {
      const amount =
        Number(
          value || 0
        );

      return `Rs. ${amount.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`;
    };

    const roundedBox = (
      x,
      y,
      width,
      height,
      fillColor = white,
      borderColor = border,
      radius = 3
    ) => {
      pdf.setFillColor(
        ...fillColor
      );

      pdf.setDrawColor(
        ...borderColor
      );

      pdf.setLineWidth(
        0.3
      );

      pdf.roundedRect(
        x,
        y,
        width,
        height,
        radius,
        radius,
        "FD"
      );
    };

    // =====================================================
    // ORDER DATA
    // =====================================================

    const orderId =
      order?.orderId ||
      order?._id ||
      order?.id ||
      "ORDER";

    const orderDate =
      order?.createdAt
        ? new Date(
            order.createdAt
          ).toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          )
        : "-";

    const paymentMethod =
      safeText(
        order?.paymentMethod,
        "COD"
      ).toUpperCase();

    const customerName =
      safeText(
        order?.name,
        "Customer"
      );

    const customerPhone =
      safeText(
        order?.phone
      );

    const customerEmail =
      safeText(
        order?.user?.email
      );

    const customerAddress =
      safeText(
        order?.address
      );

    const pincode =
      safeText(
        order?.deliveryPincode
      );

    const invoiceNumber =
      safeText(
        order?.invoiceNumber ||
        order?.invoiceNo ||
        `INV-${orderId}`
      );

    const invoiceDate =
      safeText(
        order?.invoiceDate ||
        orderDate
      );

    // =====================================================
    // PAGE 1 — SHIPPING LABEL
    // =====================================================

    let y = 15;

    // =====================================================
    // HEADER
    // =====================================================

    pdf.setFillColor(
      ...white
    );

    pdf.roundedRect(
      margin,
      y,
      17,
      17,
      3,
      3,
      "F"
    );

    pdf.setDrawColor(
      ...border
    );

    pdf.roundedRect(
      margin,
      y,
      17,
      17,
      3,
      3,
      "S"
    );

    if (logoImage) {
      try {
        pdf.addImage(
          logoImage,
          logoFormat,
          margin + 1.5,
          y + 1.5,
          14,
          14,
          undefined,
          "FAST"
        );
      } catch (error) {
        console.error(
          "Shipping logo failed:",
          error
        );
      }
    }

    pdf.setTextColor(
      ...navy
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      17
    );

    pdf.text(
      "Giftyfy",
      margin + 21,
      y + 7
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...gray
    );

    pdf.text(
      "+91 98765 43220",
      margin + 21,
      y + 12
    );

    pdf.text(
      "support@giftyfy.com",
      margin + 21,
      y + 16
    );

    // =====================================================
    // SHIPPING BADGE
    // =====================================================

    const badgeWidth = 48;
    const badgeHeight = 11;

    const badgeX =
      pageWidth -
      margin -
      badgeWidth;

    pdf.setFillColor(
      ...navy
    );

    pdf.roundedRect(
      badgeX,
      y,
      badgeWidth,
      badgeHeight,
      5,
      5,
      "F"
    );

    pdf.setTextColor(
      ...white
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.text(
      "SHIPPING LABEL",
      badgeX +
        badgeWidth / 2,
      y + 7,
      {
        align: "center"
      }
    );

    // =====================================================
    // ORDER INFO
    // =====================================================

    y = 39;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...gray
    );

    pdf.text(
      "ORDER ID",
      margin,
      y
    );

    pdf.text(
      "DATE",
      margin + 70,
      y
    );

    pdf.text(
      "PAYMENT",
      margin + 125,
      y
    );

    pdf.setFontSize(
      10
    );

    pdf.setTextColor(
      ...black
    );

    pdf.text(
      String(orderId),
      margin,
      y + 6
    );

    pdf.text(
      orderDate,
      margin + 70,
      y + 6
    );

    pdf.setFillColor(
      ...lightNavy
    );

    pdf.roundedRect(
      margin + 125,
      y - 5,
      28,
      10,
      4,
      4,
      "F"
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.setFontSize(
      8
    );

    pdf.text(
      paymentMethod,
      margin + 139,
      y + 1.5,
      {
        align: "center"
      }
    );

    // =====================================================
    // DIVIDER
    // =====================================================

    y = 53;

    pdf.setDrawColor(
      ...navy
    );

    pdf.setLineWidth(
      0.7
    );

    pdf.line(
      margin,
      y,
      pageWidth - margin,
      y
    );

    // =====================================================
    // FROM / SHIP TO
    // =====================================================

    y = 60;

    const boxGap = 5;

    const boxWidth =
      (contentWidth - boxGap) /
      2;

    const boxHeight = 57;

    roundedBox(
      margin,
      y,
      boxWidth,
      boxHeight
    );

    roundedBox(
      margin + boxWidth + boxGap,
      y,
      boxWidth,
      boxHeight
    );

    // =====================================================
    // FROM
    // =====================================================

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "FROM",
      margin + 7,
      y + 9
    );

    pdf.setDrawColor(
      ...border
    );

    pdf.line(
      margin + 7,
      y + 13,
      margin + boxWidth - 7,
      y + 13
    );

    let fromY =
      y + 21;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...black
    );

    pdf.text(
      "Giftyfy",
      margin + 7,
      fromY
    );

    fromY += 5;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...gray
    );

    [
      "Giftyfy Ecommerce Pvt Ltd",
      "KK Nagar",
      "Madurai",
      "Tamil Nadu - 625018",
      "India"
    ].forEach(
      (line) => {
        pdf.text(
          line,
          margin + 7,
          fromY
        );

        fromY += 4.5;
      }
    );

    pdf.text(
      "Phone : +91 98765 43220",
      margin + 7,
      fromY + 1
    );

    // =====================================================
    // SHIP TO
    // =====================================================

    const shipX =
      margin +
      boxWidth +
      boxGap;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "SHIP TO CUSTOMER",
      shipX + 7,
      y + 9
    );

    pdf.setDrawColor(
      ...border
    );

    pdf.line(
      shipX + 7,
      y + 13,
      shipX + boxWidth - 7,
      y + 13
    );

    let shipY =
      y + 21;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      10
    );

    pdf.setTextColor(
      ...black
    );

    pdf.text(
      customerName,
      shipX + 7,
      shipY
    );

    shipY += 6;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...gray
    );

    const addressLines =
      pdf.splitTextToSize(
        customerAddress,
        boxWidth - 14
      );

    addressLines
      .slice(0, 4)
      .forEach(
        (line) => {
          pdf.text(
            line,
            shipX + 7,
            shipY
          );

          shipY += 4.5;
        }
      );

    if (
      customerPhone !== "-"
    ) {
      pdf.text(
        `Phone : ${customerPhone}`,
        shipX + 7,
        shipY + 1
      );

      shipY += 5;
    }

    if (
      customerEmail !== "-"
    ) {
      pdf.text(
        customerEmail,
        shipX + 7,
        shipY
      );
    }

    if (
      pincode !== "-"
    ) {
      const pinWidth = 24;

      pdf.setFillColor(
        ...lightNavy
      );

      pdf.roundedRect(
        shipX +
          boxWidth -
          pinWidth -
          7,
        y + 7,
        pinWidth,
        9,
        3,
        3,
        "F"
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        7
      );

      pdf.setTextColor(
        ...navy
      );

      pdf.text(
        pincode,
        shipX +
          boxWidth -
          pinWidth / 2 -
          7,
        y + 13,
        {
          align: "center"
        }
      );
    }

   // =====================================================
// SHIPPING ORDER ITEMS
// =====================================================

y = 125;

const itemsBoxHeight = Math.max(
  60,
  40 + (items.length * 22)
);

roundedBox(
  margin,
  y,
  contentWidth,
  itemsBoxHeight,
  lightGray
);

pdf.setFont("helvetica", "bold");
pdf.setFontSize(9);
pdf.setTextColor(...navy);

pdf.text(
  "ORDER ITEMS",
  margin + 7,
  y + 9
);

pdf.setDrawColor(...border);

pdf.line(
  margin + 7,
  y + 13,
  pageWidth - margin - 7,
  y + 13
);

let itemY = y + 24;

items.forEach((item, index) => {

  const itemName = safeText(item?.name, "Product");
  const quantity = Number(item?.quantity || 1);

  const size = safeText(
    item?.size || item?.frameSize
  );

  const color = safeText(
    item?.color || item?.variant
  );

  const shippingProductImage =
    productImages[
      item?._id ||
      item?.id ||
      item?.name
    ];

  // IMAGE
  pdf.setFillColor(...white);

  pdf.roundedRect(
    margin + 7,
    itemY - 8,
    25,
    25,
    2,
    2,
    "F"
  );

  pdf.setDrawColor(...border);

  pdf.roundedRect(
    margin + 7,
    itemY - 8,
    25,
    25,
    2,
    2,
    "S"
  );

  if (shippingProductImage) {
    try {
      pdf.addImage(
        shippingProductImage,
        getImageFormat(shippingProductImage),
        margin + 8,
        itemY - 7,
        23,
        23,
        undefined,
        "FAST"
      );
    } catch (err) {}
  }

  // NAME
  const productX = margin + 39;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...black);

  const nameLines = pdf.splitTextToSize(
    itemName,
    75
  );

  pdf.text(
    nameLines.slice(0,2),
    productX,
    itemY
  );

  let detailY =
    itemY +
    (nameLines.slice(0,2).length * 4.5) +
    3;

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...gray);

  if(size !== "-"){
    pdf.text(
      `Size: ${size}`,
      productX,
      detailY
    );
    detailY += 4;
  }

  if(color !== "-"){
    pdf.text(
      `Color: ${color}`,
      productX,
      detailY
    );
    detailY += 4;
  }

  const shippingCustomized =
    isTrue(item?.isCustomized) ||
    Boolean(item?.customName) ||
    Boolean(item?.message) ||
    (
      Array.isArray(item?.extraImages) &&
      item.extraImages.length > 0
    );

  if(shippingCustomized){
    pdf.setFont("helvetica","bold");
    pdf.setTextColor(...navy);

    pdf.text(
      "Customized",
      productX,
      detailY
    );
  }

  // Qty
  const qtyX =
    pageWidth -
    margin -
    62;

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...gray);

  pdf.text(
    "Qty",
    qtyX,
    itemY - 2
  );

  pdf.setFontSize(10);
  pdf.setTextColor(...black);

  pdf.text(
    String(quantity),
    qtyX,
    itemY + 5
  );

  if(index < items.length - 1){

    pdf.setDrawColor(...border);

    pdf.line(
      margin + 7,
      itemY + 20,
      pageWidth - margin - 7,
      itemY + 20
    );

  }

  itemY += 22;

});

// ==============================
// TOTAL AMOUNT
// ==============================

pdf.setDrawColor(...border);

pdf.line(
  margin + 7,
  itemY,
  pageWidth - margin - 7,
  itemY
);

itemY += 8;

pdf.setFont("helvetica","bold");
pdf.setFontSize(10);
pdf.setTextColor(...navy);

pdf.text(
  "Total Amount",
  pageWidth - margin - 70,
  itemY
);

pdf.text(
  money(finalTotal),
  pageWidth - margin - 7,
  itemY,
  {
    align:"right"
  }
);
    // =====================================================
    // PACKAGE ID
    // =====================================================

    y = Math.min(
      y +
        itemsBoxHeight +
        9,
      238
    );

    const packageHeight = 34;

    pdf.setDrawColor(
      ...navy
    );

    pdf.setLineWidth(
      0.5
    );

    if (
      pdf.setLineDashPattern
    ) {
      pdf.setLineDashPattern(
        [2, 2],
        0
      );
    }

    pdf.roundedRect(
      margin,
      y,
      contentWidth,
      packageHeight,
      3,
      3,
      "S"
    );

    if (
      pdf.setLineDashPattern
    ) {
      pdf.setLineDashPattern(
        [],
        0
      );
    }

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "PACKAGE ID",
      margin + 8,
      y + 9
    );

    pdf.setFontSize(
      10
    );

    pdf.setTextColor(
      ...black
    );

    pdf.text(
      String(orderId),
      margin + 8,
      y + 16
    );

    // BARCODE
    if (barcodeImage) {
      pdf.addImage(
        barcodeImage,
        "PNG",
        margin + 69,
        y + 8,
        54,
        16,
        undefined,
        "FAST"
      );
    }

    // QR
    const qrSize = 21;

    const qrX =
      pageWidth -
      margin -
      qrSize -
      8;

    const qrY =
      y + 6;

    if (qrImage) {
      pdf.addImage(
        qrImage,
        "PNG",
        qrX + 1,
        qrY + 1,
        qrSize - 2,
        qrSize - 2,
        undefined,
        "FAST"
      );
    }

    // =====================================================
    // SHIPPING FOOTER
    // =====================================================

    const footerY = 282;

    pdf.setDrawColor(
      ...border
    );

    pdf.line(
      margin,
      footerY - 5,
      pageWidth - margin,
      footerY - 5
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "Handle With Care",
      margin,
      footerY
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setTextColor(
      ...gray
    );

    pdf.text(
      "Thank you for shopping with Giftyfy",
      pageWidth - margin,
      footerY,
      {
        align: "right"
      }
    );

    // =====================================================
    // PAGE 2 — INVOICE
    // =====================================================

    pdf.addPage();

    let invoiceY = 15;

    // =====================================================
    // INVOICE HEADER
    // =====================================================

    pdf.setFillColor(
      ...white
    );

    pdf.roundedRect(
      margin,
      invoiceY,
      14,
      14,
      3,
      3,
      "F"
    );

    pdf.setDrawColor(
      ...border
    );

    pdf.roundedRect(
      margin,
      invoiceY,
      14,
      14,
      3,
      3,
      "S"
    );

    if (logoImage) {
      try {
        pdf.addImage(
          logoImage,
          logoFormat,
          margin + 1.2,
          invoiceY + 1.2,
          11.6,
          11.6,
          undefined,
          "FAST"
        );
      } catch (error) {
        console.error(
          "Invoice logo failed:",
          error
        );
      }
    }

    pdf.setTextColor(
      ...navy
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      15
    );

    pdf.text(
      "Giftyfy",
      margin + 18,
      invoiceY + 6
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(
      7.5
    );

    pdf.setTextColor(
      ...gray
    );

    pdf.text(
      "+91 98765 43220",
      margin + 18,
      invoiceY + 10.5
    );

    pdf.text(
      "support@giftyfy.com",
      margin + 18,
      invoiceY + 14.5
    );

    // =====================================================
    // INVOICE BADGE
    // =====================================================

    const invoiceBadgeWidth = 34;
    const invoiceBadgeHeight = 11;

    const invoiceBadgeX =
      pageWidth -
      margin -
      invoiceBadgeWidth;

    pdf.setFillColor(
      ...navy
    );

    pdf.roundedRect(
      invoiceBadgeX,
      invoiceY,
      invoiceBadgeWidth,
      invoiceBadgeHeight,
      5,
      5,
      "F"
    );

    pdf.setTextColor(
      ...white
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.text(
      "INVOICE",
      invoiceBadgeX +
        invoiceBadgeWidth / 2,
      invoiceY + 7,
      {
        align: "center"
      }
    );

    // =====================================================
    // INVOICE INFORMATION
    // =====================================================

    invoiceY = 39;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      7.5
    );

    pdf.setTextColor(
      ...gray
    );

    pdf.text(
      "INVOICE NO",
      margin,
      invoiceY
    );

    pdf.text(
      "DATE",
      margin + 65,
      invoiceY
    );

    pdf.text(
      "ORDER ID",
      margin + 120,
      invoiceY
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...black
    );

    pdf.text(
      invoiceNumber,
      margin,
      invoiceY + 6
    );

    pdf.text(
      invoiceDate,
      margin + 65,
      invoiceY + 6
    );

    pdf.text(
      String(orderId),
      margin + 120,
      invoiceY + 6
    );

    // =====================================================
    // DIVIDER
    // =====================================================

    invoiceY = 52;

    pdf.setDrawColor(
      ...navy
    );

    pdf.setLineWidth(
      0.7
    );

    pdf.line(
      margin,
      invoiceY,
      pageWidth - margin,
      invoiceY
    );

    // =====================================================
    // BILL FROM / BILL TO
    // =====================================================

    invoiceY = 59;

    const invoiceBoxGap = 5;

    const invoiceBoxWidth =
      (contentWidth -
        invoiceBoxGap) /
      2;

    const invoiceBoxHeight = 53;

    roundedBox(
      margin,
      invoiceY,
      invoiceBoxWidth,
      invoiceBoxHeight
    );

    roundedBox(
      margin +
        invoiceBoxWidth +
        invoiceBoxGap,
      invoiceY,
      invoiceBoxWidth,
      invoiceBoxHeight
    );

    // BILL FROM
    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "BILL FROM",
      margin + 7,
      invoiceY + 9
    );

    pdf.setDrawColor(
      ...border
    );

    pdf.line(
      margin + 7,
      invoiceY + 13,
      margin +
        invoiceBoxWidth -
        7,
      invoiceY + 13
    );

    let billFromY =
      invoiceY + 21;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...black
    );

    pdf.text(
      "Giftyfy",
      margin + 7,
      billFromY
    );

    billFromY += 5;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...gray
    );

    [
      "Giftyfy Ecommerce Pvt Ltd",
      "KK Nagar",
      "Madurai",
      "Tamil Nadu - 625018",
      "India"
    ].forEach(
      (line) => {
        pdf.text(
          line,
          margin + 7,
          billFromY
        );

        billFromY += 4.2;
      }
    );

    pdf.text(
      "Phone : +91 98765 43220",
      margin + 7,
      billFromY
    );

    // BILL TO
    const billToX =
      margin +
      invoiceBoxWidth +
      invoiceBoxGap;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "BILL TO",
      billToX + 7,
      invoiceY + 9
    );

    pdf.setDrawColor(
      ...border
    );

    pdf.line(
      billToX + 7,
      invoiceY + 13,
      billToX +
        invoiceBoxWidth -
        7,
      invoiceY + 13
    );

    let billToY =
      invoiceY + 21;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...black
    );

    pdf.text(
      customerName,
      billToX + 7,
      billToY
    );

    billToY += 5;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...gray
    );

    const billAddressLines =
      pdf.splitTextToSize(
        customerAddress,
        invoiceBoxWidth - 14
      );

    billAddressLines
      .slice(0, 4)
      .forEach(
        (line) => {
          pdf.text(
            line,
            billToX + 7,
            billToY
          );

          billToY += 4.2;
        }
      );

    if (
      customerPhone !== "-"
    ) {
      pdf.text(
        `Phone : ${customerPhone}`,
        billToX + 7,
        billToY + 1
      );

      billToY += 5;
    }

    if (
      customerEmail !== "-"
    ) {
      pdf.text(
        customerEmail,
        billToX + 7,
        billToY
      );
    }

    // =====================================================
    // PRODUCT TABLE
    // =====================================================

    invoiceY = 123;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "ITEM DETAILS",
      margin,
      invoiceY
    );

    const tableY =
      invoiceY + 5;

    const tableHeaderHeight = 10;

    pdf.setFillColor(
      ...navy
    );

    pdf.roundedRect(
      margin,
      tableY,
      contentWidth,
      tableHeaderHeight,
      2,
      2,
      "F"
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      7.5
    );

    pdf.setTextColor(
      ...white
    );

    const colItem =
      margin + 5;

    const colQty =
      margin + 112;

    const colRate =
      margin + 132;

    const colTax =
      margin + 153;

    const colAmount =
      pageWidth -
      margin -
      5;

    pdf.text(
      "ITEM",
      colItem,
      tableY + 6.5
    );

    pdf.text(
      "QTY",
      colQty,
      tableY + 6.5
    );

    pdf.text(
      "RATE",
      colRate,
      tableY + 6.5
    );

    pdf.text(
      "TAX",
      colTax,
      tableY + 6.5
    );

    pdf.text(
      "AMOUNT",
      colAmount,
      tableY + 6.5,
      {
        align: "right"
      }
    );

    // =====================================================
    // PRODUCT ROWS
    // =====================================================

    let productY =
      tableY +
      tableHeaderHeight;

    /*
      Customized item gets more height so that:

      Name
      Message
      Extra images

      can be shown inside the same item section.
    */

    items.forEach(
      (item) => {
        const itemName =
          safeText(
            item?.name,
            "Product"
          );

        const quantity =
          Number(
            item?.quantity || 1
          );

        const itemPrice =
          Number(
            item?.price || 0
          );

        const itemAmount =
          itemPrice * quantity;

        const itemSize =
          safeText(
            item?.size ||
            item?.frameSize
          );

        const itemColor =
          safeText(
            item?.color ||
            item?.variant
          );

        const itemKey =
          item?._id ||
          item?.id ||
          item?.name ||
          `item-${items.indexOf(item)}`;

        const customName =
          safeText(
            item?.customName,
            ""
          );

        const customMessage =
          safeText(
            item?.message,
            ""
          );

        const itemExtraImages =
          customExtraImagesByItem[
            itemKey
          ] || [];

        const itemIsCustomized =
          isTrue(
            item?.isCustomized
          ) ||
          isTrue(
            item?.customized
          ) ||
          isTrue(
            item?.isCustom
          ) ||
          Boolean(
            customName
          ) ||
          Boolean(
            customMessage
          ) ||
          itemExtraImages.length > 0;

        // =================================================
        // CALCULATE CUSTOMIZATION HEIGHT
        // =================================================

        let extraRowHeight = 0;

        if (itemIsCustomized) {
          extraRowHeight += 7;

          if (customName) {
            extraRowHeight += 4;
          }

          if (customMessage) {
            const messageLines =
              pdf
                .splitTextToSize(
                  `Message: ${customMessage}`,
                  75
                )
                .slice(0, 3);

            extraRowHeight +=
              messageLines.length *
              3.5;
          }

          if (
            itemExtraImages.length > 0
          ) {
            extraRowHeight += 21;
          }
        }

        const invoiceRowHeight =
          30 +
          extraRowHeight;

        // =================================================
        // ROW BOX
        // =================================================

        roundedBox(
          margin,
          productY,
          contentWidth,
          invoiceRowHeight,
          white
        );

        // =================================================
        // PRODUCT IMAGE
        // =================================================

        const productImage =
          productImages[
            item?._id ||
            item?.id ||
            item?.name
          ];

        if (productImage) {
          try {
            pdf.addImage(
              productImage,
              getImageFormat(
                productImage
              ),
              margin + 5,
              productY + 4,
              21,
              21,
              undefined,
              "FAST"
            );
          } catch (error) {
            console.error(
              "PDF product image failed:",
              error
            );
          }
        }

        // =================================================
        // PRODUCT NAME
        // =================================================

        const productNameX =
          margin + 31;

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          7.5
        );

        pdf.setTextColor(
          ...black
        );

        const productNameLines =
          pdf.splitTextToSize(
            itemName,
            73
          );

        pdf.text(
          productNameLines.slice(0, 2),
          productNameX,
          productY + 9
        );

        // =================================================
        // SIZE / COLOR
        // =================================================

        let productDetailY =
          productY + 18;

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          6.5
        );

        pdf.setTextColor(
          ...gray
        );

        if (
          itemSize !== "-"
        ) {
          pdf.text(
            `Size: ${itemSize}`,
            productNameX,
            productDetailY
          );

          productDetailY += 3.5;
        }

        if (
          itemColor !== "-"
        ) {
          pdf.text(
            `Color: ${itemColor}`,
            productNameX,
            productDetailY
          );

          productDetailY += 3.5;
        }

        // =================================================
        // CUSTOMIZED BADGE
        // =================================================

        if (
          itemIsCustomized
        ) {
          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.setFontSize(
            6.5
          );

          pdf.setTextColor(
            ...navy
          );

          pdf.text(
            "Customized",
            productNameX + 42,
            productY + 20
          );
        }

        // =================================================
        // QTY
        // =================================================

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          8
        );

        pdf.setTextColor(
          ...black
        );

        pdf.text(
          String(quantity),
          colQty + 4,
          productY + 16,
          {
            align: "center"
          }
        );

        // =================================================
        // RATE
        // =================================================

        pdf.text(
          money(itemPrice),
          colRate,
          productY + 16
        );

        // =================================================
        // TAX
        // =================================================

        const itemGstPercent =
          Number(
            item?.gst || 0
          );

        pdf.setTextColor(
          ...gray
        );

        pdf.text(
          `${itemGstPercent}%`,
          colTax,
          productY + 16
        );

        // =================================================
        // AMOUNT
        // =================================================

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setTextColor(
          ...navy
        );

        pdf.text(
          money(itemAmount),
          colAmount,
          productY + 16,
          {
            align: "right"
          }
        );

        // =================================================
        // CUSTOMIZATION DATA
        // =================================================

        if (itemIsCustomized) {
          let customY =
            productY + 28;

          const customX =
            productNameX;

          // -------------------------------
          // NAME
          // -------------------------------

          if (customName) {
            pdf.setFont(
              "helvetica",
              "bold"
            );

            pdf.setFontSize(
              6.5
            );

            pdf.setTextColor(
              ...navy
            );

            pdf.text(
              `Name: ${customName}`,
              customX,
              customY
            );

            customY += 4;
          }

          // -------------------------------
          // MESSAGE
          // -------------------------------

          if (customMessage) {
            pdf.setFont(
              "helvetica",
              "bold"
            );

            pdf.setFontSize(
              6.5
            );

            pdf.setTextColor(
              ...navy
            );

            const messageLines =
              pdf
                .splitTextToSize(
                  `Message: ${customMessage}`,
                  75
                )
                .slice(0, 3);

            pdf.text(
              messageLines,
              customX,
              customY
            );

            customY +=
              messageLines.length *
              3.5;
          }

          // -------------------------------
          // EXTRA CUSTOM IMAGES
          // -------------------------------

          if (
            itemExtraImages.length > 0
          ) {
            let extraX =
              customX;

            const extraY =
              productY +
              invoiceRowHeight -
              22;

            itemExtraImages
              .slice(0, 3)
              .forEach(
                (imageData) => {
                  try {
                    pdf.setFillColor(
                      ...white
                    );

                    pdf.setDrawColor(
                      ...border
                    );

                    pdf.roundedRect(
                      extraX,
                      extraY,
                      20,
                      18,
                      1.5,
                      1.5,
                      "FD"
                    );

                    pdf.addImage(
                      imageData,
                      getImageFormat(
                        imageData
                      ),
                      extraX + 1,
                      extraY + 1,
                      18,
                      16,
                      undefined,
                      "FAST"
                    );

                    extraX += 23;
                  } catch (error) {
                    console.error(
                      "Custom extra image PDF error:",
                      error
                    );
                  }
                }
              );
          }
        }

        // =================================================
        // NEXT ROW
        // =================================================

        productY +=
          invoiceRowHeight;
      }
    );

    // =====================================================
    // LEGACY CUSTOMIZATION SECTION
    // =====================================================

    /*
      This section is only used if old orders have
      customizedImage/customImage fields but don't have
      item.extraImages/customName/message.
    */

    let customizationBottomY =
      productY + 8;

    const hasLegacyCustomization =
      Boolean(
        legacyCustomImageData
      ) ||
      Boolean(
        legacyCustomText
      );

    const hasModernCustomization =
      customizedItems.length > 0;

    if (
      hasLegacyCustomization &&
      !hasModernCustomization
    ) {
      const customizationX =
        margin;

      const customizationWidth =
        contentWidth;

      let customizationY =
        productY + 6;

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        9
      );

      pdf.setTextColor(
        ...navy
      );

      pdf.text(
        "CUSTOMIZATION",
        customizationX,
        customizationY
      );

      customizationY += 5;

      const sectionStartY =
        customizationY;

      let sectionHeight = 20;

      if (
        legacyCustomImageData
      ) {
        sectionHeight = 50;
      } else if (
        legacyCustomText
      ) {
        const lines =
          pdf
            .splitTextToSize(
              String(
                legacyCustomText
              ),
              customizationWidth - 10
            )
            .slice(0, 6);

        sectionHeight =
          12 +
          lines.length * 4;
      }

      pdf.setDrawColor(
        ...border
      );

      pdf.roundedRect(
        customizationX,
        sectionStartY,
        customizationWidth,
        sectionHeight,
        2,
        2,
        "S"
      );

      // Legacy main image
      if (
        legacyCustomImageData
      ) {
        try {
          pdf.addImage(
            legacyCustomImageData,
            getImageFormat(
              legacyCustomImageData
            ),
            customizationX + 5,
            sectionStartY + 5,
            45,
            38,
            undefined,
            "FAST"
          );
        } catch (error) {
          console.error(
            "Legacy custom image PDF error:",
            error
          );
        }
      }

      // Legacy text
      if (
        legacyCustomText
      ) {
        const textX =
          legacyCustomImageData
            ? customizationX + 60
            : customizationX + 5;

        const textWidth =
          legacyCustomImageData
            ? customizationWidth - 68
            : customizationWidth - 10;

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          7.5
        );

        pdf.setTextColor(
          ...navy
        );

        pdf.text(
          "Custom Message:",
          textX,
          sectionStartY + 10
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          8
        );

        pdf.setTextColor(
          ...black
        );

        const lines =
          pdf
            .splitTextToSize(
              String(
                legacyCustomText
              ),
              textWidth
            )
            .slice(0, 6);

        pdf.text(
          lines,
          textX,
          sectionStartY + 17
        );
      }

      customizationBottomY =
        sectionStartY +
        sectionHeight +
        7;
    }

    // =====================================================
    // TOTALS
    // =====================================================

    const totalsTop =
      Math.max(
        customizationBottomY,
        171
      );

    const termsWidth = 94;
    const totalsGap = 7;

    // =====================================================
    // TERMS
    // =====================================================

    roundedBox(
      margin,
      totalsTop,
      termsWidth,
      72,
      lightGray
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      8.5
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "TERMS & CONDITIONS",
      margin + 7,
      totalsTop + 10
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(
      7
    );

    pdf.setTextColor(
      ...gray
    );

    const terms = [
      "1. Goods once sold cannot be returned",
      "   except as per the applicable return policy.",
      "2. Please retain this invoice for future",
      "   reference and support requests.",
      "3. Product availability and delivery are",
      "   subject to the applicable order terms."
    ];

    let termsY =
      totalsTop + 18;

    terms.forEach(
      (line) => {
        pdf.text(
          line,
          margin + 7,
          termsY
        );

        termsY += 5;
      }
    );

    // =====================================================
    // TOTALS BOX
    // =====================================================

    const totalsX =
      margin +
      termsWidth +
      totalsGap;

    const totalsWidth =
      contentWidth -
      termsWidth -
      totalsGap;

    roundedBox(
      totalsX,
      totalsTop,
      totalsWidth,
      72,
      white
    );

    const totalLabelX =
      totalsX + 7;

    const totalValueX =
      totalsX +
      totalsWidth -
      7;

    let totalsY =
      totalsTop + 8;

    const drawTotalRow = (
      label,
      value,
      options = {}
    ) => {
      const {
        bold = false,
        size = 7.2,
        color = black
      } = options;

      pdf.setFont(
        "helvetica",
        bold
          ? "bold"
          : "normal"
      );

      pdf.setFontSize(
        size
      );

      pdf.setTextColor(
        ...color
      );

      pdf.text(
        label,
        totalLabelX,
        totalsY
      );

      pdf.text(
        value,
        totalValueX,
        totalsY,
        {
          align: "right"
        }
      );

      totalsY += 6.2;
    };

    drawTotalRow(
      "Product Price",
      money(
        productPriceTotal
      )
    );

    drawTotalRow(
      "Product Discount",
      `- ${money(
        productDiscountTotal
      )}`,
      {
        color: [
          190,
          55,
          55
        ]
      }
    );

    drawTotalRow(
      "Taxable Value",
      money(
        taxableValueTotal
      )
    );

    drawTotalRow(
      `GST (${gstRate}%)`,
      money(
        gstAmountTotal
      )
    );

    drawTotalRow(
      "Gross Amount",
      money(
        grossAmountTotal
      ),
      {
        bold: true
      }
    );

    drawTotalRow(
      "Additional Discount",
      `- ${money(
        additionalDiscount
      )}`,
      {
        color: [
          190,
          55,
          55
        ]
      }
    );

    drawTotalRow(
      "Delivery",
      deliveryCharge === 0
        ? "FREE"
        : money(
            deliveryCharge
          )
    );

    // =====================================================
    // GRAND TOTAL
    // =====================================================

    const grandTotalY =
      totalsTop + 56;

    pdf.setFillColor(
      ...navy
    );

    pdf.roundedRect(
      totalsX + 5,
      grandTotalY,
      totalsWidth - 10,
      13,
      3,
      3,
      "F"
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      9
    );

    pdf.setTextColor(
      ...white
    );

    pdf.text(
      "TOTAL",
      totalsX + 11,
      grandTotalY + 8.5
    );

    pdf.text(
      money(finalTotal),
      totalsX +
        totalsWidth -
        11,
      grandTotalY + 8.5,
      {
        align: "right"
      }
    );

    // =====================================================
    // PAYMENT
    // =====================================================

    const paymentY =
      totalsTop + 82;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "PAYMENT",
      margin,
      paymentY
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(
      8
    );

    pdf.setTextColor(
      ...black
    );

    pdf.text(
      paymentMethod,
      margin,
      paymentY + 6
    );

    // =====================================================
    // SIGNATURE
    // =====================================================

    const signatureX =
      pageWidth -
      margin -
      55;

    pdf.setDrawColor(
      ...border
    );

    pdf.setLineWidth(
      0.3
    );

    pdf.line(
      signatureX,
      paymentY + 3,
      pageWidth - margin,
      paymentY + 3
    );

    if (signatureImage) {
      try {
        pdf.addImage(
          signatureImage,
          getImageFormat(
            signatureImage
          ),
          signatureX + 10,
          paymentY - 5,
          30,
          10,
          undefined,
          "FAST"
        );
      } catch (error) {
        console.error(
          "Signature rendering failed:",
          error
        );
      }
    }

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(
      7.5
    );

    pdf.setTextColor(
      ...navy
    );

    pdf.text(
      "Authorized Signatory",
      pageWidth - margin,
      paymentY + 10,
      {
        align: "right"
      }
    );

    // =====================================================
    // FOOTER
    // =====================================================

    const invoiceFooterY =
      pageHeight - 14;

    pdf.setDrawColor(
      ...border
    );

    pdf.line(
      margin,
      invoiceFooterY - 7,
      pageWidth - margin,
      invoiceFooterY - 7
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(
      7
    );

    pdf.setTextColor(
      ...gray
    );

    pdf.text(
      "Thank you for shopping with Giftyfy.",
      margin,
      invoiceFooterY
    );

    pdf.text(
      "This is a computer generated invoice.",
      pageWidth - margin,
      invoiceFooterY,
      {
        align: "right"
      }
    );

    // =====================================================
    // SAVE PDF
    // =====================================================

    pdf.save(
      `GIFTYFY_Order_${orderId}.pdf`
    );

    toast.success(
      "Shipping label & invoice PDF downloaded successfully!"
    );

  } catch (error) {
    console.error(
      "Shipping Label PDF Error:",
      error
    );

    toast.error(
      "Failed to generate PDF"
    );
  }
};


  // =========================
  // RESET FILTERS (UI convenience only — does not alter fetch/filter/pagination logic)
  // =========================
  const resetFilters = () => {
    setFilter({
      location: "",
      from: "",
      to: "",
      status: ""
    });
  };

  // =========================
  // STATUS DISPLAY HELPERS (presentation only)
  // =========================
  const statusMeta = {
    "Pending": { icon: <FaHourglassHalf />, className: "pending", label: "Pending" },
    "Confirmed": { icon: <FaCheckCircle />, className: "confirmed", label: "Confirmed" },
    "Customization In Progress": { icon: <FaPaintBrush />, className: "customization-in-progress", label: "Customizing" },
    "Shipped": { icon: <FaTruck />, className: "shipped", label: "Shipped" },
    "Assigned": { icon: <FaUserCheck />, className: "assigned", label: "Assigned" },
    "Out for Delivery": { icon: <FaShippingFast />, className: "out-for-delivery", label: "Out for Delivery" },
    "Delivered": { icon: <FaBoxOpen />, className: "delivered", label: "Delivered" },
    "Cancelled": { icon: <FaTimesCircle />, className: "cancelled", label: "Cancelled" },
  };

  const getStatusMeta = (status) =>
    statusMeta[status] || { icon: <FaHourglassHalf />, className: "pending", label: status };
const cancelOrder = async () => {
  if (!cancelReason.trim()) {
    toast.error("Please enter cancel reason");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:4000/api/orders/${selectedOrderId}/status`,
      {
        status: "Cancelled",
        reason: cancelReason,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    toast.success("Order cancelled successfully");

    setShowCancelModal(false);
    setSelectedOrderId("");
    setCancelReason("");

    fetchOrders(); // Refresh orders
  } catch (err) {
    console.log("Cancel Error:", err.response?.data || err.message);

    toast.error(
      err.response?.data?.message || "Cancel failed"
    );
  }
};
  return (

  <AdminLayout>


    {/* ========================= */
/* ORDER MODAL */
/* ========================= */}

{selectedOrder && (

  <div className="admin-order-modal" onClick={() => setSelectedOrder(null)}>

    <div className="admin-order-modal-content" onClick={(e) => e.stopPropagation()}>

      {/* HEADER */}
      <div className="admin-order-modal-header">

        <h2>Order Details</h2>

        <button
          className="admin-order-close"
          onClick={() =>
            setSelectedOrder(null)
          }
          title="Close"
        >
          <FaTimes />
        </button>

      </div>

      <div className="admin-order-modal-body">

      {/* CUSTOMER */}
      <div className="admin-order-section admin-info-card">

        <h3 className="admin-info-card-title">Customer Information</h3>

        <div className="admin-info-grid">

          <p>
            <span className="admin-info-label">Date</span>
            <span className="admin-info-value">
              {new Date(selectedOrder.createdAt).toDateString()}
            </span>
          </p>

          <p>
            <span className="admin-info-label">Customer</span>
            <span className="admin-info-value">{selectedOrder.name}</span>
          </p>

          <p>
            <span className="admin-info-label">Email</span>
            <span className="admin-info-value">{selectedOrder.user?.email}</span>
          </p>

          <p>
            <span className="admin-info-label">Phone</span>
            <span className="admin-info-value">{selectedOrder.phone}</span>
          </p>

          <p className="admin-info-full">
            <span className="admin-info-label">Address</span>
            <span className="admin-info-value">{selectedOrder.address}</span>
          </p>

          <p>
            <span className="admin-info-label">Payment</span>
            <span className="admin-info-value">{selectedOrder.paymentMethod}</span>
          </p>

        </div>

      </div>

      {/* DELIVERY PARTNER */}
      {selectedOrder.deliveryPartner && (

        <div className="admin-delivery-box admin-info-card">

          <h3 className="admin-info-card-title">Delivery Partner</h3>

          <div className="admin-info-grid">

            <p>
              <span className="admin-info-label">Name</span>
              <span className="admin-info-value">{selectedOrder.deliveryPartner.name}</span>
            </p>

            <p>
              <span className="admin-info-label">Phone</span>
              <span className="admin-info-value">{selectedOrder.deliveryPartner.phone}</span>
            </p>

            <p>
              <span className="admin-info-label">Email</span>
              <span className="admin-info-value">{selectedOrder.deliveryPartner.email}</span>
            </p>

          </div>

        </div>

      )}

      {/* ITEMS */}
      <div className="admin-order-items admin-info-card">

        <h3 className="admin-info-card-title">Ordered Items</h3>

        {selectedOrder.items.map(
          (item, i) => (

            <div
              key={i}
              className="admin-modal-item"
            >

              <img
                src={`http://localhost:4000/uploads/${item.image}`}
                alt=""
                className="admin-modal-img"
              />

              <div className="admin-modal-item-info">

                <h4>{item.name}</h4>

                <div className="admin-modal-item-meta">

                  <span className="admin-qty-pill">Qty: {item.quantity}</span>

                  {item.size && (
                    <span className="admin-meta-pill">Size: {item.size}</span>
                  )}

                  {item.variant && (
                    <span className="admin-meta-pill">Variant: {item.variant}</span>
                  )}

                </div>

                {item.isCustomized && (

                  <div className="admin-custom-order-box">

                    <span className="admin-custom-badge">
                      🎨 Customized
                    </span>
                      {item.customName && (
      <p>
        <b>Custom Name:</b> {item.customName}
      </p>
    )}

                    {item.message && (
                      <p>
                        <b>Message:</b>{" "}
                        {item.message}
                      </p>
                    )}

               {item.extraImages?.length > 0 && (

  <div className="admin-custom-images">

 {item.extraImages?.map((img, index) => {

  console.log("Custom Image:", img);

  return (
    <div
  key={index}
  className="admin-custom-image-box"
>
  <img
    src={`http://localhost:4000/uploads/${img}`}
    alt="Customized"
    className="admin-custom-preview"
  />

  <button
  className="admin-download-btn"
  onClick={() => downloadImage(img)}
>
  <FaDownload /> Download
</button>
</div>
  );

})}

  </div>

)}

                  </div>

                )}

              </div>

            </div>

          )
        )}

      </div>

      {/* TOTAL */}
      <div className="admin-order-total admin-info-card">

        <h3 className="admin-info-card-title">Order Summary</h3>

        <div className="admin-summary-row">
          <span>Subtotal</span>
          <span>₹{Math.round(selectedOrder.subtotal)}</span>
        </div>
        <div className="admin-summary-row">
          <span>Delivery</span>
          <span>
            {Number(selectedOrder.delivery || 0) === 0
              ? "FREE"
              : `₹${selectedOrder.delivery}`}
          </span>
        </div>

        <div className="admin-summary-row">
          <span>Discount</span>
          <span>₹{Math.round(selectedOrder.discount || 0)}</span>
        </div>

        <div className="admin-summary-row admin-summary-total">
          <span>Total</span>
          <span>₹{Math.round(selectedOrder.totalAmount)}</span>
        </div>

      </div>

      </div>

    </div>

  </div>

)}
{showCancelModal && (
  <div
    className="admin-order-modal"
    onClick={() => setShowCancelModal(false)}
  >
    <div
      className="admin-order-modal-content"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: "500px" }}
    >
      <div className="admin-order-modal-header">
        <h2>Cancel Order</h2>

        <button
          className="admin-order-close"
          onClick={() => setShowCancelModal(false)}
        >
          <FaTimes />
        </button>
      </div>

      <div className="admin-order-modal-body">
        <label>Reason for Cancellation</label>

        <textarea
          rows="5"
          className="form-control"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Enter cancellation reason..."
        />

        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => setShowCancelModal(false)}
          >
            Close
          </button>

          <button
            className="btn btn-danger"
            onClick={cancelOrder}
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  </div>
)}

  <div className="admin-orders-page">

      {/* ========================= */}
      {/* LEFT */}
      {/* ========================= */}

      <div className="admin-orders-left">

       <div className="admin-orders-header">

  <div className="admin-orders-header-left">

    <h2 className="admin-orders-title">
      Order Management
    </h2>

    <span className="admin-orders-count-badge">
      <FaBoxes /> {filteredOrders.length} Orders
    </span>

  </div>

  <div className="admin-export-section">

    <button
      className="admin-export-btn"
      onClick={exportToExcel}
    >
      <FaFileExcel /> Export Excel
    </button>

  </div>

</div>


        {/* ========================= */}
        {/* FILTERS */}
        {/* ========================= */}

        <div className="admin-filters-card">

        <div className="admin-orders-filters">

          <div className="admin-filter-field">

            <label className="admin-filter-label">Location</label>

            <select
              className="admin-orders-select"
              value={filter.location}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  location: e.target.value
                })
              }
            >

              <option value="">
                All Locations
              </option>

              {[
                ...new Set(
                  orders.map(
                    (o) => o.deliveryPincode
                  )
                )
              ]

                .filter(Boolean)

                .map((pin, index) => (

                  <option
                    key={index}
                    value={pin}
                  >
                    {pin}
                  </option>

                ))}

            </select>

          </div>

          <div className="admin-filter-field">

            <label className="admin-filter-label">From Date</label>

            <input
              type="date"
              value={filter.from}
              className="admin-orders-date"
              onChange={(e) =>
                setFilter({
                  ...filter,
                  from: e.target.value
                })
              }
            />

          </div>

          <div className="admin-filter-field">

            <label className="admin-filter-label">To Date</label>

            <input
              type="date"
              value={filter.to}
              className="admin-orders-date"
              onChange={(e) =>
                setFilter({
                  ...filter,
                  to: e.target.value
                })
              }
            />

          </div>

          <div className="admin-filter-field">

            <label className="admin-filter-label">Status</label>

            <select
              className="admin-orders-select"
              value={filter.status}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  status: e.target.value
                })
              }
            >

              <option value="">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>
              <option value="Customized">
                Customized Orders
              </option>

              <option value="Customization In Progress">
                Customization In Progress
              </option>

              <option value="Confirmed">
                Confirmed
              </option>

              <option value="Shipped">
                Shipped
              </option>

              <option value="Delivered">
                Delivered
              </option>

              <option value="Cancelled">
                Cancelled
              </option>

            </select>

          </div>

          <div className="admin-filter-field admin-filter-reset">

            <label className="admin-filter-label admin-filter-label-hidden">Reset</label>

            <button
              className="admin-reset-btn"
              onClick={resetFilters}
              title="Reset Filters"
            >
              <FaRedoAlt /> Reset
            </button>

          </div>

        </div>

        </div>

        {/* ========================= */}
        {/* TABLE */}
        {/* ========================= */}

        <div className="admin-orders-table-wrapper">

          <div className="admin-orders-table-scroll">

          <table className="admin-orders-table">

            <thead>

              <tr>

                <th>Order</th>
                <th>Items</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Location</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody>
            {currentOrders.map((order) => (


                  <tr key={order._id}>

                    {/* ORDER */}
                    <td>
                      <span className="admin-order-id-badge">
                        {order.orderId}
                      </span>
                    </td>

                    {/* PRODUCTS */}
                    <td className="admin-orders-product-cell">

                      {order.items.map(
                        (item, i) => (

                          <div
                            key={i}
                            className="admin-orders-product-row"
                          >

                            <img
                              src={`http://localhost:4000/uploads/${item.image}`}
                              alt=""
                              className="admin-orders-product-img"
                            />

                            <div className="admin-orders-product-info">

                              <p className="admin-orders-product-name">
                                {item.name}
                              </p>

                              <div className="admin-orders-product-tags">

                                <span className="admin-orders-product-qty">
                                  Qty {item.quantity}
                                </span>

                                {item.size && (
                                  <span className="admin-orders-product-qty">
                                    Size {item.size}
                                  </span>
                                )}

                                {item.variant && (
                                  <span className="admin-orders-product-qty">
                                    {item.variant}
                                  </span>
                                )}

                              </div>

                              {/* CUSTOMIZED */}
                              {item.isCustomized && (
                                <div className="admin-customized-tag">
                                  🎁 Customized
                                </div>
                              )}

                            </div>

                          </div>

                        )
                      )}

                    </td>

                    {/* CUSTOMER */}
                    <td className="admin-orders-user-cell">

                      <p className="admin-user-name">
                        {order.name || "-"}
                      </p>

                      <p className="admin-user-sub">
                        {order.user?.email || "-"}
                      </p>

                      <p className="admin-user-sub">
                        {order.phone || "-"}
                      </p>

                    </td>

                    {/* DATE */}
                    <td>

                      {
                        new Date(
                          order.createdAt
                        ).toLocaleDateString()
                      }

                    </td>

                    {/* LOCATION */}
                    <td>

                      {
                        order.deliveryPincode
                      }

                    </td>

                    {/* PAYMENT */}
                    <td>

                      <span className="admin-orders-payment-badge">

                        {
                          order.paymentMethod ||
                          "COD"
                        }

                      </span>

                    </td>

                    {/* STATUS */}
<td>

  <div className="admin-status-wrapper">

    {/* CUSTOMIZED TAG */}
    {order.items.some(
      (item) => item.isCustomized
    ) && (
      <span className="admin-custom-pill">
        🎁 Customized
      </span>
    )}

    {/* STATUS BADGE */}
    <span
      className={`admin-orders-status ${getStatusMeta(order.status).className}`}
    >

      {getStatusMeta(order.status).icon}

      {order.status ===
      "Customization In Progress"
        ? "Customizing"
        : order.status}

    </span>

  </div>

</td>

                    {/* ACTION */}
<td>

<div className="admin-action-buttons">

  {/* STATUS UPDATE */}
  <button
    className={`action-icon-btn status-btn ${order.status
      ?.toLowerCase()
      .replace(/\s/g, "-")}`}
    disabled={
      order.status === "Delivered" ||
      order.status === "Cancelled"
    }
    onClick={() => updateOrderStatus(order)}
    title={
      order.status === "Pending"
        ? "Confirm Order"
        : order.status === "Confirmed"
        ? order.items.some((item) => item.isCustomized)
          ? "Start Customization"
          : "Ship Order"
        : order.status === "Customization In Progress"
        ? "Customization Completed"
        : order.status === "Shipped"
        ? "Waiting Delivery Partner"
        : order.status === "Assigned"
        ? "Assigned"
        : order.status === "Out for Delivery"
        ? "Out For Delivery"
        : "Delivered"
    }
  >
    {order.status === "Pending" && <FaCheckCircle />}

    {order.status === "Confirmed" &&
      (order.items.some((item) => item.isCustomized) ? (
        <FaPaintBrush />
      ) : (
        <FaTruck />
      ))}

    {order.status === "Customization In Progress" && (
      <FaPaintBrush />
    )}

    {order.status === "Shipped" && <FaUserCheck />}

    {order.status === "Assigned" && <FaUserCheck />}

    {order.status === "Out for Delivery" && (
      <FaShippingFast />
    )}

    {order.status === "Delivered" && <FaBoxOpen />}
  </button>

    

  {/* VIEW DETAILS */}
  <button
    className="action-icon-btn view-btn"
    onClick={() => setSelectedOrder(order)}
    title="View Details"
  >
    <FaEye />
  </button>

  {/* PDF DOWNLOAD */}
<button
  className="action-icon-btn pdf-btn"
  onClick={() => downloadOrderPDF(order)}
  title="Download Shipping Label & Invoice"
>
  <FaFilePdf />
</button>
  {["Pending", "Confirmed"].includes(order.status) && (
  <button
    className="action-icon-btn reject-btn"
    onClick={() => {
      setSelectedOrderId(order._id);
      setCancelReason("");
      setShowCancelModal(true);
    }}
    title="Cancel Order"
  >
    <FaTimesCircle />
  </button>
)}

</div>
</td>

                  </tr>

                ))}

            </tbody>

          </table>

          </div>

           <div className="pagination">

          <button
            onClick={() =>
              setCurrentPage((p) => (p > 1 ? p - 1 : 1))
            }
            disabled={currentPage === 1}
          >
            <FaChevronLeft /> Prev
          </button>

          <span>
            Page {currentPage}
          </span>

          <button
            onClick={() =>
              setCurrentPage((p) =>
                indexOfLastOrder < filteredOrders.length ? p + 1 : p
              )
            }
            disabled={indexOfLastOrder >= filteredOrders.length}
          >
            Next <FaChevronRight />
          </button>

        </div>


        </div>

      </div>
      

  </div>
  

    </AdminLayout>

  );

}