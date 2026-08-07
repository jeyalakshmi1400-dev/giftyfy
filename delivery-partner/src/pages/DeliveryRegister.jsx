import React, { useState } from "react";
import axios from "axios";
import "../styles/deliveryRegister.css";

export default function DeliveryRegister() {

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    pincode: "",
    aadharNumber: "",
    panNumber: "",
    vehicleType: "",
    vehicleNumber: "",
    drivingLicenseNo: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: ""
  });

  // 📸 FILE STATES
  const [photoFile, setPhotoFile] = useState(null);
  const [aadharFile, setAadharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);

  const [preview, setPreview] = useState(null);

  const changeHandler = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // PROFILE IMAGE
  const handleProfile = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      Object.keys(form).forEach((key) => {
        data.append(key, form[key]);
      });

      data.append("photo", photoFile);
      data.append("aadharImage", aadharFile);
      data.append("panImage", panFile);
      data.append("drivingLicenseImage", licenseFile);

      await axios.post(
        "http://localhost:4000/api/delivery/register",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("Registered Successfully ✅");

      setForm({
        name: "",
        phone: "",
        email: "",
        password: "",
        address: "",
        pincode: "",
        aadharNumber: "",
        panNumber: "",
        vehicleType: "",
        vehicleNumber: "",
        drivingLicenseNo: "",
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        ifscCode: ""
      });

      setPhotoFile(null);
      setAadharFile(null);
      setPanFile(null);
      setLicenseFile(null);
      setPreview(null);

    } catch (err) {
      console.log(err);
      alert("Error ❌");
    }
  };

  return (
    <div className="register-page">

      <div className="register-container">

        <h2>Delivery Partner Register</h2>

        {/* PROFILE */}
        <div className="profile-section">

          <img
            src={
              preview ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            }
            className="profile-img"
            alt="profile"
          />

          <input type="file" accept="image/*" onChange={handleProfile} />

        </div>

        <form onSubmit={submitHandler}>

          {/* BASIC INFO */}
          <div className="form-grid">
            <input name="name" placeholder="Name" onChange={changeHandler} value={form.name} />
            <input name="phone" placeholder="Phone" onChange={changeHandler} value={form.phone} />
            <input name="email" placeholder="Email" onChange={changeHandler} value={form.email} />
            <input type="password" name="password" placeholder="Password" onChange={changeHandler} value={form.password} />
          </div>

          {/* ADDRESS */}
          <textarea name="address" placeholder="Address" onChange={changeHandler} value={form.address} />

          <div className="form-grid">
            <input name="pincode" placeholder="Pincode" onChange={changeHandler} value={form.pincode} />
          </div>

          {/* AADHAR */}
          <div className="form-grid">
            <input name="aadharNumber" placeholder="Aadhar Number" onChange={changeHandler} value={form.aadharNumber} />
            <input type="file" onChange={(e) => setAadharFile(e.target.files[0])} />
          </div>

          {/* PAN */}
          <div className="form-grid">
            <input name="panNumber" placeholder="PAN Number" onChange={changeHandler} value={form.panNumber} />
            <input type="file" onChange={(e) => setPanFile(e.target.files[0])} />
          </div>

          {/* LICENSE */}
          <div className="form-grid">
            <input name="drivingLicenseNo" placeholder="Driving License No" onChange={changeHandler} value={form.drivingLicenseNo} />
            <input type="file" onChange={(e) => setLicenseFile(e.target.files[0])} />
          </div>

          {/* VEHICLE */}
          <div className="form-grid">
            <select name="vehicleType" onChange={changeHandler} value={form.vehicleType}>
              <option value="">Vehicle Type</option>
              <option>Bike</option>
              <option>Scooter</option>
              <option>Cycle</option>
            </select>

            <input name="vehicleNumber" placeholder="Vehicle Number" onChange={changeHandler} value={form.vehicleNumber} />
          </div>

          {/* BANK */}
          <div className="form-grid">
            <input name="accountHolderName" placeholder="Account Holder Name" onChange={changeHandler} value={form.accountHolderName} />
            <input name="bankName" placeholder="Bank Name" onChange={changeHandler} value={form.bankName} />
            <input name="accountNumber" placeholder="Account Number" onChange={changeHandler} value={form.accountNumber} />
            <input name="ifscCode" placeholder="IFSC Code" onChange={changeHandler} value={form.ifscCode} />
          </div>

          <button type="submit" className="register-btn">
            Register
          </button>

        </form>

      </div>

    </div>
  );
}