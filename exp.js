var owners = {
  exoticpluto7: {
    wallet: 'ayy',
    token: 'aaa'
  },
  'salchipapa.llameante': {
    wallet: 'ayyy',
    token: 'bbbb'
  }
}
var async = require('async');
var obj = {owner: 'exoticpluto7'}

async.eachOf(owners, function (owner, ownerName, cb) {
  console.log(owner, ownerName);
  cb(null);
}, function (err) {

})

console.log(owners[obj.owner].token)