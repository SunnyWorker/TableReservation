import React, {useState} from 'react';
import "./styles/Reservation.css";
import axios from "axios";

function Reservation(props) {
    const [arriveDate, setArriveDate] = useState(new Date(props.reservation.tb_arriveDate));
    const config = {
        'withCredentials': true
    }


    function deleteBooking() {
        axios.delete("http://localhost:8080/delete-booking?id="+props.reservation.tb_id,config).then((response)=>{
            if(response.status===200) props.deleteFunction(props.reservation);
        })
    }
    return (
        <div className="booking-table">
            <div className="restaurant-info">
                <h2 className="restaurant-name">{props.reservation.r_name}</h2>
                <p className="restaurant-address">{props.reservation.r_address}</p>
            </div>
            <div className="booking-info">
                <p className="booking-date">Дата посещения: {arriveDate.getFullYear() + "-" + (arriveDate.getMonth()+1) + "-" + arriveDate.getDate()}</p>
                <p className="booking-time">Время прибытия: {Number((props.reservation.tb_arriveTime).substring(0,2))%24+":"+(props.reservation.tb_arriveTime).substring(3,5)}</p>
                <p className="booking-time">Время ухода:    {Number((props.reservation.tb_leaveTime).substring(0,2))%24+":"+(props.reservation.tb_leaveTime).substring(3,5)}</p>
                <p className="booking-time">Забронировано столиков: {props.reservation.table_count}</p>
            </div>
            {props.reservation.tb_status==="future"?<button className="cancel-booking-btn" onClick={deleteBooking}>Отменить бронирование</button>:
                props.reservation.tb_status==="in progress"?<div className={"in-progress-block"}>Приятного аппетита</div>:
                    <div className={"past-block"}>Ждём вас снова</div>}
        </div>
    );
}

export default Reservation;