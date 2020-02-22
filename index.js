const Discord = require('discord.js');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const client = new Discord.Client();

/*============Spreadsheet stuff============*/
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'private/token.json';

function authorize(credentials, callback, message) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, message);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function listMajors(auth, message) {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
      spreadsheetId: '',
      range: 'ExpoHacksIIISignUp!A2:C',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const rows = res.data.values;
      if (rows.length) {
        var data = [];
        rows.map((row) => {
          data.push([`${row[0]} ${row[1]}`, `${row[2]}`])
        });

        const user_message = message.content;
        var breakIndex1 = 0;
        var breakIndex2 = 0;
        for(i = 0; i < user_message.length; i++){
            if(user_message[i] == ","){
                if(breakIndex1 == 0){
                    breakIndex1 = i;
                }
                else{
                    breakIndex2 = i;
                }
            }
        }
        
        const full_name = user_message.substring(8, breakIndex1)
        const school = user_message.substring(breakIndex1+2, breakIndex2)
        const email = user_message.substring(breakIndex2+2, user_message.length)
        for(i = 0; i < data.length; i++){
            if(data[i][0].toLowerCase() == full_name.toLowerCase() &&
                data[i][1].toLowerCase() == email.toLowerCase()){
                    message.channel.send("You have been verified. Welcome to Expo Hacks III discord server!!");
                    var role = message.guild.roles.find(role => role.name === "Verified");
                    message.member.addRole(role);
                    break;
            }
            else if(i == data.length-1){
                message.channel.send("I'm sorry but you do not appear to be signed up for Expo Hacks III. Make sure the information you typed in is exactly like how you filled out the form. If you haven't flled out the form, please sign up at https://trivalleyyouthexpo.com/hackathon and try again.");
                break;
            }
        }

      } else {
        console.log('No data found.');
      }
    });
}

/*============Discord bot============*/
client.once('ready', () => {
	console.log('Ready!');
});

client.login('');

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.find(channel => channel.name === "general");
    if(!channel) return;

    channel.send(`Welcome to the server, ${member}! If you want to be verified as a competitor, type in '!verify first last, school, email'`);
});

client.on('message', message => {
	if (message.content.substring(0, 7) == '!verify') {
        fs.readFile('private/credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            authorize(JSON.parse(content), listMajors, message);
        });
    }
});