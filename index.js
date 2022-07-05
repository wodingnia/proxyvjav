const http = require('http');
const https = require('https');
const zlib = require('zlib');

//https://ip230617622.ahcdn.com/key=vTSNHnrT08j+6xpxO7aPDw,s=,end=1657115636,limit=3/state=YsRCwKlg/referer=none,.vjav.com,.gstatic.com,.vjav.com/reftag=057661800/media=hls/ssd8/121/2/285133392.m3u8
//http://127.0.0.1:3000/ip230617622.ahcdn.com/key=vTSNHnrT08j+6xpxO7aPDw,s=,end=1657115636,limit=3/state=YsRCwKlg/referer=none,.vjav.com,.gstatic.com,.vjav.com/reftag=057661800/media=hls/ssd8/121/2/285133392.m3u8

//http://127.0.0.1:3000/ip230617622.ahcdn.com/key=vTSNHnrT08j+6xpxO7aPDw,s=,end=1657115636,limit=3/state=YsRCwKlg/referer=none,.vjav.com,.gstatic.com,.vjav.com/reftag=057661800/media=hls/ssd8/121/2/285133392.mp4/seg-1-v1-a1.ts

http.createServer(onRequest).listen(5000);

function onRequest(client_req, client_res) {
    console.log('serve: ' + client_req.url);
    let cdn_location_regex = /ip(\d+).ahcdn.com/
    let cdn_location = client_req.url.match(cdn_location_regex);
    if (cdn_location == null) {
        return client_res.end()
    }
    let real_url = client_req.url.replace(`/${cdn_location[0]}`, '')
    let options = {
        hostname: cdn_location[0],
        port: 443,
        path: real_url,
        method: client_req.method,
        headers: client_req.headers,
        rejectUnauthorized: false,
        strictSSL: false
    };
    options.headers.referer = 'https://vjav.com/';
    options.headers['user-agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36'
    let proxy = https.request(options, function (res) {
        if (options.path.includes(".m3u8")) {
            let headers= JSON.parse(JSON.stringify(res.headers));
            delete headers['content-encoding'];
            delete headers['transfer-encoding'];
            client_res.writeHead(res.statusCode, headers);
            var gunzip = zlib.createGunzip();
            res.pipe(gunzip);
            let body=[];
            gunzip.on("data", function (chunk) {
                // console.log(chunk.toString());
                body.push(chunk)
                
            })
            let hostport=/https?:\/\/(?:w{1,3}\.)?[^\s.]+(?:\.[a-z]+)*(?::\d+)?(?![^<]*(?:<\/\w+>|\/?>))/ig;
            gunzip.on("end", function () {
                let _body=Buffer.concat(body).toString();
                console.log(`/${cdn_location[0]}`)
                _body=_body.replace(hostport,`/${cdn_location[0]}`);
                client_res.write(_body)
                client_res.end()
            })
        } else {
            res.headers['Access-Control-Allow-Origin']= '*';
            res.headers['Access-Control-Allow-Methods']= 'OPTIONS, POST, GET';
            res.headers['Access-Control-Max-Age']=2592000;

            client_res.writeHead(res.statusCode, res.headers);
            res.pipe(client_res, {
                end: true
            });
        }
    });

    client_req.pipe(proxy, {
        end: true
    });
}
function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

// const result = await streamToString(stream)
async function streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("utf-8");
}
