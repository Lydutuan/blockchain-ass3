import { ethers } from "ethers";

import { MEDICAL_RECORDS_ABI }
from "../../MedicalRecords.abi.ts";

const CONTRACT_ADDRESS =
  "0x1F04016F7c823D5173Ff45a163C81b4AF65da9e8";

export async function getContract() {
  if (!(window as any).ethereum) {
    throw new Error("Wallet not found");
  }

  const provider =
    new ethers.BrowserProvider(
      (window as any).ethereum
    );

  const signer =
    await provider.getSigner();

  const contract =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      MEDICAL_RECORDS_ABI,
      signer
    );

  return contract;
}