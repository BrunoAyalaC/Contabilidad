import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterInvoice from './pages/RegisterInvoice';
import JournalEntries from './pages/JournalEntries';
import OcrUpload from './pages/OcrUpload';
import ConsultaRuc from './pages/ConsultaRuc';

console.log('App: module loaded');

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  if (isAuthLoading) return <div style={{ padding: 20 }}>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const NavBar: React.FC = () => {
  const { isAuthenticated, logoutUser } = useAuth();
  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <nav style={styles.navbar}>
      <ul style={styles.navList}>
        {isAuthenticated ? (
          <>
            <li style={styles.navItem}><Link to="/consulta-ruc" style={styles.navLink}>Consulta RUC</Link></li>
            <li style={styles.navItem}><button onClick={handleLogout} style={styles.logoutButton}>Logout</button></li>
          </>
        ) : (
          <li style={styles.navItem}><Link to="/login" style={styles.navLink}>Login</Link></li>
        )}
      </ul>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div style={styles.appContainer}>
          <NavBar />
          <div style={styles.content}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/register-invoice"
                element={
                  <PrivateRoute>
                    <RegisterInvoice />
                  </PrivateRoute>
                }
              />
              <Route
                path="/journal-entries"
                element={
                  <PrivateRoute>
                    <JournalEntries />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ocr-upload"
                element={
                  <PrivateRoute>
                    <OcrUpload />
                  </PrivateRoute>
                }
              />
              <Route
                path="/consulta-ruc"
                element={
                  <PrivateRoute>
                    <ConsultaRuc />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
};

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  },
  navbar: {
    backgroundColor: '#333',
    padding: '10px 20px',
    color: 'white',
  },
  navList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  navItem: {
    marginRight: '20px',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#555',
    },
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1em',
  },
  content: {
    flexGrow: 1,
    padding: '20px',
  },
};

export default App;