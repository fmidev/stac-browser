import React from 'react';
import { createStyles, makeStyles } from '@material-ui/styles'

interface Props {
    borderRect: number[] | null
}

const SpyGlassBorderCanvas: React.FC<Props> = ({ children, borderRect }) => {

    const canvasRef = React.useRef<HTMLCanvasElement>()

    React.useEffect(() => {
        if (!canvasRef || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if( borderRect === null) return;

        const domDimensions = canvasRef.current.getBoundingClientRect()

        const xScale = canvasRef.current.width / domDimensions.width
        const yScale = canvasRef.current.height / domDimensions.height

        ctx.save();
        ctx.scale(xScale, yScale);

        try {
            ctx.beginPath();
            ctx.lineWidth = 1
            ctx.strokeStyle = "red";
            ctx.rect(borderRect[0], borderRect[1], borderRect[2], borderRect[3]);
            ctx.stroke();
        } finally {
            ctx.restore();
        }
    
    }, [borderRect]);
    const classes = useStyles()

    return <canvas ref={canvasRef as any} className={classes.borderCanvas} />
}


const useStyles = makeStyles(() =>
  createStyles({
    borderCanvas: {
        pointerEvents: 'none',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        zIndex: 100,
        position: 'absolute',
    }

}));

export default SpyGlassBorderCanvas