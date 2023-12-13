'use strict';

const fs = require('fs');


let rawdata = fs.readFileSync('export.json');
let info = JSON.parse(rawdata);

const team = "default"
const room = info.room_name.replaceAll(" ", "-").toLowerCase();


let users = {}; // hash table of all users
let posts = [];
let channel = JSON.stringify({
    type: "channel",
    channel: {
        team,
        name: room,
        purpose: info.topic,
        type: "O"
    }
});


const getFileTime = (timestamp) => {
    const ts = new Date(timestamp);
    let hours = ts.getHours();
    let ampm = "AM"
    if(hours > 12)
    {
        hours = hours - 12;
        ampm = "PM"
    }
    if(hours === 0)
    {
        hours = 12;
    }
    const minutes = ts.getMinutes().toString().padStart(2, '0');
    const seconds = ts.getSeconds().toString().padStart(2, '0');

    const suffix = `-${ts.getMonth()+1}-${ts.getDate()}-${ts.getFullYear()} at ${hours}-${minutes}-${seconds} ${ampm}`

    console.log(suffix);
    return suffix;
}

const injectFileTime = (filename, timestamp) => {
    const filetime = getFileTime(timestamp);

    const index = filename.lastIndexOf(".");
    const filetype = filename.slice(index);
    const name = filename.slice(0, index);

    return name + filetime + filetype;
}

const messageToPost = (message) => {
    const user = message.user_id;
    if(!users[user])
    {
        users[user] = user.slice(1, user.length - 23) + "_matrix";
    }

    const post = {
        type: "post",
        post: {
            team,
            channel: room,
            user: users[user],
            message: message.content.body,
            create_at: message.origin_server_ts
        }
    }

    return post;
}

const iamgeToPost = (message) => {
    const user = message.user_id;
    if(!users[user])
    {
        users[user] = user.slice(1, user.length - 23) + "_matrix";
    }

    const filename = injectFileTime(message.content.body, message.origin_server_ts);

    console.log(filename)
    const post = {
        type: "post",
        post: {
            team,
            channel: room,
            user: users[user],
            message: message.content.body,
            create_at: message.origin_server_ts,
            attachments: [{
                path: "/tmp/import/images/" + filename
            }]
        }
    }



    return post;
}

const fileToPost = (message) => {
    const user = message.user_id;
    if(!users[user])
    {
        users[user] = user.slice(1, user.length - 23) + "_matrix";
    }

    const filename = injectFileTime(message.content.body, message.origin_server_ts);
    console.log(filename)
    const post = {
        type: "post",
        post: {
            team,
            channel: room,
            user: users[user],
            message: message.content.body,
            create_at: message.origin_server_ts,
            attachments: [{
                path: "/tmp/import/files/" + filename
            }]
        }
    }

    return post;
}

const videoToPost = (message) => {
    const user = message.user_id;
    if(!users[user])
    {
        users[user] = user.slice(1, user.length - 23) + "_matrix";
    }

    const filename = injectFileTime(message.content.body, message.origin_server_ts);
    console.log(filename)
    const post = {
        type: "post",
        post: {
            team,
            channel: room,
            user: users[user],
            message: message.content.body,
            create_at: message.origin_server_ts,
            attachments: [{
                path: "/tmp/import/videos/" + filename
            }]
        }
    }

    return post;
}



info.messages.forEach(message => {
    if(message.type === "m.room.message") 
    {
        const mtype = message.content.msgtype;
        if (mtype === "m.text") 
        {
            posts.push(messageToPost(message));
        }
        if (mtype === "m.image")
        {
            posts.push(iamgeToPost(message));
        }
        if (mtype === "m.file")
        {
            posts.push(fileToPost(message));
        }
        if (mtype === "m.file")
        {
            posts.push(videoToPost(message));
        }
    }
});

const allUsers = [];

for(const [key, value] of Object.entries(users)) {
    const user = {
        type: "user",
        user: {
            username: value,
            email: value + "@localhost",
            use_markdown_preview: "false",
            use_formatting: "false",
            show_unread_section: "false",
            email_interval: "hour"
        }
    }

    allUsers.push(user);
}


const version = JSON.stringify({
    type: "version",
    version: 1
});
const userOutput = allUsers.map(user => JSON.stringify(user)).join('\n');
const postOutput = posts.map(post => JSON.stringify(post)).join('\n');



fs.writeFile(`output-${room}.jsonl`, version + '\n' + channel + '\n' + userOutput + '\n' + postOutput, (err) => {
    if(err) {
        throw err;
    }
})
