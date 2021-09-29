import { Dataset } from '../types'

//const CATALOG_ROOT = 'https://s3.eu-west-1.amazonaws.com/directory.spatineo.com/tmp/tuulituhohaukka-stac/catalog/root2.json'
const CATALOG_ROOT = 'https://pta.data.lit.fmi.fi/stac/root.json'

interface Link {
  rel: string
  href: string
  time?: Time
}

interface Time {
  time_start: string
  time_end: string
}

interface CreatedLinkObject {
  time_start: Date
  time_end: Date
}

//const debug = console.log;
/* eslint-disable @typescript-eslint/no-unused-vars */
const debug = function (...args: any[]) { /* NOP */ }

const CACHE : Record<string, Promise<Response> | undefined> = {}

async function get(url : string) {
  let promise = CACHE[url];
  if (promise === undefined) {
    promise = fetch(url, { method: 'GET' }).then(r => r.json())
    CACHE[url] = promise;
  }

  return await promise;
}

// 1. get root catalog
// 2. get all datasets catalog
// 3. read id and title from each dataset catalog and return as an array of objects {datasets: [{id: 'foo', title: 'bar'}, {...}]}
export const getAllDatasets = (): Promise<any[]> => {

  debug('API: getAllDatasets Called')
  return new Promise((resolve, reject) => {
    get(CATALOG_ROOT).then((rootCatalog : any) => {
      const datasetPromises = rootCatalog.links.filter((link: Link) => link.rel === 'child')
        .map((link: Link) => {
          debug('API: Looping to get next level inside catalog 🔁 ')
          debug('API: Current link to fetch is: ', link.href)
          return get(link.href)
        });
      Promise.all(datasetPromises).then(resolve).catch(reject)
    }).catch(reject)
  });
}

// 1. get all dataset catalogs
// 2. find the dataset catalog with given id
// 3. return bands from selecte dataset catalog contents
export const getBandsForDataset = (id: string): Promise<any> => {
  debug('API: getBandsForDatasets called!')
  return new Promise((resolve, reject) => {
    getAllDatasets().then((dataSets : any[]) => {
        const dataSetById = dataSets.find((dataset: Dataset) => dataset.id == id)
        if (dataSetById) {
            resolve(dataSetById.summaries.bands)
        } else {
            reject('on such dataset: '+id)
        }
    }).catch(reject);
  })
}


const daysSinceEpoch = (date : Date) : number => {
  return Math.floor(date.getTime()/(24*60*60*1000));
}

const getItemsForDatasetAndTime_currentOrPrevious = (datasetId: string, inspectionTime: string) => {
  const inspectionDate = new Date(inspectionTime)
  const fullDaysSinceEpoch = daysSinceEpoch(inspectionDate)
  return getItemsForDatasetAndTime_generic(
    datasetId, 
    inspectionDate,
    (a: CreatedLinkObject, b: CreatedLinkObject) => -(a.time_start.getTime() - b.time_start.getTime()),
    (object: any) => object.time_start.getTime() <= inspectionDate.getTime(),
    (item: any) => daysSinceEpoch(item.time_start) <= fullDaysSinceEpoch)
}

function startOfUTCDay(date : Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

// Currently the default mode is to get the currentOrPrevious
export const getItemsForDatasetAndTime = getItemsForDatasetAndTime_currentOrPrevious

const getItemsForDatasetAndTime_generic = (
  datasetId: string, 
  inspectionDate: Date, 
  sortObjectComparison: (a: CreatedLinkObject, b: CreatedLinkObject) => number,
  pickStartingCatalog: (object: any) => boolean,
  pickItem: (item: any) => boolean) => {
  debug('API: getItemsForDatasetAndTime called!')

  return new Promise((resolve, reject) => {

    const createLinkObject = (link: Link) => {
        return {
          href: link.href,
          time_start: link.time ? new Date(link.time.time_start) : null,
          time_end: link.time ? new Date(link.time.time_end) : null
        }
    }

    getAllDatasets().then((dataSets) => {

        const dataSetById = dataSets.find((dataSet: any) => dataSet.id == datasetId)
        if (!dataSetById) {
            return reject('No such dataset: '+datasetId)
        }
        const listOfSubCatalogs = dataSetById.links.filter((link: Link) => link.rel === 'child').map(createLinkObject)

        // sort list in timely order
        listOfSubCatalogs.sort(sortObjectComparison)
        debug('API: ListOfSubCatalogs: ', listOfSubCatalogs)

        // Find the first dataset-time catalog that might contain inspectionDate
        const index = listOfSubCatalogs.findIndex(pickStartingCatalog)

        const workingList = index === -1 ? [] : listOfSubCatalogs.slice(index) as any[]

        const findCatalogAndItems = (workingList : any[]) => {
            return new Promise((resolve, reject) => {
                if (workingList.length == 0) {
                    debug('There are no items matching what we wanted')
                    return resolve({ items: [ /* items */] })
                }
                const obj = workingList.splice(0,1)[0]
                get(obj.href).then((datasetTimeCatalog : any) => {

                    const items = datasetTimeCatalog.links.filter((link: Link) => link.rel === 'item').map(createLinkObject)
                    items.sort(sortObjectComparison)
                    debug('API: Sorted items ', items)

                    // Find item that starts after inspection time
                    const foundFirstItem = items.find(pickItem)
                    if (!foundFirstItem) {
                        // Try the next catalog: note, the workingList has been spliced, so this call wll process the next item
                        return findCatalogAndItems(workingList).then(resolve).catch(reject)
                    }
                  
                    // if inspectionTime is within foundFirstItem.time_start and time_end 
                    //    then) start_of_day = start of inspectionTime day
                    //    else) start_of_day  = start of foundFirstItem.time_start
                    let start_of_day : Date
                    if (foundFirstItem.time_start.getTime() <= inspectionDate.getTime() && inspectionDate.getTime() < foundFirstItem.time_end.getTime()) {
                      start_of_day = startOfUTCDay(inspectionDate)
                    } else {
                      start_of_day = startOfUTCDay(foundFirstItem.time_start)
                    }
                    const end_of_day = new Date(start_of_day.getTime()+24*60*60*1000)

                    const foundItems = items.filter((item: any) => item.time_start.getTime() < end_of_day.getTime() && start_of_day.getTime() <= item.time_end.getTime())
                    debug('API:',foundItems.length,'item(s) found! that span',start_of_day, '-',end_of_day)
                    
                    const itemFetchPromises = foundItems.map((i : any) => get(i.href))
                    Promise.all(itemFetchPromises).then(items => {
                        debug('API: Fetched', items.length, 'items')
                        resolve({ items: items })
                    }).catch(reject)

                }).catch(reject)
            })
        }
        findCatalogAndItems(workingList).then(resolve).catch(reject)

    }).catch(reject)
  })
}
