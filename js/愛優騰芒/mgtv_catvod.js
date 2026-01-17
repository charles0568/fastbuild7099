var rule = {
    title: '芒果TV',
    host: 'https://www.mgtv.com',
    url: '/fyclass?fypage',
    searchUrl: 'https://mobileso.bz.mgtv.com/msite/search/v2?q=**&pn=fypage&pc=20',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.mgtv.com/' },
    class_name: '電影&電視劇&綜藝&動漫&紀錄片',
    class_url: '3&2&1&50&51',
    play_parse: true,
    lazy: $js.toString(() => {
        const parsers = ['https://jx.xmflv.com/?url=', 'https://jx.m3u8.tv/jiexi/?url='];
        for (let api of parsers) {
            try {
                let html = request(api + input);
                let m3u8 = html.match(/['"](https?:\/\/[^'"]*\.m3u8[^'"]*)['"]/);
                if (m3u8 && m3u8[1]) { input = { parse: 0, url: m3u8[1] }; break; }
            } catch(e) {}
        }
    }),
    推荐: $js.toString(() => { setResult([]); }),
    一级: $js.toString(() => {
        let d = [];
        let channelId = MY_CATE;
        let pg = MY_PAGE;
        let url = 'https://pianku.api.mgtv.com/rider/list/pcweb/v3?platform=pcweb&channelId=' + channelId + '&pn=' + pg + '&pc=20&year=all&sort=c2&area=a1';
        let html = request(url);
        let json = JSON.parse(html);
        if (json.data && json.data.hitDocs) {
            json.data.hitDocs.forEach(item => {
                d.push({ title: item.title, img: item.img, desc: item.updateInfo || '', url: item.playPartId });
            });
        }
        setResult(d);
    }),
    二级: $js.toString(() => {
        let d = {};
        let videoId = MY_URL;
        let infoUrl = 'https://pcweb.api.mgtv.com/video/info?video_id=' + videoId;
        let html = request(infoUrl);
        let json = JSON.parse(html);
        let infoData = json.data && json.data.info ? json.data.info : {};
        d.title = infoData.title || '';
        d.img = infoData.img || '';
        d.desc = infoData.desc || '';
        let firstUrl = 'https://pcweb.api.mgtv.com/episode/list?video_id=' + videoId + '&page=1&size=50';
        let firstHtml = request(firstUrl);
        let firstJson = JSON.parse(firstHtml);
        let allEpisodes = firstJson.data && firstJson.data.list ? firstJson.data.list : [];
        let urlList = [];
        allEpisodes.forEach(item => {
            if (item.isIntact == '1' || item.isIntact == 1) {
                let name = item.t4 || item.t3 || item.title;
                let playLink = 'https://www.mgtv.com' + item.url;
                urlList.push(name + '$' + playLink);
            }
        });
        d.vod_play_from = '芒果TV';
        d.vod_play_url = urlList.join('#');
        setResult(d);
    }),
    搜索: $js.toString(() => {
        let d = [];
        let wd = MY_URL;
        let url = 'https://mobileso.bz.mgtv.com/msite/search/v2?q=' + encodeURIComponent(wd) + '&pn=1&pc=20';
        let html = request(url);
        let json = JSON.parse(html);
        if (json.data && json.data.contents) {
            json.data.contents.forEach(group => {
                if (group.type === 'media' && group.data) {
                    group.data.forEach(item => {
                        if (item.source === 'imgo') {
                            let match = item.url.match(/\/(\d+)\.html/);
                            if (match) d.push({ title: item.title.replace(/<B>|<\/B>/g, ''), img: item.img, desc: '', url: match[1] });
                        }
                    });
                }
            });
        }
        setResult(d);
    })
};
