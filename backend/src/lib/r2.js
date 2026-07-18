import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_BUCKET        = 'harud';
const R2_CUSTOM_DOMAIN = 'r2c.sajidbanday.me';

let r2Client = null;

function getR2() {
    if (!r2Client) {
        r2Client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
                secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
            },
            forcePathStyle: true,
        });
    }
    return r2Client;
}

export async function uploadToR2(key, buffer, contentType) {
    await getR2().send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buffer, ContentType: contentType }));
    return `https://${R2_CUSTOM_DOMAIN}/${key}`;
}

export async function deleteFromR2(key) {
    await getR2().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
