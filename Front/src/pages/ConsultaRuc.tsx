import React, { useState } from 'react';
import { fetchRucData } from '../api/sunat';

const ConsultaRuc: React.FC = () => {
  const [ruc, setRuc] = useState('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!/^[0-9]{11}$/.test(ruc)) {
      setError('El RUC debe tener 11 dígitos numéricos.');
      return;
    }
    setError(null);
    setData(null);
    setIsLoading(true);
    try {
      const result = await fetchRucData(ruc);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Consulta de RUC en SUNAT</h1>
      <div style={styles.searchBox}>
        <input
          type="text"
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          placeholder="Ingrese RUC de 11 dígitos"
          style={styles.input}
          maxLength={11}
        />
        <button onClick={handleSearch} disabled={isLoading} style={styles.button}>
          {isLoading ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {data && (
        <div style={styles.resultsContainer}>
          <h2 style={styles.resultsTitle}>Resultados de la Consulta</h2>
          <div style={styles.grid}>
            {Object.entries(data).map(([key, value]) => (
              <div key={key} style={styles.gridItem}>
                <strong style={styles.key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> 
                <span style={styles.value}>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
  title: { textAlign: 'center' as 'center', color: '#333', marginBottom: '20px' },
  searchBox: { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
  input: { fontSize: '1em', padding: '10px', width: '300px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' },
  button: { fontSize: '1em', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { color: 'red', textAlign: 'center' as 'center' },
  resultsContainer: { marginTop: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' },
  resultsTitle: { borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  gridItem: { padding: '10px', borderBottom: '1px solid #eee' },
  key: { display: 'block', color: '#555', marginBottom: '5px' },
  value: { color: '#000' },
};

export default ConsultaRuc;
