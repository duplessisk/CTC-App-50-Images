const fs = require('fs');

function main() {

    var objectInfo = [];

    var rows = getFileContents();

    populateObjectInfo(objectInfo,rows);

        //      page:  1   2   3   4   5   6   7   8
    answerKeys = [ [] ,[] ,[] ,[] ,[], [], [], [] ];
    objectTypes = [];
    originalObjectNumbers = [];
    var objectNumbers = new Map();

    setKeys(objectNumbers,objectInfo,answerKeys,objectTypes,originalObjectNumbers);

    // renameObjects(objectNumbers);

    exports.originalObjectNumbers = originalObjectNumbers;
    exports.answerKeys = answerKeys;
    exports.objectTypes = objectTypes;

}

main();

/**
 * Stores each row of excel data.
 * @param {Array} rows - row of the excel data.
 * @param {Array} objectInfo - contains each row of excel data.
 */
function populateObjectInfo(objectInfo,rows) {
    for (var i = 0; i < rows.length; i++) {
        objectInfo.push(rows[i].toString().split(','));
    }
}

/**
 * Reads data from excel sheet.
 * @return - Array containing data from excel sheet.
 */
function getFileContents() {
    var fileContents = fs.readFileSync(__dirname +
        '/50_images_no_AF_information.csv');

    var rows = fileContents.toString().split(new RegExp('\r?\n'));
    return rows.splice(1,rows.length - 2);
}

/**
 * Populates the answerKeys and objectTypes arrays based on the excel sheet.
 * @param {Map} objectNumbers - contains the image number associated with
 *                              each object.
 * @param {Array} objectInfo - contains each row of excel data.
 * @param {Array} answerKeys - Contains the answers for each object.
 * @param {Array} objectTypes - Contains type of each object.
 */
function setKeys(objectNumbers,objectInfo,answerKeys,objectTypes,originalObjectNumbers) {
    for (var i = 0; i < 8; i++) {
        for (j = 0; j < 10; j++) {
            var num;
            if (i == 0) {
                num = j;
                var originalObjectNumber = objectInfo[num][0].split('t')[1].trim();
                originalObjectNumbers.push(originalObjectNumber);
                objectNumbers.set(originalObjectNumber, '0' + String(num));
            } else {
                num = Number(String(i) + String(j));
                var originalObjectNumber = objectInfo[num][0].split('t')[1].trim();
                originalObjectNumbers.push(originalObjectNumber);
                objectNumbers.set(originalObjectNumber, String(num));
            }
            answerKeys[i].push(objectInfo[num][2] == "Cell");
            objectTypes.push(objectInfo[num][3]);
        }
    }

}

/**
 *
 * @param {*} objectNumbers -
 */
function renameObjects(objectNumbers) {
    fs.readdirSync(__dirname + '/../client_side_code/original_object_images').forEach(function(file,e) {
        var originalObjectNumber = getOriginalObjectNumber(file);
        changeObjectName(objectNumbers, file, originalObjectNumber);
    });
}

/**
 *
 * @param {File} file -
 */
function getOriginalObjectNumber(file) {
    var originalObjectNumber = file.split('t')[1];
    return originalObjectNumber.split('_')[0].trim();
}

/**
 *
 * @param {*} file -
 * @param {*} originalObjectNumber -
 */
function changeObjectName(objectNumbers, file, originalObjectNumber) {
    if (objectNumbers.has(originalObjectNumber)) {
        var updatedObjectNumber = objectNumbers.get(originalObjectNumber);
        fs.rename(__dirname + '/../client_side_code/original_object_images/' + file,
            __dirname + '/../client_side_code/final_object_images/object' +
                updatedObjectNumber + '.png', function(e) {
        });
    }
}
