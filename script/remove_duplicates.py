"""
Script to remove duplicate entries from names.txt and items_database.json
Keeps the first occurrence of each duplicate.
"""
import json
from pathlib import Path


def remove_duplicates_from_names(input_file: Path, output_file: Path):
    """Remove duplicates from names.txt, keeping first occurrence."""
    seen = set()
    unique_names = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            name = line.strip()
            # Keep empty lines as they might be intentional
            if not name:
                continue
            if name not in seen:
                seen.add(name)
                unique_names.append(name)
    
    # Write to new file
    with open(output_file, 'w', encoding='utf-8') as f:
        for name in unique_names:
            f.write(f"{name}\n")
    
    return len(unique_names), len(seen)


def remove_duplicates_from_database(input_file: Path, output_file: Path):
    """Remove duplicates from items_database.json based on item name."""
    with open(input_file, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    seen_names = set()
    unique_items = []
    duplicates = []
    
    for item in items:
        name = item.get('name', '')
        if name and name not in seen_names:
            seen_names.add(name)
            unique_items.append(item)
        elif name in seen_names:
            duplicates.append(name)
    
    # Write to new file with pretty formatting
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_items, f, indent=2, ensure_ascii=False)
    
    return len(unique_items), duplicates


def main():
    script_dir = Path(__file__).parent
    
    # Process names.txt
    names_input = script_dir / "names.txt"
    names_output = script_dir / "names_deduplicated.txt"
    
    print("Processing names.txt...")
    unique_count, total_count = remove_duplicates_from_names(names_input, names_output)
    removed_names = total_count - unique_count
    print(f"  Original: {total_count} items")
    print(f"  Unique: {unique_count} items")
    print(f"  Removed: {removed_names} duplicates")
    print(f"  Saved to: {names_output}")
    
    # Process items_database.json
    db_input = script_dir / "items_database.json"
    db_output = script_dir / "items_database_deduplicated.json"
    
    print("\nProcessing items_database.json...")
    unique_count, duplicates = remove_duplicates_from_database(db_input, db_output)
    print(f"  Unique: {unique_count} items")
    print(f"  Removed: {len(duplicates)} duplicates")
    if duplicates:
        print(f"  Duplicate items found: {', '.join(duplicates)}")
    print(f"  Saved to: {db_output}")
    
    print("\nDone! New files created with '_deduplicated' suffix.")


if __name__ == "__main__":
    main()

