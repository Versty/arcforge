"""
Build relation graph from items database
Transforms flat item data into a graph structure with explicit edges
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Set


def create_edge(
    name: str,
    direction: str,
    relation: str,
    quantity: int = None,
    dependency: List[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Create an edge dictionary."""
    edge = {
        "name": name,
        "direction": direction,
        "relation": relation
    }
    
    if quantity is not None:
        edge["quantity"] = quantity
    
    if dependency:
        edge["dependency"] = dependency
    
    return edge


def get_item_levels(item_data: Dict[str, Any]) -> List[str]:
    """
    Extract all levels for an item (weapons/gear).
    Returns list of level names like ["Ferro I", "Ferro II", ...]
    """
    levels = []
    base_name = item_data.get("name", "")
    
    # Check if this item has upgrades or repairs with levels
    has_levels = False
    
    # Check crafting for result_level
    if "crafting" in item_data:
        for craft in item_data["crafting"]:
            if "result_level" in craft:
                levels.append(craft["result_level"])
                has_levels = True
    
    # Check upgrades for input/output levels
    if "upgrades" in item_data:
        for upgrade in item_data["upgrades"]:
            if "input_level" in upgrade:
                levels.append(upgrade["input_level"])
                has_levels = True
            if "output_level" in upgrade:
                levels.append(upgrade["output_level"])
                has_levels = True
    
    # Check repairs for item_name (which includes levels)
    if "repairs" in item_data:
        for repair in item_data["repairs"]:
            if "item_name" in repair:
                levels.append(repair["item_name"])
                has_levels = True
    
    # Check recycling for input levels
    if "recycling" in item_data:
        recycling = item_data["recycling"]
        if "recycling" in recycling:
            for recycle in recycling["recycling"]:
                if "input" in recycle:
                    levels.append(recycle["input"])
                    has_levels = True
        if "salvaging" in recycling:
            for salvage in recycling["salvaging"]:
                if "input" in salvage:
                    levels.append(salvage["input"])
                    has_levels = True
    
    # Remove duplicates and sort
    levels = sorted(list(set(levels)))
    
    return levels if has_levels else [base_name]


def process_crafting(item_data: Dict[str, Any], item_name: str) -> List[Dict[str, Any]]:
    """Process crafting relationships into edges."""
    edges = []
    
    if "crafting" not in item_data:
        return edges
    
    for craft_recipe in item_data["crafting"]:
        # Get dependency (workshop)
        dependency = None
        if "workshop" in craft_recipe:
            dependency = [{"type": "workshop", "name": craft_recipe["workshop"]}]
        
        # Add blueprint lock if present
        if craft_recipe.get("blueprint_locked"):
            if dependency is None:
                dependency = []
            dependency.append({"type": "blueprint", "name": "required"})
        
        # Process recipe materials (incoming edges)
        if "recipe" in craft_recipe:
            for material in craft_recipe["recipe"]:
                material_name = material.get("item")
                quantity = material.get("quantity")
                
                if material_name:
                    edge = create_edge(
                        name=material_name,
                        direction="in",
                        relation="craft_from",
                        quantity=quantity,
                        dependency=dependency
                    )
                    edges.append(edge)
    
    return edges


def process_upgrades(item_data: Dict[str, Any], item_name: str) -> List[Dict[str, Any]]:
    """Process upgrade relationships into edges."""
    edges = []
    
    if "upgrades" not in item_data:
        return edges
    
    for upgrade in item_data["upgrades"]:
        input_level = upgrade.get("input_level", item_name)
        output_level = upgrade.get("output_level")
        
        # Only process if this is the correct input level
        if input_level != item_name:
            continue
        
        # Get dependency (workshop, upgrade perks)
        dependency = None
        if "workshop" in upgrade:
            dependency = [{"type": "workshop", "name": upgrade["workshop"]}]
        
        if upgrade.get("blueprint_locked"):
            if dependency is None:
                dependency = []
            dependency.append({"type": "blueprint", "name": "required"})
        
        # Process upgrade materials (incoming edges for materials)
        if "recipe" in upgrade:
            for material in upgrade["recipe"]:
                material_name = material.get("item")
                quantity = material.get("quantity")
                
                if material_name:
                    edge = create_edge(
                        name=material_name,
                        direction="in",
                        relation="upgrade_from",
                        quantity=quantity,
                        dependency=dependency
                    )
                    edges.append(edge)
        
        # Add edge to output level (upgrade_to)
        if output_level:
            edge_dep = dependency.copy() if dependency else []
            if "upgrade_perks" in upgrade:
                edge_dep.append({"type": "perks", "name": ", ".join(upgrade["upgrade_perks"])})
            
            edge = create_edge(
                name=output_level,
                direction="out",
                relation="upgrade_to",
                dependency=edge_dep if edge_dep else None
            )
            edges.append(edge)
    
    return edges


def process_repairs(item_data: Dict[str, Any], item_name: str) -> List[Dict[str, Any]]:
    """Process repair relationships into edges."""
    edges = []
    
    if "repairs" not in item_data:
        return edges
    
    for repair in item_data["repairs"]:
        repair_item_name = repair.get("item_name", item_name)
        
        # Only process if this is the correct item
        if repair_item_name != item_name:
            continue
        
        # Get dependency (durability restored)
        dependency = None
        if "durability" in repair:
            dependency = [{"type": "durability", "name": f"+{repair['durability']}"}]
        
        # Process repair materials (incoming edges)
        if "recipe" in repair:
            for material in repair["recipe"]:
                material_name = material.get("item")
                quantity = material.get("quantity")
                
                if material_name:
                    edge = create_edge(
                        name=material_name,
                        direction="in",
                        relation="repair_from",
                        quantity=quantity,
                        dependency=dependency
                    )
                    edges.append(edge)
    
    return edges


def process_recycling(item_data: Dict[str, Any], item_name: str) -> List[Dict[str, Any]]:
    """Process recycling relationships into edges."""
    edges = []
    
    if "recycling" not in item_data:
        return edges
    
    recycling = item_data["recycling"]
    
    # Process recycling (item -> materials)
    if "recycling" in recycling:
        for recycle in recycling["recycling"]:
            recycle_input = recycle.get("input", item_name)
            
            # Only process if this matches current item
            if recycle_input != item_name:
                continue
            
            # Add outgoing edges to materials
            if "materials" in recycle:
                for material in recycle["materials"]:
                    material_name = material.get("item")
                    quantity = material.get("quantity")
                    
                    if material_name:
                        edge = create_edge(
                            name=material_name,
                            direction="out",
                            relation="recycle_to",
                            quantity=quantity
                        )
                        edges.append(edge)
    
    # Process salvaging (item -> materials)
    if "salvaging" in recycling:
        for salvage in recycling["salvaging"]:
            salvage_input = salvage.get("input", item_name)
            
            # Only process if this matches current item
            if salvage_input != item_name:
                continue
            
            # Add outgoing edges to materials
            if "materials" in salvage:
                for material in salvage["materials"]:
                    material_name = material.get("item")
                    quantity = material.get("quantity")
                    
                    if material_name:
                        edge = create_edge(
                            name=material_name,
                            direction="out",
                            relation="salvage_to",
                            quantity=quantity
                        )
                        edges.append(edge)
    
    return edges


def create_node(
    name: str,
    wiki_url: str = None,
    source_url: str = None,
    infobox: Dict[str, Any] = None,
    image_urls: Dict[str, str] = None
) -> Dict[str, Any]:
    """Create a node with basic info."""
    node = {"name": name}
    
    if wiki_url:
        node["wiki_url"] = wiki_url
    if source_url:
        node["source_url"] = source_url
    if infobox:
        node["infobox"] = infobox
    if image_urls:
        node["image_urls"] = image_urls
    
    node["edges"] = []
    
    return node


def build_relation_graph(items_database: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Build relation graph from items database.
    Returns a dictionary mapping item name to node data.
    """
    nodes = {}
    
    # First pass: create all nodes
    for item_data in items_database:
        base_name = item_data.get("name")
        if not base_name:
            continue
        
        levels = get_item_levels(item_data)
        
        for level_name in levels:
            if level_name not in nodes:
                # Create node with basic info
                nodes[level_name] = create_node(
                    name=level_name,
                    wiki_url=item_data.get("wiki_url"),
                    source_url=item_data.get("source_url"),
                    infobox=item_data.get("infobox"),
                    image_urls=item_data.get("image_urls")
                )
    
    # Second pass: create edges
    for item_data in items_database:
        base_name = item_data.get("name")
        if not base_name:
            continue
        
        levels = get_item_levels(item_data)
        
        for level_name in levels:
            if level_name not in nodes:
                continue
            
            edges = []
            
            # Process crafting
            edges.extend(process_crafting(item_data, level_name))
            
            # Process upgrades
            edges.extend(process_upgrades(item_data, level_name))
            
            # Process repairs
            edges.extend(process_repairs(item_data, level_name))
            
            # Process recycling and salvaging
            edges.extend(process_recycling(item_data, level_name))
            
            nodes[level_name]["edges"] = edges
    
    # Third pass: add reverse edges
    # For each craft_from edge, add craft_to edge to the material
    # For each recycle_to edge, add recycle_from edge to the material
    # etc.
    reverse_edges = []
    
    # Collect all reverse edges first (don't modify nodes dict during iteration)
    for node_name, node in list(nodes.items()):
        for edge in node["edges"]:
            target_name = edge["name"]
            
            # Determine reverse relation
            relation = edge["relation"]
            reverse_relation = None
            reverse_direction = None
            
            if relation == "craft_from":
                reverse_relation = "craft_to"
                reverse_direction = "out"
            elif relation == "craft_to":
                reverse_relation = "craft_from"
                reverse_direction = "in"
            elif relation == "upgrade_from":
                reverse_relation = "upgrade_to"
                reverse_direction = "out"
            elif relation == "upgrade_to":
                reverse_relation = "upgrade_from"
                reverse_direction = "in"
            elif relation == "repair_from":
                reverse_relation = "repair_to"
                reverse_direction = "out"
            elif relation == "repair_to":
                reverse_relation = "repair_from"
                reverse_direction = "in"
            elif relation == "recycle_to":
                reverse_relation = "recycle_from"
                reverse_direction = "in"
            elif relation == "recycle_from":
                reverse_relation = "recycle_to"
                reverse_direction = "out"
            elif relation == "salvage_to":
                reverse_relation = "salvage_from"
                reverse_direction = "in"
            elif relation == "salvage_from":
                reverse_relation = "salvage_to"
                reverse_direction = "out"
            
            if reverse_relation:
                # Create reverse edge
                reverse_edge = create_edge(
                    name=node_name,
                    direction=reverse_direction,
                    relation=reverse_relation,
                    quantity=edge.get("quantity"),
                    dependency=edge.get("dependency")
                )
                
                reverse_edges.append((target_name, reverse_edge))
    
    # Create any missing nodes and add reverse edges
    for target_name, edge in reverse_edges:
        if target_name not in nodes:
            nodes[target_name] = create_node(name=target_name)
        nodes[target_name]["edges"].append(edge)
    
    return nodes


def main():
    """Main function to build relation graph."""
    data_dir = Path(__file__).parent.parent / "data"
    
    input_file = data_dir / "items_database.json"
    output_file = data_dir / "items_relation.json"
    
    # Check if input file exists
    if not input_file.exists():
        print(f"Error: {input_file} not found!")
        return
    
    print(f"Reading items database from {input_file}...")
    
    # Read items database
    with open(input_file, 'r', encoding='utf-8') as f:
        items_database = json.load(f)
    
    print(f"Found {len(items_database)} items in database")
    
    # Build relation graph
    print("Building relation graph...")
    nodes = build_relation_graph(items_database)
    
    print(f"Created {len(nodes)} nodes in graph")
    
    # Convert to list for JSON output
    items_relation = list(nodes.values())
    
    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(items_relation, f, indent=2, ensure_ascii=False)
    
    print(f"\n[OK] Relation graph saved to: {output_file}")
    print(f"  Total size: {output_file.stat().st_size / 1024:.1f} KB")
    
    # Print some statistics
    total_edges = sum(len(node["edges"]) for node in items_relation)
    print(f"\nStatistics:")
    print(f"  Total nodes: {len(items_relation)}")
    print(f"  Total edges: {total_edges}")
    print(f"  Average edges per node: {total_edges / len(items_relation):.1f}")
    
    # Count edge types
    edge_types = {}
    for node in items_relation:
        for edge in node["edges"]:
            relation = edge["relation"]
            edge_types[relation] = edge_types.get(relation, 0) + 1
    
    print(f"\nEdge types:")
    for edge_type, count in sorted(edge_types.items()):
        print(f"  {edge_type}: {count}")


if __name__ == "__main__":
    main()

