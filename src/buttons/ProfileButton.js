import React, {useContext, useEffect, useState} from 'react';
import '../styles/Header.css';
import UserContext from "../contexts/UserContext";
import axios from "axios";
import {Link} from "react-router-dom";

function ProfileButton(props) {
    const [pictureName, setPictureName] = useState();
    const {user} = useContext(UserContext);
    const config = {
        withCredentials: true
    }
    useEffect(()=>{
        if(user)
        axios.get("http://localhost:8080/getUserProfilePictureById?id="+user.u_profile_image_id,config)
            .then(response => {
                setPictureName(response.data.profileImagePath)
            });
    },[user]);

    if(pictureName)
    return (
        <Link className="profile" to={"/userProfile?id="+user.u_id}>
            <img src={"/images/"+pictureName} alt="avatar" />
        </Link>
    );
}

export default ProfileButton;