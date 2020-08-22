/*
 * Usage:
 * node get_feedback.js 2020-04-06 >> output.txt
 * pipe feedback into output.txt with a bunch of jsons
*/
var admin = require('firebase-admin');
var serviceAccount = require("../BLANK");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "BLANK"
});
const admin_db = admin.firestore();

if (process.argv.length !== 3) {
  console.error("Expects arguments: node get_feedback.js [date]");
  console.error("Where date is of format e.g. 2020-04-22");
  console.error("First feedback ever was April 7")
  return;
}

admin_db.collection("feedback")
  .where("time", ">", new Date(process.argv[2]))
  .orderBy("time", "asc")
  .get().then((query) => {
    query.forEach(doc => {
      console.log(JSON.stringify(doc.data()));
    });
});