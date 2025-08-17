// ULID風ユニークID生成
export function generateUniqueId() {
  const encoding = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let timeStamp = Date.now();

  // タイムスタンプ部分（48bit = 10文字）
  const timeChars = Array(10);
  for (let i = 9; i >= 0; i--) {
    timeChars[i] = encoding[timeStamp % 32];
    timeStamp = Math.floor(timeStamp / 32);
  }

  // ランダム部分（80bit = 16文字）
  const randomPart = cryptoRandomBytes(10);
  let value = 0;
  let bitLength = 0;
  const randChars = [];
  for (let i = 0; i < randomPart.length; i++) {
    value = (value << 8) | randomPart[i];
    bitLength += 8;
    while (bitLength >= 5) {
      bitLength -= 5;
      randChars.push(encoding[(value >> bitLength) & 31]);
    }
  }
  while (randChars.length < 16) {
    randChars.push(encoding[0]);
  }
  return timeChars.join('') + randChars.join('');
}

// GAS対応のランダムバイト生成
function cryptoRandomBytes(length: number) {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(Math.floor(Math.random() * 256));
  }
  return result;
}
