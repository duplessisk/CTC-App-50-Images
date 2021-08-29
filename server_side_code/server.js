const express = require("express");
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const originalObjectNumbers = require("./object_types");
const answerKeys = require("./object_types");
const objectTypes = require("./object_types");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: path.resolve(__dirname, './.env') });

const app = express();

app.set('view engine', 'ejs');

app.use('/static', express.static('client_side_code'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, 
    useUnifiedTopology: true , useFindAndModify: false });

const schema = new mongoose.Schema({   
    clientId: String, 
    previouslySubmitted: Boolean,
    firstName: String,
    lastName: String,
    company: String,
    wrongObjectsByPage: Object,
});

const Client = mongoose.model('CLIA-prevalidation-af', schema);

console.log();
console.log("server starting...");

const TEST_INFO = fs.readFileSync(__dirname + '/../client_side_code/test_info.txt', 'utf-8').split(',');
const TEST = TEST_INFO[0]
const TEST_VERSION = TEST_INFO[1]
const NUM_QUESTIONS = 50

// welcome page
app.get("/", function(request,response) {
    response.sendFile(path.join(__dirname + '/html_pages/welcome_page.html'));
});
app.post("/html_pages/welcome_page", function(request,response) {
    response.redirect('/html_pages/login_page');
});

// login page
app.get("/html_pages/login_page", function(request,response) {
    response.sendFile(path.join(__dirname + '/html_pages/login_page.html'));
});
app.post("/html_pages/login_page", function(request,response) {
    setClientCookie(request, response);
    response.redirect('/html_pages/instructions_page');
});

// instructions page
app.get("/html_pages/instructions_page", function(request,response) {
    initClientDocument(request, response);
});
app.post("/html_pages/instructions_page", function(request,response) {
    response.redirect('/html_pages/page_1');
});

// instructions page 2 (after the instructions have already been viewed once)
app.get("/html_pages/instructions_page_2", function(request,response) {
    response.sendFile(path.join(__dirname + 
        '/html_pages/instructions_page_2.html'));
});
app.post("/html_pages/instructions_page_2", function(request,response) {
    response.redirect('/html_pages/page_1');
});


// page 1
app.get("/html_pages/page_1", function(request,response) {
    response.sendFile(path.join(__dirname + '/html_pages/page_1.html'));
});
app.post("/html_pages/page_1", function(request,response) {
    processPage(request, 1, true);                      
    redirectPage(request, response, '/html_pages/instructions_page_2', 
        '/html_pages/page_2', '/html_pages/review_page');
});

// page 2
app.get("/html_pages/page_2", function(request,response) {
    response.sendFile(path.join(__dirname + '/html_pages/page_2.html'));
});
app.post("/html_pages/page_2", function(request,response) {
    processPage(request, 2, true);
    redirectPage(request, response, '/html_pages/page_1', '/html_pages/page_3',
        '/html_pages/review_page');
});

// page 3
app.get("/html_pages/page_3", function(request,response) {
    response.sendFile(path.join(__dirname + '/html_pages/page_3.html'));
});
app.post("/html_pages/page_3", function(request,response) {
    processPage(request, 3, true);
    redirectPage(request, response, '/html_pages/page_2', '/html_pages/page_4',
        '/html_pages/review_page');
});

// page 4
app.get("/html_pages/page_4", function(request,response) {
    response.sendFile(path.join(__dirname + '/html_pages/page_4.html'));
});
app.post("/html_pages/page_4", function(request,response) {
    processPage(request, 4, true);
    redirectPage(request, response, '/html_pages/page_3','/html_pages/page_5',
        '/html_pages/review_page');
});

// page 5
app.get("/html_pages/page_5", function(request,response) {
    response.sendFile(path.join(__dirname + '/html_pages/page_5.html'));
});
app.post("/html_pages/page_5", function(request,response) {
    processPage(request, 5, true);
    redirectPage(request, response, '/html_pages/page_4',
        '/html_pages/review_page','/html_pages/review_page');
});

// review page
app.get("/html_pages/review_page", function(request,response) {
    response.sendFile(path.join(__dirname + '/html_pages/review_page.html'));
});
app.post("/html_pages/review_page", function(request,response) {
    
    var id = request.cookies['session_id'];

    Client.findOne({clientId: id}, function(e, clientData) {
        
        var btnClicked = request.body.btn;
        if (btnClicked == "Previous") {
            processPage(request,5,false);
            redirectPage(request, response, '/html_pages/page_5','','');
        } else if (btnClicked == "pageOneNull") {
            processPage(request, 1,false);
            redirectPage(request, response,'','','/html_pages/page_1');
        } else if (btnClicked == "pageTwoNull") {
            processPage(request,2,false);
            redirectPage(request, response,'','','/html_pages/page_2');
        } else if (btnClicked == "pageThreeNull") {
            processPage(request,3,false);
            redirectPage(request, response,'','','/html_pages/page_3');
        } else if (btnClicked == "pageFourNull") {
            processPage(request,4,false);
            redirectPage(request, response,'','','/html_pages/page_4');
        } else if (btnClicked == "pageFiveNull") {
            processPage(request,5,false);
            redirectPage(request, response,'','','/html_pages/page_5');
        } else if (clientData.previouslySubmitted) {
            response.redirect('/html_pages/form_already_submitted_page');
        } else {

            Client.findOneAndUpdate({clientId: id}, 
                {previouslySubmitted: true}, {upsert: false}, 
                    function() {});

            var numObjectsByType = postAllObjectPaths();
            [wrongObjectsByType,totalWrongByType] = 
                postWrongObjectPaths(clientData.wrongObjectsByPage);
            
            var totalIncorrect = getTotalIncorrect(totalWrongByType);

            writeResultsData(numObjectsByType, totalWrongByType, 
                totalIncorrect);
            writeResultsFile(request, totalIncorrect, totalWrongByType, 
                numObjectsByType, wrongObjectsByType);

            sendEmailWithResults(request);

            response.redirect('/html_pages/results_page');
        }
    });
});

// results page 
app.get("/html_pages/results_page", function(request,response) {
    response.sendFile(path.join(__dirname + '/html_pages/results_page.html'));
});

// page already submitted
app.get("/html_pages/form_already_submitted_page", function(request,response) {
    response.sendFile(path.join(__dirname + 
        '/html_pages/form_already_submitted_page.html'));
});

app.listen(process.env.PORT || 3000);

/**
 * Sets a cookie for each client.
 * @param {http} request - Client http request to the server.
 * @param {http} response - Server http response to the client.
 */
function setClientCookie(request, response) {
    fullName = request.body.fullName;
    company = request.body.company;
    addressLineOne = request.body.addressLineOne
    addressLineTwo = request.body.addressLineTwo
    city = request.body.city
    state = request.body.state
    country = request.body.country
    zipCode = request.body.zipCode

    response.cookie("session_id", fullName + "." + company + "." + addressLineOne + "." + addressLineTwo + "." +
        city + "." + state + "." + country + "." + zipCode);
}

/**
 * Initializes client data in MongoDB. If the form has already been submitted by
 * that particular user, then they aren't allowed to proceed. 
 * @param {http} request - Client http request to the server.
 * @param {http} response - Server http response to the client.
 */ 
function initClientDocument(request, response) {

    var id = request.cookies['session_id'];

        Client.findOne({clientId: id}, function(e,clientData) {
            if (clientData != null && clientData.previouslySubmitted) {
                response.sendFile(path.join(__dirname + 
                    '/html_pages/form_already_submitted_page.html'));
            } else {
                const newClient = new Client({ 
                    clientId: id,
                    previouslySubmitted: false,
                    wrongObjectsByPage: [ [], [], [], [], [] ]
                });
                
                newClient.save();

                Client.findOneAndUpdate({clientId: id}, 
                    {firstName: request.body.firstName, 
                        lastName: request.body.lastName,
                            company: request.body.company}, {upsert: false}, 
                                function() {});

                response.sendFile(path.join(__dirname + 
                    '/html_pages/instructions_page.html'));

            }
        });

}

/**
 * Sets the wrong answers for each page 
 * @param {http} request - client http request to the server.
 * @param {http} response - server http response to the client.
 * @param {Number} pageNumber - Page whose wrong paths are to be reset.
 * @param {String} path1 - Path associated with the previous page. 
 * @param {String} path2 - Path associated with the next page.
 * @param {String} path3 - path associated with the target page (doesn't have 
 *                         to be the previous or next page).
 * @param {Boolean} notComingFromReviewPage - True if client request isn't made
 *                                            from the review page, false o/w.
 */
function processPage(request, pageNumber, notComingFromReviewPage) {

    var id = request.cookies['session_id'];

    Client.findOne({clientId: id}, function(e,clientData) {
        
        var updatedWrongObjectsByPage = clientData.wrongObjectsByPage;
        updatedWrongObjectsByPage[pageNumber - 1] = [];
        
        Client.findOneAndUpdate({clientId: id}, 
            {wrongObjectsByPage: updatedWrongObjectsByPage}, {upsert: false},
                function() {
                    if (notComingFromReviewPage) {

                        answerKey = answerKeys.answerKeys[pageNumber - 1];
                        var clientResponses = getClientResponses(request);
    
                        setWrongObjectsByPage(request, answerKey, clientResponses, 
                            pageNumber - 1);
                    }
                });
    });   
}

/**
 * Stores answer key, client responses, and determines wrong object paths for
 * each page in the client side form.
 * @param {Array} answerKey - Contains all answers for this page. 
 * @param {http} request - Client http request to the server.
 * @param {number} pageNumber - App page number (1-5) client is on.
 */
function getClientResponses(request) {
    var clientResponses = initClientResponses(request);
    return setClientResponses(clientResponses);
}

/**
 * Consumes and stores client responses from this page.
 * @param {http} request - Client http request to the server.
 * @return - Array containing client responses to the questions from this page.
 */
function initClientResponses(request) {
    return [
        request.body.radio0,
        request.body.radio1,
        request.body.radio2,
        request.body.radio3,
        request.body.radio4,
        request.body.radio5,
        request.body.radio6,
        request.body.radio7,
        request.body.radio8,
        request.body.radio9
    ]
}

/**
 * Sets all client responses with boolean and null values.
 * @param {Array} clientResponses - Contains client responses for each object.
 * @return - Array containing client responses to the questions from this page.
 */
function setClientResponses(clientResponses) {
    for (var i = 0; i < clientResponses.length; i++) {
        if (clientResponses[i] == "cell") {
            clientResponses[i] = true;
        } else if (clientResponses[i] == "notCell")  {
            clientResponses[i] = false;
        } else {
            clientResponses[i] = null;
        }
    }
    return clientResponses;
}

/**
 * Stores each object the client got incorrect.
 * @param {http} request - Client http request to the server.
 * @param {Array} answerKey - Contains all answers for this page. 
 * @param {Array} clientResponses - Contains client responses for each object.
 * @param {number} pageNumber - App page number (1-5) client is on.
 */
function setWrongObjectsByPage(request,answerKey,clientResponses,pageNumber) {

    var id = request.cookies['session_id'];

    Client.findOne({clientId: id}, function(e,clientData) {

        var updatedWrongObjectsByPage = clientData.wrongObjectsByPage;

        for (var i = 0; i < 10; i++) {
            if (answerKey[i] != clientResponses[i] || 
                clientResponses[i] == null) {  
                var objectNumber = String(pageNumber) + String(i);
                updatedWrongObjectsByPage[pageNumber].push(objectNumber);
            }
        }

        Client.findOneAndUpdate({clientId: id}, 
            {wrongObjectsByPage: updatedWrongObjectsByPage}, {upsert: false}, 
            function() {});

    });
}

/**
 * Serves appropriate html page to client depending on their request
 * @param {http} request - Client http request to the server.
 * @param {String} path1 - Path associated with the previous page. 
 * @param {String} path2 - Path associated with the next page.
 * @param {String} path3 - path associated with the target page (doesn't have 
 *                         to be the previous or next page).
 */
function redirectPage(request, response, path1, path2, path3) {
    var btnClicked = request.body.btn;
    if (btnClicked == "Previous") {
        response.redirect(path1);
    } else if (btnClicked == "Next") {
        response.redirect(path2);
    } else {
        response.redirect(path3);
    }
}

/**
 * Sets and writes all objects paths by type and number of objects by type. 
 * @return - Map containing number of objects by type.
 */
function postAllObjectPaths() {
    [allObjectsByType, numObjectsByType] = setAllObjectPaths();
    writeObjectPaths(allObjectsByType, "all_object_paths");
    return numObjectsByType;
}

/**
 * Sets all objects paths by type and number of objects by type. 
 * @return - Map containing all object paths by type and map containing number 
 *           of objects by type. 
 */
function setAllObjectPaths() {

    var allObjectTypes = objectTypes.objectTypes;

    var allObjectsByType = new Map();
    var numObjectsByType = new Map();

    for (var i = 0; i < allObjectTypes.length/10; i++) {
        for (var j = 0; j < 10; j++) {
            var objectNum = String(i) + String(j);
            var objectPath = '/static/final_object_answers/object' + objectNum 
                + '.png';
            var thisObjectType = allObjectTypes[Number(objectNum)];
            if (allObjectsByType.has(thisObjectType)) {
                allObjectsByType.get(thisObjectType).push(objectPath);
                // increment total number objects for this Object type
                numObjectsByType.set(thisObjectType, 
                    numObjectsByType.get(thisObjectType) + 1);
            } else {
                allObjectsByType.set(thisObjectType, new Array(objectPath)); 
                // init total number objects for this Object type
                numObjectsByType.set(thisObjectType, 1);
            }
        }
    }  
    return [allObjectsByType, numObjectsByType];
}

/**
 * Sets and writes wrong objects paths by type and number of objects by type. 
 * @param {Array} wrongObjectsByPage - Contains wrong objects by page (1-5).
 * @return - Map containing wrong object paths by type and map containing 
 *           number of wrong objects by type.
 */
function postWrongObjectPaths(wrongObjectsByPage) {
    [wrongObjectsByType,totalWrongByType] = 
        setWrongObjectPaths(wrongObjectsByPage);
    writeObjectPaths(wrongObjectsByType, "wrong_object_paths");
    return [wrongObjectsByType,totalWrongByType];
}

/**
 * Sets the wrong object paths by type
 * @param {Array} wrongObjectsByPage - Contains wrong objects by page (1-5).
 * @return - Map containing wrong object paths by type and map containing 
 *           number of wrong objects by type.
 */
function setWrongObjectPaths(wrongObjectsByPage) {

    var allObjectTypes = objectTypes.objectTypes;

    [wrongObjectsByType, totalWrongByType] = initWrongMaps(allObjectTypes);

    for (var i = 0; i < 5; i++) {
        for (var j = 0; j < wrongObjectsByPage[i].length; j++) {
            var objectNum = wrongObjectsByPage[i][j];
            var objectPath = '/static/final_object_answers/object' + objectNum + 
                '.png';
            var thisObjectType = getThisObjectType(allObjectTypes,objectNum);
            if (wrongObjectsByType.has(thisObjectType)) {
                totalWrongByType.set(thisObjectType, 
                    totalWrongByType.get(thisObjectType) + 1);
                wrongObjectsByType.get(thisObjectType).push(objectPath);
            }
        }
    }
    return [wrongObjectsByType, totalWrongByType];
}

/**
 * Initializes keys for both wrongObjectsByType and totalWrongByType maps.
 * @param {Array} allObjectTypes - Contains type of all objects.
 * @return - Map containing wrong object paths by type and map containing 
 *           number of wrong objects by type.
 */
function initWrongMaps(allObjectTypes) {
    var totalWrongByType = new Map();
    var wrongObjectsByType = new Map();
    for (var i = 0; i < allObjectTypes.length; i++) {
        var objectType = allObjectTypes[i];
        totalWrongByType.set(objectType, 0);
        wrongObjectsByType.set(objectType, new Array());
    }
    return [wrongObjectsByType,totalWrongByType];
}

/**
 * Records the total number of incorrect responses for each object type.
 * @param {Map} totalWrongByType - Contains total number of wrong objects by 
 *                                  type.
 * @return - total number of incorrect objects (type agnostic). 
 */
function getTotalIncorrect(totalWrongByType) {
    var totalIncorrect = 0;
    var keys = Array.from(totalWrongByType.keys());
    for (var i = 0; i < keys.length; i++) {
        totalIncorrect += totalWrongByType.get(keys[i]);
    }
    return totalIncorrect;
}

/**
 * Writes either wrong object or all object data to JSON file that's sent to 
 * the client side.
 * @param {Map} objectsByType - Contains objects (either wrong or all) whose 
 *                              data needs to be written to a JSON file.
 * @param {String} fileName - File to write data to.
 */
function writeObjectPaths(objectsByType,fileName) {
    fs.writeFile("./client_side_code/" + fileName + ".json", "", function(){
        var objectsByTypeKeys = Array.from(objectsByType.keys());
        for (var i = 0; i < objectsByTypeKeys.length; i++) {
            for (var j = 0; j < objectsByType.get(objectsByTypeKeys[i]).length; 
                j++) {
                    var thisObjectObject = {};
                    thisObjectObject[objectsByTypeKeys[i]] =
                    objectsByType.get(objectsByTypeKeys[i])[j];
                    fs.appendFileSync("./client_side_code/" + fileName +
                        ".json", JSON.stringify(thisObjectObject, null, 4), 
                            function(){});
            }
        }
    });   
}


/**
 * Returns the type of this object.
 * @param {Array} allObjectTypes - Contains type of all objects.
 * @param {String} objectNum - String representation of object number.
 * @return - This object's type.
 */
function getThisObjectType(allObjectTypes,objectNum) {
    if (Number(objectNum.charAt(0) == 0)) {
        var num = Number(objectNum.charAt(1));
        return allObjectTypes[num];
    } else {
        return allObjectTypes[Number(objectNum)];
    }
}

/**
 * Computes and writes result data (overall score and score by object type)
 * that will be displayed on the client side.
 * @param {Map} numObjectsByType - Contains number of objects by type
 * @param {Map} totalWrongByType - Contains number of objects user answered 
 *                                  incorrectly by type.
 * @param {Number} totalIncorrect - Total number of incorrect objects 
 *                                  (type agnostic)  
 */
function writeResultsData(numObjectsByType, totalWrongByType, totalIncorrect) {
    var numObjectsByTypeString = setNumObjectsByType(numObjectsByType);
    var totalWrongByTypeString = setTotalWrongByType(totalWrongByType);
    var totalIncorrectString = setTotalIncorrect(totalIncorrect);

    fs.writeFile("./client_side_code/results_data.json",  
        totalIncorrectString + 
        totalWrongByTypeString + 
        numObjectsByTypeString , function() {
    });
}

/**
 * Returns JSON String representing the total number of incorrect responses
 * by the client.
 * @param {Number} totalIncorrect - total number of incorrect objects 
 *                                  (type agnostic).
 * @return - JSON String representing total number of incorrect responses by 
 *           the client.
 */
function setTotalIncorrect(totalIncorrect) {
    totalIncorrectObject = {};
    totalIncorrectObject["totalIncorrect"] = totalIncorrect;
    return JSON.stringify(totalIncorrectObject, null, 4);
}

/**
 * Returns JSON string representing total number of questions by object type.
 * @param {Map} numObjectsByType - contains total number of objects by type.
 * @return - JSON string representing total number of objects by type.
 */
function setNumObjectsByType(numObjectsByType) {
    var numObjectsByTypeObject = {};
    var numObjectsByTypeKeys = Array.from(numObjectsByType.keys());
    for (var i = 0; i < numObjectsByTypeKeys.length; i++) {
        var thisNumObjectsByType = 
            numObjectsByType.get(numObjectsByTypeKeys[i]);
        numObjectsByTypeObject[numObjectsByTypeKeys[i]] = 
            thisNumObjectsByType;
    }
    return JSON.stringify(numObjectsByTypeObject,null,4);
}

/**
 * Returns JSON string representing total number of objects (by type) answered 
 * incorrectly by the client.
 * @param {Map} totalWrongByType - contains number of wrong objects by type.
 * @return - a string representing the client's total number of incorrect 
 *           responses by Object type.
 */
function setTotalWrongByType(totalWrongByType) {
    var totalWrongByTypeObject = {};
    var totalWrongByTypeKeys = Array.from(totalWrongByType.keys());
    for (var i = 0; i < totalWrongByTypeKeys.length; i++) {
        var thisTypeTotalIncorrect = 
            totalWrongByType.get(totalWrongByTypeKeys[i]);
        totalWrongByTypeObject[totalWrongByTypeKeys[i]] = 
            thisTypeTotalIncorrect;
    }
    return JSON.stringify(totalWrongByTypeObject,null,4);
}

/**
 *
 * @param {*} i -
 * @param {*} wrongObjectNumber -
 * @return -
 */
function getWrongObjectNumberIndex(i, wrongObjectNumber) {
    if (wrongObjectNumber.charAt(i) == '0') {
        return Number(wrongObjectNumber.charAt(1));
    } else {
        return Number(wrongObjectNumber);
    }
}


/**
 * Writes the final_results.txt that will be emailed to the admin.
 * @param {http} request - Client http request to the server.
 * @param {Map} totalWrongByType - Contains number of incorrectly answered 
 *                                 objects by type.
 * @param {Map} numObjectsByType {Map} - Contains total number of objects 
 *                                       by type.
 * @param {Map} wrongObjectsByType - Contains incorrectly answered objects 
 *                                   by type. 
 */
function writeResultsFile(request, totalIncorrect, totalWrongByType, 
                          numObjectsByType, wrongObjectsByType) {

    var clientInfo = request.cookies['session_id'].split(".");

    fullName = clientInfo[0];
    company = clientInfo[1];
    addressLineOne = clientInfo[2];
    addressLineTwo = clientInfo[3];
    city = clientInfo[4];
    state = clientInfo[5];
    country = clientInfo[6];
    zipCode = clientInfo[7];

    fs.writeFile("./final_results.txt","", function() {
        if (addressLineTwo == ""){
            fs.appendFileSync("./final_results.txt","Test Taker: " + fullName +
                "\n" + "\n" + "Affiliation Info: " + "\n" +  company + "\n" + addressLineOne + "\n"
                    + city + ", " + state + ", " + country + ", " + zipCode + "\n" + "\n", function() {})
        } else {
            fs.appendFileSync("./final_results.txt","Test Taker: " + fullName + "\n"
                + "\n" + "Affiliation Info: " + "\n" +  company + "\n" + addressLineOne + "\n" +
                    addressLineTwo + "\n" + city + ", " + state + ", " + country + ", " + zipCode + "\n" + "\n",
                        function() {})
        }
        fs.appendFileSync("./final_results.txt", "Test: " + TEST + "\n", function() {})
        fs.appendFileSync("./final_results.txt", "Test Version: " + TEST_VERSION + "\n" + "\n", function() {})
        fs.appendFileSync("./final_results.txt", "Final Result: ",function() {});
        fs.appendFileSync("./final_results.txt", (NUM_QUESTIONS - totalIncorrect) +
        " out of " + NUM_QUESTIONS + " (" + Math.round(100*((NUM_QUESTIONS-totalIncorrect)/NUM_QUESTIONS))
            + "%)" + ", " + getPassOrFail(totalIncorrect) + "\n", function() {});
        var keys = Array.from(totalWrongByType.keys());
        for (var i = 0; i < keys.length; i++) {
            fs.appendFileSync("./final_results.txt", "\n" +
                fileContents(keys[i], numObjectsByType, totalWrongByType,
                    wrongObjectsByType),
                        function(){});
        }
        var time = new Date();
        time.setUTCHours(time.getUTCHours() - 7);
        fs.appendFileSync("./final_results.txt", "\n" + "Time Stamp: "  + setTimeFormat(time),
            function(){});
    });
}


function setTimeFormat(time) {
    var timeStampString = "";
    timeStampString += time.getFullYear() + "-"
    timeStampString += convertMonth(time.getMonth()) + "-";
    timeStampString += time.getDate() + ", ";
    timeStampString += time.toLocaleTimeString()
    return timeStampString;
}

function convertMonth(month) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[parseInt(month, 10)]
}

/**
 *
 */
function getPassOrFail(totalIncorrect) {
    if (totalIncorrect > 10) {
        return "Fail"
    } else {
        return "Pass"
    }
}

/**
 * Returns the breakdown of the client's performance by object type.
 * @param {String} objectType - This object's type.
 * @param {Map} numObjectsByType - Contains number of objects by type.
 * @param {Map} totalWrongByType - Contains number of objects user answered
 *                                 incorrectly by type.
 * @param {Map} wrongObjectsByType - Contains incorrectly answered objects
 *                                   by type.
 * @return - breakdown of the client's performance by object type.
 */
function fileContents(objectType, numObjectsByType, totalWrongByType,
                      wrongObjectsByType) {

    var originalObjectNumberArr = originalObjectNumbers.originalObjectNumbers;
    var percentageIncorrect = 100*totalWrongByType.get(objectType)/
        numObjectsByType.get(objectType);
    var percentageCorrect = (100 - Math.round(percentageIncorrect));
    var globalMessage = "Object Type " + objectType + ": Correct " +
        (numObjectsByType.get(objectType) - totalWrongByType.get(objectType)) + " out of " +
            numObjectsByType.get(objectType) + " (" + percentageCorrect + "%)"
                + "\n";
    var granularMessage = "Objects Missed: ";
    if (wrongObjectsByType.get(objectType).length == 0) {
       granularMessage += "None"
    } else {
        for (var i = 0; i < wrongObjectsByType.get(objectType).length; i++) {
            if (i != 0) {
                granularMessage += ", ";
            }
            var wrongObjectNumber = wrongObjectsByType.get(objectType)[i].substring(35,37);
            var wrongObjectNumberIndex =
                getWrongObjectNumberIndex(i,wrongObjectNumber);
            granularMessage += originalObjectNumberArr[wrongObjectNumberIndex];
        }
    }
    granularMessage += "\n";
    return globalMessage + granularMessage;
}


/**
 * Sends email containing final_results.text (client performance) to the admin.
 */
function sendEmailWithResults(request) {

    var clientInfo = request.cookies['session_id'].split(".");

    fullName = clientInfo[0];

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user:process.env.EMAIL_SENDER_ACC,
            pass:process.env.EMAIL_SENDER_PASSWORD
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_SENDER_ACC,
        to: process.env.EMAIL_RECIEVER_ACC,
        subject: fullName + " " + TEST_VERSION,
        attachments: [{
            filename: 'final_results.txt',
            path: './final_results.txt'
        }]
    }

    transporter.sendMail(mailOptions, function(e,data) {
        if (e) {
            console.log(e);
        }
    });

}