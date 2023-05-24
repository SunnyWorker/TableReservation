import React from 'react';
import styles from "../styles/AdminPanel.module.css";
import {Link} from "react-router-dom";

function ChangeReservationButton(props) {
    return (
        <div className={`${styles.changeReservation}  ${styles.toggleDiv}`}>
            <Link to={"/changeReservation?id="+props.id}  className={`${styles.changeReservationToggle}  ${styles.toggle}`} id="changeReservationToggle">
                <img src="/images/mech.png"/>
                <p>Изменить</p>
            </Link>
        </div>
    );
}

export default ChangeReservationButton;