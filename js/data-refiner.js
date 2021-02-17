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
                    var element = $("<li class='flex-row flex-inline'><input name='" + field + "' type='checkbox' value='" + field + "' data-export-name='" + field + "' checked><label for='" + field + "'><input type='text' placeholder='Column " + fieldCounter + "' value='" + field + "'></label></li>");
                    element.find("input[type=text]").change(function() {
                        var exportName = $(this).val() != "" ? $(this).val() : $(this).attr("placeholder");
                        
                        //Set the export name on the checkbox
                        $(this).parent().siblings("input[type=checkbox]").attr("data-export-name", exportName);
                        
                        //Changes the labels on the outlier fields
                        $("div.outlier-checkboxes input[name='" + field + "'] + p").text(exportName);
                        
                        //Changes the li elements in the row modifications option
                        var li_rowmods = $("ul.select[name=select-rowmods-col] li[value='" + field + "']");
                        li_rowmods.text(exportName);
                        li_rowmods.attr("value", exportName);
                    })
                    
                    form.find("ul").append(element);
                
                    //Field counter for input placeholders
                    fieldCounter++;
                    
                    $("input[type=checkbox][name='" + field + "']").change(function() {
                        if($(this).is(":checked")) {
                            $("div.outlier-checkboxes").append($("<div class='flex-row flex-inline'><input type='checkbox' name='" + field + "' checked><p>" + $(this).attr("data-export-name") + "</p></div>"));
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
    
    //ROW MODS
    {
        var rowModsElement = $("<div class='option'>" + 
            "<div class='flex-row flex-wrap'>" +
                "<input name='use-rowmods' type='checkbox'><p>Use</p><ul name='select-rowmods-op' class='select' value='avg'>" +
                        "<p>Avg</p><div><div><li value='avg'>Avg</li><li value='min' col-required>Min</li><li value='max' col-required>Max</li><li value='first'>First</li><li value='last'>Last</li></div></div>" +
                    "</ul>" + 
                    "<ul name='select-rowmods-col' class='select hide'>" +
                        "<p>Column</p><div><div></div></div>" +           
                    "</ul>" +
                    "<p>value of every </p><input name='rowmod-num' type='number'><p> rows from the </p><ul name='select-rowmods-io' class='select' value='input'>" +
                        "<p>input</p><div><div><li value='input'>input</li><li value='output'ui>output</li></div></div>" +
                    "</ul>" +
            "</div>" +
          "</div>");
        
        //Limit the row number to being greater than 0.
        rowModsElement.find("input[type=number]").change(function() {
            if($(this).val() < 0)
                $(this).val(0);
        });
        
        //Creates a column selector
        var list = rowModsElement.find("ul.select[name=select-rowmods-col]");
        $("form.file-headers > ul li input[type=checkbox]").each(function() {
            //Get the column to add and the list.
            var col = $(this).attr("name");
            
            //If the list doesn't have a value, give it one.
            if(list.attr("value") == undefined)
                list.attr("value", col);
            
            //Add all of the li elements.
            list.find("> div").append($("<li value='" + col + "'>" + col + "</li>"));
        })
        
        //Make the column selector show up for certain operations.
        rowModsElement.find("ul.select[name=select-rowmods-op] li").click(function() {
            //Requires a column to be selected in certain cases.
            if($(this).attr("col-required") != undefined)
                list.removeClass("hide");
            else
                list.addClass("hide");
        })
        
        $("form.file-headers").append($("<h3 data-documentation='docs/refinement?id=with-row-modifications'>Row Modifications</h3>")).append(rowModsElement);
    }
    
    //OUTLIERS
    {
        $("form.file-headers").append($(
            "<h3>Outliers</h3>" +
            "<div class='option'>" +
                "<div class='flex-row flex-wrap'>" +
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
                
    
    //The content objects
    var contentObjs = contentObjsRefiner.map(x => x.data);
    
    //The cache, row mod mode and row mod column for row modifications.
    //The cache is kept outside of the contentObjs loop to ensure continuity through multiple files.
    var cache = [];
    var rowModMode = $("ul.select[name=select-rowmods-op]").attr("value");
    var rowModCol = $("ul.select[name=select-rowmods-col]").attr("value");
    
    //Loop through all files and all row ranges
    contentObjs.forEach(contentObj => {
        var content = [];
        
        //If row modifications are being used
        if($("input[type=checkbox][name=use-rowmods]").is(":checked")) {
            //Check if it's applied to inputs. If not, it will be applied later.
            if($(".select[name=select-rowmods-io]").attr("value") == "input") {
                //Get the number of rows to check at once.
                var rowCount = parseInt($("input[name=rowmod-num]").val());
                
                //Loop through each and apply the proper operation.
                var currValue;
                for(var i = 0; i < contentObj.length; i++) {
                    cache.push(contentObj[i]);
                    
                    if(cache.length >= rowCount) {
                        content.push(evaluateRowMods(cache, rowModMode, rowModCol));
                        
                        cache = [];
                    }
                }
            }
        }
        
        //If row modifications aren't applied to the input, the normal content can be used.
        if(content.length == 0) {
            content = contentObj;
        }
        
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
    
    //If row modifications are being used
    if($("input[type=checkbox][name=use-rowmods]").is(":checked")) {
        //Set to begin with the header
        var modifiedResult = [result[0]];
        
        //Check if it's applied to outputs. If not, it was already applied.
        if($(".select[name=select-rowmods-io]").attr("value") == "output") {
            //Get the number of rows to check at once.
            var rowCount = parseInt($("input[name=rowmod-num]").val());
            
            //Loop through each and apply the proper operation. Starts at 1 so the header isn't included.
            for(var i = 1; i < result.length; i++) {
                cache.push(result[i]);

                if(cache.length >= rowCount) {
                    modifiedResult.push(evaluateRowMods(cache, rowModMode, rowModCol));
                    cache = [];
                }
            }
        
            //Return the result with modified rows.
            return modifiedResult;
        }
    }
    
    //If row modificaitions weren't applied to the output, return the result.
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

/*
 * A function for transforming an array of rows into a singular row based on a specified mode.
 * Modes are 'min', 'max', 'first', 'last', or 'avg', each of which are relatively self explanatory.
 * The 'col' parameter is not needed unless the 'min' or 'max' modes are used.
 */
function evaluateRowMods(cache, mode, col="") {
    //Select the first element of the cache
    if(mode == "first")
        return cache[0];
    //Select the last element of the cache
    else if(mode == "last")
        return cache[cache.length - 1];
    //Averages every value in the cache
    else if(mode == "avg") {
        //Adds the values of each individual key from each element in the cache together
        var result = cache.reduce(function (accumulator, currValue) {
            Object.keys(currValue).forEach(function (key) {
                //The ternary operator is for when the accumulator hasn't been assigned to yet.
                //BigNumber library is used to ensure accurate precision, as floating point values aren't entirely precise.
                accumulator[key] = ((new BigNumber(currValue[key]).plus(accumulator[key] != undefined ? accumulator[key] : 0))).toString(); 
            });

            return accumulator;
        }, {});

        //Divides every value by the cache length to normalize it and make an average.
        //BigNumber library is used to ensure accurate precision, as floating point values aren't entirely precise.
        Object.keys(result).forEach(function(key) {
            result[key] = (new BigNumber(result[key]).dividedBy(cache.length)).toString();
        });
        
        //Returns the result.
        return result;
    }
    
    //For finding minimums and maximums, so the first element is what we'll compare to.
    var result = cache[0];
    console.log(result);
    for(var i = 1; i < cache.length; i++) {
        //Find the smallest/largest value of the specified column
        if(mode == "min") {
            if(result[col] < cache[i][col])
                result = cache[i];
        } else if(mode == "max") {
            if(result[col] > cache[i][col])
                result = cache[i];
        }
    }
    return result;
}