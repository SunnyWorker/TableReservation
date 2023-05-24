import React, {useContext} from 'react';
import styles from "./styles/ReservationTableZone.module.css";
import ReservationContext from "./contexts/ReservationContext";

function Table(props) {
    const {busyTables, selectedTables, setSelectedTables } = useContext(ReservationContext);

    const handleClick = () => {
        if(!busyTables.includes(props.table_id)) {
            if (selectedTables.includes(props.table_id)) {
                setSelectedTables(selectedTables.filter(id => id !== props.table_id));
            } else {
                setSelectedTables([...selectedTables, props.table_id]);
            }
        }
    };

    const tableStatus =
        props.status === "free"
            ? styles.freeTable
            : props.status === "busy"
                ? styles.busyTable
                : styles.selectedTable;

    return (
        <div
            className={tableStatus}
            style={{
                width: props.radius + "px",
                height: props.radius + "px",
                top: props.y + "%",
                left: props.x + "%",
            }}
            onClick={handleClick}
        ></div>
    );
}

export default Table;