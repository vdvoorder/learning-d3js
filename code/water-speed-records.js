
async function drawChart() {

    /* 1. Access data */
    const dataset = await d3.csv("./data/water-speed-records.csv")

    // helper functions to iterate array
    const parseDate = d3.timeParse("%Y-%m-%d")

    const xAccessor = d => +d.speed_kmh
    const yAccessor = d => parseDate(d["date"])

    const xAxisLabelText = "Speed (km/h)"
    const yAxisLabelText = "Time"

    /* 2. Create chart dimensions */
    const width = d3.min([
        window.innerWidth * 0.9,    // window.inner* is a read-only property that     
        window.innerHeight * 0.9,   // returns the interior width of the window in pixels
    ])

    // margin is the padding between the wrapper and bounds
    let dimensions = {
        width: width,
        height: width,
        margin: {
            top: 20,
            right: 20,
            bottom: 80,
            left: 80,
        },
    }

    // make our bounds respect the margins
    dimensions.boundedWidth = dimensions.width
        - dimensions.margin.left
        - dimensions.margin.right
    dimensions.boundedHeight = dimensions.height
        - dimensions.margin.top
        - dimensions.margin.bottom


    /* 3. Draw canvas */

    // wrapper is entire SVG element containing axes, data elements and legends
    const wrapper = d3.select("#wrapper")
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)

    // bounds live inside the wrapper and contain just the data elements
    const bounds = wrapper.append("g")
        .style("transform", `translate(${dimensions.margin.left
            }px, ${dimensions.margin.top
            }px)`)

    /* 4. Create scales */
    const xScale = d3.scaleLinear()
        .domain(d3.extent(dataset, xAccessor))
        .range([0, dimensions.boundedWidth])
        .nice()

    const yScale = d3.scaleTime()
        .domain(d3.extent(dataset, yAccessor))
        .range([0, dimensions.boundedHeight])
        .nice()

    const drawDots = (dataset) => {

        const dots = bounds.selectAll("circle")
            .data(dataset, d => d[0])

        const newDots = dots.enter().append("circle")

        const allDots = newDots.merge(dots)
            .attr("cx", d => xScale(xAccessor(d)))
            .attr("cy", d => yScale(yAccessor(d)))
            .attr("r", 4)

        const oldDots = dots.exit()
            .remove()
    }
    drawDots(dataset)

    /* 6. Draw peripherals */
    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)
        .ticks(5)

    const xAxis = bounds.append("g")
        .call(xAxisGenerator)
        .style("transform", `translateY(${dimensions.boundedHeight}px)`)

    const xAxisLabel = xAxis.append("text")
        .attr("x", dimensions.boundedWidth / 2)
        .attr("y", dimensions.margin.bottom - 20)
        .attr("fill", "black")
        .style("font-size", "1.4em")
        .html(xAxisLabelText)

    const yAxisGenerator = d3.axisLeft()
        .scale(yScale)
        .ticks(8)

    const yAxis = bounds.append("g")
        .call(yAxisGenerator)

    const yAxisLabel = yAxis.append("text")
        .attr("x", -dimensions.boundedHeight / 2)
        .attr("y", -dimensions.margin.left + 30)
        .attr("fill", "black")
        .style("font-size", "1.4em")
        .html(yAxisLabelText)
        .style("transform", "rotate(-90deg)")
        .style("text-anchor", "middle")

    /* 7. Set up interactions */

    const listeningRect = bounds.append("rect")
        .attr("class", "listening-rect")
        .attr("width", dimensions.boundedWidth)
        .attr("height", dimensions.boundedHeight)
        .on("mousemove", onMouseMove)
        .on("mouseleave", onMouseLeave)
    
    bounds.selectAll("circle")
        .on("mouseenter", onMouseMove)
        .on("mouseleave", onMouseLeave)

    const tooltip = d3.select("#tooltip")

    // function onMouseEnter(datum) {

    //     const hoveredDot = bounds.append("circle")
    //         .attr("class", "tooltipDot")
    //         .attr("cx", xScale(xAccessor(datum)))
    //         .attr("cy", yScale(yAccessor(datum)))
    //         .attr("r", 7)
    //         .style("pointer-events", "none")

    //     const shootingLine = bounds.append("line")
    //         .attr("class", "tooltipLine")
    //         .attr("x1", 0)
    //         .attr("y1", yScale(yAccessor(datum)))
    //         .attr("x2", xScale(xAccessor(datum)))
    //         .attr("y2", yScale(yAccessor(datum)))
    //         .style("pointer-events", "none")

    //     const formatSpeed = d3.format(".2f")
    //     tooltip.select("#speed")
    //         .text(formatSpeed(xAccessor(datum)))

    //     tooltip.select("#captain")
    //         .text(datum.captain)

    //     tooltip.select("#craft")
    //         .text(datum.craft)

    //     const dateParser = d3.timeParse("%Y-%m-%d")
    //     const formatDate = d3.timeFormat("%a %-d %b, %Y")
    //     tooltip.select("#date")
    //         .text(formatDate(dateParser(datum.date)))

    //     const x = xScale(xAccessor(datum))
    //         + dimensions.margin.left
    //     const y = yScale(yAccessor(datum))
    //         + dimensions.margin.top

    //     tooltip.style("transform", `translate(`
    //         + `calc( -50% + ${x}px),`
    //         + `calc(-100% + ${y}px)`
    //         + `)`)

    //     tooltip.style("opacity", 1)

    // }

    function onMouseMove() {
        const mousePosition = d3.mouse(this)
        const hoveredDate = xScale.invert(mousePosition[0])

        const getDistanceFromHoveredDate = d => Math.abs(
        xAccessor(d) - hoveredDate
        )
        const closestIndex = d3.scan(dataset, (a, b) => (
        getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
        ))

        const closestDataPoint = dataset[closestIndex]
        const closestXValue = xAccessor(closestDataPoint)
        const closestYValue = yAccessor(closestDataPoint)

        const x = xScale(closestXValue)
            + dimensions.margin.left
        const y = yScale(closestYValue)
            + dimensions.margin.top

        const hoveredDot = bounds.append("circle")
            .attr("class", "tooltipDot")
            .attr("cx", xScale(closestXValue))
            .attr("cy", yScale(closestYValue))
            .attr("r", 7)
            .style("pointer-events", "none")

        const shootingLine = bounds.append("line")
            .attr("class", "tooltipLine")
            .attr("x1", 0)
            .attr("y1", yScale(closestYValue))
            .attr("x2", xScale(closestXValue))
            .attr("y2", yScale(closestYValue))
            .style("pointer-events", "none")

        const formatSpeed = d3.format(".2f")
        tooltip.select("#speed")
            .text(formatSpeed(closestXValue))
        tooltip.select("#captain")
            .text(closestDataPoint.captain)
        tooltip.select("#craft")
            .text(closestDataPoint.craft)

        const dateParser = d3.timeParse("%Y-%m-%d")
        const formatDate = d3.timeFormat("%a %-d %b, %Y")
        tooltip.select("#date")
            .text(formatDate(dateParser(closestDataPoint.date)))

        tooltip.style("transform", `translate(`
            + `calc( -50% + ${x}px),`
            + `calc(-100% + ${y}px)`
            + `)`)
        tooltip.style("opacity", 1)
    }

    function onMouseLeave() {
        tooltip.style("opacity", 0)
        d3.selectAll(".tooltipDot")
            .remove()
        d3.selectAll(".tooltipLine")
            .remove()
    }

}
drawChart()

// TODO: make shootingLine appear from left to right when hovering
// TODO: make non-closest tooltipLine and tooltipDot disappear onMouseMove()