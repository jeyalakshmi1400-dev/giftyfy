import React, { useEffect, useState } from "react";
import axios from "axios";
import DeliveryLayout from "../layout/DeliveryLayout";
import "../styles/mySalary.css";

export default function MySalary() {

  const [salary, setSalary] = useState([]);

  const partnerId = localStorage.getItem("partnerId");

  useEffect(() => {

    fetchSalary();

  }, []);

  const fetchSalary = async () => {

    try {

      const res = await axios.get(
        `http://localhost:4000/api/salary/partner/${partnerId}`
      );

      setSalary(res.data.salaries);

    } catch (err) {

      console.log(err);

    }

  };

  return (

    <DeliveryLayout>

      <div className="my-salary">

        <h2>My Salary</h2>

        <table>

          <thead>

            <tr>

              <th>Month</th>

              <th>Year</th>

              <th>Total Salary</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {salary.map((item) => (

              <tr key={item._id}>

                <td>{item.month}</td>

                <td>{item.year}</td>

                <td>₹{item.totalSalary}</td>

                <td>{item.paymentStatus}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </DeliveryLayout>

  );

}