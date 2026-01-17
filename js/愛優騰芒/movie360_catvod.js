var rule = {
    title: '360影視',
    host: 'https://www.360kan.com',
    url: '/fyclass?fypage',
    searchUrl: 'https://api.so.360kan.com/index?kw=**',
    searchable: 2,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; MI 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.101 Mobile Safari/537.36',
        'Referer': 'https://www.360kan.com'
    },
    class_name: '電視劇&電影&動漫&綜藝',
    class_url: '2&1&4&3',
    play_parse: true,
    lazy: $js.toString(() => {
        const parsers = [
            'https://jx.xmflv.com/?url=',
            'https://jx.m3u8.tv/jiexi/?url='
        ];
        for (let api of parsers) {
            try {
                let html = request(api + input);
                let m3u8 = html.match(/['"](https?:\/\/[^'"]*\.m3u8[^'"]*)['"]/);
                if (m3u8 && m3u8[1]) {
                    input = { parse: 0, url: m3u8[1] };
                    break;
                }
            } catch(e) {}
        }
    }),
    推荐: $js.toString(() => {
        let d = [];
        let html = request('https://api.web.360kan.com/v1/rank?cat=1&size=20');
        let json = JSON.parse(html);
        if (json.data) {
            json.data.forEach(item => {
                d.push({
                    title: item.title,
                    img: item.cover,
                    desc: item.upinfo || '',
                    url: item.cat + '_' + item.ent_id
                });
            });
        }
        setResult(d);
    }),
    一级: $js.toString(() => {
        let d = [];
        let tid = MY_CATE;
        let pg = MY_PAGE;
        let html = request('https://api.web.360kan.com/v1/filter/list?catid=' + tid + '&size=21&pageno=' + pg);
        let json = JSON.parse(html);
        if (json.data && json.data.movies) {
            json.data.movies.forEach(item => {
                let pic = item.cdncover || item.cover || '';
                if (pic && !pic.startsWith('http')) pic = 'https:' + pic;
                d.push({
                    title: item.title,
                    img: pic,
                    desc: item.doubanscore || item.comment || '',
                    url: tid + '_' + item.id
                });
            });
        }
        setResult(d);
    }),
    二级: $js.toString(() => {
        let d = {};
        let ids = MY_URL.split('_');
        let cat = ids[0];
        let id = ids[1];
        let html = request('https://api.web.360kan.com/v1/detail?cat=' + cat + '&id=' + id);
        let json = JSON.parse(html);
        let data = json.data;
        d.title = data.title || '';
        d.img = data.cdncover || '';
        d.type = data.moviecategory ? data.moviecategory.slice(-1)[0] : '';
        d.year = data.pubdate || '';
        d.area = (data.area || []).join(', ');
        d.actor = (data.actor || []).join(', ');
        d.director = (data.director || []).join(', ');
        d.desc = data.description || '';
        let playUrls = [];
        let playFrom = [];
        let allSites = data.playlink_sites || Object.keys(data.playlinksdetail || {});
        for (let site of allSites) {
            let episodes = data.allepidetail && data.allepidetail[site] ? data.allepidetail[site] : [];
            let urlList = [];
            if (episodes.length > 0) {
                episodes.forEach(ep => {
                    if (ep.url && ep.playlink_num) urlList.push(ep.playlink_num + '$' + ep.url);
                });
            } else if (data.playlinksdetail && data.playlinksdetail[site] && data.playlinksdetail[site].default_url) {
                urlList.push('播放$' + data.playlinksdetail[site].default_url);
            }
            if (urlList.length > 0) {
                playFrom.push(site);
                playUrls.push(urlList.join('#'));
            }
        }
        d.vod_play_from = playFrom.join('$$$');
        d.vod_play_url = playUrls.join('$$$');
        setResult(d);
    }),
    搜索: $js.toString(() => {
        let d = [];
        let wd = MY_URL;
        let html = request('https://api.so.360kan.com/index?kw=' + encodeURIComponent(wd));
        let json = JSON.parse(html);
        if (json.data && json.data.longData && json.data.longData.rows) {
            json.data.longData.rows.forEach(row => {
                d.push({
                    title: row.titleTxt || '',
                    img: row.cover || '',
                    desc: row.coverInfo ? row.coverInfo.txt : '',
                    url: row.cat_id + '_' + row.en_id
                });
            });
        }
        setResult(d);
    })
};
