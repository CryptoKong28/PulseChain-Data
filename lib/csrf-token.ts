import { useEffect, useState } from 'react';

// Generate a secure random CSRF token
export const generateCSRFToken = (): string => {
  if (typeof window === 'undefined') return '';
  
  // Create a random string for the token
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const token = Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  
  // Store the token in localStorage or sessionStorage
  // For better security, using sessionStorage as it's cleared when the session ends
  sessionStorage.setItem('csrf_token', token);
  
  return token;
};

// Get the stored CSRF token, or generate a new one if none exists
export const getCSRFToken = (): string => {
  if (typeof window === 'undefined') return '';
  
  const storedToken = sessionStorage.getItem('csrf_token');
  if (storedToken) return storedToken;
  
  return generateCSRFToken();
};

// Validate a token against the stored one
export const validateCSRFToken = (token: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const storedToken = sessionStorage.getItem('csrf_token');
  return !!storedToken && token === storedToken;
};

// A React hook to get and update the CSRF token
export const useCSRFToken = (): string => {
  const [token, setToken] = useState<string>('');
  
  useEffect(() => {
    setToken(getCSRFToken());
  }, []);
  
  return token;
}; 