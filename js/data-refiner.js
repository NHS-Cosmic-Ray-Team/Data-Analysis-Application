//The array of contents, held as an object
var contentObjsRefiner;

//A dictionary of basic stats by field name
var basicStats = {};

//Acts as a callback for the filechooser
function loadDatasetsRefiner(fileContents) {    
    //Empty the array when new files are uploaded
    contentObjsRefiner = [];
    
    //Remove any pre-existing UI.
    $("div[name=data-refiner] form.file-headers").remove();
    $("div[name=data-refiner] .panel div.buttons").remove();
    $("div[name=data-refiner] .panel div.actions button[name=export]").remove();
    
    //Create the form for selecting options.
    var form = $("<form class='file-headers'><h3>Columns</h3><ul name='checkboxes'></ul></form></div>");
    $("div[name=data-refiner] .panel").prepend(form);
    
    var dataArrays = {};
    var fields;
        
    //Loop through each file, save its contents, and add its fields to the list of choices.
    for(var i = 0; i < fileContents.length; i++) {        
        fileContents[i] = fileContents[i].split('\n').filter(x => {
            return x.replace(/,|\r|\n/g, '').length != 0;
        }).join('\n');
                
        //Checks whether there's a header
        var lines = fileContents[i].split('\n');
        var hasHeader = lines[0].toLowerCase().startsWith("date");
                
        //If no header exists, add a default header.
        if(!hasHeader) {
            //The old contents of the file
            var contents = fileContents[i];
            
            var numColumns = lines[0].split(',').length + 1;            
            var header = "";
            for(var j = 0; j < numColumns; j++) {
                header += "Column" + (j + 1);
                if(j != numColumns - 1)
                    header += ",";
            }
            
            fileContents[i] = header + "\n" + contents;
        }
                    
        var data = Papa.parse(fileContents[i], {
            header: true,
            skipEmptyLines: true,
            transform: function(value, column) {
                //Removes headers inserted into the middle of files by the cosmic ray code
                if(value.toLocaleLowerCase() === column.toLocaleLowerCase())
                    return "";
                
                //Removes headers inserted into the middle of files that are caught in the previous line.
                var split = value.split(/\s/);
                if(split.length > 1)                
                    return split[0];
                
                //If there are no headers present, it just returns the original value.
                return value;
            }
        });
        contentObjsRefiner.push(data);
        
        //Sets the fields to the columns from the first file.
        if(fields == undefined)
            fields = data.meta.fields;
                
        //Add the fields as checkboxes to select
        var fieldCounter = 1;
        fields.forEach(field => {
            if(field != "") {
                data.data.forEach(obj => {
                    if(dataArrays[field] == undefined)
                        dataArrays[field] = [];
                    
                    dataArrays[field].push(obj[field]);
                })
                
                
                if(form.find("ul li input[name='" + field + "']").length <= 0) {
                    //Adds the checkbox and name changer for the fields
                    var element = $("<li class='flex-row'><input name='" + field + "' type='checkbox' value='" + field + "' data-export-name='" + field + "' checked><label for='" + field + "'><input type='text' placeholder='Column " + fieldCounter + "' value='" + field + "'></label></li>");
                    element.find("input[type=text]").change(function() {
                        var exportName = $(this).val() != "" ? $(this).val() : $(this).attr("placeholder");
                        
                        //Set the export name on the checkbox
                        $(this).parent().siblings("input[type=checkbox]").attr("data-export-name", exportName);
                        
                        //Changes the labels on the outlier fields
                        $("div.outlier-checkboxes input[name='" + field + "'] + p").text(exportName);
                    })
                    
                    form.find("ul").append(element);
                
                    //Field counter for input placeholders
                    fieldCounter++;
                    
                    $("input[type=checkbox][name='" + field + "']").change(function() {
                        if($(this).is(":checked")) {
                            $("div.outlier-checkboxes").append($("<div class='flex-row'><input type='checkbox' name='" + field + "' checked><p>" + $(this).attr("data-export-name") + "</p></div>"));
                        } else {
                            $("div.outlier-checkboxes input[name='" + field + "']").parent().remove();
                        }
                    });
                    
                    if(i > 0 && form.find("> .warning[name=fields]").length <= 0)
                        form.append($("<p name='fields' class='warning'>Warning: Differing fields in loaded files.</p>"))
                }
            }
        });
    }
    
    //Gets basic statistics for a number of data values.
    Object.keys(dataArrays).forEach(function(key) {   
        var arr = dataArrays[key].map(x => parseFloat(x));
        
        basicStats[key] = {
            mean: ss.mean(arr),
            deviation: ss.standardDeviation(arr)
        };
    });
        
    allOrNoneButtons();
    options();
    exportButton();
    sendToAnalyzerButton();
}

//Creates the options framework
function options() {
    //ROW RANGES
    {
        //A variable tracking the maximum number of rows allowed.
        var maxRows = 0;
        contentObjsRefiner.forEach(x => {
            maxRows += x.data.length;
        });


        var rowRangeCreationButton = $("<button type='button' name='row-ranges'>Create Row Range</button>").click(function() {
            createRowRange(maxRows);
        });

        $("form.file-headers").append($("<h3>Row Ranges</h3>")).append(rowRangeCreationButton);
    }
    
    //OUTLIERS
    {
        $("form.file-headers").append($(
            "<h3>Outliers</h3>" +
            "<div class='option'>" +
                "<div class='flex-row'>" +
                    "<input name='use-outliers' type='checkbox'><p>Exclude data points lying outside</p><input name='standard-deviations' type='number'><p>standard deviations.</p>" +
                "</div>" +
                "<div class='outlier-checkboxes flex-row'>" +
                "</div>" +
            "</div>"));
        
        $("form.file-headers > ul li input[type=checkbox]").each(function() {
            var field = $(this).attr("name");
            $("div.outlier-checkboxes").append($("<div class='flex-row'><input type='checkbox' name='" + field + "' checked><p>" + field + "</p></div>"));
        })
    }
    
    //QUERIES
    {
        //Creates a query
        var queryCreateButton = $("<button type='button' name='queries'>Create Query</button>").click(function() {
            createQuery();
        });
        
        var queryMatchMode = $("<div class='flex-row'><input name='query-mode' type='checkbox' checked><p>AND Matching Mode</p></div>");

        $("form.file-headers").append($("<h3 class='flex-row' data-documentation='docs/queries'>Inclusion Queries</h3>")).append(queryCreateButton).append(queryMatchMode);
    }
}

//Creates the inputs for constructing a row range to export
function createRowRange(maxRows) { 
    //A button for deleting the ow range element.
    var deleteButton = $("<button name='delete' type='button'>&times;</button>").click(function() {
        $(this).parent("div.row-range").remove();
    }).css("min-width", 0);
    
    //Create the element and attach the delete button
    var rangeEl = $(
    "<div class='option flex-row row-range' name='rows'>" + 
        "<p>Select Rows</p>" + 
        "<input type='number' step='1' name='select-rows-start' value='0'><p>to</p><input type='number' step='1' name='select-rows-end' value='" + maxRows + "'>" + 
    "</div>"
     ).prepend(deleteButton);
    
    //Stop non-numerical values from being entered
    rangeEl.find("input[type=number]")
    .on("input", function() {
        $(this).val($(this).val().replace(/[^0-9]/g,''));
    });
    
    //Stop values over the maximum row count from being entered.
    rangeEl.find("input[name=select-rows-end]")
    .on("change", function() {
        $(this).val($(this).val().replace(/[^0-9]/g,''));
        
        if(parseInt($(this).val()) > maxRows)
            $(this).val(maxRows);
    });
    
    rangeEl.insertBefore($("button[name=row-ranges]"));
}

//Creates the input for construction of a new inclusion query
function createQuery() {
    //A button for deleting the ow range element.
    var deleteButton = $("<button name='delete' type='button'>&times;</button>").click(function() {
        $(this).parent("div.query").remove();
    }).css("min-width", 0);
    
    //Create the element and attach the delete button
    var queryEl = $(
    "<div class='option flex-row query' name='rows'><input type='text' name='query'></div>"
     ).prepend(deleteButton);
    
    //Show user if the query is invalid
    queryEl.find("input[name=query]").on("change focusout", function() {
        var regex = new RegExp("(\\${.*?})+?", "gm");
        
        try {
            //Replaces variables with numbers to make it readable
            var result = math.evaluate($(this).val().replace(regex, "0"));

            if(result === true || result === false)
                $(this).removeClass("error");
            else
                $(this).addClass("error");
        } catch(e) {
            $(this).addClass("error");
        }
    }).focusin(function() {
        $(this).removeClass("error");
    })
    
    queryEl.insertBefore($("button[name=queries]"));
}

//Add buttons for selecting all or none.
function allOrNoneButtons() {
    //Element for holding the buttons
    var buttons = $("<div class='buttons flex-row-center'>");
    $("form.file-headers").append(buttons);
    
    //Create the elements
    var selectAllButton = $("<button type='button' name='select-all' class='alt-button flex-column'>Select All</button>").click(function() {
        $("form.file-headers ul[name=checkboxes] li input[type=checkbox]").prop("checked", true).change();
    });
    var selectNoneButton = $("<button type='button' name='select-none' class='alt-button flex-column'>Select None</button>").click(function() {
        $("form.file-headers ul[name=checkboxes] li input[type=checkbox]").prop("checked", false).change();
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
            [Papa.unparse(generateExportedCSVObject())]
        );
    
        window.location = "#analysis";
    });
    
    //Append it
    $("div[name=data-refiner] .panel > div.actions").prepend(sendToAnalyzerButton);
}

//A function for exporting the selection
function exportFiles() { 
    var exported = generateExportedCSVObject();
    
    var blob = new Blob([
        Papa.unparse(exported, {
            quotes: false,
            quoteChar: '',
            escapeChar: '',
            delimiter: ",",
            skipEmptyLines: 'greedy' //other option is 'greedy', meaning skip delimiters, quotes, and whitespace.
        })
    ], {type: "text/csv;charset=utf-8"});
    saveAs(blob, "export.csv");
}

//Generates a CSV file with only the selected fields included.
function generateExportedCSVObject() {
    //Get all checked inputs to get a list of the selected fields.
    var selectedFields = $("form.file-headers ul[name=checkboxes] input:checked").map(function() { 
        return this.value; 
    }).get();
    
    //Gets the actual user set names of the columns
    var selectedExportNames = $("form.file-headers ul[name=checkboxes] input:checked + label input[type=text]").map(function() {
        var value = $(this).parent().siblings("input[type=checkbox]").attr("data-export-name");
        if(value != undefined) {
            if(value == "")
                return $(this).attr("placeholder");
            
            return value;
        }
        
        return $(this).val();    
    }).get();
        
    //Get any existing queries
    var queries = $("form.file-headers .query input[type=text]").map(function() {
        return $(this).val();
    }).get();
        
    var result = [selectedExportNames];
    
    //Get the start and end rows.
    var rowRanges = [];
    $("form.file-headers .option.row-range").each(function(index, el) {
        rowRanges.push([
            parseInt($(this).find("input[name=select-rows-start]").val()),
            parseInt($(this).find("input[name=select-rows-end]").val())
        ]);
    });
    
    if(rowRanges.length == 0)
        rowRanges.push([0, 0]);
                
    //Loop through all files and all row ranges
    contentObjsRefiner.forEach(data => {
        var content = data.data;
        
        rowRanges.forEach(range => {            
            //Deal with cases where no range was specified or the range is out of bounds
            if(range[1] == 0 || range[1] > content.length)
                range[1] = content.length;
            
            for(var i = range[0]; i < range[1]; i++) {
                //Column refinement
                var push = valuesKeysContain(content[i], selectedFields);
                
                //Outlier refinement
                if($("input[name=use-outliers]").is(":checked"))
                    if(checkForOutliers(selectedFields, push))
                        continue;
                
                //Query refinement
                var matchMode = $("input[name=query-mode]").is(":checked") ? 0 : 1;
                if(!checkForQueries(queries, selectedFields, push, matchMode))
                    continue;
                
                result.push(push);
            }
        });
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

//A function that uses standard deviations to check for and eliminate outliers based on settings
function checkForOutliers(fields, array) {
    var deviations = parseFloat($("input[name=standard-deviations]").val());
    
    for(var i = 0; i < fields.length; i++) {
        if($("div.outlier-checkboxes input[type=checkbox][name='" + fields[i] + "']:checked").length > 0) {
            if(array[i] < basicStats[fields[i]].mean - basicStats[fields[i]].deviation * deviations || array[i] > basicStats[fields[i]].mean + basicStats[fields[i]].deviation * deviations)
                return true;
        }
    }
    
    return false;
}

/*
 * A function for comparing column values with a user-defined query.
 * matchMode = 0: AND matching, in which all queries must be matched
 * matchMode = 1: OR matching, in which at least one query must be matched
 */
function checkForQueries(queries, fields, array, matchMode=0) {        
    if(queries.length <= 0)
        return true;
    
    //The result for OR matching
    var result = false;
    
    //Check each query
    for(var i = 0; i < queries.length; i++) {
        //Stops modification of original queries.
        var query = queries[i];
        
        //Replace variable standins with the actual value
        for(var j = 0; j < fields.length; j++)
            query = query.replace("${" + fields[j] + "}", array[j].toString());
                
        try {            
            //If the result is false and all matches must be met, return false
            if(!math.evaluate(query) && matchMode == 0)
                return false;
            //If OR matching is occurring and the result is true, return true.
            if(math.evaluate(query) && matchMode == 1)
                return true;
        } catch(e) {            
            //If an error is thrown, exclude it
            return false;
        }
    }
    
    //If the end's been reached in AND matching, then it can be included because all queries have been met.
    //If the end's been reached in OR matching, then it should be excluded because no queries have been met.
    return matchMode == 0;
}