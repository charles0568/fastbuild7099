var rule = {
    title: '騰訊視頻',
    host: 'https://v.qq.com',
    url: '/fyclass?fypage',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://v.qq.com/' },
    class_name: '電影&電視劇&綜藝&動漫',
    class_url: 'movie&tv&variety&cartoon',
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
        let channel = MY_CATE;
        let pg = MY_PAGE;
        let offset = (parseInt(pg) - 1) * 21;
        let url = 'https://v.qq.com/x/bu/pagesheet/list?_all=1&append=1&channel=' + channel + '&listpage=1&offset=' + offset + '&pagesize=21&iarea=-1';
        let html = request(url);
        let regex = /<div[^>]*class=["']?list_item["']?[^>]*>([\s\S]*?)<\/div>/gi;
        let matches = html.match(regex) || [];
        matches.forEach(item => {
            let titleMatch = item.match(/<img[^>]*alt=["']?([^"']*)["']?/i);
            let picMatch = item.match(/<img[^>]*src=["']?([^"'\s>]+)["']?/i);
            let urlMatch = item.match(/<a[^>]*data-float=["']?([^"'\s>]+)["']?/i);
            if (titleMatch && picMatch) d.push({ title: titleMatch[1] || '', img: picMatch[1] || '', desc: '', url: channel + '$' + (urlMatch ? urlMatch[1] : '') });
        });
        setResult(d);
    }),
    二级: $js.toString(() => {
        let d = {};
        let parts = MY_URL.split('$');
        let targetCid = parts[1] || parts[0];
        let detailUrl = 'https://node.video.qq.com/x/api/float_vinfo2?cid=' + targetCid;
        let html = request(detailUrl);
        let json = JSON.parse(html);
        d.title = json.c && json.c.title ? json.c.title : '';
        d.img = json.c && json.c.pic ? json.c.pic : '';
        d.desc = json.c && json.c.description ? json.c.description : '';
        let videoIds = json.c && json.c.video_ids ? json.c.video_ids : [];
        let urlList = [];
        videoIds.forEach((vid, idx) => {
            let playUrl = 'https://v.qq.com/x/cover/' + targetCid + '/' + vid + '.html';
            urlList.push('第' + (idx + 1) + '集$' + playUrl);
        });
        d.vod_play_from = '騰訊視頻';
        d.vod_play_url = urlList.join('#');
        setResult(d);
    }),
    搜索: $js.toString(() => {
        let d = [];
        let wd = MY_URL;
        let url = 'https://pbaccess.video.qq.com/trpc.videosearch.mobile_search.MultiTerminalSearch/MbSearch?vplatform=2';
        let payload = JSON.stringify({ version: '25042201', clientType: 1, query: wd, pagenum: 0, pagesize: 30 });
        let html = post(url, payload, { 'Content-Type': 'application/json' });
        let json = JSON.parse(html);
        if (json.data && json.data.normalList && json.data.normalList.itemList) {
            json.data.normalList.itemList.forEach(it => {
                if (it && it.doc && it.doc.id && it.videoInfo && it.doc.id.length > 11) {
                    d.push({ title: it.videoInfo.title ? it.videoInfo.title.replace(/<\/?em>/g, '') : '', img: it.videoInfo.imgUrl || '', desc: '', url: it.doc.id });
                }
            });
        }
        setResult(d);
    })
};
