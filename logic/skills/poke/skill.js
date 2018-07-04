/*
	SKILL : poke
	UTHOR : "Anonymous"
	DATE : 02/07/2018
*/

module.exports = (skill) => {
    
    function sendPoke(userNameTo,userNameFrom, hook) {
        skill.useHook(hook._id, { 
            message: {
                attachments: [
                {
                    title: "POKE",
                    text: "Poke from " + userNameFrom,
                    image_url: "https://media.giphy.com/media/Vfie0DJryAde8/giphy.gif"
                }],
                private: true,
                privateName: userNameTo
            }
            
        }, { deleteHook: true });
    }

    skill.addCommand("poke","poke",({phrase, data}) => {
        return Promise.resolve().then(() => {
            return skill.createHook().then(hook => {
                var userNameTo = phrase.replace("poke","").trim();
                setTimeout(() => sendPoke(userNameTo,data.userName, hook),5000);
                return ({
                    message: {
                        text: "Ok poke sent, if the person exist, it will send him/her a poke, if it fail, the poke will be sent to you",
                        request_hook: true,
                        hook: hook
                    }
                  });
            });
        }).catch((err) => {
            if(typeof(err) !== String) err = err.toString();
            skill.log("Error : " + err);
            return({
                message: {
                    title: "Error",
                    text: err
                }
            });
        });   
    }, {
        description: "Send poke"
    });
    
};
