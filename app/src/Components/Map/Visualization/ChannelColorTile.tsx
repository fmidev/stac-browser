import * as React from 'react'
import { createStyles, makeStyles } from '@material-ui/styles'
import { Grid } from '@material-ui/core'
import Circle from './Circle'
import { useDispatch } from 'react-redux'
import { setClickedColorTile } from '../../../Store/Actions/data'

interface Props {
  text: string
  letter: string
  color: string
}

const ChannelColorTile: React.FC<Props> = ({ text, letter, color }) => {
  const classes = useStyles()
  const dispatch = useDispatch()
  return (
    <Grid container>
      <Grid item xs={12}>
        <div
          className={classes.ballContainer}
          onClick={(event) => {
            event.stopPropagation()
            dispatch(setClickedColorTile({ clickedColorTile: letter }))
          }}
        >
          <Circle text={text} color={color} borderWidth={'1'} />
        </div>
      </Grid>
    </Grid>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    ballContainer: {
      display: 'flex',
      maxHeight: '70px',
      aspectRatio: '1/1',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItem: 'center',
    },
  }))

export default ChannelColorTile