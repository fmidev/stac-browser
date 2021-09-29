import * as React from 'react'
import { batch, useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../App'
import { Grid } from '@material-ui/core'
import ChannelColorTile from './ChannelColorTile'
import SlimAccordion from '../General/SlimAccordion'
import BandList from '../ListComponents/Lists/BandList'
import { ChannelSettings } from '../../../types'
import { setRedChannel, setGreenChannel, setBlueChannel } from '../../../Store/Actions/data'

interface Props {
  channelSettings: ChannelSettings
  mapComponentIndex: number
}

const NormalVisualization: React.FC<Props> = ({ mapComponentIndex }) => {
  const dispatch = useDispatch()
  const colorData = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].channelSettings)
  const [clickedColorTile, setClickedColorTile] = React.useState('')
  const bands = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].derivedData.bands)
  const selectedDataset = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].selectedDataset)

  // Will compare arrays and elements whether they are equal
  const arrayEquals = (array1: any, array2: any) => {
    return Array.isArray(array1)
      && Array.isArray(array2)
      && array1.length === array2.length
      && array1.every((object, index) => object.name === array2[index].name)
  }

  // Stores and gives access to previous state
  const usePrevious = (value: any) => {
    const ref = React.useRef()
    React.useEffect(() => {
      ref.current = value
    })
    return ref.current
  }

  const previousBands = usePrevious(bands)

  // If elements are not equal inside arrays, reset selections in color bubbles
  React.useEffect(() => {
    if (previousBands === undefined) return

    if (!arrayEquals(previousBands, bands)) {
      batch(() => {
        dispatch(setRedChannel({ mapComponentIndex: mapComponentIndex, redChannelValue: '' }))
        dispatch(setGreenChannel({ mapComponentIndex: mapComponentIndex, greenChannelValue: '' }))
        dispatch(setBlueChannel({ mapComponentIndex: mapComponentIndex, blueChannelValue: '' }))
      })
    }
  }, [selectedDataset])

  // Function will set all bands selected automagically, when one of the described datasets is selected
  React.useEffect(() => {
    const specialDatasets = [{
      name: 'Latvuskorkeusmalli',
      value: 'latvuskorkeusmalli'
    }, {
      name: 'Myrskytuhoriskikartta',
      value: 'myrskytuhoriski'
    }, {
      name: 'Tuulituhoriski',
      value: 'tuulituhoriski'
    }]

    specialDatasets.forEach(({ name, value }) => {
      if (name === selectedDataset) {
        batch(() => {
          dispatch(setRedChannel({ mapComponentIndex: mapComponentIndex, redChannelValue: value }))
          dispatch(setGreenChannel({ mapComponentIndex: mapComponentIndex, greenChannelValue: value }))
          dispatch(setBlueChannel({ mapComponentIndex: mapComponentIndex, blueChannelValue: value }))
        })
      }
    })
  }, [selectedDataset])

  const setClicked = (value: string) => {
    setClickedColorTile(value)
  }

  const switchListColor = (clickedColorTile: string) => {
    switch (clickedColorTile) {
      case 'R': {
        return (
          <Grid item xs={10} >
            <SlimAccordion name={'list'} isExpanded={true}>
              <BandList
                bands={bands}
                color={'red'}
                mapComponentIndex={mapComponentIndex} />
            </SlimAccordion>
          </Grid>
        )
      }
      case 'G': {
        return (
          <Grid item xs={10} >
            <SlimAccordion name={'list'} isExpanded={true}>
              <BandList
                bands={bands}
                color={'green'}
                mapComponentIndex={mapComponentIndex} />
            </SlimAccordion>
          </Grid>
        )
      }
      case 'B': {
        return (
          <Grid item xs={10} >
            <SlimAccordion name={'list'} isExpanded={true}>
              <BandList
                bands={bands}
                color={'blue'}
                mapComponentIndex={mapComponentIndex} />
            </SlimAccordion>
          </Grid>
        )
      }
      default: {
        return (
          <Grid item xs={10} >
            <SlimAccordion name={'list'} isExpanded={true}>
              <BandList
                bands={bands}
                color={'red'}
                mapComponentIndex={mapComponentIndex} />
            </SlimAccordion>
          </Grid>
        )
      }
    }
  }

  return (
    <div style={{ width: '100%', paddingTop: '10px' }}>
      <Grid container direction='column' spacing={2}>
        <Grid container item direction='row' justify='space-evenly' style={{ paddingRight: '40px' }}>
          <Grid item xs={3}>
            <ChannelColorTile text={colorData.R} letter={'R'} color={'red'} />
          </Grid>
          <Grid item xs={3}>
            <ChannelColorTile text={colorData.G} letter={'G'} color={'rgb(70,198,25)'} />
          </Grid>
          <Grid item xs={3}>
            <ChannelColorTile text={colorData.B} letter={'B'} color={'rgb(0,143,225)'} />
          </Grid>
        </Grid>
        <Grid container item direction='row' justify='center' >
          {switchListColor(clickedColorTile)}
        </Grid>
      </Grid>
    </div >
  )
}

export default NormalVisualization