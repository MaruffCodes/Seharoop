export const fetchNotifications = async (token) => {
  // Security/Performance: Do not make the request if token is missing
  if (!token || typeof token !== 'string') {
    console.error('🚨 Fetch Notifications Error: No valid authentication token provided.');
    return [];
  }

  try {
    const response = await fetch('http://192.168.1.8:5001/api/patient/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Error Handling: Catch non-200 responses safely
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔔 Notifications fetched from server:', result.data);
    return result.data || [];
  } catch (error) {
    console.error('🚨 Fetch Notifications Error:', error.message);
    return [];
  }
};