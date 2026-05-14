const endpoint = process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001';
let client: any = null;

async function getClient() {
  if (client) return client;
  // dynamic import to support ESM-only ipfs-http-client installs
  const mod = await import('ipfs-http-client');
  const create = (mod as any).create ?? (mod as any).default?.create ?? (mod as any).default ?? (mod as any);
  client = create({ url: endpoint + '/api/v0' });
  return client;
}

export async function addFileToIpfs(buffer: Buffer): Promise<string> {
  const c = await getClient();
  const result = await c.add(buffer);
  // result.cid may be a CID object — convert to string
  // @ts-ignore
  return result.cid?.toString?.() ?? String(result?.cid ?? result?.[0]?.cid ?? '');
}
