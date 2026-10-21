// Gera um par RSA e imprime a chave pública (para "key" no manifest) e o id da extensão.
const crypto = require('node:crypto');

function extensionIdFromKey(keyB64) {
  const hash = crypto.createHash('sha256').update(Buffer.from(keyB64, 'base64')).digest('hex').slice(0, 32);
  return [...hash].map((c) => String.fromCharCode('a'.charCodeAt(0) + parseInt(c, 16))).join('');
}

if (require.main === module) {
  const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const key = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  console.log(JSON.stringify({ key, id: extensionIdFromKey(key) }, null, 2));
}
module.exports = { extensionIdFromKey };
