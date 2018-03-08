/**
 * mcodes is a simple command line utility to manage dynamic messenger codes for your FB Messenger bot
 * You can use mcodes to create messenger codes and manage them through git. Then you can use your submodule
 * 
 * mcodes create <ref> <pageAccess> --> ID
 */


const axios = require("axios");
const crypto = require("crypto");

const fs = require("fs");
const path = require("path");

const isNull = (v) => (v === undefined) || (v === null);
const isNonNull = (v) => !isNull(v);

const manifest = require('./manifest.json');

async function createCode(ref, pageAccessToken, imageSize) {

    if (isNull(ref) || isNull(pageAccessToken)) {
        console.log("ref and pageAccesToken must be defined");
        return;
    }

    const size = imageSize || 2000;
    const url = "https://graph.facebook.com/v2.6/me/messenger_codes?access_token=" + pageAccessToken;
    const method = "POST";
    const id = crypto.randomBytes(4).toString('hex');
    const data = { 
        type: "standard",
        data: { ref: id },
        image_size: size
    };
    try {
        const response = await axios.post(url, data);
        return Object.assign({ id: id }, response.data);
    } catch (err) {
        throw new Error("There was an error resolving the request to Facebook");
    }
    return 1;
}

async function saveCode(uri, id, ref) {
    if (isNull(uri) || isNull(ref)) {
        return;
    }

    const response = await axios.get(uri, { responseType: 'arraybuffer'});
    const fileBuffer = new Buffer(response.data, "binary");
    fs.writeFileSync(path.join(__dirname, 'img', id + '.png'), fileBuffer);
    manifest[id] = { uri, ref }
    fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, "\t"));
}

async function main() {

    const args = process.argv;
    
    if (args.length < 3) {
        console.log('Incorrect number of arguments');
        process.exit(1);
    }
    
    const objectRef = args[2];
    let pageAccess = args[3];

    if (isNull(pageAccess)) {
        console.log("Attempting to load page access token from mcodes.config...");
        try {
            const file = fs.readFileSync(path.join(__dirname, 'mcodes.config.json'));
            pageAccess = JSON.parse(file.toString())["pageAccessToken"];
        } catch (err) {
            console.log("Config file does not exist! Please set up mcodes.config.json");
        }
    }

    console.log("Creating a messenger code for with ref " + objectRef + "...");
    const response = await createCode(objectRef, pageAccess);
    await saveCode(response.uri, response.id, objectRef);
    console.log("Success!");

}

main()