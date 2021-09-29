export interface TuulituhoResultUnit {
    time: number
    count: number
}

export interface TuulituhoResult {
    data: TuulituhoResultUnit[]
}

//const debug = function (...args: any[]) { console.log('Tuulituhot:', ...args) }
const debug = function (...args: any[]) { /* NOP */ }

const SMK_FEATURE_SERVICE = 'https://aineistot.metsakeskus.fi/metsakeskus/rest/services/Metsatieto/MKItuhot/FeatureServer/0/query/'

function simplifyTime(time : number) {
    const date = new Date(time)
    date.setHours(0)
    date.setMinutes(0)
    date.setMinutes(0)
    date.setMilliseconds(0)
    return date.getTime()
}

export function getTuulituhotDaily(time_start : Date, time_end : Date) : Promise<TuulituhoResult> {
    return new Promise((resolve, reject) => {
        const url = new URL(SMK_FEATURE_SERVICE)
        const params : Record<string, string> = {
            f: 'json',
            groupByFieldsForStatistics: 'mki_saapumispvm',
            orderByFields: 'mki_saapumispvm',
            outStatistics: '[{"statisticType":"COUNT","onStatisticField":"mki_saapumispvm","outStatisticFieldName":"stats"}]',
            time: `${time_start.getTime()},${time_end.getTime()}`
        }
        Object.keys(params).forEach(k => { url.searchParams.append(k, params[k]) })
        debug('fetching url', url.toString())
        fetch(url.toString(), { method: 'GET' }).then(response => {
            response.json().then(data => {
                resolve({
                    data : data.features.map((f : any) => ({ time : simplifyTime(f.attributes.mki_saapumispvm), count : f.attributes.stats }))
                })
            }).catch(reject)
        }).catch(reject)
    })
}

export function getTuulituhotMonthly(time_start : Date, time_end : Date) : Promise<TuulituhoResult> {
    return new Promise((resolve, reject) => {
        const first_day = new Date(time_start.getFullYear(), time_start.getMonth(), 1);
        const last_day = new Date(time_end.getFullYear(), time_end.getMonth() + 1, 0);
        debug('retrieving between',first_day,'and',last_day)
        getTuulituhotDaily(first_day, last_day).then(dailyResult => {
            const monthlyResult = {
                data: dailyResult.data.reduce((memo, r) => {
                    const day = new Date(r.time)
                    const month_start = new Date(day.getFullYear(), day.getMonth(), 1).getTime()
                    let record = memo.find(m => m.time === month_start)
                    if (!record) {
                        record = { time: month_start, count: r.count }
                        memo.push(record)
                    } else {
                        record.count += r.count
                    }
                    return memo;
                }, [] as TuulituhoResultUnit[])
            }
            resolve(monthlyResult)
        }).catch(reject)
    })
}
