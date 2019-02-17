// Charts

interface Chart {
    svg: d3.Selection<SVGGElement, {}, null, undefined>
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    line: d3.Line<number>;
}

interface MapPreview {
    svg: d3.Selection<SVGGElement, {}, null, undefined>
    scale: d3.ScaleLinear<number, number>;
}


// Data point types

interface SkillData {
    name: string;
    dataSets: Array<DataSet>;
}

interface DataSet {
    name: string;
    dataPoints: Array<number>;
}

// Map preview types

interface BeatmapSettings {
    cs: number;
    ar: number;
}

interface HitObject {
    x: number;
    y: number;
    time: number;
    newCombo: boolean;
}

interface HitCircle extends HitObject {
    // nothing more needed
}

enum SliderType {
    Linear = "Linear",
    Perfect = "Perfect",
    Bezier = "Bezier",
    Catmull = "Catmull"
}

enum CurvePointType {
    Grey = "Grey",
    Red = "Red"
}

interface CurvePoint {
    type: CurvePointType;
    x: number;
    y: number;
}

interface Slider extends HitObject {
    type: SliderType;
    curvePoints: CurvePoint[];
    repeat: number;
}

interface Spinner extends HitObject {
    // nothing more needed
}
