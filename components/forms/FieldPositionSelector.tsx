import dynamic from "next/dynamic";
import { AllianceColor, FieldPos } from "@/lib/Types";
import p5Types from "p5";
import { useCallback, useEffect, useState } from "react";
import useDynamicState from "@/lib/client/useDynamicState";

const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
	ssr: false,
});

let bg: p5Types.Image;
let dropped = false;

export default function FieldPositionSelector({
	alliance,
	fieldImagePrefix,
	initialPos,
	callback,
}: {
	alliance: AllianceColor;
	fieldImagePrefix: string;
	initialPos: FieldPos;
	callback: (key: string, value: FieldPos) => void;
}) {
	const [mx, setMx, getMx] = useDynamicState(initialPos?.x ?? 0);
	const [my, setMy, getMy] = useDynamicState(initialPos?.y ?? 0);
	const [a, setA, getA] = useDynamicState(initialPos?.angle ?? 0);
	const [ax, setAx] = useState(0);
	const [ay, setAy] = useState(0);

	useEffect(() => {
		callback("AutoStart", { x: mx ?? 0, y: my ?? 0, angle: a ?? 0 });
	}, [mx, my, a, ax, ay, callback.name]);

	const setup = (p5: p5Types, canvasParentRef: Element) => {
		bg = p5.loadImage(
			alliance === AllianceColor.Blue
				? `/fields/${fieldImagePrefix}Blue.png`
				: `/fields/${fieldImagePrefix}Red.png`,
		);

		const ctx = p5.createCanvas(350, 300).parent(canvasParentRef);
		ctx.mousePressed(() => {
			if (!dropped) {
				dropped = true;
				setMx(p5.mouseX);
				setMy(p5.mouseY);
			} else {
				dropped = false;
				setAx(p5.mouseX);
				setAy(p5.mouseY);

				getMx((mx) => {
					getMy((my) => {
						setA(p5.atan2(p5.mouseY - (my ?? 0), p5.mouseX - (mx ?? 0)));
					});
				});
			}
		});

		p5.rectMode(p5.CENTER);
	};

	const draw = (p5: p5Types) => {
		p5.background(bg);
		p5.stroke("black");
		p5.strokeWeight(1);
		p5.fill("lightgrey");

		if (a == 0 && mx == 0 && my == 0) return;

		p5.translate(mx ?? 0, my ?? 0);
		setA(a);
		p5.rotate(a ?? 0);
		p5.rect(0, 0, 35, 35, 10);
		p5.fill("black");
		p5.rect(12.5, 15, 10, 5, 3);
		p5.rect(12.5, -15, 10, 5, 3);
		p5.rect(-12.5, 15, 10, 5, 3);
		p5.rect(-12.5, -15, 10, 5, 3);

		p5.stroke("red");
		p5.strokeWeight(3);
		p5.line(0, 0, 35, 0);
	};

	return (
		<div className="w-fit h-fit flex flex-col items-center">
			<div className="overflow-hidden rounded-3xl w-fit h-fit">
				<Sketch
					setup={setup}
					draw={draw}
				/>
			</div>

			<h1 className="font-semibold animate-pulse">Tap to set the position</h1>
		</div>
	);
}
