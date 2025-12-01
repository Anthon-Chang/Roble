import axios from "axios";

const API_BASE_URL = "https://furniture-api.fly.dev";

export async function fetchAllFurniture() {
  const response = await axios.get(`${API_BASE_URL}/v1/products?limit=50&offset=0`);
  return response.data.data; // solo la lista
}

export async function fetchFurnitureById(id) {
  const response = await axios.get(`${API_BASE_URL}/v1/products/${id}`);
  return response.data.data;
}
