import { BrowserProvider, Contract} from "ethers";

// Deployed MedicalRecords contract address (Polygon Amoy). Override via VITE_CONTRACT_ADDRESS.
export const CONTRACT_ADDRESS =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS ||
  "0x1a1340BEEEcB6F6b6DDEf266A5777f509948a263";

const EXPECTED_CHAIN_ID = Number(
  (import.meta as any).env?.VITE_CHAIN_ID || "80002"
);

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


async function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Wallet not detected. Please install MetaMask.");
  }

  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);

  if (currentChainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Please switch MetaMask to the expected network (chainId ${EXPECTED_CHAIN_ID}). Current chainId: ${currentChainId}.`
    );
  }

  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (code === "0x") {
    throw new Error(
      `No contract found at address ${CONTRACT_ADDRESS} on chainId ${network.chainId}. ` +
      "Please verify your contract address and network."
    );
  }

  return provider;
}

export async function getContract(): Promise<Contract> {
  const provider = await getProvider();
  const accounts = await provider.listAccounts();

  if (accounts.length === 0) {
    throw new Error("Please connect wallet first.");
  }

  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export async function getReadContract(): Promise<Contract> {
  const provider = await getProvider();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function queryFilterChunks(
  contract: Contract,
  filter: any,
  fromBlock: number,
  toBlock: number,
  chunkSize = 1000
) {
  const logs: any[] = [];
  let start = fromBlock;

  while (start <= toBlock) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    const chunk = await contract.queryFilter(filter, start, end);
    logs.push(...chunk);
    start = end + 1;
  }

  return logs;
}

// Total number of records ever created. recordCounter starts at 1, so total = counter - 1.
export async function getTotalRecords(contract: Contract): Promise<number> {
  const counter = Number(await contract.recordCounter());
  return Math.max(0, counter - 1);
}