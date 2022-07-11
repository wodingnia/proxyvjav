const Axios = require('axios').default;
const Cheerio = require('cheerio');
class SearchEnginee {
    constructor(query) {
        this.page = 1;
        this.query = query
        this.cookies = null;
    }

    videoUrl(page) {
        return `https://www.thumbzilla.com/tags/${this.query}?page=${page || this.page}`;
    }
    gifUrl(page) {
        return `https://www.pornhub.com/gifs/search?search=${this.query}&page=${page || this.firstpage}`;
    }
    gifParser($) {
        const gifs = $('ul.gifs.gifLink li');

        return gifs.map((i, gif) => {
            const data = $(gif).find('a');

            return {
                title: data.find('span').text(),
                url: 'http://dl.phncdn.com#id#.gif'.replace('#id#', data.attr('href')),
                webm: data.find('video').attr('data-webm'),
            };
        }).get();
    }
    videoParser($) {
        let that = this;
        return new Promise((resolve, reject) => {
            Axios.get(this.videoUrl(this.page), {
            }).then((data) => {
                let cookies = data.headers["set-cookie"];
                const cookieObj = {};

                for (const c of cookies) {
                    const arr = c.split(",").map((v) => v.trim());

                    for (const str of arr) {
                        const matcher = /^([\w]+)=(.+);/.exec(str);
                        if (!matcher) continue;
                        const key = matcher[1];
                        const value = matcher[2];

                        const isBuildInKey = [
                            "path",
                            "domain",
                            "secure",
                            "httpOnly",
                            "Max-Age",
                            "expires",
                            "SameSite",
                        ].find((v) => v.toLowerCase() === key);

                        if (isBuildInKey) {
                            continue;
                        }

                        cookieObj[key] = value;
                    }
                }
                that.cookies = cookieObj;
                let body = data.data;
                let $ = Cheerio.load(body)
                const videos = $('ul.responsiveListing a.js-thumb');
                let video_list = videos.map((i) => {
                    const data = videos.eq(i);
                    if (!data.length) {
                        return;
                    }

                    const thumb = data.find('img').attr('data-defaultthumb') || '';

                    return {
                        title: data.find('span.info span.title').text().trim(),
                        url: data.attr('href'),
                        duration: data.find('.duration').text(),
                        thumb: thumb,
                        source: 'Pornhub'
                    };
                }).get();
                resolve(video_list);
            }).catch((error) => {
                console.log(error)
                reject(error)
            });
        })
    }
    videoRealUrl(video_page_url) {
        let that = this;
        return new Promise((resolve, reject) => {
            let source_url = video_page_url;
            let cookiesStr = "";
            // for (const c in that.cookies) {
            //     cookiesStr += `${c}=${that.cookies[c]};`
            // }
            Axios.get(source_url, {
                headers: {
                    cookies: cookiesStr,
                    'authority': 'cn.pornhub.com',
                    'pragma': 'no-cache',
                    'cache-control': 'no-cache',
                    'upgrade-insecure-requests': '1',
                    'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'sec-fetch-site': 'none',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-dest': 'document',
                    'accept-language': 'zh,en;q=0.9,en-US;q=0.8,zh-CN;q=0.7',
                    'referer': `https://cn.pornhub.com`,
                }
            }).then((data) => {
                try {
                    let body = data.data;
                    let regex=/"playerObjList"\s:\s\[{\n\s+"playerDiv"\s:\s{([\s|\S]*?)}\n\s+}\]/g
                    // let regex = /<script type="text\/javascript">(\W+var pageVar(\d+)\s=\s([\s\S]*?))<\/script>/g;
                    let realurl_regex = regex.exec(body);
                    let match_obj=realurl_regex[1];
                    match_obj=match_obj.replace(/\\t|\n/g,"")
                    let result = eval(`function __run(){return {${realurl_regex[1]}};} __run();`)
                    let mediaDefinitions = result.videoVars.mediaDefinitions;
                    let video = mediaDefinitions.filter((item) => {
                        if (item.defaultQuality==true) return true;
                    })
                    resolve(video[0]['videoUrl']);
                } catch (ex) {
                    reject(ex)
                }
            }).catch((error) => {
                console.log(error)
                reject(error)
            });
        })
    }
}

module.exports = SearchEnginee;

function test() {
    let enginee = new SearchEnginee("sexfight");
    // enginee.videoParser().then((data) => {
    //     // console.log(data);

    // });
    enginee.videoRealUrl('https://www.thumbzilla.com/video/ph5d33af7e3e566/male-vs-female-sexfight-loser-cums-first-and-get-humiliated').then((data) => {
        console.log(data)
    });

}
test()