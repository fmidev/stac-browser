import * as React from 'react';
import Dygraph from 'dygraphs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../App';
import { createStyles, makeStyles } from '@material-ui/core/styles'
import { setComparisonDate } from '../../Store/Actions/data'

interface GraphData {
  data: any[],
  labels: string[],
  colors: string[]
}

type modifiedDataType = {
  date: Date
  seriesDataOne: number | null 
  seriesDataTwo: number | null
  seriesDataThree: number | null
}

interface Props {
  graphData: GraphData,
  children: JSX.Element,
  twoMonths?:  React.MouseEventHandler,
  fourMonths?: React.MouseEventHandler,
  sixMonths?: React.MouseEventHandler,
  mapComponentIndex: number
}
const Graph: React.FC<Props> = ({graphData, children, mapComponentIndex}: Props) => {
  const inspectionDate = useSelector((state: RootState): string => state.dataReducer.data.global.inspectionDate)
  const comparisonDate = useSelector((state: RootState) => state.dataReducer.data.global.comparisonDate)
  const sidebarIsOpen = useSelector((state: any) => state.dataReducer.data.global.sidebarIsOpen)
  const graphRef = React.useRef<HTMLDivElement>(null);
  const [ graph, setGraph] = React.useState<Dygraph | null>(null);
  const dispatch = useDispatch()
  const classes = useStyles()

  function clickedCallBack(e: any, x: any, points: any){
    dispatch(setComparisonDate({comparisonDate: x}))
  }

  function pointClicked(e: any, point: any){
    dispatch(setComparisonDate({comparisonDate: point.xval}))
  }

  function ensureAnnotationDate (graphArray: any[], time: string) { 
    const graphDataTime = graphArray.find((arr: any) => arr[0].getTime() === new Date(time).getTime())
    if(graphDataTime) return;
    
    const entryData= graphArray.find((arr: any) => arr[0].getTime() > new Date(time).getTime())
    const insertIndex = entryData ? graphArray.indexOf(entryData) : graphArray.length;

    graphArray.splice(insertIndex,0, [new Date(time), null, null, null])
    // console.log('Insert time: ', time, 'At index: ', insertIndex)
  }

  function legendFormatter(this: any, data: any) {
    if (data.x == null) {
      return '<br>' + data.series.map(function(series: { dashHTML: string; labelHTML: string; }) { 
        return series.dashHTML + ' ' + series.labelHTML }).join();
    }
    let html = "<b>" + data.xHTML + "</b>"      
    data.series.forEach(function(series: any) {
    if (!series.isVisible) return;
    let labeledData = series.labelHTML + `: <b>` + series.yHTML + "</b>";
    //console.log(labeledData)
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

  const graphInit = (graphData : GraphData) => {
    
    if (!graphRef.current) throw Error("graphRef is not assigned");
    //console.log('new g')

    for (let i = 0; i < graphData.data.length; i++) {
      for (let k = 0; k < graphData.data[i].length; k++) {
        if (graphData.data[i][k] === 0) graphData.data[i][k] = NaN;
      }
    }

    const g = new Dygraph(graphRef.current,
      graphData.data,
    {
    legend: "always",
    highlightCircleSize: 5,
    colors: [...graphData.colors],
    animatedZooms: true,
    visibility: [true, true, true],
    labels: ['Date', ...graphData.labels],
    series: graphData.labels.reduce((memo : any, label) => { memo[label] = { axis: 'y1'}; return memo; }, {}),
    connectSeparatedPoints: true,
    clickCallback: clickedCallBack,
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
      },
      y2: {
        axisLineColor: "rgb(229, 228, 226)",
      }
    },
    })
    return g;
  }

  React.useEffect(() => {
    ensureAnnotationDate(graphData.data, inspectionDate)
    if(comparisonDate){
      ensureAnnotationDate(graphData.data, comparisonDate)
    }

    const g = graphInit(graphData)
    const annotationInit = [{
      series: graphData.labels[0],
      x: new Date(inspectionDate).getTime(),
      shortText: 'I',
      text: 'Valkoinen',
      cssClass: 'annotation',
      tickHeight: 138,
      attachAtBottom: true,
    }
    ]
    // console.log('InspectionDate -:', annotationInit)
    if(comparisonDate){
      annotationInit.push(
        { 
        series: graphData.labels[0],
        x: new Date(comparisonDate).getTime(),
        shortText: 'C',
        text: 'Valkoinen',
        cssClass: 'annotation',
        tickHeight: 120,
        attachAtBottom: true,
        } 
      )
    }
    // console.log('comparisonDate -:', annotationInit)
   g.setAnnotations(annotationInit)

   setGraph(g);

  // // Seems to crash the page when graph.resize() is called?
  //  return () => {
  //   if(graph){
  //     graph.destroy()
  //     setGraph(null);
  //   }
  // }
},[
  graphData,
  inspectionDate,
  comparisonDate,
  sidebarIsOpen
])

React.useEffect(() => {
  setTimeout(function () {
    if (graph) {
      graph.resize();
    }
  }, 300);
})
// // The following don't seem to resize the graph properly when sidebar is opened and closed:
// }, [])
// }, [sidebarIsOpen])

 return (
  <div style={{padding: '0rem'}}>
    <div>{children}</div>
      <div ref={graphRef} 
      className={classes.graphContainer} 
      style={{width: '102%', minHeight: '100%', marginLeft: '-2rem', padding: '0rem'}}></div>
  </div>
  )
}
const useStyles = makeStyles((theme) =>
  createStyles({
      graphContainer: {
        zIndex: 50,
      },
  }),
)

export default Graph;

