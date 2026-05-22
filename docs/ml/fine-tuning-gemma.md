# Fine-Tuning Gemma 4 for Road Safety

## Use Case
Fine-tune Gemma 4 (2B) on Indian emergency response data for better on-device performance.

## Dataset Format (Alpaca-style JSONL)
```json
{"instruction": "What do I do after a tyre burst?", "output": "1. Don't brake suddenly. 2. Grip the steering wheel firmly. 3. Let the car slow down naturally. 4. Pull over to a safe spot. 5. Turn on hazard lights. 6. Call 1033 (Highway Helpline)."}
```

## Training Config (LoRA)
- Model: google/gemma-2b
- Rank: 16
- Alpha: 32
- Target modules: q_proj, v_proj
- Learning rate: 2e-4
- Batch size: 4 (effective 16 with grad accumulation)
- Epochs: 3
- Max seq length: 512

## Dataset Sources
1. Road safety FAQs from Indian transport authorities
2. First-aid procedures from Red Cross India
3. Good Samaritan Law FAQs
4. Indian emergency number directory

## Evaluation
- Perplexity on held-out test set
- BLEU score for response quality
- Response relevance rating (1-5)
