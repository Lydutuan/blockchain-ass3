const axios = require("axios");
const FormData = require("form-data");

exports.uploadToIPFS = async (
  fileBuffer,
  fileName
) => {
  try {
    const data = new FormData();

    data.append(
      "file",
      fileBuffer,
      fileName
    );

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        maxBodyLength: Infinity,

        headers: {
          ...data.getHeaders(),

          pinata_api_key:
            process.env.PINATA_API_KEY,

          pinata_secret_api_key:
            process.env
              .PINATA_SECRET_API_KEY,
        },
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error(
      "IPFS Upload Error:",
      error.response?.data || error.message
    );

    throw new Error(
      "Failed to upload to IPFS"
    );
  }
};
