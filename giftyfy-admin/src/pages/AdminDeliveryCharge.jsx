import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/DeliveryCharge.css";
import AdminLayout from "../layout/AdminLayout";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
  "Andaman & Nicobar Islands",
  "Lakshadweep",
  "Dadra & Nagar Haveli and Daman & Diu",
];

/* ---------- small inline icon set (no extra dependency) ---------- */
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconZone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconTag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.82 0l4.36-4.36a2 2 0 0 0 0-2.82Z" />
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconMap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4m0 3-6-3" />
  </svg>
);

const AdminDeliveryCharge = () => {
  const [settings, setSettings] = useState({
    zones: [],
    freeDeliveryAmount: 999,
  });

  const [showForm, setShowForm] = useState(false);

  const [editingIndex, setEditingIndex] = useState(null);

  const [zone, setZone] = useState({
    zoneName: "",
    states: [],
    onlineCharge: "",
    codCharge: "",
  });

  // UI-only state: which rows have their state-chip list expanded
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/delivery-setting"
      );

      setSettings({
        zones: res.data.zones || [],
        freeDeliveryAmount: res.data.freeDeliveryAmount || 999,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleInput = (e) => {
    setZone({
      ...zone,
      [e.target.name]: e.target.value,
    });
  };

  const toggleState = (state) => {
    if (zone.states.includes(state)) {
      setZone({
        ...zone,
        states: zone.states.filter((s) => s !== state),
      });
    } else {
      setZone({
        ...zone,
        states: [...zone.states, state],
      });
    }
  };
  const selectAllStates = () => {
    if (zone.states.length === indianStates.length) {
      setZone({
        ...zone,
        states: [],
      });
    } else {
      setZone({
        ...zone,
        states: indianStates,
      });
    }
  };
  const saveZone = async () => {
  if (
    !zone.zoneName ||
    zone.states.length === 0 ||
    !zone.onlineCharge ||
    !zone.codCharge
  ) {
    alert("Please fill all fields");
    return;
  }

  let updatedZones = [...settings.zones];

  if (editingIndex !== null) {
    updatedZones[editingIndex] = zone;
  } else {
    updatedZones.push(zone);
  }

  const updatedSettings = {
    ...settings,
    zones: updatedZones,
  };

  try {
    await axios.put(
      "http://localhost:4000/api/delivery-setting",
      updatedSettings
    );

    alert(
      editingIndex !== null
        ? "Zone Updated Successfully ✅"
        : "Zone Added Successfully ✅"
    );

    setSettings(updatedSettings);

    setZone({
      zoneName: "",
      states: [],
      onlineCharge: "",
      codCharge: "",
    });

    setEditingIndex(null);
    setShowForm(false);

    fetchSettings();
  } catch (err) {
    console.log(err);
    alert("Failed to save zone");
  }
};
  const deleteZone = (index) => {
    const updated = settings.zones.filter((_, i) => i !== index);

    setSettings({
      ...settings,
      zones: updated,
    });
  };

  const editZone = (index) => {
    setZone({
      ...settings.zones[index],
    });

    setEditingIndex(index);

    setShowForm(true);
  };
  const saveSettings = async () => {
    try {
      await axios.put(
        "http://localhost:4000/api/delivery-setting",
        settings
      );

      alert("Delivery Settings Updated Successfully ✅");

      fetchSettings();
    } catch (err) {
      console.log(err);
    }
  };

  const toggleRowExpanded = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // ---- derived summary numbers (display only, no logic change) ----
  const totalZones = settings.zones.length;
  const totalStatesCovered = new Set(
    settings.zones.flatMap((z) => z.states || [])
  ).size;

  const selectedStates = settings.zones
  .filter((_, index) => index !== editingIndex)
  .flatMap((zone) => zone.states);

  const CHIP_LIMIT = 4;

  return (
    <AdminLayout>
      <div className="delivery-settings-page">
        {/* Page header */}
        <div className="delivery-header">
          <div className="delivery-header-text">
            <h1>Delivery Settings</h1>
            <p>Configure state-wise delivery zones and shipping charges</p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingIndex(null);

              setZone({
                zoneName: "",
                states: [],
                onlineCharge: "",
                codCharge: "",
              });

              setShowForm(true);
            }}
          >
            <IconPlus />
            Add Delivery Zone
          </button>
        </div>

        {/* Summary cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon summary-icon-blue">
              <IconZone />
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Delivery Zones</span>
              <span className="summary-value">{totalZones}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon summary-icon-green">
              <IconTag />
            </div>
            <div className="summary-content">
              <span className="summary-label">Free Delivery Threshold</span>
              <span className="summary-value">
                ₹{settings.freeDeliveryAmount}
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon summary-icon-purple">
              <IconMap />
            </div>
            <div className="summary-content">
              <span className="summary-label">Total States Covered</span>
              <span className="summary-value">{totalStatesCovered}</span>
            </div>
          </div>
        </div>

        {/* Delivery Zones */}
        <div className="delivery-table-card">
          <div className="delivery-top">
            <div>
              <h3>Delivery Zones</h3>
              <p className="card-subtext">
                Set shipping charges for groups of states
              </p>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingIndex(null);

                setZone({
                  zoneName: "",
                  states: [],
                  onlineCharge: "",
                  codCharge: "",
                });

                setShowForm(true);
              }}
            >
              <IconPlus />
              Add Zone
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>States</th>
                  <th>Online</th>
                  <th>COD</th>
                  <th className="th-action">Action</th>
                </tr>
              </thead>

              <tbody>
                {settings.zones.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state">
                        <IconZone />
                        <p>No delivery zones added yet</p>
                        <span>Add a zone to start charging by state</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  settings.zones.map((item, index) => {
                    const isExpanded = !!expandedRows[index];
                    const visibleStates = isExpanded
                      ? item.states
                      : item.states.slice(0, CHIP_LIMIT);
                    const remaining = item.states.length - CHIP_LIMIT;

                    return (
                      <tr key={index}>
                        <td>
                          <span className="zone-name">{item.zoneName}</span>
                        </td>

                        <td>
                          <div className="state-chip-container">
                            {visibleStates.map((state) => (
                              <span className="state-chip" key={state}>
                                {state}
                              </span>
                            ))}

                            {!isExpanded && remaining > 0 && (
                              <button
                                type="button"
                                className="state-chip state-chip-more"
                                onClick={() => toggleRowExpanded(index)}
                              >
                                +{remaining} More
                              </button>
                            )}

                            {isExpanded && item.states.length > CHIP_LIMIT && (
                              <button
                                type="button"
                                className="state-chip state-chip-more"
                                onClick={() => toggleRowExpanded(index)}
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="charge-value">
                            ₹ {item.onlineCharge}
                          </span>
                        </td>

                        <td>
                          <span className="charge-value">
                            ₹ {item.codCharge}
                          </span>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-btn icon-btn-edit"
                              onClick={() => editZone(index)}
                              title="Edit zone"
                            >
                              <IconEdit />
                              Edit
                            </button>

                            <button
                              className="icon-btn icon-btn-delete"
                              onClick={() => deleteZone(index)}
                              title="Delete zone"
                            >
                              <IconTrash />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Free Delivery */}
        <div className="delivery-table-card">
          <h3>Free Delivery</h3>
          <p className="card-subtext">
            Orders above this amount get free delivery automatically
          </p>

          <div className="input-group input-group-inline">
            <label>Free Delivery Amount</label>
            <div className="input-box">
              <span>₹</span>
              <input
                type="number"
                value={settings.freeDeliveryAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    freeDeliveryAmount: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={saveSettings}>
          Save Delivery Settings
        </button>

        {/* Add/Edit Modal */}
        {showForm && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false);
            }}
          >
            <div className="delivery-card modal-card">
              <div className="form-header">
                <h3>
                  {editingIndex !== null
                    ? "Edit Delivery Zone"
                    : "Add Delivery Zone"}
                </h3>

                <button
                  className="close-btn"
                  onClick={() => setShowForm(false)}
                >
                  <IconClose />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group span-2">
                    <label>Zone Name</label>
                    <div className="input-box  select-box">
                      <select
                          name="zoneName"
                          value={zone.zoneName}
                          onChange={handleInput}
                        >
                          <option value="">Select Zone</option>
                          <option value="South India">South India</option>
                          <option value="North India">North India</option>
                          <option value="East India">East India</option>
                          <option value="West India">West India</option>
                          <option value="Central India">Central India</option>
                          <option value="North East India">North East India</option>
                          <option value="Union Territories">Union Territories</option>
                        </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Online Charge</label>
                    <div className="input-box">
                      <span>₹</span>
                      <input
                        type="number"
                        name="onlineCharge"
                        value={zone.onlineCharge}
                        onChange={handleInput}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>COD Charge</label>
                    <div className="input-box">
                      <span>₹</span>
                      <input
                        type="number"
                        name="codCharge"
                        value={zone.codCharge}
                        onChange={handleInput}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="states-section">
                  <div className="states-section-top">
                    <h4>Select States</h4>
                    <span className="states-count">
                      {zone.states.length} selected
                    </span>
                  </div>

                  <label className="select-all">
                    <input
                      type="checkbox"
                      checked={zone.states.length === indianStates.length}
                      onChange={selectAllStates}
                    />
                    Select All States
                  </label>

                  <div className="state-grid">
                    {indianStates.map((state) => (
                      <label className="state-item" key={state}>
                        <input
                          type="checkbox"
                          checked={zone.states.includes(state)}
                          disabled={
                            selectedStates.includes(state) &&
                            !zone.states.includes(state)
                          }
                          onChange={() => toggleState(state)}
                        />
                        <span>{state}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={saveZone}>
                  {editingIndex !== null ? "Update Zone" : "Add Zone"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveryCharge;