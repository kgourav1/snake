import nltk
from nltk.corpus import wordnet as wn
from collections import defaultdict

# Download WordNet (only first time)
nltk.download('wordnet')

def has_meaning(word):
    """Check if a word has at least one meaning in WordNet."""
    return bool(wn.synsets(word))

# Group words by starting letter
words_by_letter = defaultdict(set)

for w in set(wn.all_lemma_names()):
    if "_" not in w and w.isalpha() and has_meaning(w):
        words_by_letter[w[0].lower()].add(w.lower())

# Keep only letters with at least 5 words
filtered = {letter: sorted(list(words)) 
            for letter, words in words_by_letter.items() 
            if len(words) >= 5}

# Save results
with open("12.txt", "w") as f:
    for letter, words in sorted(filtered.items()):
        f.write(f"{letter}: {','.join(words)}\n")

# Quick preview
for letter in sorted(filtered.keys()):
    print(f"{letter} -> {filtered[letter][:5]} ... ({len(filtered[letter])} words)")
