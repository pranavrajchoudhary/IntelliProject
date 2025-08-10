import axios from 'axios';

// We can configure the backend url later here.
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 5000,
});

const mockApiCall = (data, success = true, errorMessage = 'Something went wrong.') => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) {
        resolve({ data });
      } else {
        reject(new Error(errorMessage));
      }
    }, 1000);
  });
};

// Placeholder API calls for authentication.
// We will replace the mockApiCall with the actual axios call to our backend.
export const login = async (email, password) => {
  // const response = await api.post('/auth/login', { email, password });
  // return response.data;
  
  console.log('Simulating login with:', email, password);
  if (email === 'test@user.com' && password === 'password') {
    return mockApiCall({ message: 'Login successful' });
  } else {
    return mockApiCall(null, false, 'Invalid email or password.');
  }
};

export const register = async (email, password) => {
  // const response = await api.post('/auth/register', { email, password });
  // return response.data;

  console.log('Simulating registration with:', email, password);
  return mockApiCall({ message: 'Registration successful' });
};

// We can add other API calls here as you build out your backend.
export const getProjects = async () => {
  // const response = await api.get('/projects');
  // return response.data;

  console.log('Simulating fetching projects');
  const projects = [
    { id: 1, name: 'Project Alpha' },
    { id: 2, name: 'Project Beta' },
  ];
  return mockApiCall(projects);
};