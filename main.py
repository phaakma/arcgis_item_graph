import os
import json
import networkx as nx
from arcgis.gis import GIS
from arcgis.apps.itemgraph import create_dependency_graph

# Authenticate to ArcGIS Online or your ArcGIS Enterprise portal
# Ensure you have the necessary credentials set up in your environment or use a profile
gis = GIS("https://www.arcgis.com", profile="saved_profile")
print(gis)

# Example item IDs to create a dependency graph
# Replace these with actual item IDs from your ArcGIS organization
item_ids = [
    "abcdefghijklmnop351887a95607abd",
    "abcdefghijklmnopb8703eb0858fd95e",
]

# Directory to save the graph data
output_dir = os.path.join(os.path.dirname(__file__), 'output')


def convert_item_graph_to_digraph(source_graph):
    """
    Convert an ArcGIS item graph to a directed graph (DiGraph) for visualization.
    Excludes certain item types and formats the nodes with titles and URLs.
    Args:
        source_graph (arcgis.apps.itemgraph.ItemGraph): The source item graph to convert.
    Returns:
        nx.DiGraph: A directed graph representation of the item graph.
    """
    G = nx.DiGraph()    
    excluded_types = {"Service Definition", "Code Attachment"}
    included_ids = set()    
    for item in source_graph.all_items(out_format="item"):
        if item.type in excluded_types:
            continue        
        title = f"<b>{item.title}</b><br/>{item.type}<br/>{item.id}<br/>"
        if item.url and item.url > "":
            title = f"<b><a href='{item.url}' target='_blank'>{item.title}</a></b><br/>{item.type}<br/>{item.id}<br/>"
        G.add_node(
            item.id,
            label=f"{item.title} ({item.type})",
            title=title,
            type=item.type,
            group=item.type
        )
        included_ids.add(item.id)    
    for edge in source_graph.edges:
        src, dst = edge
        if src in included_ids and dst in included_ids:
            G.add_edge(src, dst)
    return G

def create_d3_visualization(G, output_file, output_dir): 
    """Create a D3.js compatible JSON file from the graph.
    Args:
        G (nx.DiGraph): The directed graph to convert.
        output_file (str): The name of the output JSON file.
        output_dir (str): The directory to save the output file.
    """
    # Ensure the output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    output_file_path = os.path.join(output_dir, output_file) 
    
    # Convert graph to JSON and save to data file
    nodes = [{'id': str(n), 
            'name': G.nodes[n]['label'],
            'title': G.nodes[n]['title'],
            'type': G.nodes[n]['type'],
            'group': G.nodes[n]['group']
            } for n in G.nodes()]
    links = [{'source': str(source), 'target': str(target)} 
            for source, target in G.edges()]    

    with open(output_file_path, 'w') as f:
        json.dump({'nodes': nodes, 'links': links}, f)   

items = []
for _itm_id in item_ids:
    items.append(gis.content.get(_itm_id))
print(items)    

my_graph = create_dependency_graph(
    gis=gis,
    item_list=items,
    outside_org=True,
    include_reverse=True,
    )

for item in my_graph.all_items(out_format="item"):
    print(f"ID: {item.id}, ({item.type}): \t{item.title}")

G = convert_item_graph_to_digraph(my_graph)
create_d3_visualization(G, 'graph.json', output_dir)