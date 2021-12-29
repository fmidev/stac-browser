import * as React from 'react';
import Dygraph from 'dygraphs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../App';
import { createStyles, makeStyles } from '@material-ui/styles'


interface Props {
  data: any[],
  /// mapComponentIndex: number
  label: string[]
}

//GraphView component start
const Dygraphed: React.FC<Props> = ({data, label}: Props) => {
  const graphRef = React.useRef<HTMLDivElement>(null)
  const inspectionDate = useSelector((state: RootState) => state.dataReducer.data.global.inspectionDate)
  //const bands = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].derivedData.bands)
  //const [bands, setBands] = React.useState([] as [])

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
    let labeledData = series.labelHTML + "<b>" + series.yHTML + "</b>";
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
        width: 525,
        legend: "follow",
        highlightCircleSize: 5,
        rollPeriod: 10,
        //fillGraph: true,
        colors: ["#DC143C","#32CD32","#0000FF"],
        animatedZooms: true,
        visibility: [true, true, true],
        // errorBars: true,
        labels: ['Date', ...label],
        series: {
          'min_vv': {
            strokeWidth: 2
          },
          'max_vv': {
            strokeWidth: 2
          },
          'max_vh': {
            strokeWidth: 2
          }
        },
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
           axisLineColor: "rgb(229, 228, 226)",
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

      g.ready(() => {
        console.log(label[0])
        g.setAnnotations([
          {
            series: label[0],
            x: modifiedData[0][0],
            shortText: "R",
            text: "Punainen",
            cssClass: '',
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
  }, [graphData])
  
  return (
    <div style={{marginTop: '1.8rem'}}>
      <div ref={graphRef} className={classes.graph}>
      </div>
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    graph: {
      display: 'flex',
      boxSizing: 'border-box',
      border: "1px solid #c8c8c8",
    }
    
  }))

export default Dygraphed

/* function bands(arg0: string, center: number[], resolution: number, bands: any, startDate: Date, endDate: Date) {
  throw new Error('Function not implemented.');
}
 */