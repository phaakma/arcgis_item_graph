# ArcGIS Item Dependency Graphs  

## main.py  
A Python script that uses the ArcGIS API for Python to generate a graph json file.  
- Update the authentication method to your preferred method.  
- Update the code that fetches the list of items to obtain your desired list to process.  
- Optionally, update the output folder and file name.  

## Static website  
A static website that allows to upload the json file which will be visualised using D3.js.  

Either download the three static files or use the GitHub Pages hosted version here:  
[https://phaakma.github.io/arcgis_item_graph/](https://phaakma.github.io/arcgis_item_graph/)

- **Load Data** to select and load in a local json file.  
- The nodes can be manually moved and will lock in place. Right click a node to toggle the lock position on and off.  
- **Save as SVG** to save the current view to an SVG file.  
- **Save Graph** to save a copy of the current graph state and layout to a JSON file.  
- **Reset node positions** to set all nodes back to floating.  
- Tick the **Enable Popups** checkbox in the top right, and then hover over a node for more information such as the item id and url links for certain item types.  
- The slider adjusts the node sizes, but causes scaling issues currently.  
- The **Adjust physics options** panel provides some sliders to adjust how the floating nodes position themselves.  


