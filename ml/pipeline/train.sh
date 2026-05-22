#!/bin/bash
# Gemma 4 Fine-Tuning Pipeline
# Usage: ./train.sh [dataset_path] [output_dir]

DATASET=${1:-"./data/training.jsonl"}
OUTPUT=${2:-"./output/gemma-roadsos"}

echo "=== Step 1: Validate Dataset ==="
python validate_dataset.py --input "$DATASET"

echo "=== Step 2: Start Training ==="
python train.py \
  --model "google/gemma-2b" \
  --dataset "$DATASET" \
  --output "$OUTPUT" \
  --lora-r 16 \
  --lora-alpha 32 \
  --batch-size 4 \
  --epochs 3 \
  --learning-rate 2e-4

echo "=== Step 3: Evaluate ==="
python evaluate.py --model "$OUTPUT" --test "$DATASET"

echo "=== Step 4: Export GGUF ==="
python export_gguf.py --model "$OUTPUT" --output "$OUTPUT/gguf"

echo "Done! Model saved to $OUTPUT"
