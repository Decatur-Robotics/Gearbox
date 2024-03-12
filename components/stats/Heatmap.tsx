import dynamic from "next/dynamic";
import p5Types from "p5";
import { useEffect } from "react";
import { Report } from "@/lib/Types";
const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});

interface Position {
  x: number;
  y: number;
}

var bg: p5Types.Image;
const resolution = 25;
var positions: Position[] = [];

export default function Heatmap(props: { selectedReports: Report[] }) {
  const setup = (p5: p5Types, canvasParentRef: Element) => {
    bg = p5.loadImage("/croppedFieldBlue.PNG");
    p5.createCanvas(350, 300).parent(canvasParentRef);
    p5.rectMode(p5.CENTER);
    p5.stroke(1);
  };

  const inSquare = (x: number, y: number, w: number) => {
    let counter = 0;
    positions.forEach((pos) => {
      if (Math.abs(pos.x - x) <= w) {
        if (Math.abs(pos.y - y) <= w) {
          counter++;
        }
      }
    });
    return counter;
  };

  useEffect(() => {
    if (props.selectedReports) {
      positions = [];
      props.selectedReports.forEach((report) =>
        positions.push({
          x: report.data.AutoStartX,
          y: report.data.AutoStartY,
        }),
      );
    }
  });

  const draw = (p5: p5Types) => {
    p5.background(bg);

    for (var x = 0; x < p5.width + resolution; x += resolution) {
      for (var y = 0; y < p5.height + resolution; y += resolution) {
        var v = inSquare(x, y, resolution) / (positions.length / 2);
        p5.fill(
          p5.lerpColor(p5.color(124, 252, 0, 150), p5.color(255, 0, 0, 200), v),
        );
        p5.rect(x, y, resolution, resolution);
      }
    }
  };

  return <Sketch setup={setup} draw={draw} />;
}
