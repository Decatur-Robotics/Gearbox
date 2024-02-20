import dynamic from "next/dynamic";
import { AllianceColor } from "@/lib/Types";
import p5Types from "p5";
import { useCallback, useEffect, useState } from "react";
import { PageProps } from "./FormPages";

const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});

var bg: p5Types.Image;
var dropped = false;
var angled = false;
var mx = 0;
var my = 0;

var ax = 0;
var ay = 0;
var a = 0;
export default function StartingPosition(props: PageProps) {
  const triggerCallback = useCallback(() => {
    props.callback("AutoStartX", mx);
    props.callback("AutoStartY", my);
    props.callback("AutoStartAngle", a);
  }, [mx, my, a, props.callback]);

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    bg = p5.loadImage(
      props.alliance === AllianceColor.Blue
        ? "/croppedFieldBlue.PNG"
        : "/croppedFieldRed.PNG",
    );
    const ctx = p5.createCanvas(350, 300).parent(canvasParentRef);
    ctx.mousePressed(() => {
      if (!dropped) {
        dropped = true;
        angled = false;
        mx = p5.mouseX;
        my = p5.mouseY;
      } else {
        dropped = false;
        angled = true;
        ax = p5.mouseX;
        ay = p5.mouseY;
      }

      triggerCallback();
    });
    p5.rectMode(p5.CENTER);
  };

  const draw = (p5: p5Types) => {
    p5.background(bg);
    p5.stroke("black");
    p5.strokeWeight(1);
    p5.fill("lightgrey");
    if (dropped || angled) {
      p5.translate(mx, my);

      a = p5.atan2(ay - my, ax - mx);
      p5.rotate(a);
      p5.rect(0, 0, 35, 35, 10);
      p5.fill("black");
      p5.rect(12.5, 15, 10, 5, 3);
      p5.rect(12.5, -15, 10, 5, 3);
      p5.rect(-12.5, 15, 10, 5, 3);
      p5.rect(-12.5, -15, 10, 5, 3);

      p5.stroke("red");
      p5.strokeWeight(3);
      p5.line(0, 0, 35, 0);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl w-fit h-fit">
      <Sketch setup={setup} draw={draw} />
    </div>
  );
}
