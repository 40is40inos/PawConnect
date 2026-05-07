import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Routes,
  Link
} from "react-router-dom";
import { Login } from "./pages/login/login";
import { Register } from "./pages/register/register";
// import { Admin } from "./pages/admin/admin";

import { CookiesProvider, useCookies } from "react-cookie";
import './App.css';
import { MainPage } from "./pages/mainPage/mainPage";
import { Guest } from "./pages/guest/guest";
import Admin from "./pages/admin/admin";

function App() {

  const [cookies, setCookie] = useCookies(["user"]);


  return (
    <Router>
      <CookiesProvider defaultSetOptions={{ path: '/' }}>
        <div className="App"> 
          <Routes>
              <Route exact path="/" element={<MainPage />} />
              <Route path="/register" element={<Register  />} />
              <Route path="/login" element={<Login />} />
              <Route path='/guest' element={<Guest />} />
              <Route path='/admin' element={<Admin />} />

          </Routes>
        </div>
      </CookiesProvider>
    </Router>
  );
}

export default App;
