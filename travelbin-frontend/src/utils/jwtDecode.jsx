import { jwtDecode } from 'jwt-decode';

// Function to decode the JWT token
export const decodeToken = () => {
  const token = localStorage.getItem('access');
  if (token) {
    return jwtDecode(token);
  }
  return null;
};
