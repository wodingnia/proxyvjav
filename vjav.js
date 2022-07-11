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
                resolve({
                    title: body.videos.map((item) => { return item.title }),
                    url: body.videos.map((item) => { return `https://vjav.com/api/videofile.php?video_id=${item.video_id}&lifetime=8640000` }),
                    duration: body.videos.map((item) => { return item.duration }),
                    thumb: body.videos.map((item) => { return item.scr }),
                    gif: body.videos.map((item) => { return `https://vp1.vjav.com/c2/videos/${parseInt(item.video_id / 1000)}000/${item.video_id}/${item.video_id}_tr.mp4` }),
                    source: 'Vjav'
                });
            }).catch((error) => {
                console.log(error)
                reject(error)
            });
        })
    }
    videoRealUrl(videoId) {
        return new Promise((resolve, reject) => {
            let source_url = `https://vjav.com/api/videofile.php?video_id=${videoId}&lifetime=8640000`;
            Axios.get(source_url, {
                headers: {
                    referer: `https://vjav.com`,
                    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36'
                }
            }).then(({ data: body }) => {
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

// function test() {
//     let enginee = new SearchEnginee("sexfight");
//     // enginee.videoParser().then((data) => {
//     //     console.log(data)
//     // });
//     enginee.videoRealUrl(543111).then((data) => {
//         console.log(data)
//     });
    
// }
// test()
