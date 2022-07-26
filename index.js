const http = require('http');
const https = require('https');
const zlib = require('zlib');

http.createServer(onRequest).listen(5000);
function getPornhub(client_res, video_page_url) {
    let url = new URL(video_page_url)
    let options = {
        hostname: url.host,
        port: 443,
        path: url.pathname,
        method: 'GET',
        headers: {
            'authority': 'cn.pornhub.com',
            'pragma': 'no-cache',
            'Accept-Encoding': 'gzip, deflate, br',
            'cache-control': 'no-cache',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'sec-fetch-site': 'none',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-dest': 'document',
            'accept-language': 'zh,en;q=0.9,en-US;q=0.8,zh-CN;q=0.7',
            'referer': `https://cn.pornhub.com`
        },
        rejectUnauthorized: false,
        strictSSL: false
    };
    let req = https.request(options, function (res) {
        try {
            var gunzip = zlib.createGunzip();
            res.pipe(gunzip);
            let body = [];
            gunzip.on("data", function (chunk) {
                body.push(chunk)
            })

            gunzip.on("end", function () {
                let _body = Buffer.concat(body).toString();
                let regex = /"playerObjList"\s:\s\[{\n\s+"playerDiv"\s:\s{([\s|\S]*?)}\n\s+}\]/g
                let realurl_regex = regex.exec(_body);
                let match_obj = realurl_regex[1];
                match_obj = match_obj.replace(/\\t|\n/g, "")
                let result = eval(`function __run(){return {${realurl_regex[1]}};} __run();`)
                let mediaDefinitions = result.videoVars.mediaDefinitions;
                let video = mediaDefinitions.filter((item) => {
                    if (item.defaultQuality == true) return true;
                })
                client_res.write(video[0]['videoUrl']);
                client_res.end()
            })

        } catch (ex) {
            client_res.end()
        }
    });
    req.on("error", e => {
        console.error(e)
    })
    req.end()
}
function onRequest(client_req, client_res) {
    console.log('serve: ' + client_req.url);
    if (client_req.url.includes('js.map')) {
        client_res.end();
        return;
    }
    // client_res.setHeader("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    // client_res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    // client_res.setHeader('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');

    if (client_req.url.includes('www.thumbzilla.com')) {
        getPornhub(client_res, `https:/${client_req.url}`)
        return
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
    if (cdn_location.includes('xvideos')) {
        referer = 'https://www.xvideos.com';
        delete options.headers['host']
    }
    if (cdn_location.includes('txxx.com')) {
        referer = 'https://txxx.com';
    }
    if (client_req.url.includes('phncdn')) {
        referer = 'https://cn.pornhub.com/';
        options.headers = { 'accept': "*/*", 'Accept-Encoding': 'gzip, deflate, br', 'Connection': 'keep-alive', 'cache-control': 'no-cache' }
    }
    options.headers.referer = referer;

    let proxy = https.request(options, function (res) {
        if (options.path.includes(".m3u8")) {
            let headers = JSON.parse(JSON.stringify(res.headers));
            delete headers['content-encoding'];
            delete headers['transfer-encoding'];
            client_res.writeHead(res.statusCode, headers);
            if (cdn_location.includes('xvideos') || cdn_location.includes('phncdn')) {
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


// getPornhub('https://www.thumbzilla.com/video/ph5d33af7e3e566/male-vs-female-sexfight-loser-cums-first-and-get-humiliated')
