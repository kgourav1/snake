import string
import itertools

# Define consonants
vowels_set = {"A", "E", "I", "O", "U"}
consonants = [c for c in string.ascii_uppercase if c not in vowels_set]

# Generate all 5-letter combinations in alphabetical order
combinations = list(itertools.combinations(consonants, 5))

# Convert each tuple to a string
words_level3_all = ["".join(c) for c in combinations]

# Save to file
with open("level3_all.txt", "w") as f:
    f.write(",".join(words_level3_all))

print(f"Generated {len(words_level3_all)} combinations and saved to level3_all.txt")
