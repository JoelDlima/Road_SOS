"""Process raw Q&A pairs into training dataset."""
import json
import argparse
from pathlib import Path
from typing import Any

def load_raw_data(path: Path) -> list[dict[str, str]]:
    """Load raw Q&A pairs from JSON file."""
    with open(path) as f:
        return json.load(f)

def format_training_entry(entry: dict[str, str]) -> dict[str, str]:
    """Format a single Q&A pair into Alpaca-style instruction format."""
    return {
        "instruction": entry.get("question", entry.get("instruction", "")),
        "output": entry.get("answer", entry.get("output", "")),
    }

def validate_entry(entry: dict[str, str]) -> bool:
    """Validate a training entry has required fields."""
    return bool(entry.get("instruction")) and bool(entry.get("output"))

def main():
    parser = argparse.ArgumentParser(description="Process raw Q&A into training data")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--validate", action="store_true")
    args = parser.parse_args()

    raw = load_raw_data(args.input)
    formatted = [format_training_entry(e) for e in raw]
    
    if args.validate:
        valid = [e for e in formatted if validate_entry(e)]
        invalid_count = len(formatted) - len(valid)
        if invalid_count > 0:
            print(f"Warning: {invalid_count} entries are invalid")
        formatted = valid
    
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w") as f:
        for entry in formatted:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    
    print(f"Processed {len(formatted)} entries \u2192 {args.output}")

if __name__ == "__main__":
    main()
