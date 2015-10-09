$(document).ready(function() {
  console.log('ready')
  $('.tagButton').click(function(event) {
    console.log('clicked', $('.tag')[0].value);
    $target = $(event.target)
    // $.post('/blogs/tag/', {
    //     url: $('.url')[0].href,
    //     tag: $('.tag')[0].value 
    //   }, function(data) {
    //      console.log(data)
    //     // $target.parent().parent().remove();
    //     // $alert.trigger('success', 'Task was removed.');
    //   }
    // )
    var data = JSON.stringify({
        url: $('.url')[0].href,
        tag: $('.tag')[0].value,
        id: $('p')[0].id
      });
     $.ajax({
        "url": "/blogs/tag/" + $('p')[0].id + '/' + $('.tag')[0].value + '/',
        "type": "POST",
        "contentType": "application/json",
        "data": data,
        "success": function() {
          location.reload()
        }
    });
  });
})