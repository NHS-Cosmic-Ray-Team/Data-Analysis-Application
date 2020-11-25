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

function overlay(name) {
    var t = $(".overlay[name='" + name + "']");
    if(t.hasClass("flex-row") || t.hasClass("flex-column"))
        t.css("display", "flex").hide().fadeIn(200);
}