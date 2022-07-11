const Axios = require('axios').default;
const Cheerio = require('cheerio');
function basel64_decode(e) {
    var t = "АВСDЕFGHIJKLМNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,~", n = "", i = 0;
    /[^АВСЕМA-Za-z0-9\.\,\~]/g.exec(e) && this.log("error decoding url");
    e = e.replace(/[^АВСЕМA-Za-z0-9\.\,\~]/g, "");
    do {
      var o = t.indexOf(e.charAt(i++))
        , r = t.indexOf(e.charAt(i++))
        , s = t.indexOf(e.charAt(i++))
        , a = t.indexOf(e.charAt(i++));
      o = o << 2 | r >> 4,
        r = (15 & r) << 4 | s >> 2;
      var l = (3 & s) << 6 | a;
      n += String.fromCharCode(o),
        64 != s && (n += String.fromCharCode(r)),
        64 != a && (n += String.fromCharCode(l))
    } while (i < e.length);
    return unescape(n)
  }

class SearchEnginee {
    constructor(query) {
        this.page = 1;
        this.query = query
    }

    videoUrl(page) {
        this.page = page;
        return `https://vjav.com/api/videos.php?params=259200/str/relevance/60/search..${page || this.page}.all..&s=${this.query}&sort=latest-updates&date=all&type=all&duration=all`;
    }

    gifUrl(page) {
        //https://vp1.vjav.com/c2/videos/351000/351264/351264_tr.mp4
        return `https://vjav.com/gifs/search?search=${this.query}&page=${page || this.firstpage}`;
    }

    videoParser() {
        return new Promise((resolve, reject) => {
            Axios.get(this.videoUrl(this.page), {
                headers: {
                    referer: `https://vjav.com/search/2/?s=${this.query}&sort=latest-updates&date=all&type=all&duration=all`,
                    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36'
                }
            }).then(({ data: body }) => {
                let result=body.videos.map((video, i) => {
                    return {
                        rating:video.rating,
                        views:video.video_viewed,
                        title: video.title ,
                        url: `https://vjav.com/api/videofile.php?video_id=${video.video_id}&lifetime=8640000` ,
                        duration: video.duration ,
                        thumb: video.scr ,
                        gif: `https://vp1.vjav.com/c2/videos/${parseInt(video.video_id / 1000)}000/${video.video_id}/${video.video_id}_tr.mp4`,
                        source: 'Vjav'
                    };
                }).get();
                resolve(result);
            }).catch((error) => {
                console.log(error)
                reject(error)
            });
        })
    }
    videoRealUrl(url) {
        return new Promise((resolve, reject) => {
            let regex=/video_id=(\d+)&lifetime/g
            let match=regex.exec(url)
            if(match==null) {return reject(new Error('url error'));}
            let source_url = url;
            Axios.get(source_url, {
                headers: {
                    referer: `https://vjav.com`,
                    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36'
                }
            }).then((res) => {
                let body=res.data;
                let base64_url=body[0]['video_url'];
                resolve(`https://vjav.com${basel64_decode(base64_url)}`);
            }).catch((error) => {
                console.log(error)
                reject(error)
            });
        })
    }
    gifParser($) {
        return null;
    }
}
module.exports = SearchEnginee;

function test() {
    let enginee = new SearchEnginee("sexfight");
    // enginee.videoParser().then((data) => {
    //     console.log(data)
    // });
    enginee.videoRealUrl('https://vjav.com/api/videofile.php?video_id=137157&lifetime=8640000').then((data) => {
        console.log(data)
    });
    
}
test()
