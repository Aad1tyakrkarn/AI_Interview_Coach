import { S3Client } from '@aws-sdk/client-s3';
import { config } from './index';

// S3 client - only initialized if AWS credentials are configured
export const s3Client = config.aws.accessKeyId
  ? new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
      ...(config.aws.endpoint ? { endpoint: config.aws.endpoint, forcePathStyle: true } : {}),
    })
  : null;

export const S3_BUCKET = config.aws.s3BucketName;
