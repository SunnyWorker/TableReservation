import React, {useContext, useEffect, useState} from 'react';
import Header from "./Header";
import {useSearchParams} from "react-router-dom";
import FilterSlider from "./FilterSlider";
import UserContext from "./contexts/UserContext";
import ReservationSlider from "./ReservationSlider";
import ReservationTableZone from "./ReservationTableZone";
import styles from './styles/ReservationTableZone.module.css';
import axios from "axios";
import NoAuthorizedPart from "./NoAuthorizedPart";
import ReservationContext from "./contexts/ReservationContext";
import AbsolutePanel from "./buttons/AbsolutePanel";
import ChangeReservationButton from "./buttons/ChangeReservationButton";

function ReservationPage(props) {

    const [searchParams] = useSearchParams();
    const [restaurant, setRestaurant] = useState();
    const [rooms, setRooms] = useState();
    const [tables, setTables] = useState();
    const [busyTables, setBusyTables] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
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
                getRooms();
            }).catch(reason => {
            setRestaurant("");
        });
    }

    console.log(busyTables)

    const getRooms = () => {
        axios.get("http://localhost:8080/getRoomsByRestaurantId?id="+searchParams.get("id"),config) //TODO
            .then(response => {
                setRooms(response.data.rooms);
                if(response.data.rooms.length>0) setSelectedRoom(response.data.rooms[0])
                getTables(response.data.rooms[0].room_id)
            }).catch(reason => {
            setRooms("");
        });
    }

    const getTables = (roomId) => {
        axios.get("http://localhost:8080/getTablesByRoomId?id="+roomId,config) //TODO
            .then(response => {
                console.log(response.data.tables)
                setTables(response.data.tables);
            }).catch(reason => {
                setTables("");
        });
    }

    useEffect(()=>{
        if(restaurant!=undefined && user!=undefined && rooms!=undefined && tables!=undefined) setLoading(false)
    },[restaurant , user, rooms, tables]);

    function getGuestCountWord(capacity) {
        if(capacity%100<10 || capacity%100>20) {
            if(capacity%10>=2 && capacity%10<=4) return capacity+' гостя'
            else if(capacity%10===1) return capacity+' гость'
        }
        return capacity+' гостей'
    }

    useEffect(()=>{
        getUser();
        getRestaurant();
    },[]);


    if(loading) {
        return (
            <Header/>
        )
    }
    else if(restaurant.r_bookingAllowed==1 && rooms.length>0) {
        return (
            <ReservationContext.Provider value={{restaurant, rooms, setRooms, tables, setTables, getTables, selectedTables, setSelectedTables, selectedRoom, setSelectedRoom, busyTables, setBusyTables}}>
                <div>
                    <Header/>
                    <div className={styles.main}>
                        <ReservationTableZone room_id={selectedRoom.room_id} room_width={selectedRoom.room_width} room_height={selectedRoom.room_height}/>
                        {user == undefined || user === "" ? null : <ReservationSlider room_id={selectedRoom.room_id} openHours={Number(restaurant.r_openTime.substring(0,2))} closeHours={Number(restaurant.r_closeTime.substring(0,2))}/>}
                    </div>
                    <AbsolutePanel>
                        {user.u_id === restaurant.r_owner_id || user.role_name===process.env.REACT_APP_ADMIN_ROLE? <ChangeReservationButton id={restaurant.r_id}/> : null}
                    </AbsolutePanel>
                </div>
            </ReservationContext.Provider>
        );
    }
    else {
        return (
            <>
                <Header/>
                <NoAuthorizedPart message={"В этом ресторане нельзя бронировать столики!"} advice={"Пожалуйста, вернитесь на страницу ресторана!"}  href={"/restaurant?id="+restaurant.r_id} linkText={"О ресторане"}/>
            </>
        )
    }

}

export default ReservationPage;