export const LOAD_INITIAL_SETUP = 'LOAD_INITIAL_SETUP'
export const SET_INITIAL_SETUP = 'SET_INITIAL_SETUP'
export const SET_STATE_FROM_URL = 'SET_STATE_FROM_URL'

export const SET_ALL_DATASETS = 'SET_ALL_DATASETS'
export const SET_BANDS = 'SET_BANDS'

export const SET_RED_CHANNEL = 'SET_RED_CHANNEL'
export const SET_GREEN_CHANNEL = 'SET_GREEN_CHANNEL'
export const SET_BLUE_CHANNEL = 'SET_BLUE_CHANNEL'
export const SET_SELECTED_MONTH = 'SET_SELECTED_MONTH'
export const SET_INSPECTION_DATE = 'SET_INSPECTION_DATE'
export const SET_COMPARISON_DATE = 'SET_COMPARISON_DATE'
export const SET_SELECTED_DATASET = 'SET_SELECTED_DATASET'
export const REMOVE_MAP = 'REMOVE_MAP'
export const ADD_MAP = 'ADD_MAP'
export const UPDATE_MAP_EXTENT = 'UPDATE_MAP_EXTENT'
export const SET_SIDEBAR_STATE = 'SET_SIDEBAR_STATE'
export const SET_CLICKED_COLOR_TILE = 'SET_CLICKED_COLOR_TILE'

interface LoadDataAction {
  type: string
}

interface SetDataAction {
  type: string
  payload: Record<string, unknown>
}


// _____ datasets && Bands
export const setAllDatasets = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_ALL_DATASETS,
  payload: data
})

export const setBands = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_BANDS,
  payload: data
})



//_____ Dummy Data
export const loadInitialSetup = (): LoadDataAction => ({
  type: LOAD_INITIAL_SETUP
})

export const setStateFromUrl = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_STATE_FROM_URL,
  payload: data
})

export const setInitialSetup = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_INITIAL_SETUP,
  payload: data,
})


//_____ Functionality ______
export const setRedChannel = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_RED_CHANNEL,
  payload: data
})

export const setGreenChannel = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_GREEN_CHANNEL,
  payload: data
})

export const setBlueChannel = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_BLUE_CHANNEL,
  payload: data
})

export const setSelectedMonth = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_SELECTED_MONTH,
  payload: data
})

export const setInspectionDate = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_INSPECTION_DATE,
  payload: data
})

export const setComparisonDate = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_COMPARISON_DATE,
  payload: data
})

export const setSelectedDataset = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_SELECTED_DATASET,
  payload: data
})

export const removeMap = (data: Record<string, unknown>): SetDataAction => ({
  type: REMOVE_MAP,
  payload: data
})

export const addMap = (data: Record<string, unknown>): SetDataAction => ({
  type: ADD_MAP,
  payload: data,
})

export const updateMapExtent = (data: Record<string, unknown>): SetDataAction => ({
  type: UPDATE_MAP_EXTENT,
  payload: data
})

export const setSiderbarState = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_SIDEBAR_STATE,
  payload: data
})

export const setClickedColorTile = (data: Record<string, unknown>): SetDataAction => ({
  type: SET_CLICKED_COLOR_TILE,
  payload: data
})
