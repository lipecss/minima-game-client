const mixer = require('@mixer/interactive-node');
const auth = require('mixer-shortcode-oauth');
const Mixer = require('@mixer/client-node');
const ws = require('ws');
const request = require('request');

let userInfo;
const myiduser = 4509390; // Id do usuario do canal
const channelId = 3553359; // Id do canal

const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

// With OAuth we don't need to log in. The OAuth Provider will attach
// the required information to all of our requests after this call.
client.use(new Mixer.OAuthProvider(client, {
    tokens: {
        access: 'QPl4ynCMxR4lURUZmBjbXx562UqayJKXAiG5IuPkqx9RDvOQpGsFui4JVKBcy7I5',
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
    },
}));

// Pega o usuario do Access Token.
client.request('GET', 'users/current')
.then(response => {
    //console.log(response.body);

    // Store the logged in user's details for later reference
    userInfo = response.body;

    // Returns a promise that resolves with our chat connection details.
    return new Mixer.ChatService(client).join(response.body.channel.id);
})
.then(response => {
    const body = response.body;
    //console.log(body); //Dados
    return createChatSocket(userInfo.id, userInfo.channel.id, body.endpoints, body.authkey);
})
.catch(error => {
    console.error('Algo de errado aconteceu');
    console.error(error);
});
var socket;
// Funcação do chat
function createChatSocket (userId, channelId, endpoints, authkey) {
    socket = new Mixer.Socket(ws, endpoints).boot();
    
    // You don't need to wait for the socket to connect before calling
    // methods. We spool them and run them when connected automatically.
    socket.auth(channelId, userId, authkey)
    .then(() => {
        console.log('Agora estamos autenticados');
        // Send a chat message
        return socket.call('whisper', ['Felipecss','Olá Mundo']);
    })
    .catch(error => {
        console.error('Oh não! Ocorreu um erro.');
        console.error(error);
        SMSDownServer(error)
    });

    socket.on('UserUpdate', data =>{
        console.log(data)
    })
}

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
        });

        this.client
            .getScenes()
            .then(() => this.createScenes())
            .then(() => this.goLive())
            .catch(this.mixerGameClientError);

        this.client.on('message', (err) => {
            console.log('<<<', err);
            const blob = JSON.parse(err);
            // console.log('client')
            // console.log(blob)

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
        this.client
        .ready().then(() => this.client.synchronizeScenes())
        .then(() => {
            console.log('client ready')

            //Botao do Logo Menu
            this.client.state.getControl("logo").on("mousedown", clickEvent => {
                this.client.captureTransaction(clickEvent.transactionID)
                .then(() => { 
                    console.log("Got my money."); 
                }).catch((err) => { console.error(err) });
                console.log('HERE')
                console.log(clickEvent);
            });

            //Botao de Doar 1000
            this.client.state.getControl("doar1000").on("mousedown", clickEvent => {
                this.client.captureTransaction(clickEvent.transactionID)
                .then(() => { 
                    let username = this.client.state
                    .getParticipants()
                    .get(clickEvent.participantID).username;
                    socket.call('whisper', [username, `Obrigado pelos 1.000 :spark`])
                }).catch((err) => { console.error(err) });
            });

            //Botao de Doar 5000
            this.client.state.getControl("doar5000").on("mousedown", clickEvent => {
                this.client.captureTransaction(clickEvent.transactionID)
                .then(() => { 
                    let username = this.client.state
                    .getParticipants()
                    .get(clickEvent.participantID).username;
                    socket.call('whisper', [username, `Obrigado pelos 5.000 :spark`])
                }).catch((err) => { console.error(err) });
            });

            //Botao Doar 15000
            this.client.state.getControl("doar15000").on("mousedown", clickEvent => {
                this.client.captureTransaction(clickEvent.transactionID)
                .then(() => { 
                    let username = this.client.state
                    .getParticipants()
                    .get(clickEvent.participantID).username;
                    socket.call('whisper', [username, `Obrigado pelos 15.000 :spark `])
                }).catch((err) => { console.error(err) });
            });
            //Botao Logo Canal
            this.client.state.getControl("channelLogo").on("mousedown", async clickEvent => {
                this.client.captureTransaction(clickEvent.transactionID)
                .then(() => { 
                    let username = this.client.state
                    .getParticipants()
                    .get(clickEvent.participantID).username;
                    socket.call('msg', [`@${username} nosso site oficial está passando por atualizações. Estamos preparando e desenvolvendo muitas novidades para vocês. Acesse: https://www.vemvalaralouca.com.br e ou nos visite nas redes sociais para ficar por dentro de toda as novidades.`])
                }).catch((err) => { console.error(err) });
            });

            //Botao Instagram
            this.client.state.getControl("btnInstagram").on("mousedown", async clickEvent => {
                this.client.captureTransaction(clickEvent.transactionID)
                .then(() => { 
                    let username = this.client.state
                    .getParticipants()
                    .get(clickEvent.participantID).username;
                    socket.call('whisper', [username, `Me siga no instagram, acesse https://twitter.com/felipecss :salute`])
                }).catch((err) => { console.error(err) });
            });

            //Botao Twitter 
            this.client.state.getControl("btnTwitter").on("mousedown", async clickEvent => {
                this.client.captureTransaction(clickEvent.transactionID)
                .then(() => { 
                    let username = this.client.state
                    .getParticipants()
                    .get(clickEvent.participantID).username;
                    socket.call('whisper', [username, `Me siga no Twitter, bora bater um papo. Acesse https://twitter.com/felipecss`])
                }).catch((err) => { console.error(err) });
            });
        }).catch(e => {
            console.error('interactive client error readying: ', e);
            throw e;
        });
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
