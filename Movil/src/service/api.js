import axios from 'axios';

// Default ESP32 IP, should be configurable in a real app
const ESP32_IP = '192.168.4.1'; 
const BASE_URL = `http://${ESP32_IP}`;

export const API_URL = (path) => `${BASE_URL}${path}`;

export const uploadAvatar = async (imageData) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageData.uri,
    name: 'avatar.bin',
    type: 'application/octet-stream',
  });

  return axios.post(API_URL('/api/avatar'), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
