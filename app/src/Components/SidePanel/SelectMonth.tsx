import * as React from 'react'
import { useSelector } from 'react-redux'
import { Card, Grid } from '@material-ui/core'
import { Bar } from 'react-chartjs-2'
import MonthElement from './MonthElement'
import { getTuulituhotMonthly } from '../../API/Tuulituhot'
import { RootState } from '../../App'


interface ChartData {
  chart: {
    labels: string[],
    datasets: [{
      label: string,
      data: number[],
      backgroundColor: string[],
      borderWidth: number,
      barThickness: number
    }]
  },
  months: Date[]
}

const SelectMonth: React.FC = () => {
  const inspectionDate = useSelector((state: RootState) => state.dataReducer.data.global.inspectionDate)
  const [chartData, setChartData] = React.useState({} as ChartData)
  const [selectedType, setSelectedType] = React.useState('inspection')
  const months = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu']


  React.useEffect(() => {
    if (!inspectionDate) return;
    const inspDate = new Date(inspectionDate);
    const visible_time_start = new Date(inspDate.getFullYear(), inspDate.getMonth()-6, 1)
    const visible_time_end = new Date(inspDate.getFullYear(), inspDate.getMonth()+6, 0)

    getTuulituhotMonthly(visible_time_start, visible_time_end).then((result) => {
      const data : ChartData = {
        chart: {
          labels: [],
          datasets: [
            {
              label: 'Tuhoilmoituksia',
              data: [],
              backgroundColor: [
                'red'
              ],
              borderWidth: 1,
              barThickness: 8
            }
          ]
        },
        months: []
      }

      for (let m = new Date(visible_time_start); m < visible_time_end; m = new Date(m.getFullYear(), m.getMonth()+1, 1)) {
        data.chart.labels.push(`${months[m.getMonth()]} ${m.getFullYear()}`)
        data.months.push(m)

        const tuhot = result.data.find(d => d.time === m.getTime())
        if (tuhot) {
          data.chart.datasets[0].data.push(tuhot.count)
        } else {
          data.chart.datasets[0].data.push(0)
        }
      }
      
      setChartData(data)
    })
  }, [inspectionDate.substring(0,7)])


  const chartOptions = {
    animation: false,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          display: false
        },
        grid: {
          display: false
        }
      },
      y: {
        display: false,
        grid: {
          display: false,
        }
      }
    }
  }

 
  return (
    <>
      <Card >
        <Bar
          data={chartData?.chart}
          options={chartOptions}
        />
        <Grid container spacing={1} justify='center'>
          {(chartData?.months || []).map((month, index) => (
            <Grid item xs={1} key={index} >
              <MonthElement dateToSelect={month} selectedType={selectedType} />
            </Grid>
          ))}
        </Grid>
      </Card>
    </>
  )
}

export default SelectMonth