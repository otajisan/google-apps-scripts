const md5sum = (input) => { 
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, input);

  // Byte -> String
  let digestStr = '';
  for (i = 0; i < digest.length; ++i) {
    let byte = digest[i];
    if (byte < 0) byte += 256;
    let byteStr = byte.toString(16);
    // Ensure we have 2 chars in our byte, pad with 0
    if (byteStr.length == 1) byteStr = '0' + byteStr;
    digestStr += byteStr;
  }

  return digestStr;
};

const getDate = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;