"""Gemma 4 fine-tuning script for RoadSoS emergency response data."""
import argparse
import torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer

def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune Gemma for road safety")
    parser.add_argument("--model", default="google/gemma-2b")
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--output", default="./output")
    parser.add_argument("--lora-r", type=int, default=16)
    parser.add_argument("--lora-alpha", type=int, default=32)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    return parser.parse_args()

def format_prompt(example: dict) -> dict:
    return {"text": f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}\n"}

def main():
    args = parse_args()
    
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        torch_dtype=torch.bfloat16,
        device_map="auto",
    )
    
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    dataset = load_dataset("json", data_files={"train": args.dataset})
    dataset = dataset.map(format_prompt)
    
    training_args = TrainingArguments(
        output_dir=args.output,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        learning_rate=args.learning_rate,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
        bf16=True,
        logging_steps=10,
        save_steps=200,
    )
    
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        dataset_text_field="text",
        max_seq_length=512,
    )
    
    trainer.train()
    model.save_pretrained(args.output)
    tokenizer.save_pretrained(args.output)
    print(f"Model saved to {args.output}")

if __name__ == "__main__":
    main()
