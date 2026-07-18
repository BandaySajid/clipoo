import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const {
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY_ID,
    CLOUDFLARE_SECRET_ACCESS_KEY,
} = process.env;

const R2_BUCKET        = 'harud';
const R2_CUSTOM_DOMAIN = 'r2c.sajidbanday.me';

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

export async function uploadToR2(key, buffer, contentType) {
    await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buffer, ContentType: contentType }));
    return `https://${R2_CUSTOM_DOMAIN}/${key}`;
}

export async function deleteFromR2(key) {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
