const fs = require('fs');

var objectInfo = [];
var fileContents = fs.readFileSync(__dirname + '/50_images_no_AF_information.csv');
let rows = fileContents.toString().split(new RegExp('\r?\n'));

for (var i = 0; i < rows.length; i++) {
	objectInfo.push(rows[i].toString().split(','));
}

objectInfo = objectInfo.splice(1,objectInfo.length - 2);

objectTypes = [];
answerKeys = [ [], [], [], [], [] ];

//      page:   1    2    3    4    5
answerKeys = [ [] , [] , [] , [] , [] ];
for (var i = 0; i < objectInfo.length; i++) {
    answerKeys[Math.floor(i/10)].push(objectInfo[i][2] == "Cell");
    objectTypes.push(objectInfo[i][3]);
}

exports.answerKeys = answerKeys;
exports.objectTypes = objectTypes;