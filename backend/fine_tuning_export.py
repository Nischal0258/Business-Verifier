import asyncio
import json
import logging
from typing import List, Dict
import aiosqlite
import os

# Define the instruction-tuning prompt template
PROMPT_TEMPLATE = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
Analyze the provided corporate data and generate a professional verification summary.

### Input:
{context}

### Response:
{summary}"""

async def export_training_data(db_path: str, output_file: str):
    """Extracts cached reports and formats them for LLM fine-tuning."""
    print(f"Exporting data from {db_path} to {output_file}...")
    
    if not os.path.exists(db_path):
        print(f"Error: Database {db_path} not found.")
        return

    dataset: List[Dict[str, str]] = []
    
    async with aiosqlite.connect(db_path) as db:
        # We query both the main cached_reports table and the new report_cache table
        # established in the previous task.
        async with db.execute("SELECT company_name, history_text, turnover_json FROM cached_reports") as cursor:
            async for row in cursor:
                name, history, turnover = row
                if not history or len(history) < 100:
                    continue
                
                # Preprocessing: Anonymization or normalization can be added here
                context = f"Company: {name}\nFinancials: {turnover}"
                
                dataset.append({
                    "instruction": "Generate a professional business verification report.",
                    "input": context,
                    "output": history,
                    "text": PROMPT_TEMPLATE.format(context=context, summary=history)
                })

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=4)
    
    print(f"Successfully exported {len(dataset)} training examples.")

if __name__ == "__main__":
    # Path relative to backend directory
    DB_PATH = os.path.join(os.path.dirname(__file__), "data", "business_verify.db")
    OUTPUT = "company_finetune_dataset.json"
    asyncio.run(export_training_data(DB_PATH, OUTPUT))
