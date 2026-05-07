import { useEffect, useState } from "react";
import { getPetKeeper } from "../../api/getThings";
import { DisplayLinks, DisplayUsers } from "../../components/displayUsers/displayUsers";
import { useNavigate  } from "react-router-dom";

import './guest.css'
export const Guest = () => {
    const navigate = useNavigate();

    const [petKeeper, setPetKeeper] = useState([]);

    const [showPetKeeper, setShowPetKeeper] = useState(false);

    const [showLinks, setShowLinks] = useState(false);

    useEffect(() => {
        getPetKeeper().then((res) => {

            setPetKeeper(res);
        });
    }, []);


    const petKeeperButton = (
        <button
            onClick={() => {
                setShowPetKeeper(old => !old);
                setShowLinks(false);
            }}
        >
            {!showPetKeeper ? 'show pet keepers' : 'close pet keepers'}
        </button>
    );

    const loginButton = (
        <button
            onClick={() => {
                navigate('/login');
            }}
        >
            Login
        </button>
    );

    const useFullLinksButton = (
        <button
        onClick={() => {
            setShowLinks(old=>!old);
            setShowPetKeeper(false);
        }}
    >
        {showLinks ? 'Close Links' : 'Useful Links'}
    </button>
    ) 
    

    //{link , title , text}
    return ( <div className="guestPage">
        <div className="buttons">
            {petKeeperButton}
            {loginButton}
            {useFullLinksButton}
        </div>
        {showPetKeeper && DisplayUsers({users : petKeeper})}
        {showLinks && DisplayLinks([
            {
                link : 'https://www.petmd.com/',
                title : 'Pet md',
                text : 'Pet md website'
            },
            {
                link : 'http://katoikidio.gr/',
                title : 'Katoikidio gr',
                text : 'Katoikidio gr website'
            },
            {
                link : 'https://eshopkatoikidio.gr/',
                title : 'Eshop katoikidia',
                text : 'Eshop katoikidia website'
            }
            
            
            
            ])}
    </div> );
}