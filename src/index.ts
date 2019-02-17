import * as d3 from "d3";
import Utils from "./utils";

class UniCircleVisualiser extends HTMLElement {
    currentTime: number = 0;
    beatmapSettings: BeatmapSettings;
    hitObjects: Array<HitObject> = [];
    skillDatas: Array<SkillData> = [];
    
    charts: Map<string, Chart>; // key is skillname:datasetname
    mapPreview: MapPreview;
    arScale: d3.ScaleLinear<number, number>;
    
    mapContainer: HTMLElement;
    graphContainer: HTMLElement;

    constructor() {
        super();

        // attach shadow dom
        this.attachShadow({mode: "open"});

        // create our content elements
        this.mapContainer = document.createElement("div");
        this.mapContainer.className = "map-container";
        this.graphContainer = document.createElement("div");
        this.graphContainer.className = "graph-container";

        // create our style element
        const style = document.createElement("style");
        style.textContent = `
            .map-container, .graph-container {
                display: inline-block;
                height: 100%;
                vertical-align: top;
            }
            
            .map-container {
                width: 70%;
            }
            
            .map-container svg {
                margin-left: auto;
                margin-right: auto;
            }

            .map-container .timestamp {
                font: bold 30px sans-serif;
            }

            .hitcircle {
                fill: none;
                stroke: black;
                stroke-width: 5;
            }

            .approachcircle {
                fill: none;
                stroke: grey;
                stroke-width: 3;
            }

            .graph-container {
                width: 30%;
                overflow-x: hidden;
                overflow-y: auto;
            }

            .graph-container .title {
                font: bold 15px sans-serif;
            }

            .graph-container g {
                pointer-events: all;
            }

            svg {
                background-color: #ddd;
                display: block;
            }

            .line {
                fill: none;
                stroke: #ffab00;
                stroke-width: 3;
            }

            .dot {
                fill: #ffab00;
                stroke: #fff
            }
        `;
        // TODO: have attribute value for light/dark theme <unicircle-visualiser theme="dark"></unicircle-visualiser>

        // attach out styles and content to our shadowroot
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this.mapContainer);
        this.shadowRoot.appendChild(this.graphContainer);

        window.addEventListener("resize", () => {
            this.initialiseSvgs();
            this.render();
        });
    }

    initialiseSvgs() {
        // initialse line chart svgs
        d3.select(this.graphContainer).selectAll("svg").remove();
        // remove any old svgs
        this.charts = new Map<string, Chart>();
        // TODO: refactor so a new svgs dont need to be for created each resize
        // TODO: way of selecting which graphs you want to display so you can have one for each dataset, not just one per skill

        for (const skillData of this.skillDatas) {
            for (const dataSet of skillData.dataSets) {
                let chart = {} as Chart;

                let margin = {
                    top: 50,
                    right: 50,
                    bottom: 50,
                    left: 50
                }
        
                let width = this.graphContainer.offsetWidth - margin.left - margin.right;
                let height = this.graphContainer.offsetHeight / 3 - margin.top - margin.bottom;
        
                chart.xScale = d3.scaleLinear()
                    .domain([0, Math.max(...this.hitObjects.map(h =>h.time))])
                    .range([0, width]);
        
                chart.yScale = d3.scaleLinear()
                    .domain([0, Math.max(...dataSet.dataPoints)])
                    .range([height, 0]);
        
                chart.line = d3.line<number>()
                    .x((d, i) => chart.xScale(this.hitObjects[i].time))
                    .y(d => chart.yScale(d))
                    .curve(d3.curveMonotoneX);
        
                chart.svg = d3.select(this.graphContainer).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top})`);

                chart.svg.append("rect")    // hidden rectangle to capture mouse events for the g element
                    .attr("width", width)
                    .attr("height", height)
                    .attr("visibility", "hidden");

                chart.svg.append("text")
                    .attr("class", "title")
                    .attr("x", width / 2)
                    .attr("y", 0 - margin.top / 2)
                    .attr("text-anchor", "middle")
                    .text(`${skillData.name}: ${dataSet.name}`);

                chart.svg.append("g")
                    .attr("class", "x-axis")
                    .attr("transform", `translate(0, ${height})`)
                    .call(d3.axisBottom(chart.xScale));
                
                chart.svg.append("g")
                    .attr("class", "y-axis")
                    .call(d3.axisLeft(chart.yScale));
        
                chart.svg.append("path")
                    .attr("class", "line");

                this.charts.set(`${skillData.name}:${dataSet.name}`, chart);
            }
        }

        // initialise map preview svg
        d3.select(this.mapContainer).select("svg").remove();
        this.mapPreview = {} as MapPreview;

        // maintain 4:3 aspect ratio to match osu!px playfield (512:384)
        var width = this.mapContainer.offsetWidth;
        var height = this.mapContainer.offsetWidth * 0.75;
        if (height > this.mapContainer.offsetHeight) {
            width = this.mapContainer.offsetHeight * (1 + 1 / 3);
            height = this.mapContainer.offsetHeight;
        }

        // only need a single scale since aspect ratio must be constant
        // scale can be used for x, y, circle radius, etc
        // scale takes osu!px input and outputs equivilent in svg space
        this.mapPreview.scale = d3.scaleLinear()
            .domain([0, 512])
            .range([0, width]);

        this.mapPreview.svg = d3.select(this.mapContainer).append("svg")
            .attr("width", width)
            .attr("height", height);

        this.mapPreview.svg.append("text")
            .attr("class", "timestamp")
            .attr("x", width / 2)
            .attr("y", height / 15)
            .attr("text-anchor", "middle");

        // initialise ar scale
        this.arScale = d3.scaleLinear()
            .domain([0, Utils.arToMilliseconds(this.beatmapSettings.ar)])
            .range([1, 4]);
    }

    setData(beatmapSettings: BeatmapSettings, hitObjects: Array<HitObject>, skillDatas: Array<SkillData>) {
        this.beatmapSettings = beatmapSettings;
        this.hitObjects = hitObjects;
        this.skillDatas = skillDatas;
        this.render();
    }

    render() {
        let dataSetCount = 0;
        for (const skillData of this.skillDatas) {
            dataSetCount += skillData.dataSets.length;
        }
        if (this.graphContainer.childNodes.length !== dataSetCount) {
            // wrong number of graphs
            // TODO: rewrite this to be per chart because this is inefficient
            //          ties into TODO from this.initialiseSvgs()
            this.initialiseSvgs();
        }

        // bind data for line charts
        this.charts.forEach((chart, key) => {
            let svg = chart.svg;
            let [skillName, dataSetName] = key.split(":");
            let dataSet = this.skillDatas.find(s => s.name == skillName).dataSets.find(d => d.name == dataSetName);

            svg.on("mousemove", () => {
                let [x, y] = d3.mouse(svg.node());
                let time = chart.xScale.invert(x);
                let dataPointIndex = d3.bisectLeft(this.hitObjects.map(h => h.time), time);
                
                this.currentTime = time;
                this.render();
            });

            svg.select(".line")
                .datum(dataSet.dataPoints)
                .attr("d", chart.line);

            // Bind data
            const dots = svg.selectAll<SVGCircleElement, null>(".dot")
                .data(dataSet.dataPoints);

            // Enter
            dots.enter().append("circle")
                .attr("class", "dot")
                .attr("r", 5)
              // Update
              .merge(dots)
                .attr("cx", (d, i) => chart.xScale(this.hitObjects[i].time))
                .attr("cy", d => chart.yScale(d));
            
            // Exit
            dots.exit().remove();
        })

        // bind data for map preview
        const circles = this.mapPreview.svg.selectAll<SVGCircleElement, null>(".hitcircle")
            .data(this.hitObjects.filter(c => 
                this.currentTime <= c.time &&
                this.currentTime >= c.time - Utils.arToMilliseconds(this.beatmapSettings.ar)
            ));
    
        // Enter
        circles.enter().append("circle")
            .attr("class", "hitcircle")
            .attr("r", this.mapPreview.scale(Utils.csToPixel(this.beatmapSettings.cs)))
          // Update
          .merge(circles)
            .attr("cx", c => this.mapPreview.scale(c.x))
            .attr("cy", c => this.mapPreview.scale(c.y));

        // Exit
        circles.exit().remove();

        const approachCircles = this.mapPreview.svg.selectAll<SVGCircleElement, null>(".approachcircle")
            .data(this.hitObjects.filter(c => 
                this.currentTime <= c.time &&
                this.currentTime >= c.time - Utils.arToMilliseconds(this.beatmapSettings.ar)
            ));
        
        // Enter
        approachCircles.enter().append("circle")
            .attr("class", "approachcircle")
          // Update
          .merge(approachCircles)
            .attr("cx", c => this.mapPreview.scale(c.x))
            .attr("cy", c => this.mapPreview.scale(c.y))
            .attr("r", c => this.mapPreview.scale(Utils.csToPixel(this.beatmapSettings.cs) * this.arScale(c.time - this.currentTime)));   // approach circle starts at approx 4x radius

        // Exit
        approachCircles.exit().remove();

        // timestamp
        this.mapPreview.svg.select(".timestamp")
            .datum(this.currentTime)
            .text(t => Utils.msToTimestamp(t));
    }

    connectedCallback() {
        console.log("attached");
    }

    disconnectedCallback() {
        console.log("detached");
    }
}

window.customElements.define("unicircle-visualiser", UniCircleVisualiser);
