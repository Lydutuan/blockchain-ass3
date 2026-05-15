const { ethers } = require("ethers");

const abi = require("./abi.json");

const provider =
  new ethers.JsonRpcProvider(
    process.env.RPC_URL, 
    undefined,
    {
      polling: true,
      pollingInterval: 4000,
    }
  );

  provider.polling = true; 

const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  wallet
);

provider.getCode(process.env.CONTRACT_ADDRESS)
  .then((code) => {
    if (code === "0x") {
      console.error(
        "ERROR: No contract code found at CONTRACT_ADDRESS on RPC_URL.",
        process.env.CONTRACT_ADDRESS,
        process.env.RPC_URL
      );
      console.error(
        "Please verify the deployed contract address and chain network."
      );
    }
  })
  .catch((err) => {
    console.error("ERROR: Failed to verify contract code:", err.message || err);
  });

module.exports = contract;