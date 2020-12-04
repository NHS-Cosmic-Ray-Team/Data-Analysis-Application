//A boolean to track whether all files have been checked.
var doneCheckingFiles;

//A boolean to track whether the last file is done being loaded
var doneLoadingFile;

//An array of the contents of valid CSV files.
var combinedFiles;

//A counter to keep track of how many valid CSV files were found
var validCount;

//Add drag and drop events for the file selecter.
$(".file-chooser")
.on("dragenter dragleave dragover drop", preventDefaults)
.on("dragenter dragover mouseenter", highlight)
.on("dragleave mouseleave", unhighlight)
.on("drop", fileUpload)
.on("click", fileDialog);

$(".file-chooser input[name=file]").change(fileManualUpload);

//Open file input dialog
function fileDialog(e) {
    var t = $(e.target).find("input[name=file]")[0];
    if(t != undefined)
        t.click();
}

//Handle when a file is opened using the system dialog
function fileManualUpload(e) {
    handleFiles(e.originalEvent.target.files, $(e.originalEvent.target).parent(".file-chooser"));
}

//A function for handling when a file is uploaded.
function fileUpload(e) {
    
    //In case the event is registered on a child element, change to the parent.
    var target = $(e.target);
    if(target.parent(".file-chooser").length > 0)
        target = target.parent(".file-chooser");
        
    target.removeClass("hover");
    
    //Get the files
    var files = e.target.files || (e.dataTransfer && e.dataTransfer.files) || (e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files);
    
    //Actually process the files.
    handleFiles(files, target);
}

//Function for handling the files that are uploaded.
function handleFiles(files, fileChooser) {
    //Reset the counters, trackers and array
    combinedFiles = [];
    doneCheckingFiles = false;
    doneLoadingFile = true;
    validCount = 0;
    
    for(var i = 0; i < files.length; i++) {        
        if(!validateFile(files[i])) {
            if(i == files.length - 1) {
                //If no valid files were found, visibly show an error. Otherwise, it will silently drop those files.
                if(validCount == 0) {
                    //Add then remove the error class.
                    fileChooser.addClass("error").removeClass("hover").delay(2000).queue(function() {
                        $(this).removeClass("error").dequeue();
                    });
                }
            
                //If this is the last file to be checked, and all other files have been processed, execute a callback with the files
                if(doneLoadingFile) {
                    var callback = eval(fileChooser.parent(".panel").parent(".overlay").attr("data-callback"));
                    if(typeof(callback) == "function")
                        callback(combinedFiles);
                }
            }
        } else {
            //Add that another valid counter was found.
            validCount++;
            
            var reader = new FileReader();
            reader.readAsText(files[i])
            
            //Note that the program is now loading a new file
            doneLoadingFile = false;

            // here we tell the reader what to do when it's done reading...
            reader.onload = readEvent => {
                readFileContents(readEvent, fileChooser, validCount);
            }
        }
        
        if(i == files.length - 1)
            doneCheckingFiles = true;
    }
    
    fileChooser.parent(".panel").parent(".overlay").fadeOut(200);
}

//Reads all of the files and combines them into an array of contents.
function readFileContents(event, fileChooser, index) {    
    var contents = event.target.result;

    combinedFiles.push(contents);
    
    //If this is the last file to be loaded, call the callback function
    if(doneCheckingFiles) {        
        //If this is the last file to be checked, and all other files have been processed, execute a callback with the files
        var callback = eval(fileChooser.parent(".panel").parent(".overlay").attr("data-callback"));
        
        if(typeof(callback) == "function")
            callback(combinedFiles);
    }
    
    //Indicate that the file's been loaded, if this is the most recent file to be loaded.
    if(index == validCount)
        doneLoadingFile = true;
}

//Adds a class to the file chooser when it's hovered over.
function highlight(e) {    
    if(!$(e.target).hasClass("error")) {
        if($(e.target).hasClass("file-chooser"))
            $(e.target).addClass("hover");
        else
            $(e.target).parent(".file-chooser").addClass("hover");
    }
}

//Removes a class from the file chooser when it's no longer hovered over.
function unhighlight(e) {
    if($(e.target).hasClass("file-chooser"))
        $(e.target).removeClass("hover");
    else
        $(e.target).parent(".file-chooser").removeClass("hover");
}

const VALID_TYPES = ["text/plain", "text/x-csv", "application/vnd.ms-excel", "application/csv", "application/x-csv", "text/csv", "text/comma-separated-values", "text/x-comma-separated-values", "text/tab-separated-values"];

//A function for validating to make sure uploaded files are valid.
function validateFile(file) {
    //Get the extension.
    var extension = file.name.split('.').pop();
    
    //If it's not a CSV file, return.
    if(extension != "csv" && extension != "txt")
        return false;
    
    //If the mime type doesn't match that of a CSV, it's not a valid file.
    if(!VALID_TYPES.includes(file.type))
        return false;
    
    return true;
}

//Prevent defaults on an event.
function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}
