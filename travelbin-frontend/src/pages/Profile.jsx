import React, {useState} from "react";
import { useParams } from "react-router-dom";
import DestinationShow from "../components/DestinationShow";
import DestinationCreate from "../components/DestinationCreate";
import { useAuth } from "../components/AuthContext";

const Profile = () => {
    const {user} = useAuth();
    const { id } = useParams(); // Get the ID from the URL parameters
    const [refresh, setRefresh] = useState(false);
    const handleDestinationCreated = () => {
        setRefresh(prevState => !prevState);
    }

    const loggedInCanEdit = (
        <>
            <div className="table-side-by-side">
            <DestinationCreate urlID={id} onDestinationCreated={handleDestinationCreated}/>
            <DestinationShow  urlID={id} refresh={refresh} onRefresh={handleDestinationCreated}/>
            </div>
        </>
    )
    const cannotEdit = (
        <>
            <DestinationShow  urlID={id} refresh={refresh} onRefresh={handleDestinationCreated}/>
        </>
    )

    return (
        <div>
            <h1>{id.charAt(0).toUpperCase() + id.slice(1)}'s Profile</h1>
            <h1>Destinations</h1>
            {user && user.username === id ? loggedInCanEdit : cannotEdit}
        </div>
    )
};

export default Profile;