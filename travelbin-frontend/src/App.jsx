import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext.jsx'

import './styles/App.css'
import { Layout } from './components/Layout.jsx'
import Entry from './pages/Entry.jsx'
import Destinations from './components/Destinations.jsx'
import Home from './pages/home.jsx'
import Registration from './pages/Registration.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import NotFound from './pages/NotFound.jsx'
import ThemeToggleButton from './components/ThemeToggleButton.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <Router>
      
        <Routes>
          <Route path="/register/" element={<Registration />}/>
          <Route path="/login/" element={<Login />}/>

          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Home />}/>
            <Route path="/d/:id" element={<Entry />}/>
            <Route path="/u/:id" element={<Profile />}/>
            <Route path="/destinations/" element={<Destinations />}/>
            <Route path="*" element={<NotFound />} />
          </Route>
      
        </Routes>
      </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App
