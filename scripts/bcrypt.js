// import bcrypt from 'bcrypt';
var bcrypt = require('bcrypt');

if (process.argv.length !== 3) {
  console.error("Expects three arguments: node bcrypt.js [password]");
  return;
}

console.log(bcrypt.hashSync(process.argv[2], 10));