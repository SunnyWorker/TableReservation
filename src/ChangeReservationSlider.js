import React, {useContext, useEffect, useRef, useState} from 'react';
import styles from "./styles/ReservationSlider.module.css";
import DatePicker from "react-datepicker";
import axios from "axios";
import ReservationContext from "./contexts/ReservationContext";
import {validateField} from "./Helpers";

function ChangeReservationSlider(props) {

    const [roomNames, setRoomNames] = useState();
    const [selectedRoomName, setSelectedRoomName] = useState("");
    const roomNameRef = useRef();
    const roomCapacityRef = useRef();
    const roomWidthRef = useRef();
    const roomHeightRef = useRef();
    const tableCapacityRef = useRef();
    const tableRadiusRef = useRef();
    const tableXRef = useRef();
    const tableYRef = useRef();
    const roomExistsErrorRef = useRef();
    const {restaurant, rooms, setRooms, getRooms, selectedRoom, setSelectedRoom, tables, getTables, selectedTable, setSelectedTable} = useContext(ReservationContext);

    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        },
        withCredentials: true
    }

    useEffect(()=>{
        getRoomNames(rooms)
        updateRoomWrittenData(selectedRoom)
        setSelectedTable(null)
    },[rooms]);

    useEffect(()=>{
        setSelectedTable(null)
    },[tables]);

    useEffect(()=>{
        updateTableWrittenData(selectedTable)
    },[selectedTable]);


    const getRoomNames = (rooms) => {
        let roomNames = [];
        for (let i = 0; i < rooms.length; i++) {
            roomNames.push(
                <option className={styles.option} key={i} value={i}>{rooms[i].room_name}</option>
            );
        }
        setRoomNames(roomNames)
    }

    const handleRoomChange = (event) => {
        setSelectedRoom(rooms[event.target.value]);
        getTables(rooms[event.target.value].room_id);
        setSelectedRoomName(event.target.value);
        setSelectedTable(null)
        updateRoomWrittenData(rooms[event.target.value])
    };

    function updateRoomWrittenData(room) {
        roomHeightRef.current.value = room.room_height;
        roomWidthRef.current.value = room.room_width;
        roomNameRef.current.value = room.room_name;
        roomCapacityRef.current.value = room.room_capacity;
        for (let i = 0; i < rooms.length; i++) {
            if(rooms[i].room_id===room.room_id) {
                setSelectedRoomName(i);
                break;
            }
        }
    }

    function updateRoomActualData() {
        const data = {
            room_width: roomWidthRef.current.value,
            room_height: roomHeightRef.current.value,
            room_name: roomNameRef.current.value,
            room_capacity: roomCapacityRef.current.value,
            room_r_id: restaurant.r_id,
            room_id: selectedRoom.room_id
        };
        setSelectedRoom(data)
    }

    function updateTableWrittenData(table) {
        tableXRef.current.value = table?table.table_x:0;
        tableYRef.current.value = table?table.table_y:0;
        tableRadiusRef.current.value = table?table.table_radius:30;
        tableCapacityRef.current.value = table?table.table_capacity:1;
    }

    function updateTableActualData() {
        const data = {
            table_x: tableXRef.current.value ,
            table_y: tableYRef.current.value ,
            table_radius: tableRadiusRef.current.value,
            table_capacity: tableCapacityRef.current.value,
            table_room_id: selectedRoom.room_id,
            table_id: selectedTable.table_id
        };
        setSelectedTable(data)
    }

    function addRoom() {
        let data = {
            room_width: 700,
            room_height: 700,
            room_name: "Новая комната"+rooms.length,
            room_capacity: 100,
            room_r_id: restaurant.r_id
        };

        axios.post("http://localhost:8080/addRoom", data, config)
            .then(response => {
                data.room_id = response.data.id;
                getRooms(data);
            });
    }

    function changeRoom() {
        let correct = 0;
        correct += validateField(roomNameRef,roomNameRef.current.value,"")

        if(correct===0) {
            const data = {
                room_width: roomWidthRef.current.value,
                room_height: roomHeightRef.current.value,
                room_name: roomNameRef.current.value,
                room_capacity: roomCapacityRef.current.value,
                room_r_id: restaurant.r_id,
                room_id: selectedRoom.room_id
            };

            axios.put("http://localhost:8080/changeRoom", data, config)
                .then(response => {
                    getRooms(data);
                });
        }

    }

    function deleteRoom() {
        let lRooms = rooms;
        if(lRooms.length>=2) {
            axios.delete("http://localhost:8080/delete-room?id="+selectedRoom.room_id, config)
                .then(response => {
                    getRooms(null);
                });
        }
    }

    function addTable() {
        const data = {
            table_x: 50,
            table_y: 50,
            table_radius: 50,
            table_capacity: 2,
            table_room_id: selectedRoom.room_id
        };

        axios.post("http://localhost:8080/addTable", data, config)
            .then(response => {
                data.table_id = response.data.id;
                getTables(selectedRoom.room_id);
            });
    }

    function changeTable() {
        if(selectedTable){
            const data = {
                table_x: tableXRef.current.value,
                table_y: tableYRef.current.value,
                table_radius: tableRadiusRef.current.value,
                table_capacity: tableCapacityRef.current.value,
                table_room_id: selectedRoom.room_id,
                table_id: selectedTable.table_id
            };

            axios.put("http://localhost:8080/changeTable", data, config)
                .then(response => {
                    getTables(selectedRoom.room_id);
                });
        }

    }

    function deleteTable() {
        if(selectedTable)
        axios.delete("http://localhost:8080/delete-table?id="+selectedTable.table_id, config)
            .then(response => {
                getTables(selectedRoom.room_id);
            });
    }

    return (
        <div className={styles.reservationSidebar}>
            <div className={styles.errorDiv}>
                <label htmlFor="error" className={styles.error} id="roomExistsError" ref={roomExistsErrorRef}></label>
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
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="name">Название:</label>
                    <input type="text" name="name" id="name" ref={roomNameRef}/>
                </div>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="capacity">Вместительность:</label>
                    <input type="number" name="capacity" id="capacity" min="1" ref={roomCapacityRef} onChange={updateRoomActualData}/>
                </div>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="width">Длина:</label>
                    <input type="range" name="width" id="width" min="1" max="1000" ref={roomWidthRef} onChange={updateRoomActualData}/>
                </div>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="height">Ширина:</label>
                    <input type="range" name="height" id="height" min="1" max="1000" ref={roomHeightRef} onChange={updateRoomActualData}/>
                </div>
                <button type={"button"} onClick={addRoom}>Добавить</button>
                <button type={"button"} onClick={changeRoom}>Сохранить</button>
                <button type={"button"} onClick={deleteRoom}>Удалить</button>
            </form>

            <form className={styles.reservationForm}>
                <label htmlFor="name">Стол</label>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="name">Вместительность:</label>
                    <input type="number" name="capacity" id="capacity" min="1" ref={tableCapacityRef} onChange={updateTableActualData}/>
                </div>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="name">Радиус:</label>
                    <input type="number" name="capacity" id="capacity" min="30" max="150" ref={tableRadiusRef} onChange={updateTableActualData}/>
                </div>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="name">Гор. смещение:</label>
                    <input type="range" name="capacity" id="capacity" min="1" max="100" ref={tableXRef} onChange={updateTableActualData}/>
                </div>
                <div className={styles.reservationFormGroup}>
                    <label htmlFor="name">Верт. смещение:</label>
                    <input type="range" name="capacity" id="capacity" min="1" max="100" ref={tableYRef} onChange={updateTableActualData}/>
                </div>
                <button type={"button"} onClick={addTable}>Добавить</button>
                <button type={"button"} onClick={changeTable}>Сохранить</button>
                <button type={"button"} onClick={deleteTable}>Удалить</button>
            </form>
        </div>
    );
}

export default ChangeReservationSlider;