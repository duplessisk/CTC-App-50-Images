/**
 * This script creates the results page. 
 */

/**
 * Main function that reads in JSON files, and links the data with the DOM.
 */
async function main() {

    addScoreToPageHeader();

    var wrongTypesMap = new Map();
    var allTypesMap = new Map();

    var wrongObjectPathsJson = await fetch("/static/wrong_object_paths.json");
    var wrongObjectPathsText = await wrongObjectPathsJson.text();
    setObjectPaths(wrongObjectPathsText, wrongTypesMap);
    
    var allObjectPathsJson = await fetch("/static/all_object_paths.json");
    var allObjectPathsText = await allObjectPathsJson.text();
    setObjectPaths(allObjectPathsText, allTypesMap);

    // To achieve specific object order wanted
    const objTypes = ["CTC", "ApoptoticCTC", "CK/EpCAMFoci", "WhiteBloodCell",
        "FluorescentArtifact", "SquamousCell"];
    const objLabels = ["Cell", "Not Cell", "Not Cell", "Not Cell", "Not Cell", "Not Cell"];
    const objDescription = ["CTC", "Apoptotic CTC", "CK/EpCAM Foci", "White Blood Cell", "Fluorescent Artifact", "SquamousCell"];

    createObjDivs(objTypes);
    
    var resultsJson = await fetch("/static/results_data.json");
    var resultsJsonText = await resultsJson.text();

    var incorrectNumTypesMap = new Map();
    var totalNumTypesMap = new Map();

    setResultsMaps(resultsJsonText,incorrectNumTypesMap,totalNumTypesMap);

    setResults(objTypes, objLabels, objDescription, incorrectNumTypesMap, totalNumTypesMap);
    createBtns(objTypes);

    var showBtnsClicked = [true,true,true,true,true,true];
    var showAllBtnsClicked = [true,true,true,true,true,true];

    // init showBtns functionality
    querySelectBtns(objTypes.length,".show-incorrect-type-btn", "showIncorrectType",
                    "Show Incorrect", "Hide Incorrect", "showAllType", 
                    "Show All", "Hide All", 17, showBtnsClicked,
                    showAllBtnsClicked, wrongTypesMap, "wrong", objTypes);
    // init showAllBtns functionaily
    querySelectBtns(objTypes.length,".show-all-type-btn", "showAllType", 
                    "Show All", "Hide All", "showIncorrectType", "Show Incorrect",
                    "Hide Incorrect", 11, showAllBtnsClicked, showBtnsClicked, 
                    allTypesMap, "all", objTypes);
}

main();


/**
 * Adds score to results page header.
 */
function addScoreToPageHeader() {
    // add content to pageHeader
    overallScore = document.createElement('div');
    overallScore.id = "overallScore";
    overallAnsweredCorrect = document.createElement('div');
    overallAnsweredCorrect.id = "overallAnsweredCorrect";
    document.body.appendChild(pageHeaderDiv);
    document.querySelector("#pageHeaderDiv").appendChild(overallScore);
    document.querySelector("#pageHeaderDiv").appendChild(overallAnsweredCorrect);

    // buffer to allow for gap between pageHeader and rest of page 
    bufferDiv = document.createElement('div');
    bufferDiv.id = "bufferDiv";
    document.body.appendChild(bufferDiv);
}

/**
 * Returns an array containing the data from the specified JSON file
 * @param {Promise} incorrectTypeBlocks - Promise obj that needs to be 
 *                                        parsed in order to obtain data
 */
function setObjectPaths(objectPathsText, typesMap) {
    var objectPathsString = filterString(objectPathsText);
    setTypesMap(objectPathsString.substring(0,
        objectPathsString.length - 1), typesMap);
}

/**
 * Creates string representing wrong_object_paths.JSON that excludes 
 * unnecessary tokens
 * @param {String} wrongObjectPathsText - contents from wrong_object_paths.JSON
 *                                        in String form
 * @return - String containing all wrong object paths
 */
function filterString(objectPathsText) {
    objectPathsString = "";
    for (let i in objectPathsText) {
        let t = objectPathsText[i];
        if (t != '{') {
            objectPathsString += t;
        }
    } 
    return objectPathsString;
}

/**
 * Occupies wrongTypesMap with the type of cell the user answered incorrectly 
 * and the object path associated with that cell.
 * @param {String} objectPathsString - String containing all wrong object paths.
 */
function setTypesMap(objectPathsString, typesMap) {
    var jsonObjArr = objectPathsString.split("}");
    // execute if block IF client got one or more objects wrong
    if (jsonObjArr[0].length != 0) { 
        for (var i = 0; i < jsonObjArr.length; i++) {
            var jsonObjSubArr = jsonObjArr[i].split(":");
            var thisCellType = formatCellTypeString(jsonObjSubArr[0]);
            var objectPath = jsonObjSubArr[1].replaceAll('"','');
            if (typesMap.has(thisCellType)) {
                typesMap.get(thisCellType).push(objectPath);
            } else {
                // objTypes and objLabels populated based on all object types.
                typesMap.set(thisCellType, new Array(objectPath)); 
            }    
        }
    }
}

/**
 * Trims the given cellTypesString so it matches that in the objTypes Array.
 * @param {String} cellTypeString - Cell type string to be trimmed. 
 */
function formatCellTypeString(cellTypeString) {
    cellTypeString = cellTypeString.replaceAll('"','');
    cellTypeString = cellTypeString.replaceAll(' ','');
    cellTypeString = cellTypeString.replace('\n','');
    return cellTypeString;
}

/**
 * Creates a Div for each object type.
 * @param {Array} objTypes - Contains all of the object types.
 */
function createObjDivs(objTypes) {
    for (var i = 0; i < objTypes.length; i++) {
        const objectDiv = document.createElement('div');
        objectDiv.id = "object" + i + "Div";
        objectDiv.className = "object-div";
        document.querySelector("#objectsDiv").appendChild(objectDiv);

        // setHeaders(i)

        objectInfoDiv = document.createElement('div');
        objectInfoDiv.id = "objectInfo" + i + "Div";
        objectInfoDiv.className = "object-info-div";
        document.querySelector("#object" + i + "Div").appendChild(objectInfoDiv);

        var objectHeaderDiv = document.createElement('div');
        objectHeaderDiv.id = "objectHeader" + i + "Div";
        objectHeaderDiv.className = "object-header-divs";
        document.querySelector("#object" + i + "Div").appendChild(objectHeaderDiv);
    }
}

/**
 * Sets incorrectNumTypesMap and totalNumTypesMap with contents from 
 * results_data.json. 
 * @param {String} resultsText - String representation of results_data.json 
 *                               contents. 
 */
function setResultsMaps(resultsText, incorrectNumTypesMap, totalNumTypesMap) {
    var resultsString = filterString(resultsText);

    var jsonResultsArr = resultsString.split("}");
    setTotalNumIncorrect(jsonResultsArr[0]);
    setNumByTypesMap(jsonResultsArr[1], incorrectNumTypesMap);
    setNumByTypesMap(jsonResultsArr[2], totalNumTypesMap);
}

/**
 * Sets the total number of incorrect responses by the user 
 * @param {String} totalNumIncorrectString - String representing data from 
 *                                           results_data.json. Contains total 
 *                                           number of incorrect responses by 
 *                                           the user. 
 */
function setTotalNumIncorrect(totalNumIncorrectString) {
    totalNumIncorrect = totalNumIncorrectString.substring(23,
        totalNumIncorrectString.length);
}

/**
 * Sets the total number of incorrect responses or total number of questions by
 * cell bin type 
 * @param {String} numByTypeString -   
 * @param {Map<String,Array>} numTypesMap - Map to set either 
 *                                          incorrectNumTypesMap 
 *                                          or totalNumsTypeMap
 * @param {Number} thisCellTypeIndex - index in numByTypeString that contains 
 *                                     the proper cell type bin
 * @param {Number} objectPathStartIndex - index in numByType string that 
 *                                       contains the start of the object path 
 *                                       of interest.
 */
function setNumByTypesMap(numByTypeString, numTypesMap) {
    var numTypeArr = numByTypeString.split(",");
    for (var i = 0; i < numTypeArr.length; i++) {
        var numTypeSubArr = numTypeArr[i].split(":");
        var thisCellType = numTypeSubArr[0];
        thisCellType = thisCellType.substring(0, objectPathsString.length - 1);
        thisCellType = formatCellTypeString(thisCellType);
        var numType = numTypeSubArr[1];
        numTypesMap.set(thisCellType, Number(numType)); 
    }
}

function createResultsHeader() {
    const resultsHeader = document.createElement('table');
    resultsHeader.classList.add("results-table-row","results-header-labels");
    const row = resultsHeader.insertRow(0);
    row.insertCell(0).innerHTML = "OBJECT";
    row.insertCell(1).innerHTML = "DESCRIPTION";
    const totalCount = row.insertCell(2);
    totalCount.className = "right-flushed-row";
    totalCount.innerHTML = "COUNT";
    const totalCorrect = row.insertCell(3);
    totalCorrect.className = "right-flushed-row";
    totalCorrect.innerHTML = "CORRECT";
    document.querySelector("#object0Div").appendChild(resultsHeader)

    const resultsHeaderLine = document.createElement('hr');
    resultsHeaderLine.className = "results-header-line";
    document.querySelector("#object0Div").appendChild(resultsHeaderLine)

    const resultsHeaderBuffer = document.createElement('div');
    resultsHeaderBuffer.className = 'results-header-buffer'
    document.querySelector("#object0Div").appendChild(resultsHeaderBuffer)

}

function createResultsRow(i, objLabels, objDescription, totalNumThisTypeValue, incorrectNumThisTypeValue) {
    var resultsTable = document.createElement('table');
    resultsTable.className = 'results-table-row'
    document.querySelector("#object" + i + "Div").appendChild(resultsTable)
    var resultsRow = resultsTable.insertRow(0);
    resultsRow.insertCell(0).innerHTML = objLabels[i];
    resultsRow.insertCell(1).innerHTML = objDescription[i]
    const totalNumThisType = resultsRow.insertCell(2);
    totalNumThisType.classList.add("right-flushed-row", "total-count-column");
    totalNumThisType.innerHTML = totalNumThisTypeValue;
    const numIncorrectThisType = resultsRow.insertCell(3);
    numIncorrectThisType.className = "right-flushed-row";
    numIncorrectThisType.innerHTML = Number(totalNumThisTypeValue) - Number(incorrectNumThisTypeValue);

    const showAllButtonColumn = resultsRow.insertCell(4);
    showAllButtonColumn.id = "showAllButtonColumn" + i;
    showAllButtonColumn.className = "right-flushed-row";

    const showIncorrectButtonColumn = resultsRow.insertCell(5);
    showIncorrectButtonColumn.id = "showIncorrectButtonColumn" + i;
    showIncorrectButtonColumn.classList.add("right-flushed-row", "left-padded-column");

    const showAllButtonDiv = document.createElement('div');
    showAllButtonDiv.className = "show-all-button-div";
    showAllButtonDiv.id = "showAllButtonDiv" + i
    document.querySelector("#showAllButtonColumn" + i)
        .appendChild(showAllButtonDiv);

    const showIncorrectButtonDiv = document.createElement('div');
    showIncorrectButtonDiv.className = "show-incorrect-button-div";
    showIncorrectButtonDiv.id = "showIncorrectButtonDiv" + i;
    document.querySelector("#showIncorrectButtonColumn" + i)
        .appendChild(showIncorrectButtonDiv);

}
/**
 * Uses information stored within totalIncorrect, incorrectNumTypesMap, and 
 * totalNumTypesMap to add the appropriate user data to the DOM.
 */
function setResults(objTypes, objLabels, objDescription, incorrectNumTypesMap, totalNumTypesMap) {
    var totalCorrect = 50;
    var totalNumQuestions = 0;

    createResultsHeader()

    for (var i = 0; i < objTypes.length; i++) {
        var incorrectNumThisTypeValue = incorrectNumTypesMap
            .get(objTypes[i]);
        var totalNumThisTypeValue = totalNumTypesMap
            .get(objTypes[i]);

        createResultsRow(i, objLabels, objDescription, totalNumThisTypeValue, incorrectNumThisTypeValue);

        const imgDiv = document.createElement('div');
        imgDiv.className = "img-div";
        imgDiv.id = "imgDiv" + i;
        document.querySelector("#object" + i + "Div").appendChild(imgDiv)

        if (i != objTypes.length - 1) {
            const resultsRowBuffer = document.createElement('hr');
            resultsRowBuffer.className = "results-row-buffer";
            document.querySelector("#object" + i + "Div").appendChild(resultsRowBuffer)
        }

        totalCorrect -= incorrectNumThisTypeValue;
        totalNumQuestions += totalNumThisTypeValue;
    }

    document.querySelector("#overallScore").innerHTML = "Score: " + 
        Math.round(100*(totalCorrect/totalNumQuestions)) + "%";
    document.querySelector("#overallAnsweredCorrect").innerHTML = totalCorrect +
        " out of " + totalNumQuestions;
}

/**
 * Creates btn elements and adds them to the DOM
 */
function createBtns(objTypes) {
    for (var i = 0; i < objTypes.length; i++) {
        var showIncorrectTypeBtn = document.createElement('button');
        showIncorrectTypeBtn.innerHTML = "Show Incorrect";
        showIncorrectTypeBtn.id = "showIncorrectType" + i + "Btn";
        showIncorrectTypeBtn.classList.add("show-type-btn", "show-incorrect-type-btn")
        document.querySelector("#showIncorrectButtonDiv" + i)
            .appendChild(showIncorrectTypeBtn);

        var showAllTypeBtn = document.createElement('button');
        showAllTypeBtn.innerHTML = "Show All";
        showAllTypeBtn.id = "showAllType" + i + "Btn";
        showAllTypeBtn.classList.add("show-type-btn", "show-all-type-btn")
        document.querySelector("#showAllButtonDiv" + i)
            .appendChild(showAllTypeBtn);

        // objects divs 
        var imgDiv = document.createElement('div');
        imgDiv.id = "img" + i + "Div";
        document.querySelector("#object" + i +"Div")
        .appendChild(imgDiv);
    }
}

/**
 * Adds an event listener to all of the show and show all btns. Contains 
 * code allowing for the dynamic content of these btns.
 * @param {String} thisBtnClass - this button's class.
 * @param {String} thisBtnId - this button's id.
 * @param {String} thisShowMsg - message button shows when it's not activated
 * @param {String} thisHideMsg - message button shows when it's activated
 * @param {String} otherBtnId - other button's id (e.g. if button is show
 *                              wrong button, opposite button is the show 
 *                              all button).
 * @param {String} otherShowMsg - message that other button shows when activated
 * @param {String} otherHideMsg -  message that other button shows when 
 *                                 deactivated
 * @param {Number} thisIdIndex - index providing the button's id num (the id
 *                               num is a number 1-6 and was assigned when 
 *                               button was created to differentiate between 
 *                               the 6 buttons of each class). 
 * @param {Array} thisBtnsClicked - Keeps track of whether the button is 
 *                                  activated (show or hide mode) or not.
 * @param {Array} otherBtnsClicked - Keeps track of whether the other button is 
 *                               is activated (show or hide mode) or not.
 * @param {Map} typesMap - map containing all the object paths (either wrong 
 *                       object or all object paths).
 * @param {String} imgType - differentiates between the wrongTypesMap and 
 *                           allTypesMap. 
 */
function querySelectBtns(numObjTypes, thisBtnClass, thisBtnId, thisShowMsg, 
                         thisHideMsg, otherBtnId, otherShowMsg, otherHideMsg, 
                         thisIdIndex, thisBtnsClicked, otherBtnsClicked, 
                         typesMap, imgType, objTypes) {
    for (var i = 0; i < numObjTypes; i++) {
        document.querySelectorAll(thisBtnClass)[i].addEventListener('click',
             function() {
                var objNum = Number(this.id.charAt(thisIdIndex));
                var clicked = thisBtnsClicked[objNum];
                // show objects for show btn
                if (clicked) {
                    document.getElementById(thisBtnId + objNum + "Btn")
                        .innerHTML = thisHideMsg;
                    if (document.getElementById(otherBtnId + objNum + "Btn")
                            .innerHTML == otherHideMsg) {
                        document.getElementById(otherBtnId + objNum + "Btn")
                            .innerHTML = otherShowMsg;
                        document.querySelector("#imgDiv" + objNum)
                            .innerHTML = '';
                        otherBtnsClicked[objNum] = true;
                    }
                    thisBtnsClicked[objNum] = false;
                    addObjectsToDom(objNum, typesMap, imgType, objTypes);
                } else { // hide objects for show btn
                    document.getElementById(thisBtnId + objNum + "Btn")
                        .innerHTML = thisShowMsg;
                    document.querySelector("#imgDiv" + objNum)
                        .innerHTML = '';
                        thisBtnsClicked[objNum] = true;
                }
        });
    }
}

/**
 * Adds incorrect cell objects to DOM
 * @param {Array} cellType - Stores all the cell type bins
 * @param {Array} incorrectTypeArr - Contains the paths of all incorrectly 
 *                                   answered objects based on cell type
 */
function addObjectsToDom(objNum, typesMap, objectType, objTypes) {
    var objType = objTypes[objNum].replaceAll(' ','');
    var objectPaths = typesMap.get(objType);
    if (objectPaths != undefined) { // avoid getting length of empty objectPaths
        for (var i = 0; i < objectPaths.length; i++) {

            var messageDiv = document.createElement('div');
            messageDiv.className = "message-div";
            messageDiv.id = "messageDiv";
    
            var objectNum = addOneToObjectNum(objectPaths[i].substring(36,38));

            var objectPath = objectPaths[i];

            var newImg = document.createElement('img');
            newImg.src = objectPath;
            newImg.id="resultsImg";

            if (objectType == "wrong") {
                messageDiv.innerHTML = "Object  " + objectNum;
            } else {
                messageDiv.innerHTML = "Object  " + objectNum;
            }
            document.querySelector("#imgDiv" + objNum)
                .appendChild(messageDiv);
            document.querySelector("#imgDiv" + objNum)
                .appendChild(newImg);
        }
    }
}

function addOneToObjectNum(objectNum) {
    if (objectNum[0] == '0') {
        objectNum = Number(objectNum[1]) + 1;
        if (objectNum < 10) {
            return '0' + String(objectNum);
        } else {
            return objectNum;
        }
    } else {
        return Number(objectNum) + 1
    }
}