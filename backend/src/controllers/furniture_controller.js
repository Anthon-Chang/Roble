import axios from 'axios';

const API_BASE_URL = 'https://furniture-api.fly.dev';

// ----------------------------------------------
// 1. OBTENER TODOS LOS MUEBLES (PRODUCTOS)
// ----------------------------------------------
export async function getAllFurniture(req, res) {
  try {
    const response = await axios.get(`${API_BASE_URL}/v1/products?limit=50&offset=0`);

    const productList = response.data?.data || [];

    return res.status(200).json({
      status: 'success',
      count: productList.length,
      data: productList
    });

  } catch (error) {
    console.error('Error al obtener productos:', error.message);

    return res.status(error.response?.status || 500).json({
      status: 'error',
      message: 'No se pudo obtener la lista de productos.',
      details: error.message
    });
  }
}

// ----------------------------------------------
// 2. OBTENER UN MUEBLE POR SKU
// ----------------------------------------------
export async function getFurnitureById(req, res) {
  const sku = req.params.id; // tu frontend usará /123

  try {
    const response = await axios.get(`${API_BASE_URL}/v1/products/${sku}`);

    const product = response.data?.data;

    return res.status(200).json({
      status: 'success',
      data: product
    });

  } catch (error) {
    console.error(`Error al obtener el producto SKU ${sku}:`, error.message);

    return res.status(error.response?.status || 500).json({
      status: 'error',
      message: `Producto con SKU ${sku} no encontrado.`,
      details: error.message
    });
  }
}

