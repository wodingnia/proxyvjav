const Axios = require('axios').default;
const Cheerio = require('cheerio');
class SearchEnginee {
    constructor(query) {
        this.page = 0;
        this.query = query
    }

    videoUrl(page) {
        return `https://www.xvideos.com/?k=${this.query}&sort=relevance&p=${page || this.page}`;
    }

    videoParser($) {
        return new Promise((resolve, reject) => {
            Axios.get(this.videoUrl(this.page), {
            }).then(({ data: body }) => {
                let $ = Cheerio.load(body)
                const videos = $('#content .mozaique .thumb-block');
                let video_list = videos.map((i, video) => {
                    const cache = $(video);
                    const title = cache.find('p a').clone().children().remove().end();
                    //find('p a').contents().filter(function(){ return this.nodeType == 3; }).text()
                    return {
                        title: title.text(),
                        url: `https://xvideos.com${title.attr('href')}`,
                        duration: cache.find('.duration').text(),
                        thumb: cache.find('.thumb img').data('src'),
                        source: 'Xvideos'
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
        return new Promise((resolve, reject) => {
            let source_url = video_page_url;
            Axios.get(source_url, {
                headers: {
                    referer: `https://www.xvideos.com/`,
                    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36'
                }
            }).then(({ data: body }) => {
                try {
                    let regex = /html5player\.setVideoHLS\('(.*?)'\);/g;
                    let realurl_regex = regex.exec(body);
                    resolve(realurl_regex[1]);
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
// function test() {
//     let enginee = new SearchEnginee("sexfight");
//     // enginee.videoParser().then((data) => {
//     //     console.log(data)
//     // });
//     enginee.videoRealUrl('https://www.xvideos.com/video617900/big_tits_strip_fight').then((data) => {
//         console.log(data)
//     });

// }
// test()