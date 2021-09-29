import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Grid, Paper } from '@material-ui/core'
import { makeStyles, createStyles } from '@material-ui/styles'
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers'
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline'
import { MuiThemeProvider } from '@material-ui/core'
import 'date-fns'
import DateFnsUtils from '@date-io/date-fns'
import { setInspectionDate } from '../../Store/Actions/data'
import { RootState } from '../../App'
import locale from 'date-fns/locale/fi'
import format from 'date-fns/format'
import { customTheme } from '../../Theme/theme'
import { getTuulituhotDaily } from '../../API/Tuulituhot'

if (locale && locale.options) {
  locale.options.weekStartsOn = 1
}

interface MonthlyDamage {
  pending: boolean,
  year: number,
  month: number,
  damages: number[], // number of damages per day, 0-indexed, will always contain entire month
  avgDamages: number
}

interface WindDamages {
  monthly: MonthlyDamage[]
}

interface DayProps {
  isSelected: boolean,
  isToday: boolean,
  day: Date,
  damagesPerEpochDay: boolean[]
}

const DayWidget: React.FC<DayProps> = ({isSelected, isToday, day, damagesPerEpochDay}) => {
  const classes = useStyles()
  const showDamages = damagesPerEpochDay[Math.floor(day.getTime()/1000/60/60/24)];
  return (
    <Paper className={isSelected ? classes.selectedDayPaper : isToday ? classes.todayPaper : classes.normalDayPaper}>
      <Grid item style={{ zoom: '66%' }}><ErrorOutlineIcon style={{ color: showDamages ? 'red' : 'transparent', fontSize: 'medium' }} /></Grid>
      <Grid item justify='center' alignItems='center'>
        {day.getDate()}
      </Grid>
    </Paper>)
}


const SelectDay: React.FC = () => {
  const dispatch = useDispatch()
  const classes = useStyles()
  const inspectionDate = useSelector((state: RootState): string => state.dataReducer.data.global.inspectionDate)
  const inspectionDateObject = new Date(inspectionDate)
  const [windDamages, setWindDamages] = React.useState({ monthly: [] as MonthlyDamage[] } as WindDamages)
  const [damagesPerEpochDay, setDamagesPerEpochDay] = React.useState([] as boolean[])

  const today = new Date()

  const handleDateChange = (date: Date | null) => {
    dispatch(setInspectionDate({ inspectionDate: date }))
  }

  const createAndGetMonthlyDamage = (date : Date) => {
    const md = {
      pending: true,
      year: date.getFullYear(),
      month: date.getMonth(),
      damages: [] as number[],
      avgDamages: 0
    }
    windDamages.monthly.push(md)
    setWindDamages(windDamages)
    const start_of_month = new Date(date.getFullYear(), date.getMonth(), 1)
    const end_of_month = new Date(date.getFullYear(), date.getMonth()+1, 0)
    
    getTuulituhotDaily(start_of_month, end_of_month).then((result) => {
      md.pending = false
      for (let m = new Date(start_of_month); m.getMonth() === start_of_month.getMonth(); m.setDate(m.getDate()+1)) {
        const d = result.data.find(d => d.time === m.getTime())?.count || 0
        md.damages.push(d)
      }
      md.avgDamages = md.damages.reduce((m,n) => m+n, 0) / md.damages.length

      let i
      for (let m = new Date(start_of_month), i = 0; m.getMonth() === start_of_month.getMonth(); m.setDate(m.getDate()+1), i++) {
        const hasDamages = md.damages[i] > md.avgDamages;
      }
      setWindDamages({monthly: windDamages.monthly})
    })
    return md
  }

  React.useEffect(() => {
     let months = 0;
     let damages = 0;
     const damagesPerEpochDay = windDamages.monthly.filter(m => !m.pending).reduce((memo, md) => {
        months++;
        let i
        for (let d = new Date(md.year, md.month, 1), i = 0; d.getMonth() === md.month; d.setDate(d.getDate()+1), i++) {
          damages += md.damages[i]
          const hasDamages = md.damages[i] > md.avgDamages;
          memo[Math.floor(d.getTime()/1000/60/60/24)] = hasDamages;
        }
      return memo
     }, [] as boolean[])
    setDamagesPerEpochDay(damagesPerEpochDay)
  }, [windDamages])

  const ensureDamagesForDate = (date : Date) => {
    let md : MonthlyDamage | undefined = windDamages.monthly.find(m => m.year === date.getFullYear() && m.month == date.getMonth())
    if (!md) {
      md = createAndGetMonthlyDamage(date)
    }
    return md;
  }


  const getDayElement = (day: any, selectedDate: any, isInCurrentMonth: any, dayComponent: any) => {
    ensureDamagesForDate(day) // triggers API request if this month has not been retrieved yet
    const isSelected = day.getDate() === selectedDate.getDate() && day.getMonth() === inspectionDateObject.getMonth();
    const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();

    let dateTile
    if (isInCurrentMonth) { //conditionally return appropriate Element of date tile.
      return <DayWidget isSelected={isSelected} isToday={isToday} day={day} damagesPerEpochDay={damagesPerEpochDay} />
    } else {
      dateTile = (<Paper className={classes.notInThisMonthDayPaper}>
        <Grid item><br /></Grid>
        <Grid item style={{ color: "lightGrey" }}>
          {day.getDate()}
        </Grid>
      </Paper>)
    }
    return dateTile
  }

  class LocalizedUtils extends DateFnsUtils {
    getDatePickerHeaderText(date: any) {
      return format(date, "EEEEEE d. MMMM", { locale: this.locale });
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <MuiThemeProvider theme={customTheme}>
        <MuiPickersUtilsProvider utils={LocalizedUtils} locale={locale}>
          <Grid container justify='space-around'>
            <DatePicker
              variant='static'
              margin='normal'
              id='date-picker'
              label='Date Picker'
              value={inspectionDateObject}
              views={["year", "month", "date"]}
              onChange={handleDateChange}
              renderDay={(day, selectedDate, isInCurrentMonth, dayComponent) => getDayElement(day, selectedDate, isInCurrentMonth, dayComponent)}
            />
          </Grid>
        </MuiPickersUtilsProvider>
      </MuiThemeProvider>
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    notInThisMonthDayPaper: {
      width: "33px",
      height: "33px",
      padding: "1px",
      backgroundColor: "#eeeeee",
      boxShadow: "none",
      borderRadius: 0,
      borderStyle: "solid",
      borderWidth: "3px",
      borderColor: "white",
    },
    normalDayPaper: {
      width: "33px",
      height: "33px",
      padding: "1px",
      backgroundColor: "#e8f5e9",
      boxShadow: "none",
      borderRadius: 0,
      borderStyle: "solid",
      borderWidth: "3px",
      borderColor: "white",
      cursor: "pointer",
    },
    selectedDayPaper: {
      width: "33px",
      height: "33px",
      padding: "1px",
      backgroundColor: "white",
      boxShadow: "none",
      borderRadius: 0,
      borderStyle: "solid",
      borderWidth: "3px",
      borderColor: "red",
      cursor: "pointer",
    },
    todayPaper: {
      width: "33px",
      height: "33px",
      padding: "1px",
      backgroundColor: "#4e9951",
      boxShadow: "none",
      borderRadius: 0,
      borderStyle: "solid",
      borderWidth: "3px",
      borderColor: "white",
      cursor: "pointer",
      color: "white",
    }
  })
)

export default SelectDay


