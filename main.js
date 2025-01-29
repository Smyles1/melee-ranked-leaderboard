var ranks = [];

function getPlayerData(cc) {
  // cc: connect code
  Logger.log('cc: ' + cc);
  if(cc === undefined) return;
  const query = `
  query AccountManagementPageQuery($cc: String!) {
    getConnectCode(code: $cc) {
      user {
        rankedNetplayProfile {
          ratingOrdinal
          continent
          characters {
            character
            gameCount
          }
        }
      }
    }
  }
  `;
  const endpoint = 'https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql'; // Fizzi's ranked database
  const variables = { cc: cc };
  const payload = {
    query: query,
    variables: variables
  };
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  const response = UrlFetchApp.fetch(endpoint, options);
  const data = JSON.parse(response.getContentText());
  Logger.log(data);
  if(data === 'null' || data.data.getConnectCode === 'null'){
    return 'no player data';
  }
  return data.data;
}

function getChars(chars){ // retrieves the most played character
  var totalGames = 0;
  var returnChars = [];
  var charsSort = chars;

  chars.forEach(char => {
    totalGames+=char.gameCount;
  })

  charsSort.sort(function(a, b) {
    return b.gameCount - a.gameCount;
  });

  chars.forEach(char => {
    returnChars.push(toTitleCase(char.character.replace('_', ' ')))
  })

  return returnChars[0];
}

function getTestData(){
  Logger.log(getPlayerData("SM#0"))
}

function getRank(elo) {
  const ranks = [
    { max: 766, rank: "Bronze 1" },
    { max: 914, rank: "Bronze 2" },
    { max: 1055, rank: "Bronze 3" },
    { max: 1189, rank: "Silver 1" },
    { max: 1316, rank: "Silver 2" },
    { max: 1436, rank: "Silver 3" },
    { max: 1549, rank: "Gold 1" },
    { max: 1654, rank: "Gold 2" },
    { max: 1752, rank: "Gold 3" },
    { max: 1843, rank: "Platinum 1" },
    { max: 1928, rank: "Platinum 2" },
    { max: 2004, rank: "Platinum 3" },
    { max: 2074, rank: "Diamond 1" },
    { max: 2137, rank: "Diamond 2" },
    { max: 2192, rank: "Diamond 3" },
    { max: 2275, rank: "Master 1" },
    { max: 2350, rank: "Master 2" }
  ];

  for (const { max, rank } of ranks) {
    if (elo < max) {
      return rank;
    }
  }

  return "Master 3";
}


function refreshAnswers() {
  var form = FormApp.openById('1arzpcL-GZOmrhIulIjF-HOISJgA6GJ2NkjkWxFFEHps');
  var formResponses = form.getResponses();
  var temptags = [];
  for (var i = 0; i < formResponses.length; i++) {
    var formResponse = formResponses[i];
    var itemResponses = formResponse.getItemResponses();
    
    var ptag = itemResponses[0].getResponse();
    var pcode = itemResponses[1].getResponse().trim();
    if(temptags.includes(pcode)){
      continue;
    } else {
      temptags.push(pcode);
    }

    var fetchResult = getPlayerData(pcode).getConnectCode;
    // splitting this up to catch it here if there is no player data
    if(fetchResult === 'no player data' || fetchResult === null){
      continue;
    }
    
    fetchResult = fetchResult.user.rankedNetplayProfile;

    var prank =  Math.floor(Number(fetchResult.ratingOrdinal));
    var nameRank = getRank(prank);
    var link = `https://slippi.gg/user/${pcode.replace('#','-')}`;
    var pcode2 = `=HYPERLINK("${link}", "${pcode}")`;
    var pregion;
    if(fetchResult.continent === null){
      continue;
    } else {
      pregion = toTitleCase(fetchResult.continent.replace('_',' '));
    }
    var char = toTitleCase(getChars(fetchResult.characters));
    
    var player = [pcode2, ptag, prank, nameRank, pregion, char, link, pcode];
    ranks.push(player);
  }
  orderRanks();
  writeRanks();
  var maxlength = ranks.length;
  if(maxlength > 10){
    maxlength = 10;
  }
  var topOrder = [];
  for(var i = 0; i < maxlength; i++){
    topOrder.push(ranks[i][1]);
  }
  return topOrder;
}

function orderRanks(){
  ranks.sort(function(a, b) {
    return b[2] - a[2];
  });
}

function getCol(arr, ind){
  var newArr = []
  for(var i = 0; i < arr.length; i++){
    newArr.push([arr[i][ind].toString()]);
  }
  return newArr;
}

function getNumbers(amount){
  var nums = [];
  for(var i = 0; i < amount; i++){
    nums.push[[i+1]];
  }
  return nums;
}

function writeRanks(){
  var sTag = SpreadsheetApp.getActive().getRange("Ranks!B2:B" + Math.floor(ranks.length+1));
  var sElo = SpreadsheetApp.getActive().getRange("Ranks!C2:C" + Math.floor(ranks.length+1));
  var sCode = SpreadsheetApp.getActive().getRange("Ranks!G2:G" + Math.floor(ranks.length+1));
  var sRank = SpreadsheetApp.getActive().getRange("Ranks!D2:D" + Math.floor(ranks.length+1));
  var sReg = SpreadsheetApp.getActive().getRange("Ranks!E2:E" + Math.floor(ranks.length+1));
  var sChar = SpreadsheetApp.getActive().getRange("Ranks!F2:F" + Math.floor(ranks.length+1));

  sTag.setValues(getCol(ranks, 1)).setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(9);
  sElo.setValues(getCol(ranks, 2)).setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(9);
  sCode.setValues(getCol(ranks, 0)).setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(9);
  sRank.setValues(getCol(ranks, 3)).setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(9);
  sReg.setValues(getCol(ranks, 4)).setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(9);
  sChar.setValues(getCol(ranks, 5)).setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(9);

  SpreadsheetApp.getActive().getRange("Ranks!I3").setValue(new Date()).setNumberFormat("yyyy-MM-dd hh:mm").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(9).setFontWeight("bold");

  createEmbed();
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

function createEmbed(){

  const embedOptions = PropertiesService.getScriptProperties();

  var fields = [];
  var maxlength = ranks.length;
  if(maxlength > 10){
    maxlength = 10;
  }

  for(var i = 0; i < maxlength; i++){
    fields.push({
            "name": 'Rank ' + (i+1) + ': ' +ranks[i][1],
            "value": '``' + '(' + ranks[i][7] + ') ' + ranks[i][2] + ': ' + ranks[i][3] + '``',
            "inline": false
          });
  }

  fields.push({
            "name": '\u200b',
            "value": '[Full ranks](https://docs.google.com/spreadsheets/d/1TsUskCP3-Pt30JN80uTetvouQgdTVQ70Wub5Mjr1gvQ/edit?usp=sharing), [Form](https://forms.gle/X15WavPVD1kURK8z5)',
            "inline": false
  });


  var options = {
    contentType: "application/json",
    muteHttpExceptions: true,
    "method": "post",
    "payload": JSON.stringify({
      "username": "Ranking bot :)",
      "avatar_url": "https://cdn.discordapp.com/attachments/1056745720440430602/1056749170423234620/0a3d669957a6d01feaf35a5fcc5ad945.png",
      "embeds": [{
        "author":{
          "name": "Ranks for Yoshicord",
        },
        "color": 11027200,
        "fields": fields,
        "footer": {
          "text": "made by smyles :)",
        }
      }] 
    }),
  };
  embedOptions.setProperty('ranks', JSON.stringify(options));
}

function sendDisc(){
  var storage = PropertiesService.getScriptProperties();

  var discordUrl = 'https://discord.com/api/webhooks/1062932015525150840/-V41YaYQSd_7wR3eQ4Hctl24Ulv9D0cM9R-Q0aUeMeD-AfCsJzPGw1RxlB64q_juQ6ZT';

  const embedOptions = PropertiesService.getScriptProperties();
  // var maxlength = ranks.length;
  // if(maxlength > 10){
  //   maxlength = 10;
  // }
  // var topOrder = [];
  // for(var i = 0; i < maxlength-1; i++){
  //   topOrder.push(ranks[i][1]);
  // }
  // embedOptions.setProperty('top', JSON.stringify(topOrder));
  
  var optionsRanks = JSON.parse(embedOptions.getProperties()['ranks']);
  var optionsTop = JSON.parse(embedOptions.getProperties()['top']);

  var currTop = refreshAnswers()

  if(!(optionsTop === JSON.stringify(currTop))){
    var response = UrlFetchApp.fetch(discordUrl, optionsRanks);
    embedOptions.setProperty('top', JSON.stringify(currTop));
  }  
}






