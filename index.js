// support xvideos,vjav,txxx,pornhub,pornzog
const http = require('http');
const https = require('https');
const zlib = require('zlib');

http.createServer(onRequest).listen(5000);

function onRequest(client_req, client_res) {
    console.log('serve: ' + client_req.url);
    if(client_req.url.includes('js.map')){
        client_res.end();
        return;
    }

    let cdn_location_regex = /([\w|\d|-]*?)\.(xvideos-cdn||ahcdn||phncdn)\.com/
    let cdn_location = client_req.url.match(cdn_location_regex);
    if (cdn_location == null) {
        return client_res.end()
    }
    cdn_location = cdn_location[0];
    let real_url = client_req.url.replace(`/${cdn_location}`, '')
    let options = {
        hostname: cdn_location,
        port: 443,
        path: real_url,
        method: client_req.method,
        headers: client_req.headers,
        rejectUnauthorized: false,
        strictSSL: false
    };
    let referer = 'https://vjav.com/';
    if (real_url.includes('xvideos')) {
        referer = 'https://www.xvideos.com';
        delete options.headers['host']
    }
    if (real_url.includes('txxx.com')) {
        referer = 'https://txxx.com';
    }
    if(client_req.url.includes('phncdn')){
        referer='https://cn.pornhub.com/';
        options.headers={'accept':"*/*",'Accept-Encoding':'gzip, deflate, br','Connection':'keep-alive','cache-control':'no-cache'}
    }
    options.headers.referer = referer;
    
    let proxy = https.request(options, function (res) {
        if (options.path.includes(".m3u8")) {
            let headers = JSON.parse(JSON.stringify(res.headers));
            delete headers['content-encoding'];
            delete headers['transfer-encoding'];
            client_res.writeHead(res.statusCode, headers);
            if (cdn_location.includes('xvideos')||cdn_location.includes('phncdn')) {
                let body = [];
                res.on("data", function (chunk) {
                    // console.log(chunk.toString());
                    body.push(chunk)
                })
                res.on("end", function () {
                    let _body = Buffer.concat(body).toString();
                    client_res.write(_body)
                    client_res.end()
                })
            } else {
                var gunzip = zlib.createGunzip();
                res.pipe(gunzip);
                let body = [];
                gunzip.on("data", function (chunk) {
                    // console.log(chunk.toString());
                    body.push(chunk)

                })
                let hostport = /(?:http||https)\:\/\/[^/]+?(?:\:\d+)?\//ig;
                gunzip.on("end", function () {
                    let _body = Buffer.concat(body).toString();
                    console.log(`/${cdn_location}`)
                    _body = _body.replace(hostport, `/${cdn_location}/`);
                    client_res.write(_body)
                    client_res.end()
                })
            }
        } else {
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
