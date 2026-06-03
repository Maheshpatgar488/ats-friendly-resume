const text = 'Some text "AdobeExpressPhotos_355749c118034121a69ca9331b40a6fc_CopyEdited.png" more';
const sanitized = text
  .replace(/!\[.*?\]\(.*?\)/g, ' ')
  .replace(/<img[^>]*>/gi, ' ')
  .replace(/<source[^>]*>/gi, ' ')
  .replace(/data:image\/[^;]+;base64[^"]*/gi, ' ')
  .replace(/data:video\/[^;]+;base64[^"]*/gi, ' ')
  .replace(/https?:\/\/[^\s]*\.(png|jpg|jpeg|gif|webp|svg|ico|bmp|mp4|webm|ogg)[^\s]*/gi, ' ')
  .replace(/https?:\/\/[^\s]+\/([^\s\/]+\.(png|jpg|jpeg|gif|webp|svg|ico|bmp))/gi, ' ')
  .replace(/\b\w+\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)\b/gi, ' ')
  .replace(/\S+\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)\S*/gi, ' ');
console.log('Before:', JSON.stringify(text));
console.log('After:', JSON.stringify(sanitized));
