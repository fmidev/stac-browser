import * as React from 'react';
import Dygraph from 'dygraphs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../App';
import { createStyles, makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core';
import { setComparisonDate } from '../../Store/Actions/data'

interface Props {
  data: any[],
  label: string[], 
  mapComponentIndex: number,
}

//GraphView component start
const Dygraphed: React.FC<Props> = ({data, label, mapComponentIndex}: Props) => {
  const graphRef = React.useRef<HTMLDivElement>(null)
  const inspectionDate = useSelector((state: RootState) => state.dataReducer.data.global.inspectionDate)
  const comparisonDate = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].comparisonDate)
  const graphTimeSpan = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].graphTimeSpan)

  //const bands = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].derivedData.bands)
  //const [bands, setBands] = React.useState([] as [])

  const dispatch = useDispatch()
  const classes = useStyles()

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

  function pointClicked(e: any, point: any){
    dispatch(setComparisonDate({comparisonDate: point.xval, index: mapComponentIndex}))
  }

  const graphInit = () => {
    const serieOne = label[0]
    const serieTwo = label[1]
    const serieThree = label[2]

    const annotation: any = [{
      series: '',
      x: new Date(inspectionDate).getTime(),
      shortText: 'I',
      text: 'Valkoinen',
      cssClass: 'annotation',
      tickHeight: 145,
      attachAtBottom: true,
    }];
  
    let graph_initialized = false;
    if (!graphRef.current) throw Error("graphRef is not assigned");
    const graph = new Dygraph(graphRef.current,
    data, 
    {
    width: 600,
    legend: "always",
    highlightCircleSize: 5,
    colors: ["#DC143C","#32CD32","#0000FF", '#000111'],
    animatedZooms: true,
    visibility: [true, true, true, true],
    labels: ['Date', serieOne, serieTwo, serieThree, ''],
    series: {
      serieOne: {
        axis: 'y1'
      },
      serieTwo: {
        axis: 'y1'
      },
      serieThree: {
        axis: 'y1'
      },
      '': {
        axis: 'y2'
      }
    },
    pointClickCallback: pointClicked,
    legendFormatter: legendFormatter,
    axes: {
      x:{
        axisLabelFormatter: (ms) => new Date(ms).toISOString().substr(0,7),
        valueFormatter: (ms) => new Date(ms).toISOString(),
        axisLineColor: "rgb(229, 228, 256)",
        drawGrid: false,
      },
      y: {
        axisLineColor: "rgb(229, 228, 226)",
        drawGrid: false,
      }
    },
    drawCallback: function(drawGraph, is_initial) {
      if(is_initial) {
        graph_initialized = true;
        if(annotation.length > 0) {
          drawGraph.setAnnotations(annotation)
        }
      }
      }
    })
    return graph;
  }
  React.useEffect(() => {
  console.log('UseEffect 1')
  if (!data || data.length === 0) return;
  
  const entryAfterInspectionData = data.find((arr) => arr[0].getTime() > new Date(inspectionDate).getTime())
  //console.log('entryAfterInspectionData', entryAfterInspectionData, inspectionDate)
  const insertIndex = entryAfterInspectionData ? data.indexOf(new Date(entryAfterInspectionData)) : data.length
  //console.log(insertIndex)
  data.splice(insertIndex,0, [new Date(inspectionDate), null, null, null, 1])

  graphInit()
  
 }, [
   inspectionDate,
   data
 ])

 React.useEffect(() => {
  const graph = graphInit()
  const ann = graph.annotations()
    if(comparisonDate ){
      ann.push({
        series: label[0],
        x: new Date(comparisonDate).getTime(),
        shortText: 'C',
        text: 'Valkoinen',
        cssClass: 'annotation',
        tickHeight: 150,
        attachAtBottom: true,
      })
    }

  graph.setAnnotations(ann)
  console.log(graph.annotations())
 }, [
   comparisonDate, 
   graphTimeSpan, 
   data])

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
      width: '100%',
      margin: '2rem auto auto'
    },
  }),
)


export default Dygraphed

