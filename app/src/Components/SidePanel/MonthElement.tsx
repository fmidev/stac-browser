import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { createStyles, makeStyles } from '@material-ui/styles'
import { ButtonBase, Typography } from '@material-ui/core'
import { setInspectionDate } from '../../Store/Actions/data'
import { RootState } from '../../App'

interface Props {
  selectedType: string
  dateToSelect: Date
}

const MonthElement: React.FC<Props> = ({ selectedType, dateToSelect }) => {

  const inspectionDate = useSelector((state: RootState) => new Date(state.dataReducer.data.global.inspectionDate))
  const classes = useStyles()
  const dispatch = useDispatch()

  const months = ['Tam', 'Hel', 'Maal', 'Huht', 'Touk', 'Kesä', 'Hei', 'Elo', 'Syys', 'Loka', 'Mar', 'Jou']

  const month = months[dateToSelect.getMonth()]

  const setMonth = (dateToSelect: Date) => {
    dispatch(setInspectionDate({ inspectionDate: dateToSelect }))
  }

  const isSelectedMonth = 
      dateToSelect.getFullYear() === inspectionDate.getFullYear() && 
      dateToSelect.getMonth()    === inspectionDate.getMonth()

  return (
    <div className={isSelectedMonth ? classes.redStyle : classes.noStyle}>
      <ButtonBase onClick={() => setMonth(dateToSelect)}>
        <Typography style={{ fontSize: '9px' }}>{month}</Typography>
      </ButtonBase>
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    noStyle: {
    },
    redStyle: {
      textAlign: 'center',
      width: '100%',
      border: 'solid 1px',
      borderColor: '#ff0000',
      borderRadius: '5px',
      backgroundColor: '#ffc2c4',
    },
    blueStyle: {
      border: 'solid 1px',
      borderColor: '#009cff',
      borderRadius: '5px',
      backgroundColor: '#c1ebff'
    }
  }))

export default MonthElement