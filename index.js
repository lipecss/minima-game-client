const mixer = require('@mixer/interactive-node');
const auth = require('mixer-shortcode-oauth');
// const Mixer = require('@mixer/client-node');
// const ws = require('ws');
// const request = require('request');

// let userInfo;

// const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

// // With OAuth we don't need to log in. The OAuth Provider will attach
// // the required information to all of our requests after this call.
// client.use(new Mixer.OAuthProvider(client, {
//     tokens: {
//         access: '2UAxih3oYRJVoVewG824NUyZGzukz406qk5RxHlm2B9NaxuAhYnNiUbKiQo73Mei',
//         expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
//     },
// }));

// // Gets the user that the Access Token we provided above belongs to.
// client.request('GET', 'users/current')
// .then(response => {
//     console.log(response.body);

//     // Store the logged in user's details for later reference
//     userInfo = response.body;

//     // Returns a promise that resolves with our chat connection details.
//     return new Mixer.ChatService(client).join(response.body.channel.id);
// })
// .then(response => {
//     const body = response.body;
//     console.log(body);
//     // TODO: Connect to chat, we'll do this in the next tutorial step :)!
// })
// .catch(error => {
//     console.error('Something went wrong.');
//     console.error(error);
// });

// Place your app info in mixerauth.json, schema is:
// {
//     "clientId": "",
//     "clientSecret": null, /* optional if you don't have a cient secret */
//     "versionId": 0
// }
const authfile = './mixerauth.json';

// Update this scene array if needed
const scenesArray = [
    {
        sceneID: 'default',
        controls: [],
        containers: [],
    },
];

class MinimalMixerGameClient {
    constructor(authToken) {
        this.client = new mixer.GameClient();

        this.client.on('open', () => this.mixerClientOpened());
        this.client.on('error', e => this.mixerGameClientError(e));

        this.client.open(authToken).catch(this.mixerGameClientError);
    }

    mixerClientOpened() {
        console.log('Mixer client opened');
        this.client.on('message', (err) => console.log('<<<', err));
        this.client.on('send', (err) => {
            console.log('>>>', err);

            // send this back to all viewers
            if (err.method == "giveInput") {
                var data = {
                    "scope": [
                        "group:default"
                    ],
                    "data": {
                        "my-control": {
                            "with": "custom data"
                        }
                    }
                };
                this.client.broadcastEvent(data);

                const options = {
                    url: 'http://localhost:8911/api/chat/message',
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    json: true,
                };
                console.log('feito')
                this.client.broadcastEvent(options);
            }
        });

        this.client
            .getScenes()
            .then(() => this.createScenes())
            .then(() => this.goLive())
            .catch(this.mixerGameClientError);

        this.client.on('message', (err) => {
            console.log('<<<', err);
            const blob = JSON.parse(err);
            console.log('client')
            console.log(blob)

            if (blob.method == 'giveInput') {
                console.log('Sending data to custom control...');
                this.client.broadcastEvent({
                    scope: ['everyone'],
                    data: {
                        "my-control": {
                            "with": "Game Client says Hello!"
                        }
                    },
                });
            }
        });
    }

    createScenes() {
        return this.client.updateScenes({ scenes: scenesArray });
    }

    goLive() {
        console.log('going live');
        this.client
            .ready()
            .then(() => console.log('client ready'))
            .catch(e => {
                console.error('interactive client error readying: ', e);
                throw e;
            });
    }

    mixerGameClientError(error) {
        console.error('interactive error: ', error);
    }
}

// Authenticate with Mixer using oauth
// Will print a shortcode out to the terminal
mixer.setWebSocket(require('ws'));
const authToken = require(authfile);
if (typeof authToken.clientId !== 'string') {
    throw new Error('clientId was not a string');
}

if (typeof authToken.clientSecret !== 'string' && authToken.clientSecret !== null) {
    throw new Error('clientSecret was not a string or null');
}

if (typeof authToken.versionId !== 'number') {
    throw new Error('versionId was not a number');
}

const authInfo = {
    client_id: authToken.clientId,
    client_secret: authToken.clientSecret,
    scopes: [
        'interactive:manage:self',
        'interactive:play',
        'interactive:robot:self',
        'user:analytics:self',
        'channel:details:self'
    ],
};

const store = new auth.LocalTokenStore(__dirname + '/mixertoken.json');
const authClient = new auth.ShortcodeAuthClient(authInfo, store);
authClient.on('code', code => {
    console.log(`Go to https://mixer.com/go?code=${code} and enter code ${code}...`);
});

authClient.on('authorized', (token) => {
    console.log('Got token!', token);
    const _instance = new MinimalMixerGameClient({
        authToken: token.access_token,
        versionId: authToken.versionId,
    });
});

authClient.on('expired', () => {
    console.error('Auth request expired');
    process.exit(1);
});

authClient.on('declined', () => {
    console.error('Auth request declined');
    process.exit(1);
});

authClient.on('error', (e) => {
    console.error('Auth error:', e);
    process.exit(1);
});

authClient.doAuth();
