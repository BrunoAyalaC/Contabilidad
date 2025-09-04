export const fetchRucData = async (ruc: string) => {
  const API_URL = 'http://localhost:5008/api/consulta-ruc'; // URL del SunatService

  try {
    const response = await fetch(`${API_URL}/${ruc}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Error en la petición: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error al consultar el RUC:', error);
    throw new Error(error.message || 'No se pudo conectar con el servicio de consulta RUC.');
  }
};
