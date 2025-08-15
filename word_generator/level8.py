import nltk
from nltk.corpus import words, wordnet

# Download required datasets (only first time)
nltk.download('words')
nltk.download('wordnet')

# Get list of all English words
word_list = set(words.words())

# Filter for meaningful palindromes
palindromes = sorted(
    w.lower()
    for w in word_list
    if len(w) > 1
    and w.lower() == w.lower()[::-1]  # Palindrome check
    and wordnet.synsets(w.lower())    # Must have meaning
)

# Print count and a sample
print(f"Total meaningful palindrome words found: {len(palindromes)}")
print("Sample:", palindromes[:20])

# Save to file (comma-separated)
with open("8.txt", "w") as f:
    f.write(",".join(palindromes))
