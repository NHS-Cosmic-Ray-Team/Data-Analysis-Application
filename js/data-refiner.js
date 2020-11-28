//The array of contents, held as an object
var contentObjsRefiner;

//Acts as a callback for the filechooser
function loadDatasetsRefiner(fileContents) {
    //Empty the array when new files are uploaded
    contentObjsRefiner = [];
    
    //Remove any pre-existing UI.
    $("div[name=data-refiner] form.file-headers").remove();
    $("div[name=data-refiner] .panel div.buttons").remove();
    $("div[name=data-refiner] .panel div.actions button[name=export]").remove();
    
    //Create the form for selecting options.
    var form = $("<form class='file-headers'><h3>Form Headers</h3><ul name='checkboxes'></ul></form></div>");
    $("div[name=data-refiner] .panel").prepend(form);
    
    //Loop through each file, save its contents, and add its fields to the list of choices.
    for(var i = 0; i < fileContents.length; i++) {
        fileContents[i] = fileContents[i].split('\n').filter(x => {
            return x.replace(/,|\r|\n/g, '').length != 0;
        }).join('\n');
        
        var data = Papa.parse(fileContents[i], {
            header: true,
            skipEmptyLines: true
        });
        contentObjsRefiner.push(data.data);
                
        //Add the fields as checkboxes to select
        data.meta.fields.forEach(field => {
            if(field != "") {
                if(form.find("ul li input[name=" + field + "]").length <= 0) {
                    form.find("ul").append($("<li class='flex-row'><input name='" + field + "' type='checkbox' value='" + field + "' checked><label for='" + field + "'>" + field + "</label></li>"))
                    
                    if(i > 0)
                        form.append($("<p class='warning'>Warning: Differing fields in loaded files.</p>"))
                }
            }
        });
    }
    
    allOrNoneButtons();
    rowSelectorOption();
    exportButton();
    sendToAnalyzerButton();
}

//Creates an option to choose a row range to export
function rowSelectorOption() {
    //A variable tracking the maximum number of rows allowed.
    var maxRows = 0;
    contentObjsRefiner.forEach(x => {
        maxRows += x.length;
    });
    
    //Create the element
    $("form.file-headers").append($("<h3>Options</h3><div class='option flex-row' name='rows'><input type='checkbox' name='select-rows'><p>Select Rows</p><input type='number' step='1' name='select-rows-start' value='0'><p>to</p><input type='number' step='1' name='select-rows-end' value='" + maxRows + "'></div>"));
    
    //Stop non-numerical values from being entered
    $("form.file-headers .option[name=rows] input[type=number]")
    .on("input", function() {
        $(this).val($(this).val().replace(/[^0-9]/g,''));
    });
    
    //Stop values over the maximum row count from being entered.
    $("form.file-headers .option[name=rows] input[name=select-rows-end]")
    .on("change", function() {
        $(this).val($(this).val().replace(/[^0-9]/g,''));
        
        if(parseInt($(this).val()) > maxRows)
            $(this).val(maxRows);
    })
}

//Add buttons for selecting all or none.
function allOrNoneButtons() {
    //Element for holding the buttons
    var buttons = $("<div class='buttons flex-row-center'>");
    $("form.file-headers").append(buttons);
    
    //Create the elements
    var selectAllButton = $("<button type='button' name='select-all' class='alt-button flex-column'>Select All</button>").click(function() {
        $("form.file-headers ul[name=checkboxes] li input[type=checkbox]").prop("checked", true);
    });
    var selectNoneButton = $("<button type='button' name='select-none' class='alt-button flex-column'>Select None</button>").click(function() {
        $("form.file-headers ul[name=checkboxes] li input[type=checkbox]").prop("checked", false);
    });
    
    //Append them
    buttons.append(selectAllButton);
    buttons.append(selectNoneButton);
}

//A function for creating the export button
function exportButton() {
    var exportButton = $("<button type='button' name='export'>Export</button>").click(exportFiles);
    
    //Append it
    $("div[name=data-refiner] .panel > div.actions").prepend(exportButton);
}

//A function for creating the send to analyzer button
function sendToAnalyzerButton() {
    var sendToAnalyzerButton = $("<button type='button' name='export'>Send to Analyzer</button>").click(function() {
        loadDatasetsAnalyzer(
            Papa.unparse(generateExportedCSVObject())
        );
    });
    
    //Append it
    $("div[name=data-refiner] .panel > div.actions").prepend(sendToAnalyzerButton);
    
    window.scrollTo(0, $("a[name=graphs]").position().top);
}

//A function for exporting the selection
function exportFiles() {
    var blob = new Blob([
        Papa.unparse(generateExportedCSVObject())
    ], {type: "text/csv;charset=utf-8"});
    saveAs(blob, "export.csv");
}

//Generates a CSV file with only the selected fields included.
function generateExportedCSVObject() {
    //Get all checked inputs to get a list of the selected fields.
    var selectedFields = $("form.file-headers ul[name=checkboxes] input:checked").map(function() { 
        return this.value; 
    }).get();
    
    var result = [selectedFields];
    
    //Get the start and end rows.
    var rowsOption = $("form.file-headers .option[name=rows] input[type=checkbox]").prop("checked");
    var bounds = rowsOption ? [
        parseInt($("form.file-headers .option[name=rows] input[name=select-rows-start]").val()),
        parseInt($("form.file-headers .option[name=rows] input[name=select-rows-end]").val())
    ] : [0, 0];
    
    console.log(bounds);
    
    contentObjsRefiner.forEach(content => {
        if(!rowsOption)
            bounds[1] = content.length;
        
        console.log(bounds);
        
        for(var i = bounds[0]; i < bounds[1]; i++) {
            result.push(valuesKeysContain(content[i], selectedFields))
        }
    });
    
    return result;
}
            
//A function that returns an array of values if their keys exist in the contains array.
function valuesKeysContain(pairing, contains) {
    var result = [];
    for(var key in pairing)
        if(contains.includes(key))
            result.push(pairing[key]);
    
    return result;
}