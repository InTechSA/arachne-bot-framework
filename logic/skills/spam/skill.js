/*
	SKILL : spam
	UTHOR : "Anonymous"
	DATE : 02/07/2018
*/

module.exports = (skill) => {
    
    const table = {
    	"innocent face":"ʘ‿ʘ",
    	"reddit disapproval face":"ಠ_ಠ",
    	"table flip":"(╯°□°）╯︵ ┻━┻",
    	"put the table back":"┬─┬﻿ ノ( ゜-゜ノ)",
    	"tidy up":"┬─┬⃰͡ (ᵔᵕᵔ͜ )",
    	"double flip":"┻━┻ ︵ヽ(`Д´)ﾉ︵﻿ ┻━┻",
    	"fisticuffs":"ლ(｀ー´ლ)",
    	"cute bear":"ʕ•ᴥ•ʔ",
    	"squinting bear":"ʕᵔᴥᵔʔ",
    	"cute face with big eyes":"(｡◕‿◕｡)",
    	"surprised":"（　ﾟДﾟ）",
    	"shrug face":"¯\\_(ツ)_/¯",
    	"meh":"¯\\(°_o)/¯",
    	"feel perky":"(`･ω･´)",
    	"angry face":"(╬ ಠ益ಠ)",
    	"excited":"☜(⌒▽⌒)☞",
    	"running":"ε=ε=ε=┌(;*´Д`)ﾉ",
    	"happy face":"ヽ(´▽`)/",
    	"basking in glory":"ヽ(´ー｀)ノ",
    	"kitty emote":"ᵒᴥᵒ#",
    	"fido":"V●ᴥ●V",
    	"meow":"ฅ^•ﻌ•^ฅ",
    	"cheers":"（ ^_^）o自自o（^_^ ）",
    	"devious smile":"ಠ‿ಠ",
    	"4chan emoticon":"( ͡° ͜ʖ ͡°)",
    	"crying face":"ಥ_ಥ",
    	"breakdown":"ಥ﹏ಥ",
    	"disagree":"٩◔̯◔۶",
    	"flexing":"ᕙ(⇀‸↼‶)ᕗ",
    	"do you even lift bro?":"ᕦ(ò_óˇ)ᕤ",
    	"kirby":"⊂(◉‿◉)つ",
    	"tripping out":"q(❂‿❂)p",
    	"discombobulated":"⊙﹏⊙",
    	"sad and confused":"¯\_(⊙︿⊙)_/¯",
    	"japanese lion face":"°‿‿°",
    	"confused":"¿ⓧ_ⓧﮌ",
    	"confused scratch":"(⊙.☉)7",
    	"worried":"(´･_･`)",
    	"dear god why":"щ（ﾟДﾟщ）",
    	"staring":"٩(͡๏_๏)۶",
    	"pretty eyes":"ఠ_ఠ",
    	"strut":"ᕕ( ᐛ )ᕗ",
    	"zoned":"(⊙_◎)",
    	"crazy":"ミ●﹏☉ミ",
    	"trolling":"༼∵༽ ༼⍨༽ ༼⍢༽ ༼⍤༽",
    	"angry troll":"ヽ༼ ಠ益ಠ ༽ﾉ",
    	"fuck it":"t(-_-t)",
    	"sad face":"(ಥ⌣ಥ)",
    	"hugger":"(づ￣ ³￣)づ",
    	"stranger danger":"(づ｡◕‿‿◕｡)づ",
    	"flip friend":"(ノಠ ∩ಠ)ノ彡( \\o°o)\\",
    	"cry face":"｡ﾟ( ﾟஇ‸இﾟ)ﾟ｡",
    	"cry troll":"༼ ༎ຶ ෴ ༎ຶ༽",
    	"tgif":"“ヽ(´▽｀)ノ”",
    	"dancing":"┌(ㆆ㉨ㆆ)ʃ",
    	"sleepy":"눈_눈",
    	"angry birds":"( ఠൠఠ )ﾉ",
    	"no support":"乁( ◔ ౪◔)「      ┑(￣Д ￣)┍",
    	"shy":"(๑•́ ₃ •̀๑)",
    	"fly away":"⁽⁽ଘ( ˊᵕˋ )ଓ⁾⁾",
    	"careless":"◔_◔",
    	"love":"♥‿♥",
    	"touchy feely":"ԅ(≖‿≖ԅ)",
    	"kissing":"( ˘ ³˘)♥",
    	"shark face":"( ˇ෴ˇ )",
    	"emo dance":"ヾ(-_- )ゞ",
    	"dance":"♪♪ ヽ(ˇ∀ˇ )ゞ",
    	"opera":"ヾ(´〇`)ﾉ♪♪♪",
    	"winnie the pooh":"ʕ •́؈•̀ ₎",
    	"boxing":"ლ(•́•́ლ)",
    	"fight":"(ง'̀-'́)ง",
    	"listening to headphones":"◖ᵔᴥᵔ◗ ♪ ♫",
    	"robot":"{•̃_•̃}",
    	"seal":"(ᵔᴥᵔ)",
    	"questionable":"(Ծ‸ Ծ)",
    	"winning!":"(•̀ᴗ•́)و ̑̑",
    	"zombie":"[¬º-°]¬",
    	"pointing":"(☞ﾟヮﾟ)☞",
    	"chasing":"''⌐(ಠ۾ಠ)¬'''",
    	"whistling":"(っ•́｡•́)♪♬",
    	"injured":"(҂◡_◡)",
    	"creeper":"ƪ(ړײ)‎ƪ​​",
    	"eye roll":"⥀.⥀",
    	"flying":"ح˚௰˚づ",
    	"things that can't be unseen":"♨_♨",
    	"looking down":"(._.)",
    	"im a hugger":"(⊃｡•́‿•̀｡)⊃",
    	"wizard":"(∩｀-´)⊃━☆ﾟ.*･｡ﾟ",
    	"yum":"(っ˘ڡ˘ς)",
    	"judging":"( ఠ ͟ʖ ఠ)",
    	"tired":"( ͡ಠ ʖ̯ ͡ಠ)",
    	"dislike":"( ಠ ʖ̯ ಠ)",
    	"hitchhiking":"(งツ)ว",
    	"satisfied":"(◠﹏◠)",
    	"sad and crying":"(ᵟຶ︵ ᵟຶ)"
    };
    
    function levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        var matrix = [];
        var i;
        for (i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        var j;
        for (j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    }

    skill.addCommand("spam","spam",({phrase, data}) => {
        return Promise.resolve().then(() => {
            phrase = phrase.replace("spam","").trim().split(':');
            var smiley;
            var text = "";
            if(phrase.length > 1) {
                text = phrase[1].trim();
                smiley = phrase[0].trim();
            } else smiley = phrase[0];
            if(smiley === "list") {
                Object.keys(table).map(el => {
                    text += el + " -> `" + table[el] + "`\n";
                    if(dist < best_distance) {
                        best_smiley = el;
                        best_distance = dist;
                    }
                });
            } else {
                text += " `";
                if(!table[smiley]) {
                    var best_distance = 500;
                    var best_smiley = "innocent face";
                    Object.keys(table).map(el => {
                        dist = levenshteinDistance(el.replace(" ",""),smiley.replace(" ",""));
                        if(dist < best_distance) {
                            best_smiley = el;
                            best_distance = dist;
                        }
                    });
                    if(best_distance < 3) {
                        text += table[best_smiley];
                    } else {
                        text = "Not found : `!spam list`"; 
                    }
                } else {
                    text += table[smiley];
                }
                text += "`";
            }
            return ({
                message: {
                    text
                }
            });
        }).catch((error) => {
            if(typeof(error) !== String) error = error.toString();
            skill.log("Error : " + error);
            return({
                message: {
                    title: "Error",
                    text: error
                }
            });
        });
    }, {
        description: "SPAM"
    });
    
};