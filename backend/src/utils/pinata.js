const axios = require("axios");
const FormData = require("form-data");

/**
 * Upload buffer to Pinata IPFS
 */
async function uploadBuffer(buffer) {
  const form = new FormData();

  form.append("file", buffer, {
    filename: "file.enc",
  });

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    form,
    {
      maxBodyLength: "Infinity",
      headers: {
        ...form.getHeaders(),
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    }
  );

  return res.data;
}

module.exports = { uploadBuffer };