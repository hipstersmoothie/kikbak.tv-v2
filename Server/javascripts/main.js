$(document).ready(function() {
  console.log('ready')
  $('.deleteButton').click(function(event) {
    $target = $(event.target)

    var data = JSON.stringify({
        url: $('.url')[0].href,
        id: $('p')[0].id
      });
     $.ajax({
        "url": "/blogs/" + $('p')[0].id + '/delete/',
        "type": "POST",
        "contentType": "application/json",
        "data": data,
        "success": function() {
          location.reload()
        }
    });
  });

  $('.verifyButton').click(function(event) {
    $target = $(event.target)
    
    var data = JSON.stringify({
        url: $('.url')[0].href,
        id: $('p')[0].id
      });
     $.ajax({
        "url": "/blogs/" + $('p')[0].id + '/verify/',
        "type": "POST",
        "contentType": "application/json",
        "data": data,
        "success": function() {
          location.reload()
        }
    });
  });

  $('.tumblrButton').click(function(event) {
    $target = $(event.target)
    
    var data = JSON.stringify({
        url: $('.url')[0].href,
        id: $('p')[0].id
      });
     $.ajax({
        "url": "/blogs/" + $('p')[0].id + '/tumblr/',
        "type": "POST",
        "contentType": "application/json",
        "data": data,
        "success": function() {
          location.reload()
        }
    });
  });
})