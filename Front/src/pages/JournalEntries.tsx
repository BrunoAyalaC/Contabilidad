import React, { useEffect, useState } from 'react';
import { getJournalEntries } from '../api/accounting';

const JournalEntries: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const data = await getJournalEntries();
        setEntries(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch journal entries.');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  if (loading) {
    return <div style={styles.container}><p>Loading journal entries...</p></div>;
  }

  if (error) {
    return <div style={styles.container}><p style={styles.error}>Error: {error}</p></div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Journal Entries</h2>
      {entries.length === 0 ? (
        <p>No journal entries found.</p>
      ) : (
        <div style={styles.entriesContainer}>
          {entries.map((entry: any) => (
            <div key={entry.id} style={styles.entryCard}>
              <p><strong>Invoice:</strong> {entry.registeredInvoice?.documentNumber} ({entry.registeredInvoice?.documentType})</p>
              <p><strong>Date:</strong> {new Date(entry.entryDate).toLocaleDateString()}</p>
              <p><strong>Description:</strong> {entry.description}</p>
              <h4 style={styles.linesHeader}>Lines:</h4>
              <ul style={styles.linesList}>
                {entry.entryLines.map((line: any) => (
                  <li key={line.id} style={styles.lineItem}>
                    {line.accountCode} - {line.accountName}: Debit {line.debit} / Credit {line.credit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
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
    padding: '20px',
  },
  header: {
    color: '#333',
    marginBottom: '20px',
  },
  entriesContainer: {
    width: '100%',
    maxWidth: '800px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  entryCard: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#f9f9f9',
  },
  linesHeader: {
    marginTop: '10px',
    marginBottom: '5px',
    color: '#555',
  },
  linesList: {
    listStyleType: 'none',
    padding: '0',
  },
  lineItem: {
    marginBottom: '5px',
    paddingLeft: '10px',
    borderLeft: '2px solid #007bff',
  },
  error: {
    color: 'red',
    marginTop: '15px',
    backgroundColor: '#ffe6e6',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid red',
  },
};

export default JournalEntries;
