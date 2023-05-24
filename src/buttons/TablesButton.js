import React from 'react';
import styles from "../styles/AdminPanel.module.css";
import {Link} from "react-router-dom";

function TablesButton(props) {
    return (
        <div className={`${styles.reservation}  ${styles.toggleDiv}`}>
            <Link className={`${styles.reservationToggle}  ${styles.toggle}`} id="reservationToggle" to={"/reservation?id="+props.id}>
                <img src="/images/Table.png"/>
                <p>Бронирование</p>
            </Link>
        </div>
    );
}

export default TablesButton;