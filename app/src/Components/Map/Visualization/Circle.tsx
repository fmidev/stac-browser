import * as React from 'react'
import { createStyles, makeStyles } from '@material-ui/styles'

interface Props {
  text: string
  color: string
  borderWidth: string
}

const Circle: React.FC<Props> = ({ text, color, borderWidth }) => {
  const classes = useStyles({ color, borderWidth })

  let textToDisplay = ''
  let longText = false

  if (text === null || text === undefined) {
    text = ""
  }

  if (text.length >= 4) {
    longText = true
    textToDisplay = `${text.slice(0, 4)}..`
  } else textToDisplay = text

  return (
    <div
      className={classes.circle}
      style={{ borderColor: `${color}`, borderWidth: `${borderWidth}` }}
    >
      <div className={longText ? classes.longText : classes.shortText}>
        {textToDisplay}
      </div>
    </div>
  )
}

const useStyles = makeStyles<Props>(() =>
  createStyles({
    circle: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '85%',
      aspectRatio: '1/1',
      border: 'solid',
      borderRadius: '50%',
      background: 'rgb(247, 247, 247)',
      '&:hover': {
        background: 'rgb(230, 230, 230)',
        cursor: 'pointer'
      }
    },
    shortText: {
      fontSize: '16px'
    },
    longText: {
      fontSize: '11px'
    }
  }))

export default Circle