import nltk
from nltk.corpus import wordnet as wn

# Download WordNet (only first time)
nltk.download('wordnet')

def has_meaning(word):
    """Check if a word has at least one meaning in WordNet."""
    return bool(wn.synsets(word))

# Get only single meaningful words with both Q and U
words_with_qu = sorted(
    w.lower()
    for w in set(wn.all_lemma_names())
    if 'q' in w.lower() and 'u' in w.lower()
    and "_" not in w  # exclude multi-word terms
    and has_meaning(w)
)

print(f"Total meaningful single words containing both Q and U: {len(words_with_qu)}")
print("Sample:", words_with_qu[:50])

# Save to file (comma-separated)
with open("11.txt", "w") as f:
    f.write(",".join(words_with_qu))
