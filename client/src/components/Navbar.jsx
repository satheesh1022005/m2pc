import React, { useState } from "react";
import "./Navbar.css";

function NavBar({setNavbarData}) {
  
  return (
    <nav className="navbar-container">
        <div className="navbar">
            Photocopy Shop
        </div>
        <div className="home-menu">
            <div onClick={() => setNavbarData("dashboard")}>Dashboard</div>
            <div onClick={() => setNavbarData("revenue")}>Revenue History</div>
            <div onClick={() => setNavbarData("settings")}>Settings</div>
        </div>
    </nav>
  );
}

export default NavBar;