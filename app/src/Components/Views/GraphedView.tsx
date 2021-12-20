import * as React from 'react';
/* import { createStyles, makeStyles } from '@mui/styles';
 */
import Dygraph from 'dygraphs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../App';
import { createStyles, makeStyles } from '@material-ui/styles'
import { ContactsOutlined, ContactSupportOutlined } from '@material-ui/icons';
import { getTimeseries } from '../../API/Api';


interface Props {
  data: any[]
}

//GraphView component start
const Dygraphed: React.FC<Props> = ({data}: Props) => {
  //const [graphState, setGraphState] = React.useState<data>([]);
  const graphRef = React.useRef<HTMLDivElement>(null)
  const inspectionDate = useSelector((state: RootState) => state.dataReducer.data.global.inspectionDate)
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
      labeledData = "<b>" + labeledData + "</b>";
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
      new Dygraph(graphRef.current,
      data, 
      {
        width: 500,
        legend: "follow",
        highlightCircleSize: 5,
        fillGraph: true,
        rollPeriod: 10,
        colors: ["#DC143C","#32CD32","#0000FF"],
        animatedZooms: true,
        visibility: [true, true, true],
        // errorBars: true,
        labels: ["Date", "Punainen", "Vihreä", "Sininen"],
        pointClickCallback: function(e, point) {
          console.log(e, point)
        },
       legendFormatter: legendFormatter,
       axes: {
         x:{
           axisLineColor: "white",
           drawGrid: false
         },
         y: {
           axisLineColor: "white",
           drawGrid: false,
         }
       }
      });
    
  }, [graphData])
  // console.log(graphData)
  return (
    <div className={classes.graphDivContainer}>
      <h3>Stac-Browser</h3>
      <div ref={graphRef} className={classes.graph}>
      </div>
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    graphDivContainer: {
      border: "1px solid #c8c8c8",
      padding: "1rem",
      margin: "1rem 0.1rem",
      borderRadius: "4px",
      width: "90%",
    },
    graph: {
      display: 'flex',
      width: '100%'
    }
    
  }))

export default Dygraphed