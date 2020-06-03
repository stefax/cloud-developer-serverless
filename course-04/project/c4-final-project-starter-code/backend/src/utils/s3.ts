import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export async function getUploadUrl(imageId: string): Promise<string> {
  return await s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}

export async function fileExists(imageId: string): Promise<boolean> {
  try {
    await s3.headObject({
      Bucket: bucketName,
      Key: imageId
    }).promise();
    return true
  } catch (headErr) {
    return headErr.code === 'NotFound'
  }
}

export async function removeFile(imageId: string): Promise<void> {
  await s3.deleteObject({
    Bucket: bucketName,
    Key: imageId
  })
}
