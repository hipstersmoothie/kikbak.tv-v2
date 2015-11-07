$(document).ready(function() {
  $('.moveKeywords').click(function(event) {
    var $selected = []
    $(".oldkeywords option:selected").each(function(index, selection) {
      $selected.push($(selection).text().match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, ""));
    });
    $.ajax({
        "url": "/buckets/" + $('h1').text() + '/moveKeywords/' + encodeURIComponent($selected.join()),
        "type": 'POST', 
        "contentType": 'application/json', 
        "success": function() {
          location.reload()
        }
    });
  });
})