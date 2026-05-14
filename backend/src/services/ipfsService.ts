import { create } from 'ipfs-http-client';

const endpoint = process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001';
const client = create({ url: endpoint + '/api/v0' });

export async function addFileToIpfs(buffer: Buffer): Promise<string> {
  const result = await client.add(buffer);
  // result.cid is a CID object in newer client versions
  // convert to string
  // @ts-ignore
  return result.cid.toString();
}
