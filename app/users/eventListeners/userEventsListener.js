var userEvents = require('app/users/events/userEvents');
var mg = require('app/modules/mailgun');
var jade = require('jade');

userEvents.on('user:password:forgot', function(user) {
    var html = jade.renderFile('app/users/views/passwordForgot.jade', {
        token: user.changePassToken
    });

    mg.sendRaw('powiadomienia@jakasnazwa.pl', [user.email],
        'From: powiadomienia@jakasnazwa.pl' +
        '\nTo: ' + user.email +
        '\nContent-Type: text/html; charset=utf-8' +
        '\nSubject: A więc hasła zapomniałeś?' +
        '\n\n' + html,
        function(err) {
            if (err) console.log('Oh noes: ' + err);
            else     console.log('Success');
    });

});

userEvents.on('user:email:changed', function(user) {

    console.log('mail changed');

});
