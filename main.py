import os
import json
import networkx as nx
from arcgis.gis import GIS
from arcgis.apps.itemgraph import create_dependency_graph
import sys

# Authenticate to ArcGIS Online or your ArcGIS Enterprise portal
gis = GIS("https://www.arcgis.com", profile="saved_profile")
print(gis)

# get all items belonging to the authenticated user.
# replace this with code to fetch the items of interest.
owner_user_name = gis.users.me.username
output_file = f"{owner_user_name}_all.json"
items = gis.content.search(query=f"owner:{owner_user_name}", max_items=1000)
print(len(items))

# Directory to save the graph data
output_dir = os.path.join(os.path.dirname(__file__), "output")


def convert_itemgraph_to_json(source_graph: "arcgis.apps.itemgraph.ItemGraph", excluded_types: set=None) -> dict:
    """
    Convert an ArcGIS item graph to a D3.js compatible JSON file.
    Optionally excludes certain item types and formats nodes with titles and URLs.
    Args:
        source_graph (arcgis.apps.itemgraph.ItemGraph): The source item graph.
        output_file (str): The name of the output JSON file.
        output_dir (str): The directory to save the output file.
    """
    excluded_types = excluded_types if excluded_types is not None else set()
    included_ids = set()
    nodes = []

    # Process items -> nodes
    for item in source_graph.all_items(out_format="item"):
        if item.type in excluded_types:
            continue

        title = f"<b>{item.title}</b><br/>{item.type}<br/>{item.id}<br/>"
        if item.url and item.url.strip():
            title = f"<b><a href='{item.url}' target='_blank'>{item.title}</a></b><br/>{item.type}<br/>{item.id}<br/>"

        nodes.append(
            {
                "id": str(item.id),
                "name": f"{item.title} ({item.type})",
                "title": title,
                "type": item.type,
                "group": item.type,
            }
        )
        included_ids.add(item.id)

    # Process edges -> links
    links = []
    for src, dst in source_graph.edges:
        if src in included_ids and dst in included_ids:
            links.append({"source": str(src), "target": str(dst)})

    return {"nodes": nodes, "links": links}


# Build the dependency graph from ArcGIS
my_graph = create_dependency_graph(
    gis=gis,
    item_list=items,
    outside_org=True,
    include_reverse=True,
)

# Export to JSON
graph_json = convert_itemgraph_to_json(source_graph=my_graph)

# Ensure output directory exists
os.makedirs(output_dir, exist_ok=True)

# Write JSON
output_file_path = os.path.join(output_dir, "graph.json")
with open(output_file_path, "w") as f:
    json.dump(graph_json, f)
