import React, { useEffect, useState} from "react";
import '../styles/Table.css'
import { apiClient } from "../config/api";

//NOTE: I don't know if this will be used for anything. The endpoint should get changed later too on backend.

const Destinations = () => {
    const [data, setData] = useState([]);
    const [searchName, setSearchName] = useState("");
    const [searchCreatedBy, setSearchCreatedBy] = useState("");
    useEffect(() => {
        // Fetch data from the Django REST API
        apiClient.get('/')
            .then((response) => setData(response.data))
            .catch((error) => console.error("Error fetching data:", error));
    }, []);

    const filteredData = data.filter((item) => {
        const nameMatch = !searchName || item.name?.toLowerCase().includes(searchName.toLowerCase());
        const createdByMatch = !searchCreatedBy || item.created_by?.toString().toLowerCase().includes(searchCreatedBy.toLowerCase());
        return nameMatch && createdByMatch;
    });

    return (
        <div>
            <h1>Destinations</h1>
            <table>
                <thead>
                    <tr>
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                        </th>
                        <th colSpan="1">
                        <input
                                type="text"
                                placeholder="Search by creator..."
                                value={searchCreatedBy}
                                onChange={(e) => setSearchCreatedBy(e.target.value)}
                            />
                        </th>
                    </tr>
                    <tr>
                        <th>Name</th>
                        <th>Created By</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((item)=> (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.created_by}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
};

export default Destinations;