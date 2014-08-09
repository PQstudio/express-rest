var userEvents = require('app/users/events/userEvents');
var mg = require('app/modules/mailgun');

userEvents.on('user:password:forgot', function(user) {

    mg.sendText('powiadomienia@jakasnazwa.pl', [user.email],
      'A więc hasła zapomniałeś?',
      'Token, który potrzebujesz: ' + user.changePassToken,
      function(err) {
        if (err) console.log('Oh noes: ' + err);
        else     console.log('Success');
    });

});

userEvents.on('user:email:changed', function(user) {

    console.log('mail changed');

});
