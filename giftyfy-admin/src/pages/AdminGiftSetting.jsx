import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layout/AdminLayout";
import "../styles/AdminGiftSetting.css";

export default function AdminGiftSetting() {

  const [setting, setSetting] = useState({
    giftWrapEnabled: true,
    giftWrapCharge: 30,
    maxMessageLength: 200
  });

  const [loading, setLoading] = useState(false);


  useEffect(() => {

    const fetchGiftSetting = async () => {

      try {

        const res = await axios.get(
          "http://localhost:4000/api/gift-setting",
          {
            headers:{
              Authorization:
              `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        setSetting(res.data);

      } catch(err) {

        console.log(err);
        toast.error("Failed to load gift settings");

      }

    };


    fetchGiftSetting();

  },[]);



  const handleChange = (e) => {

    const {name,value,type,checked} = e.target;


    setSetting({
      ...setting,

      [name]:
      type === "checkbox"
      ?
      checked
      :
      value
    });

  };




  const updateSetting = async()=>{

    try{

      setLoading(true);


      await axios.put(

        "http://localhost:4000/api/gift-setting",

        {
          giftWrapEnabled:
          setting.giftWrapEnabled,

          giftWrapCharge:
          Number(setting.giftWrapCharge),

          maxMessageLength:
          Number(setting.maxMessageLength)
        },

        {
          headers:{
            Authorization:
            `Bearer ${localStorage.getItem("token")}`
          }
        }

      );


      toast.success(
        "Gift Setting Updated 🎁"
      );


    }
    catch(err){

      console.log(err);

      toast.error(
        "Update Failed"
      );

    }
    finally{

      setLoading(false);

    }

  };





  return (

    <AdminLayout>

      <div className="gift-setting-page">


        <div className="gift-card">


          {/* HEADER */}

          <div className="gift-header">

            <h2>
              🎁 Gift Settings
            </h2>

            <p>
              Manage gift wrap charge and gift message options
            </p>

          </div>





          {/* BODY */}

          <div className="gift-body">



            {/* ENABLE */}

            <div className="gift-switch-box">

              <div>

                <h5>
                  Gift Wrap Option
                </h5>

                <p>
                  Allow customers to add gift wrapping
                </p>

              </div>


              <label className="switch">

                <input

                  type="checkbox"

                  name="giftWrapEnabled"

                  checked={
                    setting.giftWrapEnabled
                  }

                  onChange={handleChange}

                />


                <span className="slider"></span>

              </label>


            </div>






            {/* CHARGE */}

            <div className="gift-field">

              <label>
                Gift Wrap Charge (₹)
              </label>


              <input

                type="number"

                name="giftWrapCharge"

                value={
                  setting.giftWrapCharge
                }

                onChange={handleChange}

                placeholder="Enter amount"

              />


            </div>






            {/* MESSAGE LIMIT */}

            <div className="gift-field">

              <label>
                Maximum Gift Message Length
              </label>


              <input

                type="number"

                name="maxMessageLength"

                value={
                  setting.maxMessageLength
                }

                onChange={handleChange}

                placeholder="Example 200"

              />


            </div>







            {/* PREVIEW */}

            <div className="gift-preview">


              <h4>
                Preview
              </h4>


              <div className="preview-row">

                <span>
                  🎁 Gift Wrap
                </span>


                <strong>

                {
                  setting.giftWrapEnabled
                  ?
                  "Available"
                  :
                  "Disabled"
                }

                </strong>


              </div>




              <div className="preview-row">

                <span>
                  Wrap Charge
                </span>


                <strong>
                  ₹{setting.giftWrapCharge}
                </strong>

              </div>




              <div className="preview-row">

                <span>
                  Message Limit
                </span>


                <strong>
                  {setting.maxMessageLength}
                  {" "}characters
                </strong>

              </div>



            </div>







            <button

              className="save-gift-btn"

              onClick={updateSetting}

              disabled={loading}

            >

              {
                loading
                ?
                "Saving..."
                :
                "Save Changes"
              }


            </button>



          </div>


        </div>


      </div>


    </AdminLayout>

  );

}