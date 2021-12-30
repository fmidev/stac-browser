import * as React from 'react';
import Dygraph from 'dygraphs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../App';
import { createStyles, makeStyles, styled } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core';
import clsx from 'clsx';

interface Props {
  data: any[],
  /// mapComponentIndex: number
  label: string[]
}

const drawerWidth = 440


//GraphView component start
const Dygraphed: React.FC<Props> = ({data, label}: Props) => {
  const graphRef = React.useRef<HTMLDivElement>(null)
  const inspectionDate = useSelector((state: RootState) => state.dataReducer.data.global.inspectionDate)
  //const bands = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].derivedData.bands)
  //const [bands, setBands] = React.useState([] as [])
  const sidebarIsOpen = useSelector((state: RootState) => state.dataReducer.data.global.sidebarIsOpen)


  const dispatch = useDispatch()
  const classes = useStyles()
  const graphData = [] as any[]

  function legendFormatter(this: any, data: any) {
    if (data.x == null) {
      return '<br>' + data.series.map(function(series: { dashHTML: string; labelHTML: string; }) { 
        return series.dashHTML + ' ' + series.labelHTML }).join();
    }
    let html = "<b>" + data.xHTML + "</b>"      
    data.series.forEach(function(series: any) {
    if (!series.isVisible) return;
    let labeledData = series.labelHTML + `: <b>` + series.yHTML + "</b>";
    if (series.isHighlighted) {
      labeledData = "<b>" +  labeledData + "</b>";
    }
    html +=
    "<div class='dygraph-legend-row'>" +
    series.dashHTML + 
    "<div>" + 
    labeledData + 
    "</div></div>";
  });
    return html;
  }

  React.useEffect(() => {
    if (!graphRef.current) throw Error("graphRef is not assigned");

    if (!data || data.length === 0) return;

    const startDate = new Date(inspectionDate)
    const endDate = new Date(inspectionDate)

    startDate.setMonth(startDate.getMonth()-2)
    endDate.setMonth(endDate.getMonth()+2)
    const modifiedData = data.map((d) => [d[0].getTime(), d[1], d[2], d[3]])
      const g = new Dygraph(graphRef.current,
      data, 
      {
        width: 500,
        legend: "follow",
        highlightCircleSize: 5,
        rollPeriod: 10,
        //fillGraph: true,
        colors: ["#DC143C","#32CD32","#0000FF"],
        animatedZooms: true,
        visibility: [true, true, true],
        // errorBars: true,
        labels: ['Date', ...label],
         
        pointClickCallback: function(e, point) {
          console.log(e, point)
        },
       legendFormatter: legendFormatter,
       // showRangeSelector: true,
       // ylabel: 'Tuulituhohaukka',
       axes: {
         x:{
           axisLabelFormatter: (ms) => new Date(ms).toISOString().substr(0,7),
           valueFormatter: (ms) => new Date(ms).toISOString(),
           axisLineColor: "rgb(229, 228, 256)",
           drawGrid: false
         },
         y: {
           axisLineColor: "rgb(229, 228, 226)",
           drawGrid: false,
         }
       },
      });

      const annotationX = modifiedData[1][0]
      console.log(modifiedData[0][0])
      console.log(modifiedData[1][0])

      const annDate = new Date(inspectionDate).getTime();

      /* g.ready(() => {
        console.log(label[0])
        g.setAnnotations([
          {
            series: label[0],
            x: modifiedData[0][0],
            shortText: "R",
            text: "Punainen",
            cssClass: 'annotation',
            tickHeight: 80,
            attachAtBottom: true,
          },
          {
            series: label[1],
            x: modifiedData[1][0],
            shortText: 'G',
            cssClass: 'annotation',
            text: 'Vihrea',
            tickHeight: 100,
            attachAtBottom: true,
          },
          {
            series: label[2],
            x: modifiedData[2][0],
            shortText: 'B',
            cssClass: 'annotation',
            text: 'Sinenen',
            tickHeight: 15,
            attachAtBottom: true,
          }
          ]);
      })
 */  }, [graphData])
  
  return (
    <div style={{width: '100%'}}>
      <Grid ref={graphRef} className={classes.container}>
      </Grid>
    </div>
  )
}

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      height: '100%',
      marginLeft: '0rem'
    },
    root: {
      display: 'flex',
      justifyContent: 'center'
    },
   
  }),
)


export default Dygraphed

