# Message formatting

Adapters reformat messages to send rich embeded message (if any) to clients. The brain must send compatible message format.

The simpliest message a skill may return from one of its Promise is the following :
```javascript
return { message: { text: "This is a very simple message." } };
```

You may add some additionnal information to the message object, like a title, or change the message avatar (using the image url instead of bot avatar, or the give emoji, not supported by all adapter!) :
```javascript
return {
  message: {
    title: "Hey!",
    avatar: "https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png",
    emoji: ":smirk:",
    text: "This message has an amazing title!"
  }
};
```

**Attachments**
Messages can display several attachments, these are additionnals fields displayed after the message. They can contain images, video, files, buttons, text...

![https://a.slack-edge.com/1877/img/api/message_guidelines/Formatting_1.png](https://a.slack-edge.com/1877/img/api/message_guidelines/Formatting_1.png)

Attachments are listed under the `attachments` array of the message object :
```javascript
return {
  message: {
    title: "An incredible message",
    text: "This message is surely the best!",
    attachments: [
      {
        color: "#ff0000",
        text: "This text will have a red border and an alert icon. Cool!",
        thumbnail: "http://www.gohrt.com/images/icons/alert-icon-red.png"
      },
      {
        color: "#00ff00",
        title: "What a video!",
        title_link: "https://www.youtube.com",
        collapsed: true,
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        author_name: "Some artist",
        author_link: "http://wikipedia.com"
        author_icon: "https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png"
      },
      {
        title: "What an image!",
        image_url: "https://pre00.deviantart.net/e95b/th/pre/i/2011/267/e/2/french_montain_by_bancomphotos-d4ardpn.jpg"
      },
      {
        color: "#000000",
        title: "Some table",
        text: "Here are a lot of fields!",
        fields: [
          {
            title: "Fun fact 1",
            message: "I lied, it's not a fact."
          },
          {
            title: "Fun fact 2",
            message: "I lied, again."
          }
        ]
      }
      ...
    ]
  }
};
```
