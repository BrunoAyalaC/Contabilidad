import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logoutUser } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Dashboard</h2>
      {user ? (
        <p style={styles.welcomeText}>Welcome, {user.username}!</p>
      ) : (
        <p style={styles.loadingText}>Loading user data...</p>
      )}
      <button onClick={handleLogout} style={styles.button}>Logout</button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    color: '#333',
    marginBottom: '20px',
  },
  welcomeText: {
    fontSize: '1.2em',
    color: '#007bff',
    marginBottom: '20px',
  },
  loadingText: {
    fontSize: '1.2em',
    color: '#555',
    marginBottom: '20px',
  },
  button: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px',
  },
};

export default Dashboard;