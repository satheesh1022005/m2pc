import { useNavigate } from "react-router-dom";
import "../App.css"
const Home = () => {

    const navigate = useNavigate();
    const handleAdmin = () => {
        const password = window.prompt("Enter admin password");
        if (password === "admin")
            navigate("/admin");
        return;
    }
    return (
        <div className="home">
            <div>Choose the type of User</div>
            <div className="home-buttons">
                <div>
                    <button onClick={() => navigate("/upload")}>Public User</button>
                </div>
                <div>
                    <button onClick={handleAdmin}>Admin</button>
                </div>
            </div>
        </div>
    )
}
export default Home;