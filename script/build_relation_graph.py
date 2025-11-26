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
    dependency: List[Dict[str, str]] = None,
    input_level: str = None,
    output_level: str = None
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
    
    if input_level:
        edge["input_level"] = input_level
    
    if output_level:
        edge["output_level"] = output_level
    
    return edge


def get_base_item_name(item_data: Dict[str, Any]) -> str:
    """
    Get the base item name (without level).
    Always returns just the base name.
    """
    return item_data.get("name", "")


def process_crafting(item_data: Dict[str, Any], item_name: str) -> List[Dict[str, Any]]:
    """Process crafting relationships into edges."""
    edges = []
    
    if "crafting" not in item_data:
        return edges
    
    for craft_recipe in item_data["crafting"]:
        # Get result level if present
        result_level = craft_recipe.get("result_level")
        
        # Get dependency (workshop)
        dependency = None
        if "workshop" in craft_recipe:
            dependency = [{"type": "workshop", "name": craft_recipe["workshop"]}]
        
        # Add blueprint lock if present
        if craft_recipe.get("blueprint_locked"):
            if dependency is None:
                dependency = []
            dependency.append({"type": "blueprint", "name": "required"})
        
        # Add result level to dependency if present
        if result_level:
            if dependency is None:
                dependency = []
            dependency.append({"type": "result_level", "name": result_level})
        
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
                        dependency=dependency,
                        output_level=result_level
                    )
                    edges.append(edge)
    
    return edges


def process_upgrades(item_data: Dict[str, Any], item_name: str) -> List[Dict[str, Any]]:
    """Process upgrade relationships into edges."""
    edges = []
    
    if "upgrades" not in item_data:
        return edges
    
    for upgrade in item_data["upgrades"]:
        input_level = upgrade.get("input_level")
        output_level = upgrade.get("output_level")
        
        # Get dependency (workshop, upgrade perks)
        dependency = None
        if "workshop" in upgrade:
            dependency = [{"type": "workshop", "name": upgrade["workshop"]}]
        
        if upgrade.get("blueprint_locked"):
            if dependency is None:
                dependency = []
            dependency.append({"type": "blueprint", "name": "required"})
        
        # Add level info to dependency
        if input_level and output_level:
            if dependency is None:
                dependency = []
            dependency.append({"type": "upgrade_level", "name": f"{input_level} -> {output_level}"})
        
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
                        dependency=dependency,
                        input_level=input_level,
                        output_level=output_level
                    )
                    edges.append(edge)
        
        # Add self-referencing edge for upgrade (item -> item at different level)
        if input_level and output_level:
            edge_dep = dependency.copy() if dependency else []
            if "upgrade_perks" in upgrade:
                edge_dep.append({"type": "perks", "name": ", ".join(upgrade["upgrade_perks"])})
            
            edge = create_edge(
                name=item_name,  # Self-reference for upgrades
                direction="out",
                relation="upgrade_to",
                dependency=edge_dep if edge_dep else None,
                input_level=input_level,
                output_level=output_level
            )
            edges.append(edge)
    
    return edges


def process_repairs(item_data: Dict[str, Any], item_name: str) -> List[Dict[str, Any]]:
    """Process repair relationships into edges."""
    edges = []
    
    if "repairs" not in item_data:
        return edges
    
    for repair in item_data["repairs"]:
        repair_item_name = repair.get("item_name")
        
        # Get dependency (durability restored)
        dependency = None
        if "durability" in repair:
            dependency = [{"type": "durability", "name": f"+{repair['durability']}"}]
        
        # Add level info to dependency if present
        if repair_item_name:
            if dependency is None:
                dependency = []
            dependency.append({"type": "repair_level", "name": repair_item_name})
        
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
                        dependency=dependency,
                        input_level=repair_item_name
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
            recycle_input = recycle.get("input")
            
            # Create dependency for level info if present
            dependency = None
            if recycle_input:
                dependency = [{"type": "recycle_level", "name": recycle_input}]
            
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
                            quantity=quantity,
                            dependency=dependency,
                            input_level=recycle_input
                        )
                        edges.append(edge)
    
    # Process salvaging (item -> materials)
    if "salvaging" in recycling:
        for salvage in recycling["salvaging"]:
            salvage_input = salvage.get("input")
            
            # Create dependency for level info if present
            dependency = None
            if salvage_input:
                dependency = [{"type": "salvage_level", "name": salvage_input}]
            
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
                            quantity=quantity,
                            dependency=dependency,
                            input_level=salvage_input
                        )
                        edges.append(edge)
    
    return edges


def create_node(
    name: str,
    node_type: str = "item",
    wiki_url: str = None,
    source_url: str = None,
    infobox: Dict[str, Any] = None,
    image_urls: Dict[str, str] = None
) -> Dict[str, Any]:
    """Create a node with basic info."""
    node = {
        "name": name,
        "node_type": node_type
    }
    
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


def build_relation_graph(items_database: List[Dict[str, Any]], traders_database: List[Dict[str, Any]] = None) -> Dict[str, Dict[str, Any]]:
    """
    Build relation graph from items database and traders database.
    Returns a dictionary mapping item/trader name to node data.
    """
    nodes = {}
    
    # First pass: create all item nodes (one per base item, not per level)
    for item_data in items_database:
        base_name = get_base_item_name(item_data)
        if not base_name:
            continue
        
        if base_name not in nodes:
            # Create node with basic info
            nodes[base_name] = create_node(
                name=base_name,
                node_type="item",
                wiki_url=item_data.get("wiki_url"),
                source_url=item_data.get("source_url"),
                infobox=item_data.get("infobox"),
                image_urls=item_data.get("image_urls")
            )
    
    # Second pass: create edges (all edges for a base item)
    for item_data in items_database:
        base_name = get_base_item_name(item_data)
        if not base_name:
            continue
        
        if base_name not in nodes:
            continue
        
        edges = []
        
        # Process crafting
        edges.extend(process_crafting(item_data, base_name))
        
        # Process upgrades
        edges.extend(process_upgrades(item_data, base_name))
        
        # Process repairs
        edges.extend(process_repairs(item_data, base_name))
        
        # Process recycling and salvaging
        edges.extend(process_recycling(item_data, base_name))
        
        # Merge edges with existing ones
        nodes[base_name]["edges"].extend(edges)
    
    # Process traders if provided
    if traders_database:
        for trader_data in traders_database:
            trader_name = trader_data.get("name")
            if not trader_name:
                continue
            
            # Create trader node
            nodes[trader_name] = create_node(
                name=trader_name,
                node_type="trader",
                wiki_url=trader_data.get("wiki_url"),
                source_url=trader_data.get("source_url"),
                image_urls=trader_data.get("image_urls")
            )
            
            # Add edges from trader to items in shop
            shop = trader_data.get("shop", [])
            for item in shop:
                item_name = item.get("name")
                if not item_name:
                    continue
                
                # Build dependency list with price/stock info
                dependency = []
                
                # Add price information
                if "price" in item or "currency" in item:
                    price_dep = {"type": "price"}
                    if "price" in item:
                        price_dep["amount"] = item["price"]
                    if "currency" in item:
                        price_dep["currency"] = item["currency"]
                    dependency.append(price_dep)
                
                # Add stock information
                if "stock" in item or "is_limited" in item:
                    stock_dep = {"type": "stock"}
                    if "stock" in item:
                        stock_dep["value"] = item["stock"]
                    if "is_limited" in item:
                        stock_dep["is_limited"] = item["is_limited"]
                    dependency.append(stock_dep)
                
                # Add ammo count information
                if "ammo_count" in item:
                    dependency.append({
                        "type": "ammo_count",
                        "value": item["ammo_count"]
                    })
                
                # Create edge from trader to item
                edge = create_edge(
                    name=item_name,
                    direction="out",
                    relation="trader",
                    quantity=1,
                    dependency=dependency if dependency else None
                )
                
                nodes[trader_name]["edges"].append(edge)
                
                # Add reverse edge from item to trader (sold_by)
                if item_name not in nodes:
                    nodes[item_name] = create_node(name=item_name, node_type="item")
                
                reverse_edge = create_edge(
                    name=trader_name,
                    direction="in",
                    relation="sold_by",
                    quantity=1,
                    dependency=dependency if dependency else None
                )
                
                nodes[item_name]["edges"].append(reverse_edge)
    
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
                    dependency=edge.get("dependency"),
                    input_level=edge.get("output_level"),  # Swap levels for reverse
                    output_level=edge.get("input_level")
                )
                
                reverse_edges.append((target_name, reverse_edge))
    
    # Create any missing nodes and add reverse edges
    for target_name, edge in reverse_edges:
        if target_name not in nodes:
            nodes[target_name] = create_node(name=target_name, node_type="item")
        nodes[target_name]["edges"].append(edge)
    
    return nodes


def main():
    """Main function to build relation graph."""
    data_dir = Path(__file__).parent.parent / "data"
    
    items_file = data_dir / "items_database.json"
    traders_file = data_dir / "traders_database.json"
    output_file = data_dir / "items_relation.json"
    
    # Check if input file exists
    if not items_file.exists():
        print(f"Error: {items_file} not found!")
        return
    
    print(f"Reading items database from {items_file}...")
    
    # Read items database
    with open(items_file, 'r', encoding='utf-8') as f:
        items_database = json.load(f)
    
    print(f"Found {len(items_database)} items in database")
    
    # Read traders database if available
    traders_database = None
    if traders_file.exists():
        print(f"Reading traders database from {traders_file}...")
        with open(traders_file, 'r', encoding='utf-8') as f:
            traders_database = json.load(f)
        print(f"Found {len(traders_database)} traders in database")
    else:
        print("No traders database found, skipping trader nodes")
    
    # Build relation graph
    print("Building relation graph...")
    nodes = build_relation_graph(items_database, traders_database)
    
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
    
    # Count node types
    node_types = {}
    for node in items_relation:
        node_type = node.get("node_type", "unknown")
        node_types[node_type] = node_types.get(node_type, 0) + 1
    
    print(f"\nStatistics:")
    print(f"  Total nodes: {len(items_relation)}")
    for node_type, count in sorted(node_types.items()):
        print(f"    {node_type}: {count}")
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

