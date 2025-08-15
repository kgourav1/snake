import nltk
from nltk.corpus import words, wordnet

# Download required datasets (only first time)
nltk.download('words')
nltk.download('wordnet')

# Get all English words
word_list = set(words.words())

# Filter meaningful words starting & ending with same letter (case-insensitive)
same_start_end = sorted(
    w.lower()
    for w in word_list
    if len(w) > 1
    and w[0].lower() == w[-1].lower()  # First and last letter same
    and wordnet.synsets(w.lower())     # Must have meaning in WordNet
)

# Print count and first few
print(f"Total meaningful words starting and ending with the same letter: {len(same_start_end)}")
print("Sample:", same_start_end[:20])

# Save to file (comma-separated)
with open("9.txt", "w") as f:
    f.write(",".join(same_start_end))
