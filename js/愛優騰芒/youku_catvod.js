var rule = {
    title: '優酷視頻',
    host: 'https://www.youku.com',
    url: '/fyclass?fypage',
    searchUrl: 'https://search.youku.com/api/search?pg=fypage&keyword=**',
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.youku.com' },
    class_name: '電視劇&電影&綜藝&動漫',
    class_url: '电视剧&电影&综艺&动漫',
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
        let tid = MY_CATE;
        let pg = MY_PAGE;
        let params = JSON.stringify({ type: tid });
        let url = 'https://www.youku.com/category/data?optionRefresh=1&pageNo=' + pg + '&params=' + encodeURIComponent(params);
        let html = request(url);
        let json = JSON.parse(html);
        if (json.data && json.data.filterData && json.data.filterData.listData) {
            json.data.filterData.listData.forEach(item => {
                let vid = '';
                if (item.videoLink && item.videoLink.includes('id_')) vid = item.videoLink.split('id_')[1].split('.html')[0];
                if (vid) d.push({ title: item.title, img: item.img, desc: item.summary || '', url: vid });
            });
        }
        setResult(d);
    }),
    二级: $js.toString(() => {
        let d = {};
        let id = MY_URL;
        let api = 'https://search.youku.com/api/search?appScene=show_episode&showIds=' + id;
        let html = request(api);
        let json = JSON.parse(html);
        let videoLists = json.serisesList || [];
        d.title = videoLists.length > 0 && videoLists[0].title ? videoLists[0].title.split(' ')[0] : '未知';
        d.img = '';
        d.desc = '';
        let urlList = [];
        videoLists.forEach(it => {
            let title = it.showVideoStage ? it.showVideoStage.replace('期', '集') : (it.displayName || '第' + (it.index || '?') + '集');
            let link = 'https://v.youku.com/v_show/id_' + it.videoId + '.html';
            urlList.push(title + '$' + link);
        });
        d.vod_play_from = '優酷';
        d.vod_play_url = urlList.join('#');
        setResult(d);
    }),
    搜索: $js.toString(() => {
        let d = [];
        let wd = MY_URL;
        let url = 'https://search.youku.com/api/search?pg=1&keyword=' + encodeURIComponent(wd);
        let html = request(url);
        let json = JSON.parse(html);
        if (json.pageComponentList) {
            json.pageComponentList.forEach(it => {
                if (it.commonData) {
                    let data = it.commonData;
                    d.push({ title: data.titleDTO ? data.titleDTO.displayName : '', img: data.posterDTO ? data.posterDTO.vThumbUrl : '', desc: data.stripeBottom || '', url: data.showId });
                }
            });
        }
        setResult(d);
    })
};
