//DROPBOX
{
    //A counter to make sure all files are downloaded before sending to the callback.
    var dropboxDownloadCount;
    
    //An array of the downloaded Dropbox file contents.
    var dropboxDownloads;
    
    dropboxOptions = {

        // Required. Called when a user selects an item in the Chooser.
        success: function(files) {            
            //Reset the tracker variables
            dropboxDownloadCount = 0;
            dropboxDownloads = [];
                        
            for(var x = 0; x < files.length; x++) {
                //Download the file contents
                $.get(files[x].link, function(data) {                    
                    dropboxDownloads.push(data);
                    dropboxDownloadCount++;

                    if(dropboxDownloadCount == files.length) {
                        $(".overlay[name=choose-file]").fadeOut(200);
                        
                        var callback = eval($(".overlay[name=choose-file]").attr("data-callback"));

                        if(typeof(callback) == "function")
                            callback(dropboxDownloads);
                    }
                });
            }
        },

        // Optional. Called when the user closes the dialog without selecting a file
        // and does not include any parameters.
        cancel: function() {

        },

        // Optional. "preview" (default) is a preview link to the document for sharing,
        // "direct" is an expiring link to download the contents of the file. For more
        // information about link types, see Link types below.
        linkType: "direct", // or "direct"

        // Optional. A value of false (default) limits selection to a single file, while
        // true enables multiple file selection.
        multiselect: true, // or true

        // Optional. This is a list of file extensions. If specified, the user will
        // only be able to select files with these extensions. You may also specify
        // file types, such as "video" or "images" in the list. For more information,
        // see File types below. By default, all extensions are allowed.
        extensions: ['.csv', '.txt'],

        // Optional. A value of false (default) limits selection to files,
        // while true allows the user to select both folders and files.
        // You cannot specify `linkType: "direct"` when using `folderselect: true`.
        folderselect: false, // or true
    };    
    
    //Create the Dropbox button
    var dropboxChooser = Dropbox.createChooseButton(dropboxOptions);
    $(".file-chooser + .brand-buttons").append(dropboxChooser);
}

//GOOGLE DRIVE
{    
    // The Browser API key obtained from the Google API Console.
    // Replace with your own Browser API key, or your own key.
    const developerKey = 'AIzaSyAquK61E0nHb3paNECMIYeR4BnYVoP82iY';

    // The Client ID obtained from the Google API Console. Replace with your own Client ID.
    const clientId = "269931021072-03rs6hc92sua3hapb43j8nsinaagghk5.apps.googleusercontent.com"

    // Replace with your own project number from console.developers.google.com.
    // See "Project number" under "IAM & Admin" > "Settings"
    const appId = "269931021072";

    // Scope to use to access user's Drive items.
    const scope = ['https://www.googleapis.com/auth/drive.readonly'];
    
    var oauthToken;
    var pickerApiLoaded;
    
    
    
    
    //A function for when the Google APIs are loaded
    function onGapiLoad() {
    }
    
    //A function for loading the various APIs required.
    function loadApis(e) {
        e.preventDefault();
        gapi.load('auth2', onAuthApiLoad);
        gapi.load('picker', onPickerApiLoad);
    }

    //Authorize the GAPI after loading the auth
    function onAuthApiLoad() {
        window.gapi.auth2.authorize(
            {
                'client_id': clientId,
                'scope': scope,
                'immediate': false
            },
            handleAuthResult);
    }
    
    //Create the picker after loading the API
    function onPickerApiLoad() {
        pickerApiLoaded = true;
        createPicker();
    }

    //Stores a valid OAuth token.
    function handleAuthResult(authResult) {
        if (authResult && !authResult.error) {
            oauthToken = authResult.access_token;
            createPicker();
        }
    }

    //A function for creating the picker object
    function createPicker() {
        if (pickerApiLoaded && oauthToken) {
            var view = new google.picker.View(google.picker.ViewId.DOCS);
            view.setMimeTypes(VALID_TYPES.join(","));
            
            var picker = new google.picker.PickerBuilder().
                addView(google.picker.ViewId.SPREADSHEETS).
                enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
                setOAuthToken(oauthToken).
                setDeveloperKey(developerKey).
                setCallback(pickerCallback).
                build();
            picker.setVisible(true);
        }
    }
    
    // A simple callback implementation.
    function pickerCallback(data) {
        if (data.action == google.picker.Action.PICKED) {
            $(".overlay[name=choose-file]").fadeOut(200);
            
            gapi.load("client", function() {
                gapi.client.load('drive', 'v3', function() {
                    downloadFiles(data.docs);
                });
            });
        }
    }
    
    //A function for getting the contents of the various files before sending them to the callback
    function downloadFiles(data) {           
        //An array of the contents of each file.
        var files = [];
        
        //A variable for tracking when all files have been checked.
        var allChecked = false;
        
        for(var i = 0; i < data.length; i++) {
            //Request the contents of the file.
            var request = gapi.client.drive.files.export({
                'fileId': data[i].id,
                'mimeType': "text/csv",
                'alt': 'media'
            });
            
            request.then(function(response) {
                //Add the contents to the array
                files.push(response.body);
                
                //If all files have now been loaded, send them to the callback to be processed.
                if(allChecked) {
                    var callback = eval($(".overlay[name=choose-file]").attr("data-callback"));
                                        
                    if(typeof(callback) == "function")
                        callback(files);
                }
            }, function(error) {
                console.error(error);
            });
            
            //If all files have been checked, note it for the async promises.
            if(i == data.length - 1)
                allChecked = true;
        }
    }
    
    $(".google-button").click(loadApis);
}
