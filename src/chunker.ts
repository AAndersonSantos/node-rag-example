export function chunkBySections(text: string): string[] {
  return text
    .split("# ====================================================================")
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0);
}