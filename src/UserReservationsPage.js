import React, {useContext, useEffect, useState} from 'react';
import Header from "./Header";
import styles from "./styles/UserReservationsPage.module.css";
import UserContext from "./contexts/UserContext";
import axios from "axios";
import Reservation from "./Reservation";
import RestaurantElement from "./RestaurantElement";

function UserReservationsPage(props) {
    const {user, getUser} = useContext(UserContext);
    const [reservations, setReservations] = useState();
    const [loading, setLoading] = useState(true);

    const config = {
        withCredentials: true
    }

    useEffect(()=>{
        getUser();
    },[]);

    useEffect(()=>{
        if(user)
            axios.get("http://localhost:8080/getAllReservationsByUserId?id="+user.u_id,config)
                .then(response => {
                    setReservations(response.data.reservations)
                    console.log(response.data.reservations)
                }).catch(reason => {
                    setReservations([]);
            });
    },[user]);

    useEffect(()=>{
        if(reservations!=undefined && user!=undefined) setLoading(false)
    },[user, reservations]);

    const deleteFromReservationList = (reservation) => {
        setReservations(reservations.filter(filterReservation => reservation !== filterReservation));
    };

    if(loading) {
        return (
            <div>
                <Header/>
            </div>
        );
    }
    else {
        return (
            <div>
                <Header/>
                <div className={styles.bookingDiv}>
                    <h2 className={styles.bookingNameH1}>Мои бронирования</h2>
                    {reservations.map((reservation) => {
                        return <Reservation reservation={reservation} deleteFunction={deleteFromReservationList}/>
                    })}
                </div>
            </div>
        );
    }
}

export default UserReservationsPage;