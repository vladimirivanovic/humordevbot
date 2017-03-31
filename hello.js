var builder = require('botbuilder');
var restify = require('restify');

var connector = new builder.ChatConnector();
var bot = new builder.UniversalBot(connector);
bot.dialog('/', [
function(session) {
    builder.Prompts.text(session, 'what is your name?');
},
function(session, results) {
    session.send('hello, ' + results.response);
}
]);

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 9000, function(){
console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen);