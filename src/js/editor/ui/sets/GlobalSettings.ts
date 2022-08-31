import { uiSet, uiSetOptions } from "../uiSet";

export type Point = {
    x: number;
    y: number;
    z?: number;
}

export enum ShapeType {
    TRIANGLE,
    RECTANGLE,
    CIRCLE,
}

export type DemoType = {
    position: Point;
    scale: Point;
    color: string;
    type:ShapeType;
    rotSpeed:number;
}

const DEFAULTS:DemoType = {
    position: {
        x: 0,
        y: 0,
        z: 0
    },
    color: "#ffffff",
    scale: {
        x: 1,
        y: 1
    },
    type: ShapeType.RECTANGLE,
    rotSpeed: .1
}

export class GlobalSettings extends uiSet {
    settings:DemoType = DEFAULTS;

    constructor(id: string = '', opts:uiSetOptions) {
        super(id, opts);

        this.pane.addInput(DEFAULTS, 'position', {
            x: {min: -10, max: 10, step: .01},
            y: {min: -10, max: 10, step: .01},
            z: {min: -10, max: 10, step: .01}
        });

        this.pane.addInput(DEFAULTS, 'scale', {
            x: {min: 0, max: 10, step: .01},
            y: {min: 0, max: 10, step: .01}
        });

        this.pane.addInput(DEFAULTS, 'color', {
            view: 'color'
        });

        this.pane.addInput(DEFAULTS, 'type', {
            options: {
                'Triangle': ShapeType.TRIANGLE,
                'Rect': ShapeType.RECTANGLE,
                'Circle': ShapeType.CIRCLE
            }
        });

        this.pane.addInput(DEFAULTS, 'rotSpeed', {
            min: 0,
            max: 1,
            step: .01
        });
    }

    export(): string {
        return `{"demo": ${super.export()}}`;
    }
}