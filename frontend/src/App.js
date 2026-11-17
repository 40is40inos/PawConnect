import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { MainPage } from './pages/mainPage/mainPage';
import { Guest } from './pages/guest/guest';
import Admin from './pages/admin/admin';
import { KeeperPage } from './pages/keeper/keeperPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/guest" element={<Guest />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/keepers/:userName" element={<KeeperPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
