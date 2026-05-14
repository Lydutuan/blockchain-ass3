import { Request, Response } from 'express';
import { addFileToIpfs } from '../services/ipfsService';
import { encryptBuffer } from '../services/encryptionService';
import FileModel from '../models/File';

export async function uploadFile(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const enableEncryption = (req.query.encrypt === 'true') || (process.env.ENABLE_ENCRYPTION === 'true');

    let buffer = file.buffer as Buffer;
    let encryptionMeta: any = null;
    let encryptionKey: string | undefined = undefined;

    if (enableEncryption) {
      const result = encryptBuffer(buffer);
      buffer = result.encrypted;
      encryptionMeta = { iv: result.iv, tag: result.tag };
      encryptionKey = result.key; // caller needs this to decrypt; store securely if needed
    }

    const cid = await addFileToIpfs(buffer);

    const doc = await FileModel.create({
      originalName: file.originalname,
      ipfsCid: cid,
      size: file.size,
      encrypted: !!enableEncryption,
      encryption: encryptionMeta,
      createdAt: new Date()
    });

    return res.json({ cid, id: doc._id, encryptionKey });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}

export async function getFileMeta(req: Request, res: Response) {
  try {
    const cid = req.params.cid;
    const doc = await FileModel.findOne({ ipfsCid: cid }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    return res.json(doc);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed' });
  }
}
