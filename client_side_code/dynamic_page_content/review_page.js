 /**
 * Allows for the review page to be dynamic. Specifically, this script 
 * lets the user know if they've skipped any questions (and lets them navigate
 * to the approprate pages) on the test before they submit.  
 */

function main() {

    document.getElementById("previousBtnDiv").classList.add('review');

    localStorage.setItem('reviewPageVisited', true);

    redirectPage('previousBtn');
    redirectPage('submitBtn');

    writeReviewMessage();

    var pagesContainSkippedQuestions = getNullPages();
    
    console.log(localStorage.getItem('pageOneHasNull'));

    console.log(pagesContainSkippedQuestions);

    findPagesWithSkippedQuestions(pagesContainSkippedQuestions);
    
    addNullButton(pagesContainSkippedQuestions)
    
}

main();

/**
 * 
 * @param {HTML Button} btn - btn that will listen for a click event. 
 */
function redirectPage(btn) {
    document.querySelector('#' + btn).addEventListener('click', function() {
        var formAlreadySubmitted = localStorage.getItem('formAlreadySubmitted');
        if (formAlreadySubmitted) {
            localStorage.setItem('formCompleted', true);
        } else {
            localStorage.setItem('formAlreadySubmitted', true);
        }
    });
}

/**
 * Writes introductary message on review page.
 */
function writeReviewMessage() {
    var reviewMessage = document.createElement('p');
    reviewMessage.id = "reviewMessage";
    reviewMessage.innerHTML = "All objects have been reviewed. The test can only be submitted once, please review " +
        "before pressing the 'submit' button";
    document.querySelector("#reviewMessageHeaderDiv")
        .appendChild(reviewMessage);
}

/**
 * Returns an array containing information on whether or not each page (1-5)
 * contains a blank client response.
 * @return - Array containing whether or not each page contains a blank 
 *           client response.
 */
function getNullPages() {
    var pagesContainBlankAnswers = [];
    var pages = ["One","Two","Three","Four","Five"];
    for (var i = 0; i < 5; i++) {
        pagesContainBlankAnswers[i] = localStorage.getItem('page' + 
            pages[i] + 'HasNull');
    }
    return pagesContainBlankAnswers;
}

/**
 * If one or more pages have a skipped question, a warning message is added to 
 * the review page.
 * @param {Array} pagesContainSkippedQuestions - Containins whether or not each 
 *                                               page contains a blank client 
 *                                               response.
 */
function findPagesWithSkippedQuestions(pagesContainSkippedQuestions) {
    if (pagesContainSkippedQuestions.includes("true")) {
        var skippedPages = document.createElement('p');
        skippedPages.innerHTML = "Note: There are at least one unassigned object on the following page(s). " +
            "Click the page to complete your test.";
        skippedPages.className = "review-page-messages";
        document.querySelector("#reviewMessageResultsDiv").appendChild(skippedPages);
    }
}

/**
 * Adds nullButton for a page (1-5) if the client skipped an question on that 
 * page.
 * @param {Array} pagesContainSkippedQuestions - Containins whether or not each 
 *                                               page contains a blank client 
 *                                               response. 
 */
function addNullButton(pagesContainSkippedQuestions) {
    var pages = ["One","Two","Three","Four","Five"];
    for (var i = 0; i < 5; i++) {
        if (pagesContainSkippedQuestions[i] == "true") {
            var pageNullBtn = document.createElement('button');
            pageNullBtn.innerHTML = "Page " + pages[i];
            pageNullBtn.className = "null-btns";
            pageNullBtn.name = "btn";
            pageNullBtn.value = "page" + pages[i] + "Null";
            pageNullBtn.type = "submit";
            var linebreak = document.createElement('br');
            document.querySelector("#nullPagesDiv").appendChild(linebreak);
            document.querySelector("#nullPagesDiv").appendChild(pageNullBtn);
        }
    }
}