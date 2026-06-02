import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext.jsx'
import { useAuth } from './components/AuthContext.jsx'
import { useEffect } from 'react'
import { apiClient } from './config/api.js'

import './styles/App.css'
import { Layout } from './components/Layout.jsx'
import Entry from './pages/Entry.jsx'
import Destinations from './components/Destinations.jsx'
import Home from './pages/Home.jsx'
import Registration from './pages/Registration.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import NotFound from './pages/NotFound.jsx'
import InviteJoin from './pages/InviteJoin.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

function PageTitle() {
  const location = useLocation();
  useEffect(() => {
    const staticTitles = {
      '/': 'Home',
      '/destinations/': 'Destinations',
      '/register/': 'Register',
      '/login/': 'Sign In',
    };
    let page = staticTitles[location.pathname];
    if (!page) {
      if (location.pathname.startsWith('/d/')) page = 'Destination';
      else if (location.pathname.startsWith('/u/')) page = 'Profile';
      else if (location.pathname.startsWith('/invite/')) page = 'Join';
    }
    document.title = page ? `${page} - TravelBin` : 'TravelBin';
  }, [location.pathname]);
  return null;
}

// After returning from Keycloak login/register, auto-join the pending invite and
// navigate directly to the destination — no round-trip through InviteJoin needed.
function PendingInviteAutoJoin() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (authLoading || !user) return;
    const token = sessionStorage.getItem('pendingInviteToken');
    if (!token) return;
    sessionStorage.removeItem('pendingInviteToken');
    apiClient.post(`/travel/invite/${token}/join/`)
      .then(res => navigate(`/d/${res.data.destination_id}`))
      .catch(err => {
        const destId = err.response?.data?.destination_id;
        if (destId) navigate(`/d/${destId}`);
        else navigate(`/invite/${token}`);
      });
  }, [user, authLoading]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <Router>
        <PageTitle />
        <PendingInviteAutoJoin />
        <Routes>
          <Route path="/register/" element={<Registration />}/>
          <Route path="/login/" element={<Login />}/>

          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Home />}/>
            <Route path="/d/:id" element={<Entry />}/>
            <Route path="/u/:id" element={<Profile />}/>
            <Route path="/destinations/" element={<Destinations />}/>
            <Route path="/invite/:token" element={<InviteJoin />}/>
            <Route path="*" element={<NotFound />} />
          </Route>

        </Routes>
      </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App
