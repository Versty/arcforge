"""
Adjust item data for specific items that need manual corrections
"""

import json
from pathlib import Path


def adjust_item_data():
    """Apply manual corrections to item database."""
    data_dir = Path(__file__).parent.parent / "data"
    database_file = data_dir / "items_database.json"
    special_types_file = data_dir / "special_item_types.json"
    
    if not database_file.exists():
        print(f"Error: {database_file} not found!")
        return
    
    with open(database_file, 'r', encoding='utf-8') as f:
        items_database = json.load(f)
    
    # Load special item types
    special_types_map = {}
    if special_types_file.exists():
        with open(special_types_file, 'r', encoding='utf-8') as f:
            special_types_data = json.load(f)
            
        # Build a reverse map: item_name -> [special_types]
        for special_type, item_names in special_types_data.items():
            for item_name in item_names:
                if item_name not in special_types_map:
                    special_types_map[item_name] = []
                special_types_map[item_name].append(special_type)
    
    # Define adjustments
    type_adjustments = {
        "Augment": [
            "Free Loadout Augment", "Looting Mk. 1", "Combat Mk. 1", "Tactical Mk. 1",
            "Looting Mk. 2", "Combat Mk. 2", "Tactical Mk. 2",
            "Looting Mk. 3 (Cautious)", "Looting Mk. 3 (Survivor)",
            "Combat Mk. 3 (Aggressive)", "Combat Mk. 3 (Flanking)",
            "Tactical Mk. 3 (Defensive)", "Tactical Mk. 3 (Healing)",
        ],
        "Shield": ["Light Shield", "Medium Shield", "Heavy Shield"],
        "Ammo": [
            "Light Ammo", "Medium Ammo", "Heavy Ammo", 
            "Shotgun Ammo", "Launcher Ammo", "Energy Clip"
        ],
    }
    
    price_adjustments = {
        # "Magnetron": 6000,
        # "Rotary Encoder": 3000,
    }
    
    image_adjustments = {
        # "Radio Relay": "https://arcraiders.wiki/w/images/thumb/b/b6/Radio_Relay.png/348px-Radio_Relay.png.webp",
    }
    
    updated = 0
    
    # Apply adjustments
    for item in items_database:
        if 'infobox' not in item:
            item['infobox'] = {}
        
        # Type adjustments
        for item_type, names in type_adjustments.items():
            if item['name'] in names:
                item['infobox']['type'] = item_type
                updated += 1
        
        # Special type adjustments
        if item['name'] in special_types_map:
            item['infobox']['special_types'] = special_types_map[item['name']]
            updated += 1
        
        # Price adjustments
        if item['name'] in price_adjustments:
            item['infobox']['sellprice'] = price_adjustments[item['name']]
            updated += 1
        
        # Image adjustments
        if item['name'] in image_adjustments:
            if 'image_urls' not in item:
                item['image_urls'] = {}
            item['image_urls']['thumb'] = image_adjustments[item['name']]
            updated += 1
    
    # Save database
    with open(database_file, 'w', encoding='utf-8') as f:
        json.dump(items_database, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated} item fields")


if __name__ == "__main__":
    adjust_item_data()

