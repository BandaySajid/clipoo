import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_BUCKET        = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'clipoo';
const R2_CUSTOM_DOMAIN = 'r2c.sajidbanday.me';

let r2Client = null;

function getR2() {
    if (!r2Client) {
        const endpoint = process.env.CLOUDFLARE_R2_S3_API_ENDPOINT
            ? process.env.CLOUDFLARE_R2_S3_API_ENDPOINT.replace(/\/[^/]+$/, '') // strip bucket from endpoint if present
            : `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
        r2Client = new S3Client({
            region: 'auto',
            endpoint,
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
    console.log(`[R2] Uploading to bucket=${R2_BUCKET} key=${key}`);
    await getR2().send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buffer, ContentType: contentType }));
    const url = `https://${R2_CUSTOM_DOMAIN}/${key}`;
    console.log(`[R2] Upload success: ${url}`);
    return url;
}

export async function deleteFromR2(key) {
    await getR2().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
