import React, {useContext, useEffect, useRef, useState} from 'react';
import styles from './styles/ReservationSlider.module.css';
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReservationContext from "./contexts/ReservationContext";
import {analyzeErrorReason, isReservationValid} from "./Helpers";

function ReservationSlider(props) {

    const [selectedComeDate, setSelectedComeDate] = useState(new Date());
    const [selectedComeHour, setSelectedComeHour] = useState(props.openHours);
    const [selectedComeMinute, setSelectedComeMinute] = useState(0);
    const [selectedLeaveHour, setSelectedLeaveHour] = useState(props.openHours+1);
    const [selectedLeaveMinute, setSelectedLeaveMinute] = useState(0);
    const [hours, setHours] = useState();
    const [closeHours, setCloseHours] = useState();
    const [closeMinutes, setCloseMinutes] = useState();
    const [minutes, setMinutes] = useState();
    const [roomNames, setRoomNames] = useState();
    const [selectedRoomName, setSelectedRoomName] = useState("");
    const timeErrorRef = useRef();
    const busyTableErrorRef = useRef();
    const {rooms, setRooms, selectedRoom, setSelectedRoom, getTables, setBusyTables, selectedTables, setSelectedTables} = useContext(ReservationContext);



    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        },
        withCredentials: true
    }

    useEffect(()=>{
        let hours = [];
        let minutes = [];
        for (let i = props.openHours; i%24 !== props.closeHours; i++) {
            hours.push(
                <option className={styles.option} key={i} value={i}>{i%24 < 10 ? `0${i%24}` : i%24}</option>
            );
        }
        for (let i = 0; i < 60; i += 5) {
            minutes.push(
                <option className={styles.option} key={i} value={i}>{i < 10 ? `0${i}` : i}</option>
            );
        }
        setHours(hours);
        setMinutes(minutes);
        recalculateCloseHours(selectedComeHour);
        recalculateCloseMinutes(selectedComeMinute);
        getBusyTables(selectedComeDate.getFullYear() + "-" + (selectedComeDate.getMonth()+1) + "-" + selectedComeDate.getDate(), selectedComeHour+":"+selectedComeMinute, selectedLeaveHour+":"+selectedLeaveMinute, selectedRoom.room_id)
        getRoomNames()
    },[]);

    const getRoomNames = () => {
        let roomNames = [];
        for (let i = 0; i < rooms.length; i++) {
            roomNames.push(
                <option className={styles.option} key={i} value={i}>{rooms[i].room_name}</option>
            );
        }
        setRoomNames(roomNames)
    }

    function recalculateCloseHours(hour) {
        let myHours = [];
        for (let i = hour+1; i%24 !== props.closeHours; i++) {
            myHours.push(
                <option className={styles.option} key={i} value={i}>{i%24 < 10 ? `0${i%24}` : i%24}</option>
            );
        }
        setSelectedLeaveHour(hour+1)
        setCloseHours(myHours);
    }

    function recalculateCloseMinutes(minute, comeHour, leaveHour) {
        if(comeHour+1!==leaveHour) {
            minute = 0;
        }
        let minutes = [];
        for (let i = minute; i < 60; i += 5) {
            minutes.push(
                <option className={styles.option} key={i} value={i}>{i < 10 ? `0${i}` : i}</option>
            );
        }
        setSelectedLeaveMinute(minute)
        setCloseMinutes(minutes);
    }

    const getBusyTables = (date, arriveTime, leaveTime, roomId) => {
        const data = {
            date: date,
            arriveTime: arriveTime,
            leaveTime: leaveTime,
            roomId: roomId
        };

        axios.post("http://localhost:8080/getBusyTables", data, config)
            .then(response => {
                setBusyTables(response.data.tables);
            })
            .catch(reason => {
                setBusyTables([]);
            });
    }

    const handleComeHourChange = (event) => {
        setSelectedComeHour(Number(event.target.value));
        recalculateCloseHours(Number(event.target.value));
        recalculateCloseMinutes(selectedComeMinute, Number(event.target.value), Number(event.target.value)+1);
        setSelectedTables([]);
        timeErrorRef.current.style.display = 'none';
        getBusyTables(selectedComeDate.getFullYear() + "-" + (selectedComeDate.getMonth()+1) + "-" + selectedComeDate.getDate(), event.target.value+":"+selectedComeMinute, (Number(event.target.value)+1)+":"+selectedLeaveMinute, selectedRoom.room_id)
    };

    const handleComeMinuteChange = (event) => {
        setSelectedComeMinute(Number(event.target.value));
        recalculateCloseMinutes(Number(event.target.value), selectedComeHour, selectedLeaveHour);
        setSelectedTables([]);
        timeErrorRef.current.style.display = 'none';
        getBusyTables(selectedComeDate.getFullYear() + "-" + (selectedComeDate.getMonth()+1) + "-" + selectedComeDate.getDate(), selectedComeHour+":"+event.target.value, selectedLeaveHour+":"+selectedLeaveMinute, selectedRoom.room_id)
    };

    const handleLeaveHourChange = (event) => {
        setSelectedLeaveHour(Number(event.target.value));
        recalculateCloseMinutes(selectedComeMinute, selectedComeHour, Number(event.target.value));
        setSelectedTables([]);
        timeErrorRef.current.style.display = 'none';
        getBusyTables(selectedComeDate.getFullYear() + "-" + (selectedComeDate.getMonth()+1) + "-" + selectedComeDate.getDate(), selectedComeHour+":"+selectedComeMinute, event.target.value+":"+selectedLeaveMinute, selectedRoom.room_id)

    };

    const handleLeaveMinuteChange = (event) => {
        setSelectedLeaveMinute(Number(event.target.value));
        setSelectedTables([]);
        timeErrorRef.current.style.display = 'none';
        getBusyTables(selectedComeDate.getFullYear() + "-" + (selectedComeDate.getMonth()+1) + "-" + selectedComeDate.getDate(), selectedComeHour+":"+selectedComeMinute, selectedLeaveHour+":"+event.target.value, selectedRoom.room_id)
    };

    const handleRoomChange = (event) => {
        setSelectedRoom(rooms[event.target.value]);
        getTables(rooms[event.target.value].room_id);
        setSelectedRoomName(event.target.value);
        getBusyTables(selectedComeDate.getFullYear() + "-" + (selectedComeDate.getMonth()+1) + "-" + selectedComeDate.getDate(), selectedComeHour+":"+selectedComeMinute, selectedLeaveHour+":"+selectedLeaveMinute, rooms[event.target.value].room_id)
    };

    const handleDateChange = (date) => {
        setSelectedComeDate(date)
        setSelectedTables([]);
        timeErrorRef.current.style.display = 'none';
        getBusyTables(date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(), selectedComeHour+":"+selectedComeMinute, selectedLeaveHour+":"+selectedLeaveMinute, selectedRoom.room_id)
    };

    const createReservation = () => {
        if(selectedComeDate!=undefined && selectedTables.length>0) {
            const data = {
                date: selectedComeDate.getFullYear() + "-" + (selectedComeDate.getMonth()+1) + "-" + selectedComeDate.getDate(),
                arriveTime: selectedComeHour+":"+selectedComeMinute,
                leaveTime: selectedLeaveHour+":"+selectedLeaveMinute,
                selectedTables: selectedTables,
                room_id: selectedRoom.room_id
            };

            axios.post("http://localhost:8080/createReservation", data, config)
                .then(response => {
                    console.log("Бронирование создано!");
                    getBusyTables(selectedComeDate.getFullYear() + "-" + (selectedComeDate.getMonth()+1) + "-" + selectedComeDate.getDate(), selectedComeHour+":"+selectedComeMinute, selectedLeaveHour+":"+selectedLeaveMinute, selectedRoom.room_id)
                })
                .catch(reason => {
                    console.log("Ошибка бронирования!");
                    analyzeErrorReason(reason,[timeErrorRef, busyTableErrorRef],["dateError", "busyTableError"])
                });
        }
    };

    return (
        <div className={styles.reservationSidebar}>
            <div className={styles.errorDiv}>
                <label htmlFor="error" className={styles.error} id="timeError" ref={timeErrorRef}></label>
                <label htmlFor="error" className={styles.error} id="busyTableError" ref={busyTableErrorRef}></label>
            </div>
            <form className={styles.reservationForm}>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="name">Помещение:</label>
                    <div className={styles.timeSelectors}>
                        <select className={styles.roomSelector} value={selectedRoomName} onChange={handleRoomChange}>
                            {roomNames}
                        </select>
                    </div>
                </div>
                <label htmlFor="name">Дата бронирования:</label>
                <DatePicker dateFormat='yyyy-MM-dd' selected={selectedComeDate} onChange={(date) => handleDateChange(date)}/>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="name">Время прибытия:</label>
                    <div className={styles.timeSelectors}>
                        <select className={styles.hoursSelector} value={selectedComeHour} onChange={handleComeHourChange}>
                            {hours}
                        </select>
                        <select className={styles.minutesSelector} value={selectedComeMinute} onChange={handleComeMinuteChange}>
                            {minutes}
                        </select>
                    </div>
                </div>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="name">Время ухода:</label>
                    <div className={styles.timeSelectors}>
                        <select className={styles.hoursSelector} value={selectedLeaveHour} onChange={handleLeaveHourChange}>
                            {closeHours}
                        </select>
                        <select className={styles.minutesSelector} value={selectedLeaveMinute} onChange={handleLeaveMinuteChange}>
                            {closeMinutes}
                        </select>
                    </div>
                </div>
                <button className={styles.reservationButton} type="button" onClick={createReservation}>Забронировать</button>
            </form>
        </div>
    );
}

export default ReservationSlider;