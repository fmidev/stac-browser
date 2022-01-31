export interface ReduxState {
  data: Data
  transient: Transient
  cache: Cache
}

export interface Data {
  global: Global
  maps: Map[]
}
export interface Transient {
  spyGlass: {
    position: number[] | null
  }
}

export interface Global {
  mapExtent: MapExtent
  graphIsOpen: boolean,
  sidebarIsOpen: boolean,
  clickedColorTile: string
  inspectionDate: string
  comparisonDate: string
  fullScreen: string
  mapSize: string
}

export interface MapExtent {
  center: number[]
  resolution: number
  rotation: number
}

export interface Cache {
  catalog: Catalog


  datasets: Dataset[]
  windDamages: WindDamages[]
}

interface FetchInProgress {
  [key: string]: boolean
}

interface FetchError {
  [key: string]: string
}

export interface Map {
  id: number
  selectedDataset: string | null
  channelSettings: ChannelSettings
  displayWindDamageVector: boolean
  displaySpyGlass: boolean
  panelBarSettings: PanelBarSettings
  derivedData: DerivedData
  graphIsOpen: boolean
  graphTimeSpan: number
}

export interface DerivedData {
  bands: Band[]
  timeValues: TimeValues
  mapLayers: []
}

export interface mapLayers {
  [index: number]: innerArray
}

interface innerArray {
  [index: number]: { linkToMapImage: string, srs: string }
}

export interface TimeValues {
  inspection: string
  comparison: string
}

export interface PanelBarSettings {
  displayDataSourceList: boolean
  displayVisualization: boolean
}

export interface ChannelSettings {
  [key: string]: string
  R: string
  G: string
  B: string
}

export interface Catalog {
  [key: string]: Record<string, unknown>
}

export interface Dataset {
  id?: string
  title: string
  channelSelectorType?: string
}

export interface Band {
  name: string
}

export interface WindDamages {
  date: string
  value: string
}

