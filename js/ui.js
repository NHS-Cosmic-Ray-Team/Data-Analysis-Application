$(".overlay .panel.closeable header").hover(function() {
    $(this).parent(".panel").toggleClass("header-hover");
})
.click(function() {
    $(this).parentsUntil(".overlay").parent().fadeOut(200);
})

$(".overlay").click(function(e) {
    if($(e.originalEvent.target).hasClass("overlay"))
        $(this).fadeOut(200);
})

//A function for making an overlay visible
function overlay(name, callback = undefined) {
    var t = $(".overlay[name='" + name + "']");
    
    //In case there's no overlay with that name
    if(t.length <= 0)
        return;
    
    //If a callback was defined, add it as an attribute to the overlay.
    if(callback != undefined)
        t.attr("data-callback", callback)
        
    if(t.hasClass("flex-row") || t.hasClass("flex-column"))
        t.css("display", "flex").hide().fadeIn(200);
    else
        t.fadeIn(200);
}