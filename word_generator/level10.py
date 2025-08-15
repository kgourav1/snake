import nltk
from nltk.corpus import words, wordnet

# Download datasets (only first time)
nltk.download('words')
nltk.download('wordnet')

# Get all English words
word_list = set(words.words())

def is_consecutive(word):
    word = word.lower()
    # Check that every next char is exactly +1 in Unicode from the previous char
    return all(ord(word[i+1]) - ord(word[i]) == 1 for i in range(len(word) - 1))

# Filter meaningful consecutive-letter words
consecutive_words = sorted(
    w.lower()
    for w in word_list
    if len(w) > 1
    and is_consecutive(w)
    and wordnet.synsets(w.lower())  # ensure it has meaning
)

print(f"Total consecutive alphabet words: {len(consecutive_words)}")
print("Sample:", consecutive_words[:20])

# Save to file
with open("10.txt", "w") as f:
    f.write(",".join(consecutive_words))
