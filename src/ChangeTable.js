import React, {useContext} from 'react';
import styles from "./styles/ReservationTableZone.module.css";
import ReservationContext from "./contexts/ReservationContext";

function ChangeTable(props) {
    const {tables, setTables, selectedTable, setSelectedTable} = useContext(ReservationContext);

    const handleClick = () => {
        if (selectedTable && selectedTable.table_id===props.table.table_id) {
            setSelectedTable(null);
        } else {
            setSelectedTable(props.table);
        }
    };

    const tableStatus =
        props.status === "free"
            ? styles.freeTable
                : styles.selectedTable;

    return (
        <div
            className={tableStatus}
            style={{
                width: props.table.table_radius + "px",
                height: props.table.table_radius + "px",
                top: props.table.table_y + "%",
                left: props.table.table_x + "%",
            }}
            onClick={handleClick}
        ></div>
    );
}

export default ChangeTable;