let currentContainer;
let currentGraph;
let currentWidth;
let currentHeight;
let simulation;
let dataPath;

// Load graph data and initialize visualization
async function initializeGraph() {
  if (dataPath) {
    const graph = await d3.json(dataPath);
    createGraph(graph);
  }

  // Add file input handler
  document
    .getElementById("load-data")
    .addEventListener("change", handleFileSelect);

  // Add popup toggle handler
  document
    .getElementById("enable-popups")
    .addEventListener("change", handlePopupToggle);
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const graph = JSON.parse(e.target.result);
        // Stop existing simulation if it exists
        if (simulation) simulation.stop();
        // Clear existing svg
        d3.select("svg").remove();
        // Create new graph with loaded data
        createGraph(graph);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Error loading file. Please ensure it is valid JSON.");
      }
    };
    reader.readAsText(file);
  }
}

function createGraph(graph) {
  currentGraph = graph;
  currentWidth = window.innerWidth;
  currentHeight = window.innerHeight;

  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", currentWidth)
    .attr("height", currentHeight)
    .call(d3.zoom().on("zoom", zoomed));

  // Add container group for zoom/pan
  const container = svg.append("g");
  currentContainer = container;

  // Add zoom function
  function zoomed(event) {
    {
      container.attr("transform", event.transform);
    }
  }

  // Create new simulation
  simulation = d3
    .forceSimulation(graph.nodes)
    .force(
      "link",
      d3
        .forceLink(graph.links)
        .id((d) => d.id)
        .distance(100)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(currentWidth / 2, currentHeight / 2))
    .force("collision", d3.forceCollide().radius(50));

  const link = container
    .append("g")
    .selectAll("line")
    .data(graph.links)
    .join("line")
    .attr("class", "link");

  const popup = d3.select("#popup");

  // Add labels
  const labels = container
    .append("g")
    .selectAll("text")
    .data(graph.nodes)
    .join("text")
    .attr("class", "node-label")
    .attr("dx", 15)
    .attr("dy", 4)
    .text((d) => d.name);

  // Add popup management with proper timer handling
  let popupTimer = null;
  let currentNode = null;

  function showPopup(event, d) {
    if (!document.getElementById("enable-popups").checked) return;
    if (popupTimer) {
      {
        clearTimeout(popupTimer);
        popupTimer = null;
      }

      // Update current node and show its popup
      currentNode = d;
      const [x, y] = [event.pageX, event.pageY];
      popup
        .style("left", x + 10 + "px")
        .style("top", y + 10 + "px")
        .style("opacity", 1)
        .html(d.title);
    }
  }

  function hidePopupWithDelay() {
    // Clear any existing timer first
    if (popupTimer) {
      {
        clearTimeout(popupTimer);
      }
    }

    if (!document.getElementById("enable-popups").checked) {
      popup.style("opacity", 0);
      return;
    }

    // Create new timer for current node
    popupTimer = setTimeout(() => {
      if (currentNode) {
        popup.transition().duration(500).style("opacity", 0);
        //currentNode = null;
        popupTimer = null;
      }
    }, 2000);
  }

  function handlePopupToggle() {
    if (!document.getElementById("enable-popups").checked) {
      // Hide popup immediately when disabled
      popup.style("opacity", 0);
      if (popupTimer) {
        clearTimeout(popupTimer);
        popupTimer = null;
      }
    }
  }

  // Update node selection with improved hover behavior
  const node = container
    .append("g")
    .selectAll("circle")
    .data(graph.nodes)
    .join("circle")
    .attr("class", "node")
    .attr("r", 10)
    .attr("fill", "#69b3a2")
    .call(drag(simulation))
    .on("mouseover", showPopup)
    .on("mouseout", hidePopupWithDelay);

  // Remove old popup click handlers since we're using hover now
  d3.select("body").on("click", null);
  popup.on("click", null);

  simulation.on("tick", () => {
    {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    }
  });

  function drag(simulation) {
    {
      function dragstarted(event) {
        {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
      }

      function dragged(event) {
        {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
      }

      function dragended(event) {
        {
          if (!event.active) simulation.alphaTarget(0);
          // Don't reset fx/fy to null - keep node fixed
          d3.select(event.sourceEvent.target).attr("fill", "#ff7f0e");
        }
      }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }
}

function saveAsSVG() {
  if (!currentContainer || !currentGraph) {
    alert("No graph data to save");
    return;
  }

  const svgCopy = d3
    .create("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", currentWidth)
    .attr("height", currentHeight);

  // Create container with current transform
  const containerCopy = svgCopy
    .append("g")
    .attr("transform", currentContainer.attr("transform"));

  // Add edges (links) first so they appear behind nodes
  containerCopy
    .selectAll(".link")
    .data(currentGraph.links)
    .join("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 1)
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  // Add nodes
  containerCopy
    .selectAll(".node")
    .data(currentGraph.nodes)
    .join("circle")
    .attr("r", 10)
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("fill", (d) => (d.fx ? "#ff7f0e" : "#69b3a2"))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  // Add labels
  containerCopy
    .selectAll(".label")
    .data(currentGraph.nodes)
    .join("text")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("dx", 15)
    .attr("dy", 4)
    .attr("font-family", "Arial, sans-serif")
    .attr("font-size", "14px")
    .attr("fill", "#333")
    .text((d) => d.name);

  // Create blob and trigger download
  const svgString = svgCopy.node().outerHTML;
  const blob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const filename =
    document.querySelector(".filename-input").value.trim() || "itemgraph";
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Start visualization once DOM is loaded
document.addEventListener("DOMContentLoaded", initializeGraph);
