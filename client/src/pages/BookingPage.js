import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useParams } from "react-router-dom";
import axios from "axios";
import { DatePicker, message, TimePicker } from "antd";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/alertSlice";

const BookingPage = () => {
  const { user } = useSelector((state) => state.user);
  const params = useParams();
  const [doctors, setDoctors] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState();
  const [isAvailable, setIsAvailable] = useState(false);
  const dispatch = useDispatch();

  const checkAppointmentAvailability = async (doctorId, date, time) => {
    try {
      const res = await axios.post(
            "/api/v1/user/check-appointment-availability",
            { doctorId, date, time },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
        // Check if the response has a success field indicating availability
        return res.data.success;
    } catch (error) {
        console.log("Error checking appointment availability:", error);
        return false;
    }
};


  // ============ handle availability
  const handleAvailability = async () => {
    try {
      dispatch(showLoading());

      if (!date || !time || !params.doctorId) {
        throw new Error("Invalid date, time, or doctorId");
      }

      // Check appointment availability using the custom function
      const available = await checkAppointmentAvailability(
        params.doctorId,
        date,
        time
      );

      dispatch(hideLoading());

      if (available) {
        setIsAvailable(true);
        message.success("Appointment available at selected time.");
      } else {
        setIsAvailable(false);
        message.error("Appointment not available at selected time.");
      }
    } catch (error) {
      dispatch(hideLoading());
      console.log("Error:", error);
      message.error("An error occurred while checking availability.");
    }
  };

  // =============== booking func
  const handleBooking = async () => {
    try {
      if (!date && !time) {
        return alert("Date & Time Required");
      }
      dispatch(showLoading());
      const res = await axios.post(
        "/api/v1/user/book-appointment",
        {
          doctorId: params.doctorId,
          userId: user._id,
          doctorInfo: doctors,
          userInfo: user,
          date: date,
          time: time,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (res.data.success) {
        message.success(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.log(error);
    }
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const res = await axios.post(
          "/api/v1/doctor/getDoctorById",
          { doctorId: params.doctorId },
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          }
        );
        if (res.data.success) {
          setDoctors(res.data.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    getUserData();
  }, [params.doctorId]);

  return (
    <Layout>
    <h3>Booking Page</h3>
    <div className="container m-2">
      {doctors && (
        <div className="booking-info">
          <h4>
            Dr.{doctors.firstName} {doctors.lastName}
          </h4>
          <h4>Fees : {doctors.feesPerCunsaltation}</h4>
          <h4>
            Timings : {doctors.timings && doctors.timings[0]} -{" "}
            {doctors.timings && doctors.timings[1]}
          </h4>
          <div className="booking-form">
            <DatePicker
              aria-required={"true"}
              className="m-2"
              format="DD-MM-YYYY"
              onChange={(value) => {
                setDate(moment(value).format("DD-MM-YYYY"));
              }}
            />
            <TimePicker
              aria-required={"true"}
              format="HH:mm"
              className="mt-3"
              onChange={(value) => {
                setTime(moment(value).format("HH:mm"));
              }}
            />

            <button
              className="btn btn-primary mt-2"
              onClick={handleAvailability}
            >
              Check Availability
            </button>

            <button className="btn btn-dark mt-2" onClick={handleBooking}>
              Book Now
            </button>
          </div>
        </div>
      )}
    </div>
  </Layout>

  );
};

export default BookingPage;
