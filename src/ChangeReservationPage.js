import React, {useContext, useEffect, useState} from 'react';
import Header from "./Header";
import ReservationContext from "./contexts/ReservationContext";
import styles from "./styles/ReservationTableZone.module.css";
import ReservationTableZone from "./ReservationTableZone";
import ReservationSlider from "./ReservationSlider";
import NoAuthorizedPart from "./NoAuthorizedPart";
import {useSearchParams} from "react-router-dom";
import UserContext from "./contexts/UserContext";
import axios from "axios";
import ChangeReservationTableZone from "./ChangeReservationTableZone";
import ChangeReservationSlider from "./ChangeReservationSlider";

function ChangeReservationPage(props) {
    const [searchParams] = useSearchParams();
    const [restaurant, setRestaurant] = useState();
    const [rooms, setRooms] = useState();
    const [tables, setTables] = useState();
    const [selectedTable, setSelectedTable] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState();
    const [loading, setLoading] = useState(true);
    const {user, getUser} = useContext(UserContext);
    const config = {
        withCredentials: true
    }

    const getRestaurant = () => {
        axios.get("http://localhost:8080/getRestaurantById?id="+searchParams.get("id"),config)
            .then(response => {
                setRestaurant(response.data.restaurant);
                getRooms(null);
            }).catch(reason => {
            setRestaurant("");
        });
    }

    const getRooms = (room) => {
        axios.get("http://localhost:8080/getRoomsByRestaurantId?id="+searchParams.get("id"),config) //TODO
            .then(response => {
                setRooms(response.data.rooms);
                if(room) {
                    setSelectedRoom(room);
                    getTables(room.room_id);
                }
                else if(response.data.rooms.length>0) {
                    setSelectedRoom(response.data.rooms[0])
                    getTables(response.data.rooms[0].room_id)
                }
            }).catch(reason => {
                setRooms("");
        });
    }

    const getTables = (roomId) => {
        axios.get("http://localhost:8080/getTablesByRoomId?id="+roomId,config) //TODO
            .then(response => {
                setTables(response.data.tables);
            }).catch(reason => {
            setTables("");
        });
    }

    useEffect(()=>{
        if(restaurant!=undefined && user!=undefined && rooms!=undefined && tables!=undefined) setLoading(false)
    },[restaurant , user, rooms, tables]);

    useEffect(()=>{
        getUser();
        getRestaurant();
    },[]);

    if(loading) {
        return (
            <Header/>
        )
    }
    else if(restaurant.r_bookingAllowed==1 && user !== "" && (user.role_name===process.env.REACT_APP_ADMIN_ROLE || user.u_id===restaurant.r_owner_id)) {
        return (
            <ReservationContext.Provider value={{restaurant, rooms, setRooms, tables, setTables, getRooms, getTables, selectedRoom, setSelectedRoom, selectedTable, setSelectedTable}}>
                <div>
                    <Header/>
                    <div className={styles.main}>
                        <ChangeReservationTableZone room_id={selectedRoom.room_id} room_width={selectedRoom.room_width} room_height={selectedRoom.room_height}/>
                        {user == undefined || user === "" ? null : <ChangeReservationSlider room_id={selectedRoom.room_id}/>}
                    </div>
                </div>
            </ReservationContext.Provider>
        );
    }
    else if(user !== "" && user.role_name!==process.env.REACT_APP_ADMIN_ROLE && user.u_id!==restaurant.r_owner_id) {
        return (
            <>
                <Header/>
                <NoAuthorizedPart message={"Вы не имеете права изменять информацию об этом ресторане!"} advice={"И вы не можете это исправить!"}  href={"/main"} linkText={"В главное меню!"}/>
            </>
        )
    }
    else if(user==="") {
        return (
            <>
                <Header/>
                <NoAuthorizedPart message={"Вы не имеете доступ к этой части сайта, если вы не владелец данного ресторана!"}  advice={"Но вы всегда можете это исправить!"}  href={"/login"} linkText={"Войти"}/>
            </>
        );
    }
}

export default ChangeReservationPage;