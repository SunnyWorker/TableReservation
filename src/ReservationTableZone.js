import React, {useContext, useEffect} from 'react';
import styles from './styles/ReservationTableZone.module.css';
import Table from "./Table";
import ReservationContext from "./contexts/ReservationContext";
import RestaurantElement from "./RestaurantElement";

function ReservationTableZone(props) {
    const {tables, busyTables, selectedTables, setSelectedTables} = useContext(ReservationContext);

    if(tables)
    return (
        <div className={styles.tableZone} style={{width: props.room_width+"px", height: props.room_height+"px"}}>
            {tables.map((table) => {
                return <Table status={busyTables.includes(table.table_id)?"busy":selectedTables.includes(table.table_id)?"selected":"free"} x={table.table_x} y={table.table_y} radius={table.table_radius} table_id={table.table_id} />
            })}
        </div>
    );
}

export default ReservationTableZone;