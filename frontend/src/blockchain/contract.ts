import { BrowserProvider, Contract} from "ethers";

// Deployed MedicalRecords contract address (Polygon Amoy). Override via VITE_CONTRACT_ADDRESS.
export const CONTRACT_ADDRESS =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS ||
  "0xd035ee308B4588AE490D213D63809e53bd1aDB32";

// ABI matching the deployed MedicalRecords.sol contract
export const CONTRACT_ABI = [
  // Records
  "function recordCounter() view returns (uint256)",
  "function records(uint256) view returns (uint256 recordId, address owner, string ipfsCid, uint256 createdAt, bool exists)",
  "function addRecord(string ipfsCid) returns (uint256)",
  "function getRecord(uint256 recordId) view returns (tuple(uint256 recordId, address owner, string ipfsCid, uint256 createdAt, bool exists))",

  // Access control
  "function accessGrants(uint256,uint256) view returns (address grantedTo, uint256 grantedAt, uint256 expiryTime, bool isRevoked)",
  "function getAccessCount(uint256 recordId) view returns (uint256)",
  "function checkAccess(uint256 recordId, address user) view returns (bool)",
  "function grantAccess(uint256 recordId, address user, uint256 expiryTime)",
  "function revokeAccess(uint256 recordId, address user)",

  // Events
  "event RecordCreated(uint256 indexed recordId, address indexed owner, string ipfsCid, uint256 timestamp)",
  "event AccessGranted(uint256 indexed recordId, address indexed grantedTo, uint256 expiryTime, uint256 timestamp)",
  "event AccessRevoked(uint256 indexed recordId, address indexed revokedFrom, uint256 timestamp)",
];


export async function getContract(): Promise<Contract> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Wallet not detected. Please install MetaMask.");
  }

  const provider = new BrowserProvider(window.ethereum);

  const accounts = await provider.listAccounts();

  if (accounts.length === 0) {
    throw new Error("Please connect wallet first.");
  }

  const signer = await provider.getSigner();

  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export async function getReadContract(): Promise<Contract> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Wallet not detected.");
  }
  const provider = new BrowserProvider(window.ethereum);
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// Total number of records ever created. recordCounter starts at 1, so total = counter - 1.
export async function getTotalRecords(contract: Contract): Promise<number> {
  const counter = Number(await contract.recordCounter());
  return Math.max(0, counter - 1);
}