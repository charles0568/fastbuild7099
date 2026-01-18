const appConfig = {
    _webSite: '',
    get webSite() {
        return this._webSite
    },
    set webSite(value) {
        this._webSite = value
    },
    _uzTag: '',
    get uzTag() {
        return this._uzTag
    },
    set uzTag(value) {
        this._uzTag = value
    },
}

const convertImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url
    if (url.indexOf('#headers#') !== -1) return url
    if (url.indexOf('doubanio.com') !== -1) {
        let finalUrl = url;
        if (finalUrl.startsWith('http://')) {
            finalUrl = finalUrl.replace('http://', 'https://');
        }
        const headers = {
            "Referer": "https://movie.douban.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        return finalUrl + '#headers#' + JSON.stringify(headers)
    }
    if (url.indexOf('@Referer=') === -1 && url.indexOf('@User-Agent=') === -1) return url
    try {
        const parts = url.split('@')
        const baseUrl = parts[0]
        const headers = {}
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i]
            const equalIndex = part.indexOf('=')
            if (equalIndex !== -1) {
                const key = part.substring(0, equalIndex)
                const value = part.substring(equalIndex + 1)
                headers[key] = value
            }
        }
        if (Object.keys(headers).length > 0) {
            return baseUrl + '#headers#' + JSON.stringify(headers)
        }
        return baseUrl
    } catch (error) {
        return url
    }
}

const processVideoData = (data) => {
    if (!data) return data
    if (Array.isArray(data)) return data.map(item => processVideoData(item))
    if (typeof data === 'object') {
        const processed = { ...data }
        if (processed.vod_pic) processed.vod_pic = convertImageUrl(processed.vod_pic)
        if (appConfig.webSite && appConfig.webSite.indexOf('/video/douban') !== -1) {
            processed.goSearch = true
        }
        return processed
    }
    return data
}

const fetch = async (params) => {
    let p = ''
    if (params) {
        const tmp = []
        for (let key in params) {
            tmp.push(key + '=' + encodeURIComponent(params[key]))
        }
        p = '&' + tmp.join('&')
    }
    const res = await req(appConfig.webSite + p)
    return res.data
}

async function getClassList(args) {
    var backData = new RepVideoClassList()
    try {
        const ret = await fetch()
        backData.data = ret.class
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function getSubclassList(args) {
    var backData = new RepVideoSubclassList()
    return JSON.stringify(backData)
}

async function getVideoList(args) {
    var backData = new RepVideoList()
    try {
        const ret = await fetch({ ac: 'detail', t: args.url, pg: args.page })
        backData.data = processVideoData(ret.list)
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function getSubclassVideoList(args) {
    var backData = new RepVideoList()
    return JSON.stringify(backData)
}

async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        const ret = await fetch({ ac: 'detail', ids: args.url })
        if (ret.list && ret.list.length > 0) {
            backData.data = processVideoData(ret.list[0])
        }
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    try {
        const ret = await fetch({ flag: args.flag, play: args.url })
        if (ret.jx === 1 || ret.parse === 1) {
            backData.sniffer = {
                url: ret.url || args.url,
                ua: ret.header && ret.header['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
            if (ret.header) backData.headers = ret.header
        } else {
            const audioUrl = ret.extra && ret.extra.audio ? ret.extra.audio : null
            if (Array.isArray(ret.url)) {
                const nameMap = {
                    RAW: { name: '原画', priority: 9999 },
                    raw: { name: '原画', priority: 9999 },
                    '4k': { name: '4K', priority: 4000 },
                    FOUR_K: { name: '4K', priority: 4000 },
                    QHD: { name: '超清', priority: 3500 },
                    super: { name: '高清', priority: 3000 },
                    SUPER: { name: '高清', priority: 3000 },
                    FHD: { name: '高清', priority: 3000 },
                    high: { name: '标清', priority: 2000 },
                    HIGH: { name: '标清', priority: 2000 },
                    HD: { name: '标清', priority: 2000 },
                    NORMAL: { name: '普画', priority: 1000 },
                    SD: { name: '普画', priority: 1000 },
                    low: { name: '流畅', priority: 100 },
                    LD: { name: '流畅', priority: 100 },
                }
                let urls = ret.url.reduce((acc, curr, index, array) => {
                    if (index % 2 === 0) {
                        if (curr.startsWith('代理')) return acc;
                        const urlItem = {
                            name: nameMap[curr] ? nameMap[curr].name : curr,
                            url: array[index + 1],
                            header: ret.header,
                            priority: nameMap[curr] ? nameMap[curr].priority : 0,
                        }
                        if (audioUrl) urlItem.audioUrl = audioUrl
                        acc.push(urlItem)
                    }
                    return acc
                }, [])
                urls.sort((a, b) => b.priority - a.priority)
                backData.urls = urls
                backData.data = urls[0]
            } else {
                const urlItem = { name: '默认', url: ret.url, header: ret.header, priority: 0 }
                if (audioUrl) urlItem.audioUrl = audioUrl
                backData.urls = [urlItem]
                backData.data = urlItem
            }
            if (ret.header) backData.headers = ret.header
            if (audioUrl) backData.audioUrl = audioUrl
        }
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        const ret = await fetch({ wd: args.searchWord, pg: args.page })
        backData.data = processVideoData(ret.list)
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}
