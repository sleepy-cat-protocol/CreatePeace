import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3001', // Hardcoded for now
  withCredentials: true, // Keep this for cookie transmission
});

export default instance;