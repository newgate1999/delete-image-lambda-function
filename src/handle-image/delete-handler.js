const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sharp = require('sharp');
const path = require('path');
require('dotenv').config();

exports.deleteImage = async (event, context) => {
  for (const record of event.Records) {
    console.log('1');
    const sourceKey = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, ' '),
    );
    console.log('2');
    if (validFile(sourceKey)) {
      const nameFile = path.basename(sourceKey);
      const sourceKeyArr = sourceKey.split('/');
      const profile = sourceKeyArr[1];
      const allSizes = process.env.ALL_SIZE.split(',');
      console.log(sourceKey);
      try {
        console.log('4 ' + 'Total size: ' + allSizes.length);
        const sizes = allSizes.map((size) => takeSize(size));
        console.log("resized");
        const dataMapping = sizes.map((size, index) => {
          return {
            targetKey: `RESIZED/PROFILE/` + profile + `/${size.width}x${size.height}/`+ nameFile,
          };
        });
        console.log("mapping");
        const imagesDelete = await Promise.all(dataMapping.map(data => {
          return deleteImage(data.targetKey)
        }));
        console.log('successful');
      } catch (error) {
        console.log(error);
        return;
      }
    }
  }
  return;
};

function takeSize(size) {
  const [width, height] = size.split('x');
  return { width: Number(width), height: Number(height) };
}
function validFile(sourceKey) {
  const typeMatch = sourceKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.log('Could not determine the image type.');
    return false;
  }
  const imageType = typeMatch[1].toLowerCase();
  if (imageType != 'jpg' && imageType != 'png') {
    console.log(`Unsupported image type: ${imageType}`);
    return false;
  }
  return true;
}

function deleteImage(targetKey) {
  const targetParams = {
    Bucket: process.env.BUCKET,
    Key: targetKey,
  };
  return s3.deleteObject(targetParams).promise();
}
