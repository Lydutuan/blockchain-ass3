require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const getCliNetwork = () => {
  const argv = process.argv;
  const networkIndex = argv.indexOf("--network");
  if (networkIndex >= 0 && networkIndex + 1 < argv.length) {
    return argv[networkIndex + 1];
  }
  return process.env.HARDHAT_NETWORK || "";
};

const isValidPrivateKey = (key) =>
  /^0x[0-9a-fA-F]{64}$/.test(key) &&
  key !== "0x0000000000000000000000000000000000000000000000000000000000000000";

const cliNetwork = getCliNetwork();
if (cliNetwork === "polygonAmoy" && !isValidPrivateKey(PRIVATE_KEY)) {
  throw new Error(
    "Invalid PRIVATE_KEY in .env. Set PRIVATE_KEY to a valid 64-byte hex private key before deploying to polygonAmoy."
  );
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    polygonAmoy: {
      url: POLYGON_AMOY_RPC,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
