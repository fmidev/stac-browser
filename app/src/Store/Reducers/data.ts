import { createReducer } from '@reduxjs/toolkit'
import { ReduxState } from '../../types'

const initialState: ReduxState = {
  data: {
    global: {
      mapExtent: {
        center: [397915, 7132330],
        resolution: 3550,
        rotation: 0
      },
      sidebarIsOpen: false,
      clickedColorTile: '',
      inspectionDate: "",
      comparisonDate: "",
      fullScreen: "",
      mapSize: ""
    },
    maps: []
  },
  cache: {
    catalog: {},
    datasets: [],
    windDamages: []
  }
}

//const debug = console.log;
const debug = function (...args: any[]) { /* NOP */ }

const dataReducer = createReducer(initialState, {
  CATALOG_FETCH_FINISHED: (state, action) => {
    debug('Reducer: Loading Catalog finished! Setting state in Redux')
    debug('Reducer: Action payload in reducer: ', action.payload)
    //state.dataFetching.fetchInProgress[action.payload.url] = action.payload.inProgress
    state.cache.catalog[action.payload.url] = action.payload.fetchedCatalog
  },
  SET_INITIAL_SETUP: (state, action) => {
    debug('Reducer: Loading initial setup from JSON file and setting state in Redux')
    debug('Reducer: Actions pay load in reducer: ', action.payload)
    state.data.global.inspectionDate = new Date('2021-07-21').toISOString()
    state.data.global.fullScreen = action.payload.data.global.fullScreen
    state.data.global.mapSize = action.payload.data.global.mapSize
    state.data.maps = action.payload.data.maps
  },
  SET_STATE_FROM_URL: (state, action) => {
    debug('Reducer: Setting state based on URL')
    debug('Reducer: Action payload: ', action.payload)
    state.data = action.payload.data
  },
  SET_RED_CHANNEL: (state, action) => {
    debug('Reducer: Setting red channel value in redux')
    debug('Reducer: action payload for set red channel: ', action.payload)
    state.data.maps[action.payload.mapComponentIndex].channelSettings.R = action.payload.redChannelValue
  },
  SET_GREEN_CHANNEL: (state, action) => {
    debug('Reducer: Setting green channel value in redux')
    debug('Reducer: action payload for set green channel: ', action.payload)
    state.data.maps[action.payload.mapComponentIndex].channelSettings.G = action.payload.greenChannelValue
  },
  SET_BLUE_CHANNEL: (state, action) => {
    debug('Reducer: Setting blue channel value in redux')
    debug('Reducer: action payload for set blue channel: ', action.payload)
    state.data.maps[action.payload.mapComponentIndex].channelSettings.B = action.payload.blueChannelValue
  },
  SET_SELECTED_MONTH: (state, action) => {
    debug('Reducer: Setting selected month in reducer')
    debug('Reducer: Action payload: ', action.payload)
    // state.data.global.selectonth = action.payload.selectedMonthedM
  },
  SET_INSPECTION_DATE: (state, action) => {
    debug('Reducer: Setting inspection date in reducer')
    debug('Reducer: Action payload: ', action.payload)
    const d = action.payload.inspectionDate;
    const dateUtc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    state.data.global.inspectionDate = dateUtc.toISOString()
  },
  SET_COMPARISON_DATE: (state, action) => {
    debug('Reducer: Setting comparison date in reducer')
    debug('Reducer: Action payload: ', action.payload)
    state.data.global.comparisonDate = action.payload.comparisonDate
  },
  SET_SELECTED_DATASET: (state, action) => {
    debug('Reducer: Setting data source or map in reducer')
    debug('Reducer: Action payload: ', action.payload)
    state.data.maps[action.payload.mapComponentIndex].selectedDataset = action.payload.selectedDataset
  },
  REMOVE_MAP: (state, action) => {
    debug('Reducer: Removing map in reducer')
    debug('Reducer: Action payload: ', action.payload)
    state.data.maps = state.data.maps.filter((map) => map.id !== action.payload.id)
  },
  ADD_MAP: (state, action) => {
    debug('Reducer: Adding a map in reducer')
    debug('Reducer: Action payload: ', action.payload)
    state.data.maps.push(action.payload.mapObject)
  },
  UPDATE_MAP_EXTENT: (state, action) => {
    // debug('Updating map')
    // debug('Action payload: ', action.payload)
    state.data.global.mapExtent.center = action.payload.center
    state.data.global.mapExtent.resolution = action.payload.resolution
    state.data.global.mapExtent.rotation = action.payload.rotation
  },
  SET_ALL_DATASETS: (state, action) => {
    debug('Reducer: Setting all sources in Reducer')
    debug('Reducer: Action payload: ', action.payload)
    state.cache.datasets = action.payload.datasets
  },
  SET_BANDS: (state, action) => {
    debug('Reducer: Setting bands in Reducer')
    debug('Reducer: Action payload: ', action.payload)
    state.data.maps[action.payload.mapComponentIndex].derivedData.bands = action.payload.bands
  },
  SET_SIDEBAR_STATE: (state, action) => {
    debug('Reducer: Setting sidebar state in Reducer')
    debug('Reducer: Action payload: ', action.payload)
    state.data.global.sidebarIsOpen = action.payload.sidebarIsOpen
  },
  SET_CLICKED_COLOR_TILE: (state, action) => {
    debug('Reducer: Setting clicked color tile state in Reducer')
    debug('Reducer: Action payload: ', action.payload)
    state.data.global.clickedColorTile = action.payload.clickedColorTile
  }
})

export default dataReducer