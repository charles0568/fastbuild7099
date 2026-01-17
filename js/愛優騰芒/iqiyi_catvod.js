var rule = {
    title: '愛奇藝',
    host: 'https://www.iqiyi.com',
    url: '/fyclass?fypage',
    searchUrl: 'https://search.video.iqiyi.com/o?if=html5&key=**&pageNum=fypage&pageSize=24&site=iqiyi',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.iqiyi.com/'
    },
    class_name: '電影&電視劇&綜藝&動漫&紀錄片',
    class_url: '1&2&6&4&3',
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
        let url = 'https://pcw-api.iqiyi.com/search/recommend/list?channel_id=' + channelId + '&data_type=1&page_id=' + pg + '&ret_num=24';
        let html = request(url);
        let json = JSON.parse(html);
        if (json.data && json.data.list) {
            json.data.list.forEach(item => {
                let remarks = item.score ? item.score + '分' : (item.focus || '');
                d.push({
                    title: item.name,
                    img: item.imageUrl ? item.imageUrl.replace('.jpg', '_390_520.jpg') : '',
                    desc: remarks,
                    url: item.channelId + '$' + item.albumId
                });
            });
        }
        setResult(d);
    }),
    二级: $js.toString(() => {
        let d = {};
        let parts = MY_URL.split('$');
        let channelId = parts[0];
        let albumId = parts[1];
        let infoUrl = 'https://pcw-api.iqiyi.com/video/video/videoinfowithuser/' + albumId + '?agent_type=1&subkey=' + albumId;
        let html = request(infoUrl);
        let json = JSON.parse(html);
        let data = json.data || {};
        d.title = data.name || '';
        d.img = data.imageUrl || '';
        d.desc = data.description || '';
        let playlists = [];
        let cid = parseInt(channelId || data.channelId || 0);
        if (cid === 1 || cid === 5) {
            if (data.playUrl) playlists.push({ title: data.name, url: data.playUrl });
        } else {
            let listUrl = 'https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid=' + albumId + '&size=200&page=1';
            let listHtml = request(listUrl);
            let listJson = JSON.parse(listHtml);
            if (listJson.data && listJson.data.epsodelist) {
                listJson.data.epsodelist.forEach(it => {
                    playlists.push({ title: it.title || it.shortTitle || '第' + it.order + '集', url: it.playUrl });
                });
            }
        }
        let urlList = playlists.map(it => (it.title || '播放') + '$' + it.url).join('#');
        d.vod_play_from = '愛奇藝';
        d.vod_play_url = urlList;
        setResult(d);
    }),
    搜索: $js.toString(() => {
        let d = [];
        let wd = MY_URL;
        let url = 'https://search.video.iqiyi.com/o?if=html5&key=' + encodeURIComponent(wd) + '&pageNum=1&pageSize=24&site=iqiyi';
        let html = request(url);
        let json = JSON.parse(html);
        if (json.data && json.data.docinfos) {
            json.data.docinfos.forEach(item => {
                if (item.albumDocInfo) {
                    let doc = item.albumDocInfo;
                    let channelId = doc.channel ? doc.channel.split(',')[0] : '0';
                    d.push({ title: doc.albumTitle || '', img: doc.albumVImage || '', desc: doc.tvFocus || '', url: channelId + '$' + doc.albumId });
                }
            });
        }
        setResult(d);
    })
};
