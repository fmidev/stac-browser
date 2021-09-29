import * as React from 'react'
import { useSelector } from 'react-redux'
import { FixedSizeList } from 'react-window'
import { Band } from '../../../../types'
import { RootState } from '../../../../App'
import { Grid, Input, InputAdornment } from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'
import RedListItem from '../ListItems/RedListItem'
import GreenListItem from '../ListItems/GreenListItem'
import BlueListItem from '../ListItems/BlueListItem'
import _ from 'lodash'

interface Props {
  bands: Band[],
  color?: string
  mapComponentIndex: number
}

const BandList: React.FC<Props> = ({ bands, color, mapComponentIndex }) => {
  const colorData = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].channelSettings)
  const sidePanelIsOpen = useSelector((state: RootState) => state.dataReducer.data.global.sidebarIsOpen)
  const [searchText, setSearchText] = React.useState('')
  const [listWidth, setListWidth] = React.useState(250)

  const clonedBands = _.cloneDeep(bands)
  // If dataset is selected and bands are loaded -> add another item that allows unselecting
  if (bands && bands.length !== 0) {
    clonedBands.unshift({ name: 'poista valinta' })
  }

  const searchAndFilter = (input: string) => {
    if (!bands) return []
    const filteredBands = clonedBands.filter((band: Band) => {
      const sourceData = band.name.toUpperCase()
      const searchText = input.toUpperCase()
      return sourceData.includes(searchText)
    }).sort()
    return filteredBands
  }

  const filteredBands = searchAndFilter(searchText)


  // Resizes the List depending on Map Size
  window.addEventListener('resize', handleResize)
  function handleResize() {
    const MapContainerWidth = document.getElementById('MapContainer')?.parentElement?.clientWidth as number
    const CalculatedWidth = MapContainerWidth * 0.45
    setListWidth(CalculatedWidth)
  }

  React.useEffect(() => {
    setTimeout(() => {
      handleResize()
    }, 100)
  }, [sidePanelIsOpen])


  const switchColorList = (color: string | undefined) => {
    switch (color) {
      case 'red': {
        return (
          <Grid item xs={12}>
            <FixedSizeList
              height={200}
              width={listWidth}
              itemSize={30}
              itemCount={filteredBands.length}
              itemData={{
                bands: filteredBands,
                selectedValue: colorData.R,
                mapComponentIndex: mapComponentIndex
              }}>
              {RedListItem}
            </FixedSizeList>
          </Grid>
        )
      }
      case 'green': {
        return (
          <Grid item xs={12}>
            <FixedSizeList
              height={200}
              width={200}
              itemSize={30}
              itemCount={filteredBands.length}
              itemData={{
                bands: filteredBands,
                selectedValue: colorData.G,
                mapComponentIndex: mapComponentIndex
              }}>
              {GreenListItem}
            </FixedSizeList>
          </Grid>
        )
      }
      case 'blue': {
        return (
          <Grid item xs={12}>
            <FixedSizeList
              height={200}
              width={200}
              itemSize={30}
              itemCount={filteredBands.length}
              itemData={{
                bands: filteredBands,
                selectedValue: colorData.B,
                mapComponentIndex: mapComponentIndex
              }}>
              {BlueListItem}
            </FixedSizeList>
          </Grid>
        )
      }
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <Grid container direction='column' spacing={2}>
        <Grid container item direction='row' xs={12} justify='center'>
          <Input
            style={{ paddingLeft: '5px', paddingRight: '5px', fontSize: '15px' }}
            placeholder='Search'
            onChange={(event) => setSearchText(event.target.value)}
            endAdornment={<InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>} />
        </Grid>
        <Grid container item direction='row'>
          {switchColorList(color)}
        </Grid>
      </Grid>
    </div >
  )
}

export default BandList