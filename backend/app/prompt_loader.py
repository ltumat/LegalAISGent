from functools import lru_cache
from pathlib import Path
import xml.etree.ElementTree as ET


@lru_cache()
def load_system_prompt() -> str:
	prompt_path = Path(__file__).resolve().parent.parent / "prompts" / "system-prompt.xml"
	if not prompt_path.exists():
		return "You are a helpful legal assistant."

	tree = ET.parse(prompt_path)
	root = tree.getroot()

	version = root.attrib.get("version", "").strip()
	jurisdiction = root.attrib.get("jurisdiction", "").strip()
	persona = (root.findtext("persona") or "").strip()
	tone = (root.findtext("tone") or "").strip()
	disclaimers = (root.findtext("disclaimers") or "").strip()

	rule_nodes = root.findall(".//rules/rule")
	rules = "\n".join(rule.text.strip() for rule in rule_nodes if rule.text) or ""

	output_format_node = root.find("outputFormat")
	output_format = (
		"".join(output_format_node.itertext()).strip() if output_format_node is not None else ""
	)

	system_prompt = f"""
Version {version}, Jurisdiction: {jurisdiction}
Persona: {persona}
Tone: {tone}
Disclaimers: {disclaimers}

Rules:
{rules}

Response Format:
{output_format}
""".strip()

	return system_prompt
