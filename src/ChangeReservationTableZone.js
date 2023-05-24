import React, {useContext} from 'react';
import ReservationContext from "./contexts/ReservationContext";
import styles from "./styles/ReservationTableZone.module.css";
import Table from "./Table";
import ChangeTable from "./ChangeTable";

function ChangeReservationTableZone(props) {
    const {tables, selectedTable, selectedRoom} = useContext(ReservationContext);

    if(tables)
        return (
            <div className={styles.tableZone} style={{width: props.room_width+"px", height: props.room_height+"px"}}>
                {tables.map((table) => {
                    if(!selectedTable || selectedTable.table_id!==table.table_id)
                        return <ChangeTable status={"free"} table={table} />;
                })}
                {selectedTable?<ChangeTable status={"selected"} table={selectedTable} />:null}
            </div>
        );
}

export default ChangeReservationTableZone;