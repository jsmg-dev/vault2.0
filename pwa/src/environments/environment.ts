export const environment = {
    production: false,
    // Use your computer's IP address for mobile testing
    // Replace 192.168.1.100 with your actual IP address
    apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:8080' 
      : `http://${window.location.hostname}:8080`
  };