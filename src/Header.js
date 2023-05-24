import React, {useContext, useEffect} from 'react';
import './styles/Header.css'
import {Link} from "react-router-dom";
import UserContext from "./contexts/UserContext";
import ProfileButton from "./buttons/ProfileButton";
function Header() {
    const {user} = useContext(UserContext);

    return (
        <div className="header">
            <Link to="/main">
                <h1>Рестораны Минска</h1>
            </Link>
            {user && user !== ""?<ProfileButton/>:null}
        </div>
    );
}

export default Header;